import React from "react";
import { baseOf, cascadeOf } from "@/lib/editor/cascade";
import { isBand, resolveStyle } from "@/lib/editor/style";
import { childrenOf, indexById, noteIds } from "@/lib/editor/tree";
import type { CanvasElement, RootStyle } from "@/lib/editor/types";
import { bindElement, type PageData, type Row, rowsFor } from "./bind";
import { classFor, ENTRANCE_SCRIPT, hasEntrances, stylesheetFor } from "./css";
import { customTagOf, withCustom } from "./custom";
import { IconGlyph } from "@/lib/editor/icon";

/**
 * Read-only rendering of a document, shared by the preview route and the
 * published site so what the author previews is what visitors get.
 */
export function RenderedPage({
    elements: all,
    rootStyle,
    data = {},
    includeScripts = true,
}: {
    elements: CanvasElement[];
    rootStyle: RootStyle;
    /** Rows already fetched for each data source; see `loadPageData`. */
    data?: PageData;
    /** Template thumbnails render inside a scriptless sandbox. */
    includeScripts?: boolean;
}) {
    const cascade = cascadeOf(rootStyle.breakpoints, rootStyle.baseBreakpointId);
    const baseId = baseOf(cascade).id;

    // Anything parked beside the canvas is a note the author kept for
    // themselves; it never reaches the page. The reference has to be the width
    // the canvas measured against — the breakpoint's own — and not the content
    // cap: measuring against a smaller `maxWidth` would classify elements the
    // author can plainly see on the artboard as notes and silently drop them.
    const frameWidth = rootStyle.fullWidth
        ? Number.POSITIVE_INFINITY
        : baseOf(cascade).width;
    const notes = noteIds(all, indexById(all), baseId, frameWidth, rootStyle.layout, cascade);
    const elements = all.filter((element) => !notes.has(element.id) && element.componentRole !== "master");

    return (
        <>
            <style
                // biome-ignore lint/security/noDangerouslySetInnerHtml: the sheet is generated from validated style values, never raw user markup
                dangerouslySetInnerHTML={{ __html: stylesheetFor(elements, rootStyle) }}
            />
            <main className="pg-root">
                {childrenOf(elements, undefined).map((el) => (
                    <RenderedNode
                        key={el.id}
                        element={el}
                        elements={elements}
                        rootStyle={rootStyle}
                        data={data}
                    />
                ))}
            </main>
            {includeScripts && hasEntrances(elements) && (
                <script
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed script with no interpolated content
                    dangerouslySetInnerHTML={{ __html: ENTRANCE_SCRIPT }}
                />
            )}
            {includeScripts && elements.some((element) => element.draggable) && <script dangerouslySetInnerHTML={{ __html: DRAG_SCRIPT }} />}
            {includeScripts && elements.some((element) => element.interaction && ["toggle-layer", "show-layer", "hide-layer"].includes(element.interaction.action)) && <script dangerouslySetInnerHTML={{ __html: ACTION_SCRIPT }} />}
            {includeScripts && elements.some((element) => element.type === "Form" && element.formSubmitMode !== "native") && <script dangerouslySetInnerHTML={{ __html: FORM_SCRIPT }} />}
            {includeScripts && rootStyle.customJs && (
                <script
                    // Last, so the page's own behaviour is already wired up and
                    // author code can build on it rather than race it.
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: the page author's own script for their own site; the parser narrows it and the editor never executes it
                    dangerouslySetInnerHTML={{ __html: rootStyle.customJs }}
                />
            )}
        </>
    );
}

function RenderedNode({
    element: raw,
    elements,
    rootStyle,
    data,
    row,
}: {
    element: CanvasElement;
    elements: CanvasElement[];
    rootStyle: RootStyle;
    data: PageData;
    /** The data row this subtree is being rendered for, inside a Repeat. */
    row?: Row;
}): React.ReactNode {
    // Derived here rather than threaded down: the node already has the page
    // style, and a second prop is one more thing that can fall out of step.
    const cascade = cascadeOf(rootStyle.breakpoints, rootStyle.baseBreakpointId);
    const baseId = baseOf(cascade).id;

    // Outside a Repeat, a bound element reads the first row/object from its
    // own source. Repeat descendants still receive the current list row.
    const directRow = row ?? (raw.sourceId ? data[raw.sourceId]?.[0] : undefined);
    const element = bindElement(raw, directRow);
    const children = childrenOf(elements, element.id);
    const style = resolveStyle(element, baseId, cascade);
    const band = isBand(element.type, style, rootStyle);
    const className =
        `pg-node ${classFor(element.id)}` +
        (band ? " pg-band" : "") +
        (element.type === "List" && element.listStyle !== "none"
            ? ` pg-list pg-list-${element.listStyle === "number" ? "number" : "bullet"}`
            : "") +
        (style.entrance === "none" ? "" : " pg-anim");

    // Repeat iterates a list. Request renders once and provides the source's
    // first object as the binding context for its entire subtree.
    const renderChildren = () =>
        element.type === "Repeat"
            ? rowsFor(element, data, true).flatMap((dataRow, index) =>
                  children.map((child) => (
                      <RenderedNode
                          key={`${index}:${child.id}`}
                          element={child}
                          elements={elements}
                          rootStyle={rootStyle}
                          data={data}
                          row={dataRow}
                      />
                  )),
              )
            : children.map((child) => (
                  <RenderedNode
                      key={child.id}
                      element={child}
                      elements={elements}
                      rootStyle={rootStyle}
                      data={data}
                      row={element.type === "Request" ? data[element.sourceId ?? ""]?.[0] : row}
                  />
              ));

    const content = (
        <>
            <ElementContent element={element} />
            {renderChildren()}
            {element.type === "Form" && <span className="pg-form-status" data-pg-form-status aria-live="polite" />}
        </>
    );

    // A band's background reaches both edges while its content stays centred
    // inside the page's content width.
    const body = band ? <div className="pg-inner">{content}</div> : content;
    const interactionHref =
        element.interaction?.action === "scroll-to"
            ? `#${classFor(element.interaction.value)}`
            : element.interaction?.action === "navigate" ? element.interaction.value : undefined;
    const href = interactionHref || element.href;
    const target = element.interaction?.target || element.target;

    // A rule is a void element: it can hold no children, so it never reaches
    // the generic path that renders them.
    if (element.type === "Divider") {
        return <hr {...withCustom(element, { id: classFor(element.id), className })} />;
    }

    if (element.type === "Embed") {
        if (!element.src) return null;
        return (
            <iframe
                {...withCustom(element, { id: classFor(element.id), className })}
                src={element.src}
                title={element.name ?? "Embedded content"}
                loading="lazy"
                // The embed is a third party's document; it gets to draw and
                // navigate itself and nothing else.
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer-when-downgrade"
            />
        );
    }

    if (element.type === "Input") {
        return (
            <input
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    ...constraints(element),
                })}
                type={element.inputType ?? "text"}
                defaultValue={element.defaultValue}
                placeholder={element.placeholder}
            />
        );
    }

    if (element.type === "Textarea") {
        return (
            <textarea
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    ...constraints(element),
                })}
                placeholder={element.placeholder}
                defaultValue={element.defaultValue ?? element.content}
            />
        );
    }

    if (element.type === "FileInput") {
        return (
            <input
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    ...constraints(element),
                })}
                type="file"
                accept={element.accept || undefined}
                multiple={element.multiple}
            />
        );
    }

    if (element.type === "Select") {
        return (
            <select
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    ...constraints(element),
                })}
                multiple={element.multiple}
                defaultValue={element.defaultValue ?? (element.placeholder ? "" : undefined)}
            >
                {/* A placeholder has to be a real option to be the initial one,
                    and it is disabled so it can never be submitted as an answer. */}
                {element.placeholder && (
                    <option value="" disabled>
                        {element.placeholder}
                    </option>
                )}
                {(element.options ?? []).map((option, index) => (
                    <option key={`${index}:${option.value}`} value={option.value}>
                        {option.label || option.value}
                    </option>
                ))}
            </select>
        );
    }

    if (element.type === "Checkbox") {
        return (
            <input
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    ...constraints(element),
                })}
                type="checkbox"
                value={element.defaultValue || "on"}
                defaultChecked={element.checked}
            />
        );
    }

    // A radio group is one element on the canvas but several inputs on the
    // page: the alternatives only mean anything together, and giving each its
    // own layer would let an author style them apart or delete one by mistake.
    if (element.type === "Radio") {
        const group = element.fieldName || classFor(element.id);
        return (
            <div
                {...withCustom(element, {
                    id: classFor(element.id),
                    className,
                    role: "radiogroup",
                })}
            >
                {(element.options ?? []).map((option, index) => (
                    <label key={`${index}:${option.value}`} className="pg-choice">
                        <input
                            type="radio"
                            name={group}
                            value={option.value}
                            required={element.required}
                            disabled={element.disabled}
                            defaultChecked={
                                element.defaultValue
                                    ? element.defaultValue === option.value
                                    : element.checked && index === 0
                            }
                        />
                        <span>{option.label || option.value}</span>
                    </label>
                ))}
            </div>
        );
    }

    // A link wraps rather than replaces the box, so styling stays on one node.
    if (href) {
        return (
            <a
                {...withCustom(element, {
                    id: classFor(element.id),
                    "data-pg-drag": element.draggable ? "true" : undefined,
                    "data-pg-action": element.interaction?.action,
                    "data-pg-target": element.interaction && !["navigate", "scroll-to"].includes(element.interaction.action) ? classFor(element.interaction.value) : undefined,
                    className: `${className} pg-link`,
                })}
                href={href}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
            >
                {body}
            </a>
        );
    }

    const tag = customTagOf(element) ?? semanticTag(element);
    return React.createElement(tag, withCustom(element, {
        id: classFor(element.id),
        htmlFor: tag === "label" && element.labelFor ? classFor(element.labelFor) : undefined,
        type: tag === "button" ? (element.buttonType ?? "button") : undefined,
        "data-pg-drag": element.draggable ? "true" : undefined,
        "data-pg-action": element.interaction?.action,
        "data-pg-target": element.interaction && !["navigate", "scroll-to"].includes(element.interaction.action) ? classFor(element.interaction.value) : undefined,
        "data-pg-display": element.type === "Grid" || element.type === "Repeat" ? "grid" : isContainerType(element.type) || element.type === "Section" ? "flex" : "block",
        className,
        action: tag === "form" ? element.formAction : undefined,
        method: tag === "form" ? ((element.formMethod === "GET" ? "get" : "post")) : undefined,
        "data-pg-form-mode": tag === "form" ? (element.formSubmitMode ?? "request") : undefined,
        "data-pg-form-method": tag === "form" ? (element.formMethod ?? "POST") : undefined,
        "data-pg-form-content": tag === "form" ? (element.formContentType ?? "json") : undefined,
        "data-pg-form-body": tag === "form" ? element.formBody : undefined,
        "data-pg-form-headers": tag === "form" ? element.formHeaders : undefined,
        "data-pg-form-success": tag === "form" ? (element.formSuccessMessage ?? "Sent successfully.") : undefined,
        "data-pg-form-error": tag === "form" ? (element.formErrorMessage ?? "Something went wrong.") : undefined,
        "data-pg-form-reset": tag === "form" && element.formResetOnSuccess ? "true" : undefined,
    }), body);
}

/**
 * The validation and state attributes every field type shares, so a constraint
 * added here reaches Input, Textarea, Select and the rest at once.
 */
function constraints(element: CanvasElement) {
    return {
        name: element.fieldName || undefined,
        required: element.required,
        disabled: element.disabled,
        readOnly: element.type === "Input" || element.type === "Textarea" ? element.readOnly : undefined,
        autoComplete: element.autocomplete || undefined,
        pattern: element.pattern || undefined,
        minLength: element.minLength,
        maxLength: element.maxLength,
        min: element.minValue || undefined,
        max: element.maxValue || undefined,
        step: element.step || undefined,
    };
}

function semanticTag(element: CanvasElement) {
    const name = (element.name ?? "").toLowerCase();
    if (element.type === "Button") return "button";
    if (element.type === "Form") return "form";
    if (element.type === "Fieldset") return "fieldset";
    if (element.type === "Label") return "label";
    if (element.type === "List") return element.listStyle === "number" ? "ol" : "ul";
    if (element.type === "ListItem") return "li";
    if (element.type === "Quote") return "blockquote";
    if (element.type === "Heading") {
        const level = name.match(/(?:^|\s)h([1-6])(?:\s|$)/)?.[1] ?? "2";
        return `h${level}` as const;
    }
    if (element.type === "Text") return "p";
    if (name.includes("navbar") || name === "nav" || name.includes("navigation")) return "nav";
    if (name.includes("footer")) return "footer";
    if (name.includes("header")) return "header";
    if (element.type === "Section") return "section";
    return "div";
}

const DRAG_SCRIPT = `(function(){document.querySelectorAll('[data-pg-drag]').forEach(function(n){n.style.touchAction='none';n.style.cursor='grab';n.addEventListener('pointerdown',function(e){if(e.button!==0)return;e.preventDefault();var sx=e.clientX,sy=e.clientY,ox=Number(n.dataset.dx||0),oy=Number(n.dataset.dy||0);n.setPointerCapture(e.pointerId);n.style.cursor='grabbing';var move=function(p){var x=ox+p.clientX-sx,y=oy+p.clientY-sy;n.dataset.dx=String(x);n.dataset.dy=String(y);n.style.translate=x+'px '+y+'px'};var up=function(){n.style.cursor='grab';n.removeEventListener('pointermove',move);n.removeEventListener('pointerup',up)};n.addEventListener('pointermove',move);n.addEventListener('pointerup',up)})})})();`;

const ACTION_SCRIPT = `(function(){document.querySelectorAll('[data-pg-target]').forEach(function(trigger){trigger.style.cursor='pointer';trigger.addEventListener('click',function(event){var target=document.getElementById(trigger.dataset.pgTarget);if(!target)return;event.preventDefault();var action=trigger.dataset.pgAction;var open=target.dataset.pgOpen==='true';var next=action==='show-layer'?true:action==='hide-layer'?false:!open;target.dataset.pgOpen=next?'true':'false';target.style.setProperty('display',next?(target.dataset.pgDisplay||'flex'):'none','important');trigger.setAttribute('aria-expanded',String(next));target.setAttribute('aria-hidden',String(!next))})})})();`;

const FORM_SCRIPT = `(function(){function headers(raw){var out={};String(raw||'').split(/\\r?\\n/).forEach(function(line){var at=line.indexOf(':');if(at>0)out[line.slice(0,at).trim()]=line.slice(at+1).trim()});return out}function fields(data){var out={};data.forEach(function(value,key){var next=value instanceof File?value.name:String(value);if(out[key]===undefined)out[key]=next;else if(Array.isArray(out[key]))out[key].push(next);else out[key]=[out[key],next]});return out}function tokens(value,map){return String(value||'').replace(/{{\\s*form\\.([A-Za-z0-9_.-]+)\\s*}}/g,function(_,key){var found=map[key];return found==null?'':Array.isArray(found)?found.join(','):String(found)})}document.querySelectorAll('form[data-pg-form-mode="request"]').forEach(function(form){if(form.dataset.pgFormBound)return;form.dataset.pgFormBound='true';form.addEventListener('submit',async function(event){event.preventDefault();var status=form.querySelector('[data-pg-form-status]');var submit=form.querySelector('[type="submit"]');var data=new FormData(form),map=fields(data),method=form.dataset.pgFormMethod||'POST',kind=form.dataset.pgFormContent||'json',url=form.getAttribute('action')||location.href,custom=tokens(form.dataset.pgFormBody,map),requestHeaders=headers(tokens(form.dataset.pgFormHeaders,map)),options={method:method,headers:requestHeaders};if(method==='GET'){var query=new URLSearchParams(custom||Object.entries(map).flatMap(function(pair){return Array.isArray(pair[1])?pair[1].map(function(value){return [pair[0],value]}):[[pair[0],pair[1]]] }));var target=new URL(url,location.href);query.forEach(function(value,key){target.searchParams.append(key,value)});url=target.href}else if(kind==='form-data'){if(custom){try{var parsed=JSON.parse(custom);Object.keys(parsed).forEach(function(key){data.set(key,String(parsed[key]))})}catch(_){data.set('_body',custom)}}options.body=data}else if(kind==='urlencoded'){options.body=custom||new URLSearchParams(Object.entries(map).flatMap(function(pair){return Array.isArray(pair[1])?pair[1].map(function(value){return [pair[0],value]}):[[pair[0],pair[1]]] })).toString();if(!requestHeaders['Content-Type'])requestHeaders['Content-Type']='application/x-www-form-urlencoded;charset=UTF-8'}else{options.body=custom||JSON.stringify(map);if(!requestHeaders['Content-Type'])requestHeaders['Content-Type']='application/json'}form.setAttribute('aria-busy','true');form.dataset.pgState='loading';if(submit)submit.disabled=true;if(status)status.textContent='';try{var response=await fetch(url,options);if(!response.ok)throw new Error('HTTP '+response.status);form.dataset.pgState='success';if(status)status.textContent=form.dataset.pgFormSuccess||'Sent successfully.';if(form.dataset.pgFormReset==='true')form.reset();form.dispatchEvent(new CustomEvent('pagiera:form-success',{bubbles:true,detail:{response:response}}))}catch(error){form.dataset.pgState='error';if(status)status.textContent=form.dataset.pgFormError||'Something went wrong.';form.dispatchEvent(new CustomEvent('pagiera:form-error',{bubbles:true,detail:{error:error}}))}finally{form.removeAttribute('aria-busy');if(submit)submit.disabled=false}})})})();`;

function isContainerType(type: CanvasElement["type"]) {
    return ["Frame", "Stack", "Container", "Form", "Fieldset", "List", "Request", "Repeat"].includes(type);
}

export function ElementContent({ element }: { element: CanvasElement }) {
    if (element.code) return <iframe title={element.name ?? "Code component"} srcDoc={element.code} sandbox="" style={{ width: "100%", height: "100%", border: 0, borderRadius: "inherit" }} />;
    if (element.type === "Image") {
        if (!element.src) return null;
        return (
            // biome-ignore lint/performance/noImgElement: the src is author-supplied at runtime and cannot be statically optimised
            <img
                src={element.src}
                alt={element.alt ?? ""}
                style={{ objectFit: element.objectFit ?? "cover", borderRadius: "inherit" }}
            />
        );
    }

    if (element.type === "Video") {
        if (!element.src) return null;
        return (
            <iframe
                src={element.src}
                title={element.name ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0, borderRadius: "inherit" }}
            />
        );
    }

    if (element.type === "Icon") return <IconGlyph element={element} />;

    if (!element.content) return null;
    return (
        <span style={{ display: "block", width: "100%", whiteSpace: "pre-wrap" }}>
            {element.content}
        </span>
    );
}
