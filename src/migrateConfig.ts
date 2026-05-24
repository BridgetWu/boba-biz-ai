import { MENU_PRESETS } from "./menuPresets";
import { ACCENT_OPTIONS } from "./theme";
import type { AccentColor, SiteConfig, ThemeMode, MenuItem, ToppingOption } from "./types";

const VALID_ACCENTS = new Set<AccentColor>(
  ACCENT_OPTIONS.map((a) => a.id),
);

const LEGACY_ACCENT_MAP: Record<
  string,
  { themeMode: ThemeMode; accentColor: AccentColor }
> = {
  matcha: { themeMode: "light", accentColor: "green" },
  taro: { themeMode: "light", accentColor: "purple" },
  brownSugar: { themeMode: "light", accentColor: "gold" },
  lychee: { themeMode: "light", accentColor: "pink" },
  earl: { themeMode: "light", accentColor: "blue" },
  chai: { themeMode: "light", accentColor: "orange" },
  jasmine: { themeMode: "light", accentColor: "teal" },
  midnight: { themeMode: "dark", accentColor: "gold" },
};

export function defaultSiteConfig(): SiteConfig {
  return {
    shopName: "",
    tagline: "",
    promoMessage: "Free pearl upgrade on your first online order this week",
    city: "",
    themeMode: "light",
    accentColor: "red",
    heroStyle: "split",
    menuItems: MENU_PRESETS.classic.map((item) => ({ ...item })),
    isDeliveryEnabled: true,
    sweetnessOptions: ["0%", "25%", "50%", "75%", "100%"],
    toppingOptions: ["Boba pearls", "Lychee jelly", "Aloe vera"],
    delivery: {
      pickup: true,
      delivery: true,
      deliveryNote:
        "Within 3 miles · waives with orders over $25 before 4pm.",
      shipping: false,
      hours: "Wed–Sun · 8:00a – 6:00p",
    },
    billing: "free",
  };
}

function normalizeMenuItem(item: unknown, fallback: MenuItem): MenuItem {
  if (!item || typeof item !== "object") return fallback;
  const raw = item as Record<string, unknown>;
  const customizationRaw =
    raw.customization && typeof raw.customization === "object"
      ? (raw.customization as Record<string, unknown>)
      : null;
  const sweetnessLevels = Array.isArray(customizationRaw?.sweetnessLevels)
    ? customizationRaw?.sweetnessLevels.filter(
        (value): value is string => typeof value === "string",
      )
    : undefined;
  const toppings = Array.isArray(customizationRaw?.toppings)
    ? customizationRaw.toppings
        .filter((value): value is Record<string, unknown> => !!value && typeof value === "object")
        .map(
          (value): ToppingOption => ({
            id: typeof value.id === "string" ? value.id : crypto.randomUUID(),
            name: typeof value.name === "string" ? value.name : "Topping",
            priceDelta:
              typeof value.priceDelta === "number" && Number.isFinite(value.priceDelta)
                ? value.priceDelta
                : undefined,
          }),
        )
    : undefined;

  return {
    id: typeof raw.id === "string" ? raw.id : fallback.id,
    name: typeof raw.name === "string" ? raw.name : fallback.name,
    description:
      typeof raw.description === "string" ? raw.description : fallback.description,
    price: typeof raw.price === "string" ? raw.price : fallback.price,
    category:
      raw.category === "signature" || raw.category === "house" || raw.category === "seasonal"
        ? raw.category
        : fallback.category,
    image: typeof raw.image === "string" ? raw.image : fallback.image,
    customization:
      sweetnessLevels || toppings
        ? {
            ...(sweetnessLevels ? { sweetnessLevels } : {}),
            ...(toppings ? { toppings } : {}),
          }
        : fallback.customization,
  };
}

function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && VALID_ACCENTS.has(value as AccentColor);
}

export function migrateSiteConfig(raw: unknown): SiteConfig {
  const base = defaultSiteConfig();
  if (!raw || typeof raw !== "object") return base;

  const r = raw as Record<string, unknown>;

  let themeMode: ThemeMode = r.themeMode === "dark" ? "dark" : "light";
  let accentColor: AccentColor = isAccentColor(r.accentColor)
    ? r.accentColor
    : "red";

  if (typeof r.accent === "string" && LEGACY_ACCENT_MAP[r.accent]) {
    themeMode = LEGACY_ACCENT_MAP[r.accent].themeMode;
    accentColor = LEGACY_ACCENT_MAP[r.accent].accentColor;
  }

  const delivery =
    r.delivery && typeof r.delivery === "object"
      ? { ...base.delivery, ...(r.delivery as object) }
      : base.delivery;

  return {
    shopName: typeof r.shopName === "string" ? r.shopName : base.shopName,
    tagline: typeof r.tagline === "string" ? r.tagline : base.tagline,
    promoMessage:
      typeof r.promoMessage === "string" ? r.promoMessage : base.promoMessage,
    city: typeof r.city === "string" ? r.city : base.city,
    themeMode,
    accentColor,
    heroStyle:
      r.heroStyle === "minimal" ||
      r.heroStyle === "feature" ||
      r.heroStyle === "split"
        ? r.heroStyle
        : base.heroStyle,
    menuItems: Array.isArray(r.menuItems)
      ? r.menuItems.map((item, index) =>
          normalizeMenuItem(item, base.menuItems[index] ?? base.menuItems[0]),
        )
      : base.menuItems,
    isDeliveryEnabled:
      typeof r.isDeliveryEnabled === "boolean"
        ? r.isDeliveryEnabled
        : base.isDeliveryEnabled,
    sweetnessOptions: Array.isArray(r.sweetnessOptions)
      ? (r.sweetnessOptions.filter((v): v is string => typeof v === "string"))
      : base.sweetnessOptions,
    toppingOptions: Array.isArray(r.toppingOptions)
      ? (r.toppingOptions.filter((v): v is string => typeof v === "string"))
      : base.toppingOptions,
    delivery,
    billing:
      r.billing === "free" ||
      r.billing === "monthly" ||
      r.billing === "yearly"
        ? r.billing
        : base.billing,
  };
}
