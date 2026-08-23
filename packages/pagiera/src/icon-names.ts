/** Icon identifiers supported by the editor and every Pagiera renderer. */
export const PAGIERA_ICON_NAMES = [
    "star", "heart", "check", "x", "plus", "minus", "search", "menu", "dots",
    "arrow-left", "arrow-right", "arrow-up", "arrow-down",
    "chevron-left", "chevron-right", "chevron-up", "chevron-down",
    "home", "user", "users", "settings", "bell", "calendar", "clock", "world",
    "mail", "phone", "map-pin", "link", "external-link", "send", "message",
    "download", "upload", "share", "copy", "trash", "pencil",
    "eye", "eye-off", "lock", "lock-open", "bookmark", "thumb-up",
    "play", "pause", "volume", "volume-off", "camera", "photo", "video", "music",
    "cart", "shopping-bag", "credit-card", "tag", "gift", "truck", "store",
    "instagram", "x-social", "facebook", "linkedin", "github", "youtube", "tiktok",
    "discord", "dribbble", "behance",
    "sparkles", "bolt", "flame", "circle-check", "alert", "info", "help",
] as const;

export type PagieraIconName = (typeof PAGIERA_ICON_NAMES)[number];
