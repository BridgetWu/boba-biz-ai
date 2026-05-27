import { MENU_PRESETS } from "./menuPresets";
import { ACCENT_OPTIONS } from "./theme";
import type {
  AccentColor,
  MarketingCopyByLanguage,
  SiteConfig,
  ThemeMode,
  MenuItem,
  MenuSection,
  ToppingOption,
} from "./types";

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

const DEFAULT_MARKETING_COPY: MarketingCopyByLanguage = {
  en: {
    heroLead:
      "Brew-to-order teas, chewy QQ, salted foams - order ahead for quicker pickup windows.",
    customizationHook: "Sweetness & ice your call",
    menuBanner: "Milk teas, fruit teas, QQ toppings - sweetness and ice your call.",
  },
  "zh-Hant": {
    heroLead: "現點現泡茶飲、Q彈配料、奶蓋系列 - 提前預訂享更快速的取餐時段。",
    customizationHook: "甜度與冰量由您決定",
    menuBanner: "奶茶、水果茶、Q彈配料 - 甜度與冰量由您決定。",
  },
};

export function defaultSiteConfig(): SiteConfig {
  return {
    shopName: "",
    ownerEmail: "",
    shopIcon: undefined,
    tagline: "",
    promoMessage: "Free pearl upgrade on your first online order this week",
    localizedPromoMessage: {
      en: "Free pearl upgrade on your first online order this week",
      "zh-Hant": "本週首次線上下單即享免費珍珠升級",
    },
    city: "",
    language: "en",
    themeMode: "light",
    accentColor: "red",
    heroStyle: "split",
    marketingCopy: DEFAULT_MARKETING_COPY,
    menuSections: [
      { id: "signature", title: "Milk teas & cafe drinks" },
      { id: "house", title: "Fruit teas & coolers" },
      { id: "seasonal", title: "Limited & seasonal" },
    ],
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
    sectionId:
      typeof raw.sectionId === "string"
        ? raw.sectionId
        : raw.category === "signature" || raw.category === "house" || raw.category === "seasonal"
          ? raw.category
          : fallback.sectionId,
    itemType:
      raw.itemType === "drink" || raw.itemType === "food"
        ? raw.itemType
        : raw.isNonDrink === true
          ? "food"
          : fallback.itemType,
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

function normalizeSections(raw: unknown, fallback: MenuSection[]): MenuSection[] {
  if (!Array.isArray(raw)) return fallback;
  const sections = raw
    .filter((value): value is Record<string, unknown> => !!value && typeof value === "object")
    .map((value) => ({
      id: typeof value.id === "string" ? value.id : "",
      title: typeof value.title === "string" ? value.title : "",
    }))
    .filter((value) => value.id.trim().length > 0 && value.title.trim().length > 0);
  return sections.length > 0 ? sections : fallback;
}

function normalizeMarketingCopy(raw: unknown): MarketingCopyByLanguage {
  if (!raw || typeof raw !== "object") return DEFAULT_MARKETING_COPY;
  const root = raw as Record<string, unknown>;
  const normalizeLocale = (
    localeRaw: unknown,
    fallback: MarketingCopyByLanguage["en"],
  ): MarketingCopyByLanguage["en"] => {
    if (!localeRaw || typeof localeRaw !== "object") return fallback;
    const r = localeRaw as Record<string, unknown>;
    return {
      heroLead: typeof r.heroLead === "string" ? r.heroLead : fallback.heroLead,
      customizationHook:
        typeof r.customizationHook === "string"
          ? r.customizationHook
          : fallback.customizationHook,
      menuBanner: typeof r.menuBanner === "string" ? r.menuBanner : fallback.menuBanner,
    };
  };
  return {
    en: normalizeLocale(root.en, DEFAULT_MARKETING_COPY.en),
    "zh-Hant": normalizeLocale(root["zh-Hant"], DEFAULT_MARKETING_COPY["zh-Hant"]),
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
    ownerEmail: typeof r.ownerEmail === "string" ? r.ownerEmail : base.ownerEmail,
    shopIcon: typeof r.shopIcon === "string" ? r.shopIcon : base.shopIcon,
    tagline: typeof r.tagline === "string" ? r.tagline : base.tagline,
    promoMessage:
      typeof r.promoMessage === "string" ? r.promoMessage : base.promoMessage,
    localizedPromoMessage:
      r.localizedPromoMessage && typeof r.localizedPromoMessage === "object"
        ? {
            en:
              typeof (r.localizedPromoMessage as Record<string, unknown>).en === "string"
                ? ((r.localizedPromoMessage as Record<string, unknown>).en as string)
                : base.localizedPromoMessage.en,
            "zh-Hant":
              typeof (r.localizedPromoMessage as Record<string, unknown>)["zh-Hant"] === "string"
                ? ((r.localizedPromoMessage as Record<string, unknown>)["zh-Hant"] as string)
                : base.localizedPromoMessage["zh-Hant"],
          }
        : {
            en: typeof r.promoMessage === "string" ? r.promoMessage : base.localizedPromoMessage.en,
            "zh-Hant": base.localizedPromoMessage["zh-Hant"],
          },
    city: typeof r.city === "string" ? r.city : base.city,
    language: r.language === "zh-Hant" ? "zh-Hant" : base.language,
    themeMode,
    accentColor,
    heroStyle:
      r.heroStyle === "minimal" ||
      r.heroStyle === "feature" ||
      r.heroStyle === "split"
        ? r.heroStyle
        : base.heroStyle,
    marketingCopy: normalizeMarketingCopy(r.marketingCopy),
    menuSections: normalizeSections(r.menuSections, base.menuSections),
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
