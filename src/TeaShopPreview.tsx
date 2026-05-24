import { useMemo, useState } from "react";
import type { DeliveryOrder, MenuItem, SiteConfig, ToppingOption } from "./types";
import { menuIntroLine } from "./aiCopy";
import { siteThemeStyle } from "./theme";
import { EditableMenuItem } from "./EditableMenuItem";

interface CartItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitBasePrice: number;
  sweetnessLevel?: string;
  toppings: ToppingOption[];
}

interface PaymentForm {
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

function categoryLabel(c: SiteConfig["menuItems"][0]["category"]): string {
  if (c === "signature") return "Milk teas & cafe drinks";
  if (c === "seasonal") return "Limited & seasonal";
  return "Fruit teas & coolers";
}

function parsePrice(price: string): number {
  const numeric = Number.parseFloat(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function lineTotal(item: CartItem): number {
  const toppingsTotal = item.toppings.reduce((sum, topping) => sum + (topping.priceDelta ?? 0), 0);
  return (item.unitBasePrice + toppingsTotal) * item.quantity;
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function maskExpDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function maskCvv(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function TeaShopPreview({
  config,
  onMenuItemUpdate,
  onAddMenuItem,
}: {
  config: SiteConfig;
  onMenuItemUpdate?: (updatedItem: MenuItem) => void;
  onAddMenuItem?: (category?: MenuItem["category"]) => void;
}) {
  const shop = config.shopName.trim() || "Your boba shop";
  const city = config.city.trim();
  const tagline = config.tagline.trim() || "Bubble tea brewed fresh — toppings your way.";
  const isOwnerEditor = Boolean(onMenuItemUpdate || onAddMenuItem);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [payment, setPayment] = useState<PaymentForm>({
    cardholderName: "",
    cardNumber: "",
    expirationDate: "",
    cvv: "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<DeliveryOrder | null>(null);

  const grouped = (["signature", "house", "seasonal"] as const).map((key) => ({
    key,
    label: categoryLabel(key),
    items: config.menuItems.filter((m) => m.category === key),
  }));

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + lineTotal(item), 0), [cart]);
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 25 ? 0 : 3.99;
  const total = subtotal + deliveryFee;

  const activeSweetnessOptions = activeItem?.customization?.sweetnessLevels?.length
    ? activeItem.customization.sweetnessLevels
    : config.sweetnessOptions;
  const activeToppingOptions = activeItem?.customization?.toppings?.length
    ? activeItem.customization.toppings
    : config.toppingOptions.map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        priceDelta: 0,
      }));

  const openCustomizer = (item: MenuItem) => {
    setActiveItem(item);
    setSelectedSweetness((item.customization?.sweetnessLevels ?? config.sweetnessOptions)[2] ?? "");
    setSelectedToppings([]);
  };

  const addToCart = () => {
    if (!activeItem) return;
    const newItem: CartItem = {
      id: `${activeItem.id}-${Date.now()}`,
      menuItemId: activeItem.id,
      itemName: activeItem.name,
      quantity: 1,
      unitBasePrice: parsePrice(activeItem.price),
      sweetnessLevel: selectedSweetness || undefined,
      toppings: selectedToppings,
    };
    setCart((prev) => [...prev, newItem]);
    setActiveItem(null);
  };

  const placeOrder = () => {
    setCheckoutError("");
    if (cart.length === 0) {
      setCheckoutError("Add at least one item before checkout.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setCheckoutError("Delivery address is required.");
      return;
    }
    const cardDigits = payment.cardNumber.replace(/\D/g, "");
    if (payment.cardholderName.trim().length < 2) {
      setCheckoutError("Cardholder name is required.");
      return;
    }
    if (cardDigits.length < 13 || cardDigits.length > 19) {
      setCheckoutError("Enter a valid card number.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expirationDate)) {
      setCheckoutError("Use MM/YY for the expiration date.");
      return;
    }
    if (!/^\d{3,4}$/.test(payment.cvv)) {
      setCheckoutError("CVV must be 3 or 4 digits.");
      return;
    }

    const order: DeliveryOrder = {
      id: `ord-${Date.now()}`,
      createdAtIso: new Date().toISOString(),
      items: cart.map((item) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitBasePrice: item.unitBasePrice,
        sweetnessLevel: item.sweetnessLevel,
        toppings: item.toppings,
        lineTotal: lineTotal(item),
      })),
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: deliveryAddress.trim(),
      payment: {
        cardholderName: payment.cardholderName.trim(),
        maskedCardNumber: `**** **** **** ${cardDigits.slice(-4)}`,
        expirationDate: payment.expirationDate,
        maskedCvv: "***",
      },
    };

    setPlacedOrder(order);
    setCart([]);
    setDeliveryAddress("");
    setPayment({ cardholderName: "", cardNumber: "", expirationDate: "", cvv: "" });
  };

  return (
    <div className={`tsp tsp--${config.themeMode}`} style={siteThemeStyle(config.themeMode, config.accentColor)}>
      <div className="tsp__promo">{config.promoMessage}</div>

      <header className="tsp__nav">
        <div className="tsp__brand">
          <span className="tsp__logo" aria-hidden />
          <div>
            <div className="tsp__name">{shop}</div>
            {city ? <div className="tsp__city">{city}</div> : null}
          </div>
        </div>
        <nav className="tsp__links" aria-label="Primary">
          <a href="#home">Home</a>
          <a href="#menu" className="tsp__linkAccent">Menu</a>
          {config.isDeliveryEnabled ? (
            <a href="#delivery" className="tsp__linkCta">Delivery / Order Online</a>
          ) : null}
        </nav>
      </header>

      <main>
        <section id="home" className={`tsp__hero tsp__hero--${config.heroStyle}`}>
          <div className="tsp__heroInner">
            <p className="tsp__kicker">Sweetness & ice your call</p>
            <h1 className="tsp__h1">{tagline}</h1>
            <p className="tsp__lead">Brew-to-order teas, chewy QQ, salted foams - order ahead for quicker pickup windows.</p>
            <div className="tsp__ctaRow">
              <a className="tsp__btn tsp__btn--primary" href="#menu">View digital menu</a>
              {config.isDeliveryEnabled ? (
                <a className="tsp__btn tsp__btn--ghost" href="#delivery">Delivery & pickup</a>
              ) : null}
            </div>
          </div>
        </section>

        <section id="menu" className="tsp__section">
          <div className="tsp__sectionHead">
            <h2 className="tsp__sectionTitle">Digital menu</h2>
            <p className="tsp__sectionSub">{menuIntroLine()}</p>
          </div>
          <div className="tsp__menuGrid">
            {grouped.map((g) =>
              g.items.length > 0 ? (
                <div key={g.key} className="tsp__menuCol">
                  <div className="tsp__menuColHead">
                    <h3 className="tsp__menuHeading">{g.label}</h3>
                    {onAddMenuItem ? (
                      <button
                        type="button"
                        className="tsp__menuAddBtn tsp__menuAddBtn--small"
                        onClick={() => onAddMenuItem(g.key)}
                      >
                        + Add
                      </button>
                    ) : null}
                  </div>
                  <ul className="tsp__menuList">
                    {g.items.map((item) =>
                      isOwnerEditor ? (
                        <EditableMenuItem key={item.id} item={item} onUpdate={onMenuItemUpdate || (() => {})} />
                      ) : (
                        <li key={item.id} className="tsp__menuItem">
                          <button type="button" className="tsp__menuOrderBtn" onClick={() => openCustomizer(item)}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="tsp__menuPublicImage" />
                            ) : (
                              <div className="tsp__menuPublicImage tsp__menuPublicImage--placeholder" aria-hidden>
                                No image
                              </div>
                            )}
                            <div className="tsp__menuTop"><span className="tsp__menuName">{item.name}</span><span className="tsp__menuPrice">{item.price}</span></div>
                            <p className="tsp__menuDesc">{item.description}</p>
                            <span className="tsp__menuAddLabel">Customize & add</span>
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
          {onAddMenuItem ? (
            <button type="button" className="tsp__menuAddBtn" onClick={() => onAddMenuItem("signature")}>
              + Add menu item
            </button>
          ) : null}
        </section>

        {config.isDeliveryEnabled ? (
          <section id="delivery" className="tsp__section tsp__section--alt">
            <div className="tsp__sectionHead">
              <h2 className="tsp__sectionTitle">Delivery checkout</h2>
              <p className="tsp__sectionSub">Build your order, add your address, and complete payment details below.</p>
            </div>
            <div className="tsp__checkoutGrid">
              <div className="tsp__card">
                <h3 className="tsp__cardTitle">Your cart</h3>
                {cart.length === 0 ? <p className="tsp__cardBody">Your cart is empty.</p> : null}
                {cart.map((item) => (
                  <div key={item.id} className="tsp__cartLine">
                    <div>
                      <strong>{item.itemName}</strong>
                      {item.sweetnessLevel ? <p className="tsp__cardBody">Sweetness: {item.sweetnessLevel}</p> : null}
                      {item.toppings.length > 0 ? (
                        <p className="tsp__cardBody">Toppings: {item.toppings.map((t) => `${t.name}${t.priceDelta ? ` (+${formatUsd(t.priceDelta)})` : ""}`).join(", ")}</p>
                      ) : null}
                    </div>
                    <div className="tsp__menuPrice">{formatUsd(lineTotal(item))}</div>
                  </div>
                ))}
                <div className="tsp__totals">
                  <div><span>Subtotal</span><span>{formatUsd(subtotal)}</span></div>
                  <div><span>Delivery fee</span><span>{formatUsd(deliveryFee)}</span></div>
                  <div className="tsp__grand"><span>Total</span><span>{formatUsd(total)}</span></div>
                </div>
              </div>

              <div className="tsp__card">
                <h3 className="tsp__cardTitle">Checkout</h3>
                <label className="tsp__fieldLabel" htmlFor="address">Delivery address</label>
                <input id="address" className="tsp__input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="123 Main St, Apt 4, City" />

                <label className="tsp__fieldLabel" htmlFor="cardName">Cardholder Name</label>
                <input id="cardName" className="tsp__input" value={payment.cardholderName} onChange={(e) => setPayment((prev) => ({ ...prev, cardholderName: e.target.value }))} />

                <label className="tsp__fieldLabel" htmlFor="cardNumber">Card Number</label>
                <input id="cardNumber" className="tsp__input" inputMode="numeric" value={payment.cardNumber} onChange={(e) => setPayment((prev) => ({ ...prev, cardNumber: maskCardNumber(e.target.value) }))} placeholder="1234 5678 9012 3456" />

                <div className="tsp__row2">
                  <div>
                    <label className="tsp__fieldLabel" htmlFor="exp">Expiration Date</label>
                    <input id="exp" className="tsp__input" inputMode="numeric" value={payment.expirationDate} onChange={(e) => setPayment((prev) => ({ ...prev, expirationDate: maskExpDate(e.target.value) }))} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="tsp__fieldLabel" htmlFor="cvv">CVV</label>
                    <input id="cvv" className="tsp__input" type="password" inputMode="numeric" value={payment.cvv} onChange={(e) => setPayment((prev) => ({ ...prev, cvv: maskCvv(e.target.value) }))} placeholder="123" />
                  </div>
                </div>

                {checkoutError ? <p className="tsp__error">{checkoutError}</p> : null}
                <button type="button" className="tsp__btn tsp__btn--primary" onClick={placeOrder}>Place order</button>
                {placedOrder ? <p className="tsp__success">Order {placedOrder.id} placed. Total charged: {formatUsd(placedOrder.total)}.</p> : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {activeItem ? (
        <div className="tsp__modalBackdrop" role="dialog" aria-modal="true" aria-label="Customize drink">
          <div className="tsp__modal">
            <h3 className="tsp__cardTitle">Customize {activeItem.name}</h3>
            <p className="tsp__cardBody">Base price: {activeItem.price}</p>

            <div>
              <p className="tsp__fieldLabel">Sweetness level</p>
              <div className="tsp__chips">
                {activeSweetnessOptions.map((option) => (
                  <button key={option} type="button" className={selectedSweetness === option ? "tsp__chip tsp__chip--on" : "tsp__chip"} onClick={() => setSelectedSweetness(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="tsp__fieldLabel">Toppings</p>
              <div className="tsp__toppingList">
                {activeToppingOptions.map((option) => {
                  const checked = selectedToppings.some((t) => t.id === option.id);
                  return (
                    <label key={option.id} className="tsp__checkRow">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedToppings((prev) =>
                            e.target.checked
                              ? [...prev, option]
                              : prev.filter((t) => t.id !== option.id),
                          );
                        }}
                      />
                      <span>{option.name} {option.priceDelta ? `(+${formatUsd(option.priceDelta)})` : ""}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="tsp__ctaRow">
              <button type="button" className="tsp__btn tsp__btn--ghost" onClick={() => setActiveItem(null)}>Cancel</button>
              <button type="button" className="tsp__btn tsp__btn--primary" onClick={addToCart}>Add to order</button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .tsp { font-family: "Source Sans 3", system-ui, sans-serif; color: var(--tsp-deep); background: var(--tsp-page-bg); min-height: 100%; }
        .tsp__promo { background: var(--tsp-promo-bg); color: var(--tsp-promo-ink); text-align: center; font-size: .72rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: .45rem 1rem; }
        .tsp__nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1.25rem; position: sticky; top: 0; background: var(--tsp-nav-bg); color: var(--tsp-nav-ink); z-index: 2; }
        .tsp__brand { display: flex; align-items: center; gap: .65rem; }
        .tsp__logo { width: 2.5rem; height: 2.5rem; border-radius: 999px; background: #0a0a0a; border: 2px solid var(--tsp-accent); display: inline-block; }
        .tsp__name { font-family: "Fraunces", Georgia, serif; font-weight: 700; font-size: 1rem; color: var(--tsp-accent); text-transform: uppercase; letter-spacing: .04em; }
        .tsp__city { font-size: .78rem; color: var(--tsp-nav-muted); text-transform: uppercase; letter-spacing: .08em; }
        .tsp__links { display: flex; align-items: center; gap: 1.1rem; font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .tsp__links a { color: var(--tsp-nav-ink); text-decoration: none; }
        .tsp__linkAccent, .tsp__linkCta { color: var(--tsp-accent) !important; }
        .tsp__hero { display: grid; gap: 1.5rem; padding: 2.5rem 1.25rem 2rem; border-bottom: 1px solid var(--tsp-border); background: var(--tsp-hero-bg); }
        .tsp__heroInner { max-width: 38rem; }
        .tsp__kicker { text-transform: uppercase; letter-spacing: .14em; font-size: .7rem; font-weight: 600; color: var(--tsp-muted); margin: 0 0 .65rem; }
        .tsp__h1 { font-family: "Fraunces", Georgia, serif; font-size: clamp(2rem, 5vw, 2.85rem); font-weight: 800; line-height: 1.05; margin: 0 0 .85rem; color: var(--tsp-accent); text-transform: uppercase; letter-spacing: -.02em; }
        .tsp__lead { margin: 0 0 1.25rem; color: var(--tsp-muted); font-size: 1.02rem; max-width: 32rem; }
        .tsp__ctaRow { display: flex; flex-wrap: wrap; gap: .75rem; }
        .tsp__btn { display: inline-flex; align-items: center; justify-content: center; padding: .7rem 1.15rem; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: .88rem; text-transform: uppercase; letter-spacing: .05em; cursor: pointer; }
        .tsp__btn--primary { background: var(--tsp-accent); color: var(--tsp-btn-on-primary); border: 2px solid var(--tsp-accent); }
        .tsp__btn--ghost { background: transparent; color: var(--tsp-deep); border: 2px solid var(--tsp-deep); }
        .tsp__section { padding: 2rem 1.25rem; }
        .tsp__section--alt { background: var(--tsp-section-alt); border-top: 1px solid var(--tsp-border); }
        .tsp__sectionHead { max-width: 36rem; margin-bottom: 1.5rem; }
        .tsp__sectionTitle { font-family: "Fraunces", Georgia, serif; font-size: 1.5rem; margin: 0 0 .35rem; text-transform: uppercase; letter-spacing: .02em; }
        .tsp__sectionSub { margin: 0; color: var(--tsp-muted); }
        .tsp__menuGrid { display: grid; gap: 1.5rem; }
        @media (min-width: 720px) { .tsp__menuGrid { grid-template-columns: repeat(3, 1fr); gap: 1.25rem; } }
        .tsp__menuHeading { font-family: "Fraunces", Georgia, serif; font-size: 1.05rem; margin: 0 0 .75rem; color: var(--tsp-accent); text-transform: uppercase; letter-spacing: .04em; }
        .tsp__menuColHead { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
        .tsp__menuList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
        .tsp__menuOrderBtn { width: 100%; text-align: left; border: 1px solid var(--tsp-border); border-radius: .75rem; padding: .8rem; background: var(--tsp-surface); cursor: pointer; }
        .tsp__menuOrderBtn:hover { border-color: var(--tsp-accent); }
        .tsp__menuPublicImage { width: 100%; aspect-ratio: 4 / 3; height: auto; object-fit: contain; border-radius: .5rem; margin-bottom: .7rem; border: 1px solid var(--tsp-border); background: var(--tsp-surface); }
        .tsp__menuPublicImage--placeholder { display: grid; place-items: center; color: var(--tsp-muted); font-size: .8rem; background: var(--tsp-accent-soft); }
        .tsp__menuAddLabel { margin-top: .6rem; display: inline-block; color: var(--tsp-accent); font-weight: 700; font-size: .8rem; text-transform: uppercase; }
        .tsp__menuAddBtn { margin-top: 1rem; font: inherit; border-radius: 999px; border: 1px solid var(--tsp-accent); background: var(--tsp-accent-soft); color: var(--tsp-accent); padding: .5rem .9rem; font-weight: 700; cursor: pointer; }
        .tsp__menuAddBtn--small { margin-top: 0; padding: .35rem .7rem; font-size: .75rem; }
        .tsp__menuTop { display: flex; justify-content: space-between; gap: .75rem; font-weight: 600; }
        .tsp__menuName { font-family: "Fraunces", Georgia, serif; }
        .tsp__menuPrice { color: var(--tsp-accent); white-space: nowrap; font-weight: 700; }
        .tsp__menuDesc { margin: .25rem 0 0; color: var(--tsp-muted); font-size: .92rem; }
        .tsp__menuImageWrapper { width: 100%; }
        .tsp__menuImage {
          width: 100%;
          aspect-ratio: 4 / 3;
          height: auto;
          object-fit: contain;
          border-radius: .5rem;
          border: 1px solid var(--tsp-border);
          background: var(--tsp-surface);
        }
        .tsp__menuImagePlaceholder {
          width: 100%;
          aspect-ratio: 4 / 3;
          border: 2px dashed var(--tsp-border);
          border-radius: .5rem;
          background: var(--tsp-surface);
          display: grid;
          place-items: center;
        }
        .tsp__card { background: var(--tsp-surface); border: 1px solid var(--tsp-border); border-radius: .75rem; padding: 1rem 1.1rem; }
        .tsp__cardTitle { font-family: "Fraunces", Georgia, serif; font-size: 1.05rem; margin: 0 0 .5rem; color: var(--tsp-accent); }
        .tsp__cardBody { margin: 0; color: var(--tsp-muted); font-size: .95rem; }
        .tsp__checkoutGrid { display: grid; gap: 1rem; }
        @media (min-width: 900px) { .tsp__checkoutGrid { grid-template-columns: 1fr 1fr; } }
        .tsp__cartLine { display: flex; justify-content: space-between; gap: .8rem; border-top: 1px solid var(--tsp-border); padding-top: .65rem; margin-top: .65rem; }
        .tsp__totals { margin-top: .75rem; border-top: 1px solid var(--tsp-border); padding-top: .75rem; display: grid; gap: .35rem; }
        .tsp__totals div { display: flex; justify-content: space-between; }
        .tsp__grand { font-weight: 700; }
        .tsp__fieldLabel { display: block; margin: .65rem 0 .25rem; font-size: .85rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
        .tsp__input { width: 100%; font: inherit; border: 1px solid var(--tsp-border); border-radius: .55rem; padding: .55rem .65rem; background: var(--tsp-surface); color: var(--tsp-deep); }
        .tsp__row2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        .tsp__error { color: #b42318; font-weight: 600; margin: .75rem 0; }
        .tsp__success { color: #047857; font-weight: 600; margin: .75rem 0 0; }
        .tsp__modalBackdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, .45); display: grid; place-items: center; padding: 1rem; z-index: 20; }
        .tsp__modal { width: min(520px, 100%); background: var(--tsp-surface); border-radius: .85rem; border: 1px solid var(--tsp-border); padding: 1rem; }
        .tsp__chips { display: flex; flex-wrap: wrap; gap: .45rem; }
        .tsp__chip { border: 1px solid var(--tsp-border); background: transparent; border-radius: 999px; padding: .32rem .62rem; cursor: pointer; font: inherit; }
        .tsp__chip--on { background: var(--tsp-accent-soft); border-color: var(--tsp-accent); color: var(--tsp-accent); font-weight: 700; }
        .tsp__toppingList { display: grid; gap: .35rem; }
        .tsp__checkRow { display: flex; align-items: center; gap: .5rem; color: var(--tsp-muted); }
      `}</style>
    </div>
  );
}
