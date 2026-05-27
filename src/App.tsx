import { useCallback, useMemo, useState } from "react";
import "./App.css";
import {
  buildWelcomeHeadline,
  generateHeroHeadline,
  generatePromoMessage,
  suggestTagline,
} from "./aiCopy";
import { defaultSiteConfig } from "./migrateConfig";
import { MENU_PRESETS } from "./menuPresets";
import { ACCENT_OPTIONS, builderThemeStyle } from "./theme";
import {
  getPublishedSiteUrl,
  saveSiteConfig,
} from "./siteConfigStorage";
import { TeaShopPreview } from "./TeaShopPreview";
import type { HeroStyle, SiteConfig, MenuItem } from "./types";

const BUILDER_COPY = {
  en: {
    steps: ["Welcome", "Brand & story", "Front page", "Digital menu", "Pickup & delivery", "Plan"],
    launchTitle: "Launch a polished boba or tea site",
    launchBody:
      "Answer a handful of prompts - BobaBiz AI assembles your front page, digital menu, and delivery story automatically. No code, no blank canvas.",
    launchBullets: [
      "Front page tuned for first-time visitors and pickups",
      "Digital menu grouped by what you actually serve",
      "Pickup, local delivery, and shipping toggles with hours",
    ],
    launchFooter:
      "Start on the free testing plan to generate your preview; upgrade when you're ready to go live with hosting.",
    topPromo: "Top promo message",
    back: "Back",
    continue: "Continue",
    openSite: "Open your website",
    brandStory: "Brand & story",
    frontPageLayout: "Front page layout",
    menuStarter: "Digital menu starter",
    pickupDelivery: "Pickup & delivery",
    plans: "Plans",
    siteTheme: "Site theme",
    accentColor: "Accent color",
    heroHeadline: "Hero headline",
    deliveryDetails: "Delivery details",
    publishedHours: "Published hours",
    sweetnessPresets: "Sweetness presets",
    toppingsPresets: "Toppings presets",
    enableDelivery: "Enable Online Delivery",
    counterPickup: "Counter & scheduled pickup",
    localDelivery: "Local delivery",
    shipping: "Bottle kits & pantry merch shipping",
  },
  "zh-Hant": {
    steps: ["歡迎", "品牌與故事", "首頁版面", "數位菜單", "自取與外送", "方案"],
    launchTitle: "快速建立專業的手搖飲網站",
    launchBody:
      "回答幾個簡單問題，BobaBiz AI 會自動生成首頁、數位菜單與外送資訊。無需寫程式，也不用從空白開始。",
    launchBullets: [
      "首頁針對新客與自取需求最佳化",
      "數位菜單依實際品項分組呈現",
      "可切換自取、外送與宅配並顯示營業時間",
    ],
    launchFooter: "先用免費測試方案預覽網站，準備上線時再升級。",
    topPromo: "頂部促銷訊息",
    back: "返回",
    continue: "繼續",
    openSite: "開啟你的網站",
    brandStory: "品牌與故事",
    frontPageLayout: "首頁版面",
    menuStarter: "數位菜單起始內容",
    pickupDelivery: "自取與外送",
    plans: "方案",
    siteTheme: "網站主題",
    accentColor: "強調色",
    heroHeadline: "首頁主標",
    deliveryDetails: "外送資訊",
    publishedHours: "對外營業時間",
    sweetnessPresets: "甜度預設",
    toppingsPresets: "配料預設",
    enableDelivery: "啟用線上外送",
    counterPickup: "櫃檯與預約自取",
    localDelivery: "在地外送",
    shipping: "瓶裝組合與周邊寄送",
  },
} as const;

const HERO: { id: HeroStyle; title: string; desc: string }[] = [
  {
    id: "minimal",
    title: "Quiet hero",
    desc: "Headline and buttons only — fast on phones.",
  },
  {
    id: "feature",
    title: "Featured panel",
    desc: "Soft highlight card for daily specials.",
  },
  {
    id: "split",
    title: "Split story",
    desc: "Narrative column plus a companion aside.",
  },
];

const MENUS: { id: keyof typeof MENU_PRESETS; title: string; desc: string }[] =
  [
    {
      id: "classic",
      title: "Night-market classics",
      desc: "Pearl blacks, Okinawa swirl, savory popcorn chicken staples.",
    },
  ];

function localizedToppingLabel(lang: "en" | "zh-Hant", value: string): string {
  if (lang === "en") return value;
  return TOPPING_LABELS[value] ?? value;
}

const SWEETNESS_PRESETS = ["0%", "25%", "50%", "75%", "100%"] as const;
const TOPPING_PRESETS = [
  "Boba pearls",
  "Pudding",
  "Lychee jelly",
  "Aloe vera",
  "Grass jelly",
  "Cheese foam",
] as const;

const UI_TEXT = {
  en: {
    shopName: "Shop name",
    city: "City or neighborhood",
    light: "Light",
    dark: "Dark",
    aiGenerate: "AI Generate",
    suggestHeadline: "Suggest headline",
    suggestHint: "Pulls from your shop name - refine freely.",
    frontHint: "Pick the hero shape. Pick up tweaks on the right instantly.",
    heroA: "Quiet hero",
    heroADesc: "Headline and buttons only - fast on phones.",
    heroB: "Featured panel",
    heroBDesc: "Soft highlight card for daily specials.",
    heroC: "Split story",
    heroCDesc: "Narrative column plus a companion aside.",
    menuHint: "Swap curated sets now; replace items later in the editor.",
    menuPresetTitle: "Night-market classics",
    menuPresetDesc: "Pearl blacks, Okinawa swirl, savory popcorn chicken staples.",
    addMenuSection: "+ Add menu section",
    deliveryHint: "Guests see only the options you enable. Hours stay visible in the order section.",
    addSweetness: "Add custom sweetness option",
    addTopping: "Add custom topping option",
    add: "+ Add",
    plansHint:
      "The testing plan unlocks full website generation in this builder. Paid tiers add hosted publishing with SSL, checkout add-ons, and priority support - pick what fits your stage.",
    livePreview: "Live preview",
    livePreviewHint:
      "Generate a real page you can open in a new tab or share. The builder stays here; your shop site opens at",
    linkCopied: "Link copied",
    copyLink: "Copy site link",
    selected: "Selected:",
    ownerEmail: "Owner email",
    shopIcon: "Shop icon",
    uploadIcon: "Upload icon",
    clearIcon: "Use default icon",
  },
  "zh-Hant": {
    shopName: "\u5e97\u540d",
    city: "\u57ce\u5e02\u6216\u5546\u5708",
    light: "\u660e\u4eae",
    dark: "\u6697\u8272",
    aiGenerate: "AI \u751f\u6210",
    suggestHeadline: "\u5efa\u8b70\u4e3b\u6a19",
    suggestHint: "\u6839\u64da\u4f60\u7684\u5e97\u540d\u751f\u6210\uff0c\u53ef\u4ee5\u81ea\u7531\u518d\u8abf\u6574\u3002",
    frontHint: "\u5148\u9078\u64c7\u9996\u9801\u7248\u578b\uff0c\u53f3\u5074\u6703\u5373\u6642\u66f4\u65b0\u3002",
    heroA: "\u7c21\u6f54\u9996\u9801",
    heroADesc: "\u53ea\u986f\u793a\u6a19\u984c\u8207\u6309\u9215\uff0c\u884c\u52d5\u7248\u8f09\u5165\u66f4\u5feb\u3002",
    heroB: "\u4e3b\u6253\u5340\u584a",
    heroBDesc: "\u4ee5\u67d4\u548c\u91cd\u9ede\u5361\u5448\u73fe\u7576\u65e5\u63a8\u85a6\u3002",
    heroC: "\u5206\u6b04\u6545\u4e8b",
    heroCDesc: "\u5de6\u53f3\u5206\u6b04\u6574\u5408\u54c1\u724c\u6545\u4e8b\u8207\u88dc\u5145\u8cc7\u8a0a\u3002",
    menuHint: "\u5148\u5957\u7528\u7cbe\u9078\u83dc\u55ae\uff0c\u4e4b\u5f8c\u53ef\u5728\u7de8\u8f2f\u5668\u518d\u66f4\u63db\u3002",
    menuPresetTitle: "\u591c\u5e02\u7d93\u5178",
    menuPresetDesc: "\u7d93\u5178\u73cd\u73e0\u8336\u3001\u6c96\u7e69\u98a8\u5473\u8207\u9e79\u9165\u96de\u4e00\u6b21\u5230\u4f4d\u3002",
    addMenuSection: "+ \u65b0\u589e\u83dc\u55ae\u5206\u985e",
    deliveryHint: "\u9867\u5ba2\u53ea\u6703\u770b\u5230\u4f60\u555f\u7528\u7684\u9078\u9805\uff0c\u71df\u696d\u6642\u9593\u6703\u986f\u793a\u5728\u8a02\u55ae\u5340\u3002",
    addSweetness: "\u65b0\u589e\u81ea\u8a02\u751c\u5ea6",
    addTopping: "\u65b0\u589e\u81ea\u8a02\u914d\u6599",
    add: "+ \u65b0\u589e",
    plansHint:
      "\u6e2c\u8a66\u65b9\u6848\u53ef\u5b8c\u6574\u751f\u6210\u7db2\u7ad9\u3002\u4ed8\u8cbb\u65b9\u6848\u5305\u542b SSL \u8a17\u7ba1\u3001\u7d50\u5e33\u52a0\u503c\u8207\u512a\u5148\u652f\u63f4\u3002",
    livePreview: "\u5373\u6642\u9810\u89bd",
    livePreviewHint:
      "\u7522\u751f\u4e00\u500b\u53ef\u5728\u65b0\u5206\u9801\u958b\u555f\u6216\u5206\u4eab\u7684\u5be6\u969b\u9801\u9762\u3002\u7de8\u8f2f\u5668\u6703\u7559\u5728\u9019\u88e1\uff1b\u4f60\u7684\u7db2\u7ad9\u6703\u958b\u5728",
    linkCopied: "\u5df2\u8907\u88fd\u9023\u7d50",
    copyLink: "\u8907\u88fd\u7db2\u7ad9\u9023\u7d50",
    selected: "\u5df2\u9078\u64c7\uff1a",
    ownerEmail: "\u5e97\u4e3b\u96fb\u5b50\u90f5\u4ef6",
    shopIcon: "\u5e97\u5bb6\u5716\u793a",
    uploadIcon: "\u4e0a\u50b3\u5716\u793a",
    clearIcon: "\u4f7f\u7528\u9810\u8a2d\u5713\u5f62\u5716\u793a",
  },
} as const;

const TOPPING_LABELS: Record<string, string> = {
  "Boba pearls": "\u73cd\u73e0",
  Pudding: "\u5e03\u4e01",
  "Lychee jelly": "\u8354\u679d\u84df\u84bb",
  "Aloe vera": "\u8606\u8588",
  "Grass jelly": "\u4ed9\u8349",
  "Cheese foam": "\u5976\u84cb",
};

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [linkCopied, setLinkCopied] = useState(false);
  const [customSweetness, setCustomSweetness] = useState("");
  const [customTopping, setCustomTopping] = useState("");
  const copy = BUILDER_COPY[config.language];
  const ui = UI_TEXT[config.language];

  const toggleLanguage = useCallback(() => {
    setConfig((c) => ({
      ...c,
      language: c.language === "en" ? "zh-Hant" : "en",
    }));
  }, []);

  const headline = useMemo(
    () => buildWelcomeHeadline(config, config.language),
    [config.shopName, config.city, config.language],
  );

  const applyTagline = useCallback(() => {
    setConfig((c) => ({
      ...c,
      tagline: suggestTagline(c.shopName),
    }));
  }, []);

  const canNext = useMemo(() => {
    if (step === 1) return config.shopName.trim().length >= 2;
    if (step === 4) {
      return (
        config.delivery.pickup ||
        config.delivery.delivery ||
        config.delivery.shipping
      );
    }
    return true;
  }, [step, config.shopName, config.delivery]);

  const goNext = () => {
    if (step < copy.steps.length - 1 && canNext) setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const publishSite = useCallback(() => {
    saveSiteConfig(config);
    window.location.assign(getPublishedSiteUrl(config));
  }, [config]);

  const copySiteLink = useCallback(async () => {
    saveSiteConfig(config);
    const url = getPublishedSiteUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt("Copy your site link:", url);
    }
  }, [config]);

  const handleMenuItemUpdate = useCallback((updatedItem: MenuItem) => {
    setConfig((c) => ({
      ...c,
      menuItems: c.menuItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    }));
  }, []);

  const addMenuItem = useCallback((sectionId?: string) => {
    const id = `custom-${Date.now()}`;
    setConfig((c) => ({
      ...c,
      menuItems: [
        ...c.menuItems,
        {
          id,
          name: "New menu item",
          description: "Tap to edit description",
          price: "$0.00",
          category: "signature",
          sectionId: sectionId ?? c.menuSections[0]?.id ?? "signature",
          itemType: "drink",
        },
      ],
    }));
  }, []);

  const addMenuSection = useCallback(() => {
    const id = `section-${Date.now()}`;
    setConfig((c) => ({
      ...c,
      menuSections: [...c.menuSections, { id, title: "New section" }],
    }));
  }, []);

  const deleteMenuSection = useCallback((sectionId: string) => {
    setConfig((c) => {
      const nextSections = c.menuSections.filter((section) => section.id !== sectionId);
      if (nextSections.length === 0) return c;
      return {
        ...c,
        menuSections: nextSections,
        menuItems: c.menuItems.filter((item) => item.sectionId !== sectionId),
      };
    });
  }, []);

  const renameMenuSection = useCallback((sectionId: string, title: string) => {
    setConfig((c) => ({
      ...c,
      menuSections: c.menuSections.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    }));
  }, []);

  const updateMarketingCopy = useCallback(
    (field: "heroLead" | "customizationHook" | "menuBanner", value: string) => {
      setConfig((c) => ({
        ...c,
        marketingCopy: {
          ...c.marketingCopy,
          [c.language]: {
            ...c.marketingCopy[c.language],
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const toggleOption = useCallback(
    (key: "sweetnessOptions" | "toppingOptions", value: string) => {
      setConfig((c) => {
        const existing = c[key];
        const next = existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value];
        return { ...c, [key]: next };
      });
    },
    [],
  );

  const addCustomOption = useCallback(
    (key: "sweetnessOptions" | "toppingOptions", rawValue: string) => {
      const value = rawValue.trim();
      if (!value) return;
      setConfig((c) => {
        if (c[key].includes(value)) return c;
        return { ...c, [key]: [...c[key], value] };
      });
    },
    [],
  );

  const monthlyPrice = 29;
  const yearlyPrice = 249;
  const yearlyMonthlyEq = Math.round(yearlyPrice / 12);

  const handleShopIconUpload = useCallback(
    (file: File | null) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) return;
        setConfig((c) => ({ ...c, shopIcon: result }));
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  return (
    <div
      className="app"
      style={builderThemeStyle(config.themeMode, config.accentColor)}
    >
      <header className="app__bar">
        <div className="app__barInner">
          <div className="app__product">
            <div className="app__productMark" aria-hidden />
            <div className="app__productText">
              <span className="app__productName">BobaBiz AI</span>
              <span className="app__productSub">
                Website builder for boba & tea shops
              </span>
            </div>
          </div>
          <span className="app__productSub" style={{ textAlign: "right" }}>
            Publish-ready pages in minutes
          </span>
          <button type="button" className="app__btn app__btn--ghost" onClick={toggleLanguage}>
            {config.language === "en" ? "EN / 繁" : "繁 / EN"}
          </button>
        </div>
      </header>

      <div className="app__layout">
        <aside className="app__wizard">
          <div className="app__wizardInner">
            <div className="app__progress" role="tablist" aria-label="Steps">
              {copy.steps.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={
                    i === step
                      ? "app__dot app__dot--active"
                      : i < step
                        ? "app__dot app__dot--done"
                        : "app__dot"
                  }
                  onClick={() => setStep(i)}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <>
                <h2 className="app__stepTitle">{copy.launchTitle}</h2>
                <p className="app__stepHint">{copy.launchBody}</p>
                <ul className="app__welcomeList">
                  {copy.launchBullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <p className="app__stepHint">{copy.launchFooter}</p>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="app__stepTitle">{copy.brandStory}</h2>
                <p className="app__stepHint">{headline}</p>
                <div className="app__field">
                  <label className="app__label" htmlFor="shop">{ui.shopName}</label>
                  <input
                    id="shop"
                    className="app__input"
                    value={config.shopName}
                    onChange={(e) =>
                      setConfig({ ...config, shopName: e.target.value })
                    }
                    placeholder="e.g. Pearl Alley Boba Lab"
                    autoComplete="organization"
                  />
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="city">{ui.city}</label>
                  <input
                    id="city"
                    className="app__input"
                    value={config.city}
                    onChange={(e) =>
                      setConfig({ ...config, city: e.target.value })
                    }
                    placeholder="e.g. Portland, Pearl District"
                  />
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="ownerEmail">{ui.ownerEmail}</label>
                  <input
                    id="ownerEmail"
                    type="email"
                    className="app__input"
                    value={config.ownerEmail}
                    onChange={(e) =>
                      setConfig({ ...config, ownerEmail: e.target.value })
                    }
                    placeholder="owner@yourshop.com"
                    autoComplete="email"
                  />
                </div>
                <div className="app__field">
                  <span className="app__label">{ui.shopIcon}</span>
                  <input
                    type="file"
                    className="app__input"
                    accept="image/*"
                    onChange={(e) => handleShopIconUpload(e.target.files?.[0] ?? null)}
                  />
                  {config.shopIcon ? (
                    <button
                      type="button"
                      className="app__btn app__btn--ghost"
                      onClick={() => setConfig((c) => ({ ...c, shopIcon: undefined }))}
                    >
                      {ui.clearIcon}
                    </button>
                  ) : null}
                </div>
                <div className="app__field">
                  <span className="app__label">{copy.siteTheme}</span>
                  <div className="app__themeToggle" role="group" aria-label="Light or dark site">
                    <button
                      type="button"
                      className={
                        config.themeMode === "light"
                          ? "app__themeBtn app__themeBtn--on"
                          : "app__themeBtn"
                      }
                      onClick={() => setConfig({ ...config, themeMode: "light" })}
                    >
                      {ui.light}
                    </button>
                    <button
                      type="button"
                      className={
                        config.themeMode === "dark"
                          ? "app__themeBtn app__themeBtn--on"
                          : "app__themeBtn"
                      }
                      onClick={() => setConfig({ ...config, themeMode: "dark" })}
                    >
                      {ui.dark}
                    </button>
                  </div>
                </div>
                <div className="app__field">
                  <span className="app__label">{copy.accentColor}</span>
                  <div className="app__accentGrid" role="listbox" aria-label="Accent color">
                    {ACCENT_OPTIONS.map((accent) => (
                      <button
                        key={accent.id}
                        type="button"
                        role="option"
                        aria-selected={config.accentColor === accent.id}
                        aria-label={accent.label}
                        title={accent.label}
                        className={
                          config.accentColor === accent.id
                            ? "app__accentSwatch app__accentSwatch--on"
                            : "app__accentSwatch"
                        }
                        style={{ backgroundColor: accent.hex }}
                        onClick={() =>
                          setConfig({ ...config, accentColor: accent.id })
                        }
                      />
                    ))}
                  </div>
                  <p className="app__accentLabel">
                    {ui.selected}{" "}
                    {ACCENT_OPTIONS.find((a) => a.id === config.accentColor)?.label ??
                      "Red"}
                  </p>
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="tag">
                    {copy.heroHeadline}
                  </label>
                  <textarea
                    id="tag"
                    className="app__textarea"
                    value={config.tagline}
                    onChange={(e) =>
                      setConfig({ ...config, tagline: e.target.value })
                    }
                    placeholder="A short line guests see first"
                  />
                  <button
                    type="button"
                    className="app__btn app__btn--ghost"
                    onClick={() =>
                      setConfig((c) => ({ ...c, tagline: generateHeroHeadline() }))
                    }
                  >
                    {ui.aiGenerate}
                  </button>
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="promo">
                    {copy.topPromo}
                  </label>
                  <input
                    id="promo"
                    className="app__input"
                    value={config.localizedPromoMessage[config.language]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        localizedPromoMessage: {
                          ...config.localizedPromoMessage,
                          [config.language]: e.target.value,
                        },
                        promoMessage:
                          config.language === "en" ? e.target.value : config.promoMessage,
                      })
                    }
                    placeholder="Offer text shown in the top bar"
                  />
                  <button
                    type="button"
                    className="app__btn app__btn--ghost"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        localizedPromoMessage: {
                          ...c.localizedPromoMessage,
                          [c.language]: generatePromoMessage(),
                        },
                      }))
                    }
                  >
                    {ui.aiGenerate}
                  </button>
                </div>
                <div className="app__aiRow">
                  <button
                    type="button"
                    className="app__btn app__btn--ghost"
                    onClick={applyTagline}
                  >
                    {ui.suggestHeadline}
                  </button>
                  <p className="app__aiNote">
                  <p className="app__aiNote">{ui.suggestHint}</p>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="app__stepTitle">{copy.frontPageLayout}</h2>
                <p className="app__stepHint">
                  {ui.frontHint}
                </p>
                <div className="app__cards">
                  {HERO.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={
                        config.heroStyle === h.id
                          ? "app__pick app__pick--on"
                          : "app__pick"
                      }
                      onClick={() =>
                        setConfig({ ...config, heroStyle: h.id })
                      }
                    >
                      <span className="app__pickTitle">{h.id === "minimal" ? ui.heroA : h.id === "feature" ? ui.heroB : ui.heroC}</span>
                      <p className="app__pickDesc">{h.id === "minimal" ? ui.heroADesc : h.id === "feature" ? ui.heroBDesc : ui.heroCDesc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="app__stepTitle">{copy.menuStarter}</h2>
                <p className="app__stepHint">
                  {ui.menuHint}
                </p>
                <div className="app__cards">
                  {MENUS.map((m) => {
                    const active =
                      config.menuItems[0]?.id === MENU_PRESETS[m.id][0]?.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={
                          active ? "app__pick app__pick--on" : "app__pick"
                        }
                        onClick={() =>
                          setConfig({
                            ...config,
                            menuItems: MENU_PRESETS[m.id].map((item) => ({
                              ...item,
                            })),
                          })
                        }
                      >
                        <span className="app__pickTitle">{ui.menuPresetTitle}</span>
                        <p className="app__pickDesc">{ui.menuPresetDesc}</p>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="app__btn app__btn--ghost"
                  onClick={addMenuSection}
                >
                  {ui.addMenuSection}
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="app__stepTitle">{copy.pickupDelivery}</h2>
                <p className="app__stepHint">
                  {ui.deliveryHint}
                </p>
                <div className="app__rows">
                  <label className="app__check">
                    <input
                      type="checkbox"
                      checked={config.isDeliveryEnabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          isDeliveryEnabled: e.target.checked,
                        })
                      }
                    />
                    {copy.enableDelivery}
                  </label>
                  <label className="app__check">
                    <input
                      type="checkbox"
                      checked={config.delivery.pickup}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          delivery: {
                            ...config.delivery,
                            pickup: e.target.checked,
                          },
                        })
                      }
                    />
                    {copy.counterPickup}
                  </label>
                  <label className="app__check">
                    <input
                      type="checkbox"
                      checked={config.delivery.delivery}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          delivery: {
                            ...config.delivery,
                            delivery: e.target.checked,
                          },
                        })
                      }
                    />
                    {copy.localDelivery}
                  </label>
                  <label className="app__check">
                    <input
                      type="checkbox"
                      checked={config.delivery.shipping}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          delivery: {
                            ...config.delivery,
                            shipping: e.target.checked,
                          },
                        })
                      }
                    />
                    {copy.shipping}
                  </label>
                </div>
                {!config.isDeliveryEnabled ? (
                  <p className="app__stepHint">
                    Online ordering is hidden from your public page until this is enabled.
                  </p>
                ) : null}
                {config.delivery.delivery ? (
                  <div className="app__field">
                    <label className="app__label" htmlFor="delnote">
                      {copy.deliveryDetails}
                    </label>
                    <textarea
                      id="delnote"
                      className="app__textarea"
                      value={config.delivery.deliveryNote}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          delivery: {
                            ...config.delivery,
                            deliveryNote: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ) : null}
                <div className="app__field">
                  <label className="app__label" htmlFor="hours">
                    {copy.publishedHours}
                  </label>
                  <input
                    id="hours"
                    className="app__input"
                    value={config.delivery.hours}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        delivery: {
                          ...config.delivery,
                          hours: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="app__field">
                  <span className="app__label">{copy.sweetnessPresets}</span>
                  <div className="app__chips">
                    {SWEETNESS_PRESETS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={
                          config.sweetnessOptions.includes(option)
                            ? "app__chip app__chip--on"
                            : "app__chip"
                        }
                        onClick={() => toggleOption("sweetnessOptions", option)}
                      >
                        {localizedToppingLabel(config.language, option)}
                      </button>
                    ))}
                  </div>
                  <div className="app__aiRow">
                    <input
                      className="app__input"
                      value={customSweetness}
                      onChange={(e) => setCustomSweetness(e.target.value)}
                      placeholder="{ui.addSweetness}"
                    />
                    <button
                      type="button"
                      className="app__btn app__btn--ghost"
                      onClick={() => {
                        addCustomOption("sweetnessOptions", customSweetness);
                        setCustomSweetness("");
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div className="app__field">
                  <span className="app__label">{copy.toppingsPresets}</span>
                  <div className="app__chips">
                    {TOPPING_PRESETS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={
                          config.toppingOptions.includes(option)
                            ? "app__chip app__chip--on"
                            : "app__chip"
                        }
                        onClick={() => toggleOption("toppingOptions", option)}
                      >
                        {localizedToppingLabel(config.language, option)}
                      </button>
                    ))}
                  </div>
                  <div className="app__aiRow">
                    <input
                      className="app__input"
                      value={customTopping}
                      onChange={(e) => setCustomTopping(e.target.value)}
                      placeholder="{ui.addTopping}"
                    />
                    <button
                      type="button"
                      className="app__btn app__btn--ghost"
                      onClick={() => {
                        addCustomOption("toppingOptions", customTopping);
                        setCustomTopping("");
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="app__stepTitle">{copy.plans}</h2>
                <p className="app__stepHint">{ui.plansHint}</p>




                <div className="app__priceGrid">
                  <button
                    type="button"
                    className={
                      config.billing === "free"
                        ? "app__pick app__pick--on"
                        : "app__pick"
                    }
                    onClick={() =>
                      setConfig({ ...config, billing: "free" })
                    }
                  >
                    <span className="app__pickTitle">
                      {config.language === "zh-Hant" ? "\u514d\u8cbb - \u6e2c\u8a66\u65b9\u6848" : "Free - Testing plan"}
                    </span>
                    <p className="app__pickDesc">
                      {config.language === "zh-Hant"
                        ? "\u751f\u6210\u9801\u9762\u3001\u8abf\u6574\u6587\u6848\u4e26\u4f7f\u7528\u5373\u6642\u9810\u89bd\uff0c\u9069\u5408\u5167\u90e8\u6f14\u793a\u8207\u6aa2\u8996\u3002"
                        : "Generate your pages, tweak copy, and use the live preview. Ideal for mocks and staff reviews before you subscribe."}
                    </p>
                  </button>
                  <button
                    type="button"
                    className={
                      config.billing === "monthly"
                        ? "app__pick app__pick--on"
                        : "app__pick"
                    }
                    onClick={() =>
                      setConfig({ ...config, billing: "monthly" })
                    }
                  >
                    <span className="app__pickTitle">
                      ${monthlyPrice} / month
                    </span>
                    <p className="app__pickDesc">
                      {config.language === "zh-Hant" ? "\u542b SSL \u8a17\u7ba1\u4e0a\u7dda\u3001\u83dc\u55ae\u7de8\u8f2f\uff0c\u96a8\u6642\u53ef\u66ab\u505c\u6216\u9077\u79fb\u3002" : "Hosted live site, SSL, menu editor - pause or migrate anytime."}

                    </p>
                  </button>
                  <button
                    type="button"
                    className={
                      config.billing === "yearly"
                        ? "app__pick app__pick--on"
                        : "app__pick"
                    }
                    onClick={() =>
                      setConfig({ ...config, billing: "yearly" })
                    }
                  >
                    <span className="app__pickTitle">
                      ${yearlyPrice} / year
                    </span>
                    <p className="app__pickDesc">
                      {config.language === "zh-Hant" ? `\u7d04 $${yearlyMonthlyEq}/\u6708\uff08\u5e74\u7e73\uff09\uff0c\u6bd4\u6708\u7e73\u66f4\u7701\u3002` : `About $${yearlyMonthlyEq}/mo billed annually - save vs monthly.`}
                    </p>
                  </button>
                </div>
                <p className="app__aiNote">
                  {ui.selected}{" "}
                  <strong>
                    {config.billing === "free"
                      ? (config.language === "zh-Hant" ? "\u514d\u8cbb\u6e2c\u8a66\u65b9\u6848" : "Free testing plan")
                      : config.billing === "monthly"
                        ? (config.language === "zh-Hant" ? "\u6708\u7e73" : "Monthly billing")
                        : (config.language === "zh-Hant" ? "\u5e74\u7e73" : "Yearly billing")}
                  </strong>
                  .
                  {config.billing === "free"
                    ? (config.language === "zh-Hant" ? " \u4f60\u53ef\u96a8\u6642\u8abf\u6574\u6240\u6709\u6b65\u9a5f\uff0c\u5347\u7d1a\u50c5\u5f71\u97ff\u4e0a\u7dda\u8a17\u7ba1\u3002" : " You can refine every step anytime; upgrading only affects hosting when you publish.")
                    : (config.language === "zh-Hant" ? " \u767c\u4f48\u5230 BobaBiz AI \u624d\u6703\u5957\u7528\u8cbb\u7528\uff0c\u9810\u89bd\u968e\u6bb5\u50c5\u4f9b\u7248\u578b\u8207\u6587\u6848\u8abf\u6574\u3002" : " Pricing applies when you publish through BobaBiz AI - your preview is for layout and copy.")}
                </p>
              </>
            )}

            <div className="app__navRow">
              <button
                type="button"
                className="app__btn app__btn--ghost"
                onClick={goBack}
                disabled={step === 0}
              >
                {copy.back}
              </button>
              {step < copy.steps.length - 1 ? (
                <button
                  type="button"
                  className="app__btn app__btn--primary"
                  onClick={goNext}
                  disabled={!canNext}
                >
                  {copy.continue}
                </button>
              ) : (
                <button
                  type="button"
                  className="app__btn app__btn--primary"
                  onClick={publishSite}
                  disabled={config.shopName.trim().length < 2}
                >
                  {copy.openSite}
                </button>
              )}
            </div>
          </div>
        </aside>

        <section className="app__preview" aria-label="Website preview">
          <div className="app__publishBar">
            <div>
              <p className="app__previewTag" style={{ margin: 0 }}>
                {ui.livePreview}
              </p>
              <p className="app__publishHint">
                {ui.livePreviewHint}{" "}
                <code className="app__code">site.html</code>.
              </p>
            </div>
            <div className="app__publishActions">
              <button
                type="button"
                className="app__btn app__btn--primary"
                onClick={publishSite}
                disabled={config.shopName.trim().length < 2}
              >
                {copy.openSite}
              </button>
              <button
                type="button"
                className="app__btn app__btn--ghost"
                onClick={() => void copySiteLink()}
                disabled={config.shopName.trim().length < 2}
              >
                {linkCopied ? ui.linkCopied : ui.copyLink}
              </button>
            </div>
          </div>
          <div className="app__previewFrame">
            <TeaShopPreview
              config={config}
              onMenuItemUpdate={handleMenuItemUpdate}
              onAddMenuItem={addMenuItem}
              onAddMenuSection={addMenuSection}
              onDeleteMenuSection={deleteMenuSection}
              onRenameMenuSection={renameMenuSection}
              onLanguageToggle={toggleLanguage}
              onMarketingCopyUpdate={updateMarketingCopy}
            />
          </div>
        </section>
      </div>
    </div>
  );
}






