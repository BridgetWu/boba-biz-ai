/** Billing: free testing tier or paid hosted plans */
export type BillingPlan = "free" | "monthly" | "yearly";

export type ThemeMode = "light" | "dark";

export type AccentColor =
  | "red"
  | "blue"
  | "gold"
  | "green"
  | "purple"
  | "orange"
  | "pink"
  | "teal";

export type HeroStyle = "minimal" | "feature" | "split";
export type LanguageCode = "en" | "zh-Hant";

export interface LocalizedMarketingContent {
  heroLead: string;
  customizationHook: string;
  menuBanner: string;
}

export interface MarketingCopyByLanguage {
  en: LocalizedMarketingContent;
  "zh-Hant": LocalizedMarketingContent;
}

export interface ToppingOption {
  id: string;
  name: string;
  priceDelta?: number;
}

export interface MenuCustomization {
  sweetnessLevels?: string[];
  toppings?: ToppingOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: "signature" | "house" | "seasonal";
  sectionId: string;
  itemType: "drink" | "food";
  image?: string;
  customization?: MenuCustomization;
}

export interface MenuSection {
  id: string;
  title: string;
}

export interface OrderItemSelection {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitBasePrice: number;
  sweetnessLevel?: string;
  toppings: ToppingOption[];
  lineTotal: number;
}

export interface DeliveryOrder {
  id: string;
  createdAtIso: string;
  items: OrderItemSelection[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  payment: {
    cardholderName: string;
    maskedCardNumber: string;
    expirationDate: string;
    maskedCvv: string;
  };
}

export interface SiteConfig {
  shopName: string;
  ownerEmail: string;
  shopIcon?: string;
  tagline: string;
  promoMessage: string;
  localizedPromoMessage: Record<LanguageCode, string>;
  city: string;
  language: LanguageCode;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  heroStyle: HeroStyle;
  marketingCopy: MarketingCopyByLanguage;
  menuSections: MenuSection[];
  menuItems: MenuItem[];
  isDeliveryEnabled: boolean;
  sweetnessOptions: string[];
  toppingOptions: string[];
  delivery: {
    pickup: boolean;
    delivery: boolean;
    deliveryNote: string;
    shipping: boolean;
    hours: string;
  };
  billing: BillingPlan;
}
