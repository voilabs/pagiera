/** Self-contained WebGL presets shared by editor and published iframe output. */
export const SHADER_PRESETS = [
    { id: "mesh", name: "Mesh gradient", colors: ["#5402e6", "#ff8ddd", "#20dcff"], gradient: "radial-gradient(at 20% 20%,#ff8ddd,transparent 65%),linear-gradient(120deg,#5402e6,#20dcff)" },
    { id: "noise", name: "Grain clouds", colors: ["#16203b", "#7b67d9", "#e6adc9"], gradient: "radial-gradient(at 70% 30%,#e6adc9,#7b67d9,#16203b)" },
    { id: "waves", name: "Ribbon waves", colors: ["#083344", "#22d3ee", "#a7f3d0"], gradient: "repeating-linear-gradient(135deg,#083344,#22d3ee 35%,#a7f3d0 50%)" },
    { id: "aurora", name: "Aurora", colors: ["#651fff", "#20dcff", "#ff8ddd"], gradient: "linear-gradient(135deg,#651fff,#20dcff,#ff8ddd)" },
    { id: "mint", name: "Liquid mint", colors: ["#083cff", "#47ffc9", "#f5ffa3"], gradient: "linear-gradient(35deg,#083cff,#47ffc9,#f5ffa3)" },
    { id: "sunset", name: "Silk sunset", colors: ["#ff542c", "#ffbe78", "#9e65ff"], gradient: "linear-gradient(145deg,#ff542c,#ffbe78,#9e65ff)" },
    { id: "ocean", name: "Ocean", colors: ["#071a64", "#226cff", "#68f3ed"], gradient: "linear-gradient(35deg,#071a64,#226cff,#68f3ed)" },
] as const;

export type ShaderSettings = { preset: string; colors: string[]; speed: number; scale: number };

export function normalizeShader(value: unknown): ShaderSettings | undefined {
    if (!value || typeof value !== "object") return undefined;
    const input = value as Partial<ShaderSettings>;
    const preset = SHADER_PRESETS.find(item => item.id === input.preset);
    if (!preset) return undefined;
    const bounded = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : 1;
    return { preset: preset.id, colors: preset.colors.map((fallback, i) => {
        const color = Array.isArray(input.colors) ? input.colors[i] : undefined;
        return typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
    }), speed: bounded(input.speed, 0, 5), scale: bounded(input.scale, .2, 5) };
}

/** Recognise the original generated presets without treating arbitrary code as a shader. */
export function shaderSettingsFor(element: { shader?: ShaderSettings; code?: string; name?: string }): ShaderSettings | undefined {
    if (element.shader) return normalizeShader(element.shader);
    const preset = SHADER_PRESETS.find(item => element.name === `Shader · ${item.name}`);
    return preset && element.code?.includes("float fold=sin(p.y*5.0") ? normalizeShader({ preset: preset.id }) : undefined;
}

export function shaderDocument(id: string, settings?: Partial<ShaderSettings>): string {
    const preset = SHADER_PRESETS.find(item => item.id === id) ?? SHADER_PRESETS.find(item => item.id === "aurora")!;
    const config = normalizeShader({ ...settings, preset: preset.id })!;
    const colors = config.colors.map(hex => [1, 3, 5].map(start => (parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(4)).join(","));
    const pattern = config.preset === 'mesh'
        ? 'float wave=sin(length(p-vec2(.3+sin(time*.2)*.3,.5))*3.0+time*.2);float fold=cos(length(p-vec2(1.2,.3+cos(time*.3)*.4))*4.0)*.5+.5;'
        : config.preset === 'noise'
          ? 'float wave=sin(p.x*3.0+sin(p.y*3.0+time*.2))+cos(p.y*4.0-time*.15)*.3;float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);float fold=clamp(sin(p.x*2.0+p.y*2.0+time*.1)*.5+.5+(grain-.5)*.18,0.0,1.0);'
          : config.preset === 'waves'
            ? 'float wave=sin(p.y*14.0+sin(p.x*3.0+time*.25)*2.0-time*.6);float fold=sin(p.y*14.0+sin(p.x*3.0+time*.25)*2.0-time*.6+1.4)*.5+.5;'
            : 'float wave=sin(p.x*3.5+sin(p.y*4.0+time*.3)*1.8+time*.25);float fold=sin(p.y*5.0+p.x*2.0+wave*2.0-time*.2)*.5+.5;';
    const fragment = `precision mediump float; uniform vec2 size; uniform float time;
    void main(){vec2 p=gl_FragCoord.xy/size; p.x*=size.x/size.y; p*=${config.scale.toFixed(4)};
    ${pattern}
    vec3 c=mix(vec3(${colors[0]}),vec3(${colors[1]}),wave*.5+.5);
    c=mix(c,vec3(${colors[2]}),smoothstep(.25,.95,fold)*.85);gl_FragColor=vec4(c,1.0);}`;
    return `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:linear-gradient(135deg,${config.colors.join(",")})}canvas{width:100%;height:100%;display:block}</style><canvas aria-hidden="true"></canvas><script>(()=>{
    const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl',{alpha:false,antialias:false});if(!gl)return;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compile');return s}
    try{const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,${JSON.stringify(fragment)}));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
    const size=gl.getUniformLocation(program,'size'),time=gl.getUniformLocation(program,'time'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let visible=true,frame=0;
function draw(t){frame=0;const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(innerWidth*ratio)),h=Math.max(1,Math.round(innerHeight*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.uniform2f(size,w,h);gl.uniform1f(time,reduce.matches?0:t/1000*${config.speed.toFixed(4)});gl.drawArrays(gl.TRIANGLES,0,6);if(visible&&!document.hidden&&!reduce.matches&&${config.speed}>0)frame=requestAnimationFrame(draw)}
    function resume(){cancelAnimationFrame(frame);frame=0;if(visible&&!document.hidden)frame=requestAnimationFrame(draw)}
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume()}).observe(canvas);addEventListener('resize',resume);document.addEventListener('visibilitychange',resume);reduce.addEventListener('change',resume);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.style.display='none'});resume();}catch(_){canvas.style.display='none'}
    })();</script></html>`;
}
