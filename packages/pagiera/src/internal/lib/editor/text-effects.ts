export type TextEffects = {
    hover: 'none' | 'underline' | 'glow' | 'lift' | 'roll';
    scroll: 'none' | 'reveal' | 'rise' | 'blur';
    split: 'none' | 'words' | 'letters';
    duration: number; stagger: number; distance: number; start: number; end: number;
    angle?: number; repeat?: boolean;
};
export function normalizeTextEffects(value: unknown): TextEffects | undefined {
    if (!value || typeof value !== 'object') return;
    const v = value as Partial<TextEffects>;
    const num = (n: unknown, fallback: number, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    const start = num(v.start, 5, 0, 95);
    return { hover: ['underline', 'glow', 'lift', 'roll'].includes(v.hover ?? '') ? v.hover! : 'none', scroll: ['reveal', 'rise', 'blur'].includes(v.scroll ?? '') ? v.scroll! : 'none', split: ['words', 'letters'].includes(v.split ?? '') ? v.split! : 'none', duration: num(v.duration, 350, 50, 3000), stagger: num(v.stagger, 25, 0, 200), distance: num(v.distance, 8, 0, 100), start, end: num(v.end, 65, start + 1, 100), angle: num(v.angle, 15, -60, 60), repeat: v.repeat === true };
}
