import {
    IconAlertCircle,
    IconArrowDown,
    IconArrowLeft,
    IconArrowRight,
    IconArrowUp,
    IconBell,
    IconBolt,
    IconBookmark,
    IconBrandBehance,
    IconBrandDiscord,
    IconBrandDribbble,
    IconBrandFacebook,
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandTiktok,
    IconBrandX,
    IconBrandYoutube,
    IconBuildingStore,
    IconCalendar,
    IconCamera,
    IconCheck,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconCircleCheck,
    IconClock,
    IconCopy,
    IconCreditCard,
    IconDots,
    IconDownload,
    IconExternalLink,
    IconEye,
    IconEyeOff,
    IconFlame,
    IconGift,
    IconHeart,
    IconHelpCircle,
    IconHome,
    IconInfoCircle,
    IconLink,
    IconLock,
    IconLockOpen,
    IconMail,
    IconMapPin,
    IconMenu2,
    IconMessageCircle,
    IconMinus,
    IconMusic,
    IconPencil,
    IconPhone,
    IconPhoto,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlus,
    IconSearch,
    IconSend,
    IconSettings,
    IconShare,
    IconShoppingBag,
    IconShoppingCart,
    IconSparkles,
    IconStar,
    IconTag,
    IconThumbUp,
    IconTrash,
    IconTruck,
    IconUpload,
    IconUser,
    IconUsers,
    IconVideo,
    IconVolume,
    IconVolumeOff,
    IconWorld,
    IconX,
} from "@tabler/icons-react";
import type React from "react";
import type { PagieraIconName } from "../../../icon-names";
import type { CanvasElement } from "./types";

type GlyphComponent = React.ComponentType<{
    size?: number | string;
    stroke?: number;
    className?: string;
    style?: React.CSSProperties;
    "aria-hidden"?: boolean;
}>;

export type IconCategory =
    | "Essentials"
    | "Navigation"
    | "People"
    | "Communication"
    | "Actions"
    | "Media"
    | "Commerce"
    | "Social";

export type IconCatalogEntry = {
    name: string;
    value: PagieraIconName;
    category: IconCategory;
    icon: GlyphComponent;
};

export const ICON_CATALOG: IconCatalogEntry[] = [
    { name: "Star", value: "star", category: "Essentials", icon: IconStar },
    { name: "Heart", value: "heart", category: "Essentials", icon: IconHeart },
    { name: "Check", value: "check", category: "Essentials", icon: IconCheck },
    { name: "Close", value: "x", category: "Essentials", icon: IconX },
    { name: "Plus", value: "plus", category: "Essentials", icon: IconPlus },
    { name: "Minus", value: "minus", category: "Essentials", icon: IconMinus },
    { name: "Search", value: "search", category: "Essentials", icon: IconSearch },
    { name: "Menu", value: "menu", category: "Essentials", icon: IconMenu2 },
    { name: "More", value: "dots", category: "Essentials", icon: IconDots },
    { name: "Success", value: "circle-check", category: "Essentials", icon: IconCircleCheck },
    { name: "Alert", value: "alert", category: "Essentials", icon: IconAlertCircle },
    { name: "Info", value: "info", category: "Essentials", icon: IconInfoCircle },
    { name: "Help", value: "help", category: "Essentials", icon: IconHelpCircle },
    { name: "Sparkles", value: "sparkles", category: "Essentials", icon: IconSparkles },
    { name: "Bolt", value: "bolt", category: "Essentials", icon: IconBolt },
    { name: "Flame", value: "flame", category: "Essentials", icon: IconFlame },

    { name: "Arrow left", value: "arrow-left", category: "Navigation", icon: IconArrowLeft },
    { name: "Arrow right", value: "arrow-right", category: "Navigation", icon: IconArrowRight },
    { name: "Arrow up", value: "arrow-up", category: "Navigation", icon: IconArrowUp },
    { name: "Arrow down", value: "arrow-down", category: "Navigation", icon: IconArrowDown },
    { name: "Chevron left", value: "chevron-left", category: "Navigation", icon: IconChevronLeft },
    { name: "Chevron right", value: "chevron-right", category: "Navigation", icon: IconChevronRight },
    { name: "Chevron up", value: "chevron-up", category: "Navigation", icon: IconChevronUp },
    { name: "Chevron down", value: "chevron-down", category: "Navigation", icon: IconChevronDown },
    { name: "Home", value: "home", category: "Navigation", icon: IconHome },
    { name: "World", value: "world", category: "Navigation", icon: IconWorld },
    { name: "Link", value: "link", category: "Navigation", icon: IconLink },
    { name: "External link", value: "external-link", category: "Navigation", icon: IconExternalLink },
    { name: "Map pin", value: "map-pin", category: "Navigation", icon: IconMapPin },

    { name: "User", value: "user", category: "People", icon: IconUser },
    { name: "Users", value: "users", category: "People", icon: IconUsers },
    { name: "Settings", value: "settings", category: "People", icon: IconSettings },
    { name: "Bell", value: "bell", category: "People", icon: IconBell },
    { name: "Calendar", value: "calendar", category: "People", icon: IconCalendar },
    { name: "Clock", value: "clock", category: "People", icon: IconClock },

    { name: "Mail", value: "mail", category: "Communication", icon: IconMail },
    { name: "Phone", value: "phone", category: "Communication", icon: IconPhone },
    { name: "Send", value: "send", category: "Communication", icon: IconSend },
    { name: "Message", value: "message", category: "Communication", icon: IconMessageCircle },
    { name: "Share", value: "share", category: "Communication", icon: IconShare },

    { name: "Download", value: "download", category: "Actions", icon: IconDownload },
    { name: "Upload", value: "upload", category: "Actions", icon: IconUpload },
    { name: "Copy", value: "copy", category: "Actions", icon: IconCopy },
    { name: "Trash", value: "trash", category: "Actions", icon: IconTrash },
    { name: "Pencil", value: "pencil", category: "Actions", icon: IconPencil },
    { name: "Eye", value: "eye", category: "Actions", icon: IconEye },
    { name: "Eye off", value: "eye-off", category: "Actions", icon: IconEyeOff },
    { name: "Lock", value: "lock", category: "Actions", icon: IconLock },
    { name: "Unlock", value: "lock-open", category: "Actions", icon: IconLockOpen },
    { name: "Bookmark", value: "bookmark", category: "Actions", icon: IconBookmark },
    { name: "Like", value: "thumb-up", category: "Actions", icon: IconThumbUp },

    { name: "Play", value: "play", category: "Media", icon: IconPlayerPlay },
    { name: "Pause", value: "pause", category: "Media", icon: IconPlayerPause },
    { name: "Volume", value: "volume", category: "Media", icon: IconVolume },
    { name: "Muted", value: "volume-off", category: "Media", icon: IconVolumeOff },
    { name: "Camera", value: "camera", category: "Media", icon: IconCamera },
    { name: "Photo", value: "photo", category: "Media", icon: IconPhoto },
    { name: "Video", value: "video", category: "Media", icon: IconVideo },
    { name: "Music", value: "music", category: "Media", icon: IconMusic },

    { name: "Cart", value: "cart", category: "Commerce", icon: IconShoppingCart },
    { name: "Shopping bag", value: "shopping-bag", category: "Commerce", icon: IconShoppingBag },
    { name: "Credit card", value: "credit-card", category: "Commerce", icon: IconCreditCard },
    { name: "Tag", value: "tag", category: "Commerce", icon: IconTag },
    { name: "Gift", value: "gift", category: "Commerce", icon: IconGift },
    { name: "Truck", value: "truck", category: "Commerce", icon: IconTruck },
    { name: "Store", value: "store", category: "Commerce", icon: IconBuildingStore },

    { name: "Instagram", value: "instagram", category: "Social", icon: IconBrandInstagram },
    { name: "X / Twitter", value: "x-social", category: "Social", icon: IconBrandX },
    { name: "Facebook", value: "facebook", category: "Social", icon: IconBrandFacebook },
    { name: "LinkedIn", value: "linkedin", category: "Social", icon: IconBrandLinkedin },
    { name: "GitHub", value: "github", category: "Social", icon: IconBrandGithub },
    { name: "YouTube", value: "youtube", category: "Social", icon: IconBrandYoutube },
    { name: "TikTok", value: "tiktok", category: "Social", icon: IconBrandTiktok },
    { name: "Discord", value: "discord", category: "Social", icon: IconBrandDiscord },
    { name: "Dribbble", value: "dribbble", category: "Social", icon: IconBrandDribbble },
    { name: "Behance", value: "behance", category: "Social", icon: IconBrandBehance },
];

const ICON_COMPONENTS = Object.fromEntries(
    ICON_CATALOG.map((entry) => [entry.value, entry.icon]),
) as Record<PagieraIconName, GlyphComponent>;

export function IconGlyph({
    element,
    name,
}: {
    element?: Pick<CanvasElement, "iconName">;
    name?: PagieraIconName;
}) {
    const Glyph = ICON_COMPONENTS[name ?? element?.iconName ?? "star"] ?? IconStar;
    return (
        <Glyph
            size="100%"
            stroke={2}
            style={{ display: "block", width: "100%", height: "100%" }}
            aria-hidden
        />
    );
}
