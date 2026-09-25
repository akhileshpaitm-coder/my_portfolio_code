import type { IconType } from "react-icons";
import {
  FiTarget, FiZap, FiShield, FiUsers, FiBookOpen, FiTrendingUp, FiHeart,
  FiStar, FiClock, FiEye, FiAward, FiCheckCircle, FiCompass, FiLayers,
  FiLock, FiCode, FiCpu, FiGlobe, FiFeather, FiFlag, FiAnchor, FiBriefcase,
  FiCoffee, FiKey, FiTool, FiThumbsUp, FiPackage, FiServer, FiDatabase,
  FiCloud, FiMonitor, FiSmartphone, FiSend, FiShare2, FiUserCheck,
  FiGitBranch, FiTerminal, FiGrid, FiBox, FiSun, FiWind, FiRefreshCw,
  FiRepeat, FiLifeBuoy, FiHelpCircle, FiInfo, FiBookmark, FiTag, FiEdit3,
  FiFileText, FiBarChart2, FiActivity, FiCrosshair, FiUser, FiUserPlus,
  FiList, FiCalendar, FiMap, FiPocket, FiGift, FiMusic, FiCamera, FiMic,
  FiVideo, FiImage, FiLink, FiPaperclip, FiShoppingCart, FiCreditCard,
  FiTruck, FiHome, FiBell, FiVolume2, FiWifi, FiBatteryCharging, FiFilter,
  FiSearch, FiSliders, FiToggleLeft, FiType, FiHash, FiPercent, FiDollarSign,
} from "react-icons/fi";
import { LuRocket } from "react-icons/lu";

/**
 * Shared registry of line icons for the Core Values card (client + server
 * safe — no db/server-only imports).
 *
 * An icon key is stored on a core value (e.g. "target"). Legacy rows that
 * still hold an emoji in the same field keep working: VALUE_EMOJI_ICONS maps
 * the fallback emojis to their closest icon, and any other emoji renders as
 * text like before.
 */

export interface ValueIcon {
  icon: IconType;
  /** Legacy emoji this icon replaces (also used to auto-migrate old rows). */
  emoji: string;
  /** Short picker label. */
  label: string;
}

export const VALUE_ICONS: Record<string, ValueIcon> = {
  "target":         { icon: FiTarget,       emoji: "🎯", label: "Target" },
  "rocket":         { icon: LuRocket,       emoji: "🚀", label: "Rocket" },
  "zap":            { icon: FiZap,          emoji: "⚡", label: "Zap" },
  "shield":         { icon: FiShield,       emoji: "🛡️", label: "Shield" },
  "users":          { icon: FiUsers,        emoji: "🤝", label: "Users" },
  "book-open":      { icon: FiBookOpen,     emoji: "📚", label: "Book" },
  "trending-up":    { icon: FiTrendingUp,   emoji: "📈", label: "Trending up" },
  "heart":          { icon: FiHeart,        emoji: "❤️", label: "Heart" },
  "star":           { icon: FiStar,         emoji: "⭐", label: "Star" },
  "clock":          { icon: FiClock,        emoji: "⏰", label: "Clock" },
  "eye":            { icon: FiEye,          emoji: "👁️", label: "Eye" },
  "award":          { icon: FiAward,        emoji: "🏆", label: "Award" },
  "check-circle":   { icon: FiCheckCircle,  emoji: "✅", label: "Check" },
  "compass":        { icon: FiCompass,      emoji: "🧭", label: "Compass" },
  "layers":         { icon: FiLayers,       emoji: "🧱", label: "Layers" },
  "lock":           { icon: FiLock,         emoji: "🔒", label: "Lock" },
  "code":           { icon: FiCode,         emoji: "💻", label: "Code" },
  "cpu":            { icon: FiCpu,          emoji: "🧠", label: "CPU" },
  "globe":          { icon: FiGlobe,        emoji: "🌐", label: "Globe" },
  "feather":        { icon: FiFeather,      emoji: "🪶", label: "Feather" },
  "flag":           { icon: FiFlag,         emoji: "🚩", label: "Flag" },
  "anchor":         { icon: FiAnchor,       emoji: "⚓", label: "Anchor" },
  "briefcase":      { icon: FiBriefcase,    emoji: "💼", label: "Briefcase" },
  "coffee":         { icon: FiCoffee,       emoji: "☕", label: "Coffee" },
  "key":            { icon: FiKey,          emoji: "🔑", label: "Key" },
  "tool":           { icon: FiTool,         emoji: "🔧", label: "Tool" },
  "thumbs-up":      { icon: FiThumbsUp,     emoji: "👍", label: "Thumbs up" },
  "package":        { icon: FiPackage,      emoji: "📦", label: "Package" },
  "server":         { icon: FiServer,       emoji: "🖥️", label: "Server" },
  "database":       { icon: FiDatabase,     emoji: "🗄️", label: "Database" },
  "cloud":          { icon: FiCloud,        emoji: "☁️", label: "Cloud" },
  "monitor":        { icon: FiMonitor,      emoji: "🖥️", label: "Monitor" },
  "smartphone":     { icon: FiSmartphone,   emoji: "📱", label: "Smartphone" },
  "send":           { icon: FiSend,         emoji: "📤", label: "Send" },
  "share-2":        { icon: FiShare2,       emoji: "🔗", label: "Share" },
  "user-check":     { icon: FiUserCheck,    emoji: "✔️", label: "User check" },
  "git-branch":     { icon: FiGitBranch,    emoji: "🌿", label: "Git branch" },
  "terminal":       { icon: FiTerminal,     emoji: "⌨️", label: "Terminal" },
  "grid":           { icon: FiGrid,         emoji: "🔲", label: "Grid" },
  "box":            { icon: FiBox,          emoji: "🃏", label: "Box" },
  "sun":            { icon: FiSun,          emoji: "☀️", label: "Sun" },
  "wind":           { icon: FiWind,         emoji: "🌬️", label: "Wind" },
  "refresh-cw":     { icon: FiRefreshCw,    emoji: "🔄", label: "Refresh" },
  "repeat":         { icon: FiRepeat,       emoji: "🔁", label: "Repeat" },
  "life-buoy":      { icon: FiLifeBuoy,     emoji: "🛟", label: "Life buoy" },
  "help-circle":    { icon: FiHelpCircle,   emoji: "❓", label: "Help" },
  "info":           { icon: FiInfo,         emoji: "ℹ️", label: "Info" },
  "bookmark":       { icon: FiBookmark,     emoji: "🔖", label: "Bookmark" },
  "tag":            { icon: FiTag,          emoji: "🏷️", label: "Tag" },
  "edit-3":         { icon: FiEdit3,        emoji: "✏️", label: "Edit" },
  "file-text":      { icon: FiFileText,     emoji: "📄", label: "File" },
  "bar-chart-2":    { icon: FiBarChart2,    emoji: "📊", label: "Chart" },
  "activity":       { icon: FiActivity,     emoji: "📈", label: "Activity" },
  "crosshair":      { icon: FiCrosshair,    emoji: "🎯", label: "Crosshair" },
  "user":           { icon: FiUser,         emoji: "👤", label: "User" },
  "user-plus":      { icon: FiUserPlus,     emoji: "➕", label: "User plus" },
  "list":           { icon: FiList,         emoji: "📋", label: "List" },
  "calendar":       { icon: FiCalendar,     emoji: "📅", label: "Calendar" },
  "map":            { icon: FiMap,          emoji: "🗺️", label: "Map" },
  "pocket":         { icon: FiPocket,       emoji: "👝", label: "Pocket" },
  "gift":           { icon: FiGift,         emoji: "🎁", label: "Gift" },
  "music":          { icon: FiMusic,        emoji: "🎵", label: "Music" },
  "camera":         { icon: FiCamera,       emoji: "📷", label: "Camera" },
  "mic":            { icon: FiMic,          emoji: "🎤", label: "Mic" },
  "video":          { icon: FiVideo,        emoji: "🎬", label: "Video" },
  "image":          { icon: FiImage,        emoji: "🖼️", label: "Image" },
  "link":           { icon: FiLink,         emoji: "🔗", label: "Link" },
  "paperclip":      { icon: FiPaperclip,    emoji: "📎", label: "Paperclip" },
  "shopping-cart":  { icon: FiShoppingCart, emoji: "🛒", label: "Cart" },
  "credit-card":    { icon: FiCreditCard,   emoji: "💳", label: "Card" },
  "truck":          { icon: FiTruck,        emoji: "🚚", label: "Truck" },
  "home":           { icon: FiHome,         emoji: "🏠", label: "Home" },
  "bell":           { icon: FiBell,         emoji: "🔔", label: "Bell" },
  "volume-2":       { icon: FiVolume2,      emoji: "🔊", label: "Volume" },
  "wifi":           { icon: FiWifi,         emoji: "📶", label: "WiFi" },
  "battery-charging":{ icon: FiBatteryCharging, emoji: "🔋", label: "Battery" },
  "filter":         { icon: FiFilter,       emoji: "🔽", label: "Filter" },
  "search":         { icon: FiSearch,       emoji: "🔍", label: "Search" },
  "sliders":        { icon: FiSliders,      emoji: "🎚️", label: "Sliders" },
  "toggle-left":    { icon: FiToggleLeft,   emoji: "🔀", label: "Toggle" },
  "type":           { icon: FiType,         emoji: "🔤", label: "Type" },
  "hash":           { icon: FiHash,         emoji: "#️⃣", label: "Hash" },
  "percent":        { icon: FiPercent,      emoji: "💯", label: "Percent" },
  "dollar-sign":    { icon: FiDollarSign,   emoji: "💵", label: "Dollar" },
};

/** Fallback icon when a value has no known icon key (and no emoji). */
export const FALLBACK_VALUE_ICON: IconType = FiStar;

/** Emoji → icon key, built from the registry (legacy row auto-mapping). */
const EMOJI_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(VALUE_ICONS).map(([key, v]) => [v.emoji, key])
);

export type ResolvedValueIcon =
  | { kind: "icon"; Icon: IconType }
  | { kind: "emoji"; emoji: string };

/**
 * Resolve a stored icon value for display:
 *  - a registry key ("target")      → its icon
 *  - a legacy mapped emoji ("🎯")   → the matching icon
 *  - any other emoji ("🚀")         → rendered as-is (kind: "emoji")
 *  - empty                          → fallback icon
 */
export function resolveValueIcon(value: string | undefined | null): ResolvedValueIcon {
  const v = (value ?? "").trim();
  if (!v) return { kind: "icon", Icon: FALLBACK_VALUE_ICON };
  if (VALUE_ICONS[v]) return { kind: "icon", Icon: VALUE_ICONS[v].icon };
  const mappedKey = EMOJI_TO_KEY[v];
  if (mappedKey) return { kind: "icon", Icon: VALUE_ICONS[mappedKey].icon };
  return { kind: "emoji", emoji: v };
}

/** All registry entries sorted by label — for the admin picker. */
export function listValueIcons(): Array<{ key: string } & ValueIcon> {
  return Object.entries(VALUE_ICONS)
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Server-side check: is this a valid icon key (registry member)? */
export function isValidValueIconKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(VALUE_ICONS, key);
}

/**
 * Normalize a stored icon value to a picker-selectable key: registry keys
 * pass through, legacy mapped emojis convert to their key, anything else
 * (unmapped emoji) is returned unchanged so it can be preserved.
 */
export function normalizeValueIcon(value: string): string {
  const v = value.trim();
  if (VALUE_ICONS[v]) return v;
  return EMOJI_TO_KEY[v] ?? v;
}
