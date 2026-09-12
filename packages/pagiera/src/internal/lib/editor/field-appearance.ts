export type FieldAppearance = { placeholderColor: string; focusColor: string; disabledOpacity: number; arrow: 'native' | 'chevron' | 'none'; arrowColor: string; arrowSize: number };
export function normalizeFieldAppearance(value: unknown): FieldAppearance | undefined {
    if (!value || typeof value !== 'object') return;
    const v = value as Partial<FieldAppearance>;
    const color = (x: unknown, fallback: string) => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? x : fallback;
    const number = (x: unknown, fallback: number, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
    return { placeholderColor: color(v.placeholderColor, '#8b8494'), focusColor: color(v.focusColor, '#5402e6'), disabledOpacity: number(v.disabledOpacity, 45, 0, 100), arrow: v.arrow === 'chevron' || v.arrow === 'none' ? v.arrow : 'native', arrowColor: color(v.arrowColor, '#8b8494'), arrowSize: number(v.arrowSize, 16, 8, 40) };
}
export function fieldAppearanceCss(selector: string, value?: FieldAppearance, select = false) {
    const v = normalizeFieldAppearance(value);
    if (!v) return '';
    const svg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${v.arrowColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`);
    return `${selector}::placeholder{color:${v.placeholderColor};opacity:1}${selector}:focus-visible{outline:2px solid ${v.focusColor};outline-offset:2px}${selector}:disabled{opacity:${v.disabledOpacity / 100};cursor:not-allowed}${selector}{accent-color:${v.focusColor}}` + (select && v.arrow !== 'native' ? `${selector}:not([multiple]){appearance:none;${v.arrow === 'chevron' ? `background-image:url("data:image/svg+xml,${svg}");background-repeat:no-repeat;background-position:right 12px center;background-size:${v.arrowSize}px;padding-right:${v.arrowSize + 32}px` : 'background-image:none'}}` : '');
}
