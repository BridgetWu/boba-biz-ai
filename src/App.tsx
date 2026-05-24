import { useCallback, useMemo, useState } from "react";
import "./App.css";
import { buildWelcomeHeadline, suggestTagline } from "./aiCopy";
import { defaultSiteConfig } from "./migrateConfig";
import { MENU_PRESETS } from "./menuPresets";
import { ACCENT_OPTIONS, builderThemeStyle } from "./theme";
import {
  getPublishedSiteUrl,
  saveSiteConfig,
} from "./siteConfigStorage";
import { TeaShopPreview } from "./TeaShopPreview";
import type { HeroStyle, SiteConfig, MenuItem } from "./types";

const STEPS = [
  "Welcome",
  "Brand & story",
  "Front page",
  "Digital menu",
  "Pickup & delivery",
  "Plan",
] as const;

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

const SWEETNESS_PRESETS = ["0%", "25%", "50%", "75%", "100%"] as const;
const TOPPING_PRESETS = [
  "Boba pearls",
  "Pudding",
  "Lychee jelly",
  "Aloe vera",
  "Grass jelly",
  "Cheese foam",
] as const;

export default function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [linkCopied, setLinkCopied] = useState(false);
  const [customSweetness, setCustomSweetness] = useState("");
  const [customTopping, setCustomTopping] = useState("");

  const headline = useMemo(
    () => buildWelcomeHeadline(config),
    [config.shopName, config.city],
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
    if (step < STEPS.length - 1 && canNext) setStep((s) => s + 1);
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

  const addMenuItem = useCallback((category: MenuItem["category"] = "signature") => {
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
          category,
        },
      ],
    }));
  }, []);

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
        </div>
      </header>

      <div className="app__layout">
        <aside className="app__wizard">
          <div className="app__wizardInner">
            <div className="app__progress" role="tablist" aria-label="Steps">
              {STEPS.map((label, i) => (
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
                <h2 className="app__stepTitle">Launch a polished boba or tea site</h2>
                <p className="app__stepHint">
                  Answer a handful of prompts — BobaBiz AI assembles your front
                  page, digital menu, and delivery story automatically. No code,
                  no blank canvas.
                </p>
                <ul className="app__welcomeList">
                  <li>Front page tuned for first-time visitors and pickups</li>
                  <li>Digital menu grouped by what you actually serve</li>
                  <li>Pickup, local delivery, and shipping toggles with hours</li>
                </ul>
                <p className="app__stepHint">
                  Start on the free testing plan to generate your preview; upgrade
                  when you&apos;re ready to go live with hosting.
                </p>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="app__stepTitle">Brand & story</h2>
                <p className="app__stepHint">{headline}</p>
                <div className="app__field">
                  <label className="app__label" htmlFor="shop">
                    Shop name
                  </label>
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
                  <label className="app__label" htmlFor="city">
                    City or neighborhood
                  </label>
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
                  <span className="app__label">Site theme</span>
                  <p className="app__paletteHint">
                    Like Kung Fu Tea: dark header, light or dark body, bold accent on headlines.
                  </p>
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
                      Light
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
                      Dark
                    </button>
                  </div>
                </div>
                <div className="app__field">
                  <span className="app__label">Accent color</span>
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
                    Selected:{" "}
                    {ACCENT_OPTIONS.find((a) => a.id === config.accentColor)?.label ??
                      "Red"}
                  </p>
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="tag">
                    Hero headline
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
                </div>
                <div className="app__field">
                  <label className="app__label" htmlFor="promo">
                    Top promo message
                  </label>
                  <input
                    id="promo"
                    className="app__input"
                    value={config.promoMessage}
                    onChange={(e) =>
                      setConfig({ ...config, promoMessage: e.target.value })
                    }
                    placeholder="Offer text shown in the top bar"
                  />
                </div>
                <div className="app__aiRow">
                  <button
                    type="button"
                    className="app__btn app__btn--ghost"
                    onClick={applyTagline}
                  >
                    Suggest headline
                  </button>
                  <p className="app__aiNote">
                    Pulls from your shop name — refine freely.
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="app__stepTitle">Front page layout</h2>
                <p className="app__stepHint">
                  Pick the hero shape. Pick up tweaks on the right instantly.
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
                      <span className="app__pickTitle">{h.title}</span>
                      <p className="app__pickDesc">{h.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="app__stepTitle">Digital menu starter</h2>
                <p className="app__stepHint">
                  Swap curated sets now; replace items later in the editor.
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
                        <span className="app__pickTitle">{m.title}</span>
                        <p className="app__pickDesc">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="app__btn app__btn--ghost"
                  onClick={() => addMenuItem("signature")}
                >
                  + Add menu item
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="app__stepTitle">Pickup & delivery</h2>
                <p className="app__stepHint">
                  Guests see only the options you enable. Hours stay visible in
                  the order section.
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
                    Enable Online Delivery
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
                    Counter & scheduled pickup
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
                    Local delivery
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
                    Bottle kits & pantry merch shipping
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
                      Delivery details
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
                    Published hours
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
                  <span className="app__label">Sweetness presets</span>
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
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="app__aiRow">
                    <input
                      className="app__input"
                      value={customSweetness}
                      onChange={(e) => setCustomSweetness(e.target.value)}
                      placeholder="Add custom sweetness option"
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
                  <span className="app__label">Toppings presets</span>
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
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className="app__aiRow">
                    <input
                      className="app__input"
                      value={customTopping}
                      onChange={(e) => setCustomTopping(e.target.value)}
                      placeholder="Add custom topping option"
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
                <h2 className="app__stepTitle">Plans</h2>
                <p className="app__stepHint">
                  The testing plan unlocks full website generation in this
                  builder. Paid tiers add hosted publishing with SSL, checkout
                  add-ons, and priority support — pick what fits your stage.
                </p>
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
                      Free · Testing plan
                    </span>
                    <p className="app__pickDesc">
                      Generate your pages, tweak copy, and use the live preview.
                      Ideal for mocks and staff reviews before you subscribe.
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
                      Hosted live site, SSL, menu editor — pause or migrate
                      anytime.
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
                      About ${yearlyMonthlyEq}/mo billed annually — save vs monthly.
                    </p>
                  </button>
                </div>
                <p className="app__aiNote">
                  Selected:{" "}
                  <strong>
                    {config.billing === "free"
                      ? "Free testing plan"
                      : config.billing === "monthly"
                        ? "Monthly billing"
                        : "Yearly billing"}
                  </strong>
                  .
                  {config.billing === "free"
                    ? " You can refine every step anytime; upgrading only affects hosting when you publish."
                    : " Pricing applies when you publish through BobaBiz AI — your preview is for layout and copy."}
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
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="app__btn app__btn--primary"
                  onClick={goNext}
                  disabled={!canNext}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="app__btn app__btn--primary"
                  onClick={publishSite}
                  disabled={config.shopName.trim().length < 2}
                >
                  Open your website
                </button>
              )}
            </div>
          </div>
        </aside>

        <section className="app__preview" aria-label="Website preview">
          <div className="app__publishBar">
            <div>
              <p className="app__previewTag" style={{ margin: 0 }}>
                Live preview
              </p>
              <p className="app__publishHint">
                Generate a real page you can open in a new tab or share. The
                builder stays here; your shop site opens at{" "}
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
                Open your website
              </button>
              <button
                type="button"
                className="app__btn app__btn--ghost"
                onClick={() => void copySiteLink()}
                disabled={config.shopName.trim().length < 2}
              >
                {linkCopied ? "Link copied" : "Copy site link"}
              </button>
            </div>
          </div>
          <div className="app__previewFrame">
            <TeaShopPreview
              config={config}
              onMenuItemUpdate={handleMenuItemUpdate}
              onAddMenuItem={addMenuItem}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
