import { useMemo, useState } from "react";
import type { DeliveryOrder, LanguageCode, MenuItem, SiteConfig, ToppingOption } from "./types";
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

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
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

const UI_COPY: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: "Home",
    menu: "Menu",
    delivery: "Delivery / Order Online",
    viewMenu: "View digital menu",
    deliveryPickup: "Delivery & pickup",
    digitalMenu: "Digital menu",
    customizeAdd: "Customize & add",
    noImage: "No image",
    checkoutTitle: "Delivery checkout",
    checkoutSub: "Build your order, add your address, and complete payment details below.",
    yourCart: "Your cart",
    cartEmpty: "Your cart is empty.",
    sweetness: "Sweetness",
    toppings: "Toppings",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    total: "Total",
    checkout: "Checkout",
    deliveryAddress: "Delivery address",
    cardholderName: "Cardholder Name",
    cardNumber: "Card Number",
    expirationDate: "Expiration Date",
    placeOrder: "Place order",
    orderPlaced: "Order",
    orderPlacedSuffix: "placed. Total charged:",
    customize: "Customize",
    basePrice: "Base price",
    sweetnessLevel: "Sweetness level",
    cancel: "Cancel",
    addToOrder: "Add to order",
    sectionTitle: "Section title",
    addItem: "+ Add item",
    delete: "Delete",
    addSection: "+ Add menu section",
    nonDrinkMessage: "This item is marked as non-drink, so drink customizations are hidden.",
    contactTitle: "Contact us",
    contactSub: "Send a message directly to the shop owner.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    message: "Message",
    send: "Send",
    ownerEmailMissing: "Owner email is not set yet.",
    contactSent: "Your message is ready to send in your email app.",
  },
  "zh-Hant": {
    home: "\u9996\u9801",
    menu: "\u83dc\u55ae",
    delivery: "\u5916\u9001 / \u7dda\u4e0a\u9ede\u9910",
    viewMenu: "\u67e5\u770b\u6578\u4f4d\u83dc\u55ae",
    deliveryPickup: "\u5916\u9001\u8207\u81ea\u53d6",
    digitalMenu: "\u6578\u4f4d\u83dc\u55ae",
    customizeAdd: "\u5ba2\u88fd\u4e26\u52a0\u5165",
    noImage: "\u7121\u5716\u7247",
    checkoutTitle: "\u5916\u9001\u7d50\u5e33",
    checkoutSub: "\u5efa\u7acb\u60a8\u7684\u8a02\u55ae\uff0c\u586b\u5beb\u5730\u5740\uff0c\u4e26\u5b8c\u6210\u4ed8\u6b3e\u8cc7\u8a0a\u3002",
    yourCart: "\u4f60\u7684\u8cfc\u7269\u8eca",
    cartEmpty: "\u8cfc\u7269\u8eca\u76ee\u524d\u662f\u7a7a\u7684\u3002",
    sweetness: "\u751c\u5ea6",
    toppings: "\u914d\u6599",
    subtotal: "\u5c0f\u8a08",
    deliveryFee: "\u5916\u9001\u8cbb",
    total: "\u7e3d\u8a08",
    checkout: "\u7d50\u5e33",
    deliveryAddress: "\u5916\u9001\u5730\u5740",
    cardholderName: "\u6301\u5361\u4eba\u59d3\u540d",
    cardNumber: "\u5361\u865f",
    expirationDate: "\u5230\u671f\u65e5",
    placeOrder: "\u9001\u51fa\u8a02\u55ae",
    orderPlaced: "\u8a02\u55ae",
    orderPlacedSuffix: "\u4e0b\u55ae\u6210\u529f\uff0c\u7e3d\u6263\u6b3e\uff1a",
    customize: "\u5ba2\u88fd",
    basePrice: "\u57fa\u790e\u50f9\u683c",
    sweetnessLevel: "\u751c\u5ea6\u9078\u64c7",
    cancel: "\u53d6\u6d88",
    addToOrder: "\u52a0\u5165\u8a02\u55ae",
    sectionTitle: "\u5206\u985e\u6a19\u984c",
    addItem: "+ \u65b0\u589e\u54c1\u9805",
    delete: "\u522a\u9664",
    addSection: "+ \u65b0\u589e\u83dc\u55ae\u5206\u985e",
    nonDrinkMessage: "\u6b64\u54c1\u9805\u70ba\u975e\u98f2\u54c1\uff0c\u56e0\u6b64\u4e0d\u986f\u793a\u751c\u5ea6\u8207\u914d\u6599\u8a2d\u5b9a\u3002",
    contactTitle: "\u806f\u7d61\u6211\u5011",
    contactSub: "\u76f4\u63a5\u50b3\u9001\u8a0a\u606f\u7d66\u5e97\u4e3b\u3002",
    firstName: "\u540d",
    lastName: "\u59d3",
    email: "\u96fb\u5b50\u90f5\u4ef6",
    message: "\u7559\u8a00",
    send: "\u9001\u51fa",
    ownerEmailMissing: "\u5c1a\u672a\u8a2d\u5b9a\u5e97\u4e3b\u96fb\u5b50\u90f5\u4ef6\u3002",
    contactSent: "\u5df2\u958b\u555f\u90f5\u4ef6\u7a0b\u5f0f\uff0c\u53ef\u4ee5\u76f4\u63a5\u9001\u51fa\u8a0a\u606f\u3002",
  },
};

const TERM_TRANSLATIONS: Record<string, string> = {
  "Classic Pearl Black Milk Tea": "\u7d93\u5178\u73cd\u73e0\u7d05\u8336\u62ff\u9435",
  "Okinawa Roast Milk Tea": "\u6c96\u7e69\u9ed1\u7cd6\u70d8\u7119\u5976\u8336",
  "Winter Melon Lemonade QQ": "\u51ac\u74dc\u6ab8\u6aacQQ",
  "Taiwanese Popcorn Chicken": "\u53f0\u5f0f\u9e7d\u9165\u96de",
  "Ceylon and Assam brew, cane sugar ice level, boba simmered in honey syrup.": "\u932b\u862d\u8207\u963f\u85a9\u59c6\u62fc\u914d\u8336\u5e95\uff0c\u53ef\u8abf\u7cd6\u51b0\uff0c\u8702\u871c\u7cd6\u6f3f\u6162\u71ac\u73cd\u73e0\u3002",
  "Roasted Okinawa brown sugar swirl, oat or whole milk, hot or cold.": "\u6c96\u7e69\u9ed1\u7cd6\u9999\u6c23\uff0c\u71d5\u9ea5\u6216\u5168\u8102\u725b\u5976\u53ef\u9078\uff0c\u51b7\u71b1\u7686\u5b9c\u3002",
  "Light winter melon tea, calamansi, basil seed, and coconut jelly.": "\u6e05\u723d\u51ac\u74dc\u8336\u642d\u914d\u91d1\u6843\u3001\u7f85\u52d2\u7c7d\u8207\u6930\u679c\u3002",
  "Shatter-crisp marinade, plum powder shaker, pickled radish bites.": "\u5916\u9165\u5167\u5ae9\u91c0\u88fd\u96de\u584a\uff0c\u6885\u7c89\u63d0\u5473\uff0c\u9644\u9183\u863f\u8514\u3002",
  "Boba pearls": "\u73cd\u73e0",
  "Lychee jelly": "\u8354\u679d\u84df\u84bb",
  "Aloe vera": "\u8606\u8588",
  Pudding: "\u5e03\u4e01",
  "Grass jelly": "\u4ed9\u8349",
  "Cheese foam": "\u5976\u84cb",
  "Tapioca Pearls": "\u73cd\u73e0",
  "Coconut Jelly": "\u6930\u679c",
};

function tTerm(lang: LanguageCode, value: string): string {
  return lang === "zh-Hant" ? TERM_TRANSLATIONS[value] ?? value : value;
}

function InlineEditableText({
  value,
  className,
  multiline = false,
  editable = false,
  onCommit,
}: {
  value: string;
  className: string;
  multiline?: boolean;
  editable?: boolean;
  onCommit?: (nextValue: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editable) return multiline ? <p className={className}>{value}</p> : <span className={className}>{value}</span>;

  const commit = () => {
    setEditing(false);
    const next = draft.trim() || value;
    if (next !== value && onCommit) onCommit(next);
  };

  if (editing) {
    if (multiline) {
      return <textarea className="tsp__inlineEditor" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }} autoFocus />;
    }
    return <input className="tsp__inlineEditor" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} autoFocus />;
  }

  const open = () => { setDraft(value); setEditing(true); };
  return multiline ? <p className={`${className} tsp__editable`} onClick={open}>{value}</p> : <span className={`${className} tsp__editable`} onClick={open}>{value}</span>;
}

export function TeaShopPreview({
  config,
  onMenuItemUpdate,
  onAddMenuItem,
  onAddMenuSection,
  onDeleteMenuSection,
  onRenameMenuSection,
  onLanguageToggle,
  onMarketingCopyUpdate,
}: {
  config: SiteConfig;
  onMenuItemUpdate?: (updatedItem: MenuItem) => void;
  onAddMenuItem?: (sectionId?: string) => void;
  onAddMenuSection?: () => void;
  onDeleteMenuSection?: (sectionId: string) => void;
  onRenameMenuSection?: (sectionId: string, title: string) => void;
  onLanguageToggle?: () => void;
  onMarketingCopyUpdate?: (field: "heroLead" | "customizationHook" | "menuBanner", value: string) => void;
}) {
  const lang = config.language;
  const ui = UI_COPY[lang];
  const marketing = config.marketingCopy[lang];
  const shop = config.shopName.trim() || (lang === "zh-Hant" ? "\u4f60\u7684\u624b\u6416\u98f2\u5e97" : "Your boba shop");
  const city = config.city.trim();
  const tagline = config.tagline.trim() || (lang === "zh-Hant"
    ? "\u73fe\u6ce1\u624b\u6416\u3001\u914d\u6599\u96a8\u4f60\u642d"
    : "Bubble tea brewed fresh - toppings your way.");
  const isOwnerEditor = Boolean(onMenuItemUpdate || onAddMenuItem);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [payment, setPayment] = useState<PaymentForm>({ cardholderName: "", cardNumber: "", expirationDate: "", cvv: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<DeliveryOrder | null>(null);
  const [contact, setContact] = useState<ContactForm>({ firstName: "", lastName: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState("");
  const [contactError, setContactError] = useState("");

  const grouped = config.menuSections.map((section) => ({ key: section.id, label: section.title, items: config.menuItems.filter((m) => m.sectionId === section.id) }));
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + lineTotal(item), 0), [cart]);
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 25 ? 0 : 3.99;
  const total = subtotal + deliveryFee;

  const activeSweetnessOptions = activeItem?.customization?.sweetnessLevels?.length ? activeItem.customization.sweetnessLevels : config.sweetnessOptions;
  const activeToppingOptions = activeItem?.customization?.toppings?.length ? activeItem.customization.toppings : config.toppingOptions.map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, priceDelta: 0 }));

  const addToCart = () => {
    if (!activeItem) return;
    setCart((prev) => [...prev, { id: `${activeItem.id}-${Date.now()}`, menuItemId: activeItem.id, itemName: tTerm(lang, activeItem.name), quantity: 1, unitBasePrice: parsePrice(activeItem.price), sweetnessLevel: selectedSweetness || undefined, toppings: activeItem.itemType === "food" ? [] : selectedToppings }]);
    setActiveItem(null);
  };

  const placeOrder = () => {
    setCheckoutError("");
    if (cart.length === 0) return setCheckoutError(lang === "zh-Hant" ? "???????????" : "Add at least one item before checkout.");
    if (!deliveryAddress.trim()) return setCheckoutError(lang === "zh-Hant" ? "????????" : "Delivery address is required.");
    const cardDigits = payment.cardNumber.replace(/\D/g, "");
    if (payment.cardholderName.trim().length < 2) return setCheckoutError(lang === "zh-Hant" ? "?????????" : "Cardholder name is required.");
    if (cardDigits.length < 13 || cardDigits.length > 19) return setCheckoutError(lang === "zh-Hant" ? "????????" : "Enter a valid card number.");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expirationDate)) return setCheckoutError(lang === "zh-Hant" ? "?????? MM/YY?" : "Use MM/YY for the expiration date.");
    if (!/^\d{3,4}$/.test(payment.cvv)) return setCheckoutError(lang === "zh-Hant" ? "CVV ?? 3 ? 4 ??" : "CVV must be 3 or 4 digits.");

    setPlacedOrder({ id: `ord-${Date.now()}`, createdAtIso: new Date().toISOString(), items: cart.map((item) => ({ menuItemId: item.menuItemId, itemName: item.itemName, quantity: item.quantity, unitBasePrice: item.unitBasePrice, sweetnessLevel: item.sweetnessLevel, toppings: item.toppings, lineTotal: lineTotal(item) })), subtotal, deliveryFee, total, deliveryAddress: deliveryAddress.trim(), payment: { cardholderName: payment.cardholderName.trim(), maskedCardNumber: `**** **** **** ${cardDigits.slice(-4)}`, expirationDate: payment.expirationDate, maskedCvv: "***" } });
    setCart([]); setDeliveryAddress(""); setPayment({ cardholderName: "", cardNumber: "", expirationDate: "", cvv: "" });
  };

  const sendContactMessage = () => {
    setContactStatus("");
    setContactError("");
    const ownerEmail = config.ownerEmail.trim();
    if (!ownerEmail) {
      setContactError(ui.ownerEmailMissing);
      return;
    }
    if (!contact.firstName.trim() || !contact.lastName.trim() || !contact.email.trim() || !contact.message.trim()) {
      setContactError(lang === "zh-Hant" ? "\u8acb\u5b8c\u6574\u586b\u5beb\u6240\u6709\u6b04\u4f4d\u3002" : "Please fill out all fields.");
      return;
    }
    const subject = encodeURIComponent(`${contact.firstName.trim()} ${contact.lastName.trim()} - ${shop} contact form`);
    const body = encodeURIComponent(
      `First name: ${contact.firstName.trim()}\nLast name: ${contact.lastName.trim()}\nEmail: ${contact.email.trim()}\n\nMessage:\n${contact.message.trim()}`,
    );
    window.location.href = `mailto:${ownerEmail}?subject=${subject}&body=${body}`;
    setContactStatus(ui.contactSent);
    setContact({ firstName: "", lastName: "", email: "", message: "" });
  };

  return (<div className={`tsp tsp--${config.themeMode}`} style={siteThemeStyle(config.themeMode, config.accentColor)}>
      <div className="tsp__promo">{config.localizedPromoMessage[lang]}</div>
      <header className="tsp__nav"><div className="tsp__brand">{config.shopIcon ? <img src={config.shopIcon} alt={shop} className="tsp__logoImage" /> : <span className="tsp__logo" aria-hidden />}<div><div className="tsp__name">{shop}</div>{city ? <div className="tsp__city">{city}</div> : null}</div></div>
        <nav className="tsp__links" aria-label="Primary"><a href="#home">{ui.home}</a><a href="#menu" className="tsp__linkAccent">{ui.menu}</a>{config.isDeliveryEnabled ? <a href="#delivery" className="tsp__linkCta">{ui.delivery}</a> : null}{onLanguageToggle ? <button type="button" className="tsp__langToggle" onClick={onLanguageToggle}>{lang === "en" ? "EN / \u7e41" : "\u7e41 / EN"}</button> : null}</nav>
      </header>

      <main>
        <section id="home" className={`tsp__hero tsp__hero--${config.heroStyle}`}><div className="tsp__heroInner">
          <InlineEditableText className="tsp__kicker" value={marketing.customizationHook} editable={Boolean(onMarketingCopyUpdate)} onCommit={(value) => onMarketingCopyUpdate?.("customizationHook", value)} />
          <h1 className="tsp__h1">{tagline}</h1>
          <InlineEditableText className="tsp__lead" multiline value={marketing.heroLead} editable={Boolean(onMarketingCopyUpdate)} onCommit={(value) => onMarketingCopyUpdate?.("heroLead", value)} />
          <div className="tsp__ctaRow"><a className="tsp__btn tsp__btn--primary" href="#menu">{ui.viewMenu}</a>{config.isDeliveryEnabled ? <a className="tsp__btn tsp__btn--ghost" href="#delivery">{ui.deliveryPickup}</a> : null}</div>
        </div></section>

        <section id="menu" className="tsp__section"><div className="tsp__sectionHead"><h2 className="tsp__sectionTitle">{ui.digitalMenu}</h2><InlineEditableText className="tsp__sectionSub" multiline value={marketing.menuBanner} editable={Boolean(onMarketingCopyUpdate)} onCommit={(value) => onMarketingCopyUpdate?.("menuBanner", value)} /></div>
          <div className="tsp__menuGrid">{grouped.map((g) => (<div key={g.key} className="tsp__menuCol"><div className="tsp__menuColHead">{onRenameMenuSection ? <input className="tsp__input" value={g.label} onChange={(e) => onRenameMenuSection(g.key, e.target.value)} aria-label={ui.sectionTitle} /> : <h3 className="tsp__menuHeading">{g.label}</h3>}{onAddMenuItem ? <button type="button" className="tsp__menuAddBtn tsp__menuAddBtn--small" onClick={() => onAddMenuItem(g.key)}>{ui.addItem}</button> : null}{onDeleteMenuSection ? <button type="button" className="tsp__menuAddBtn tsp__menuAddBtn--small" onClick={() => onDeleteMenuSection(g.key)} disabled={config.menuSections.length <= 1}>{ui.delete}</button> : null}</div>
              <ul className="tsp__menuList">{g.items.map((item) => isOwnerEditor ? (<EditableMenuItem key={item.id} item={item} onUpdate={onMenuItemUpdate || (() => {})} />) : (<li key={item.id} className="tsp__menuItem"><button type="button" className="tsp__menuOrderBtn" onClick={() => { setActiveItem(item); setSelectedSweetness(""); setSelectedToppings([]); }}>{item.image ? <img src={item.image} alt={tTerm(lang, item.name)} className="tsp__menuPublicImage" /> : <div className="tsp__menuPublicImage tsp__menuPublicImage--placeholder" aria-hidden>{ui.noImage}</div>}<div className="tsp__menuTop"><span className="tsp__menuName">{tTerm(lang, item.name)}</span><span className="tsp__menuPrice">{item.price}</span></div><p className="tsp__menuDesc">{tTerm(lang, item.description)}</p><span className="tsp__menuAddLabel">{ui.customizeAdd}</span></button></li>))}</ul></div>))}</div>
          {onAddMenuSection ? <button type="button" className="tsp__menuAddBtn" onClick={onAddMenuSection}>{ui.addSection}</button> : null}
        </section>

        {config.isDeliveryEnabled ? <section id="delivery" className="tsp__section tsp__section--alt"><div className="tsp__sectionHead"><h2 className="tsp__sectionTitle">{ui.checkoutTitle}</h2><p className="tsp__sectionSub">{ui.checkoutSub}</p></div><div className="tsp__checkoutGrid"><div className="tsp__card"><h3 className="tsp__cardTitle">{ui.yourCart}</h3>{cart.length === 0 ? <p className="tsp__cardBody">{ui.cartEmpty}</p> : null}{cart.map((item) => (<div key={item.id} className="tsp__cartLine"><div><strong>{item.itemName}</strong>{item.sweetnessLevel ? <p className="tsp__cardBody">{ui.sweetness}: {tTerm(lang, item.sweetnessLevel)}</p> : null}{item.toppings.length > 0 ? <p className="tsp__cardBody">{ui.toppings}: {item.toppings.map((t) => `${tTerm(lang, t.name)}${t.priceDelta ? ` (+${formatUsd(t.priceDelta)})` : ""}`).join(", ")}</p> : null}</div><div className="tsp__menuPrice">{formatUsd(lineTotal(item))}</div></div>))}<div className="tsp__totals"><div><span>{ui.subtotal}</span><span>{formatUsd(subtotal)}</span></div><div><span>{ui.deliveryFee}</span><span>{formatUsd(deliveryFee)}</span></div><div className="tsp__grand"><span>{ui.total}</span><span>{formatUsd(total)}</span></div></div></div>
            <div className="tsp__card"><h3 className="tsp__cardTitle">{ui.checkout}</h3><label className="tsp__fieldLabel" htmlFor="address">{ui.deliveryAddress}</label><input id="address" className="tsp__input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              <label className="tsp__fieldLabel" htmlFor="cardName">{ui.cardholderName}</label><input id="cardName" className="tsp__input" value={payment.cardholderName} onChange={(e) => setPayment((prev) => ({ ...prev, cardholderName: e.target.value }))} />
              <label className="tsp__fieldLabel" htmlFor="cardNumber">{ui.cardNumber}</label><input id="cardNumber" className="tsp__input" inputMode="numeric" value={payment.cardNumber} onChange={(e) => setPayment((prev) => ({ ...prev, cardNumber: maskCardNumber(e.target.value) }))} placeholder="1234 5678 9012 3456" />
              <div className="tsp__row2"><div><label className="tsp__fieldLabel" htmlFor="exp">{ui.expirationDate}</label><input id="exp" className="tsp__input" inputMode="numeric" value={payment.expirationDate} onChange={(e) => setPayment((prev) => ({ ...prev, expirationDate: maskExpDate(e.target.value) }))} placeholder="MM/YY" /></div><div><label className="tsp__fieldLabel" htmlFor="cvv">CVV</label><input id="cvv" className="tsp__input" type="password" inputMode="numeric" value={payment.cvv} onChange={(e) => setPayment((prev) => ({ ...prev, cvv: maskCvv(e.target.value) }))} placeholder="123" /></div></div>
              {checkoutError ? <p className="tsp__error">{checkoutError}</p> : null}<button type="button" className="tsp__btn tsp__btn--primary" onClick={placeOrder}>{ui.placeOrder}</button>{placedOrder ? <p className="tsp__success">{ui.orderPlaced} {placedOrder.id} {ui.orderPlacedSuffix} {formatUsd(placedOrder.total)}.</p> : null}
            </div></div></section> : null}

        <section id="contact" className="tsp__section tsp__section--alt"><div className="tsp__sectionHead"><h2 className="tsp__sectionTitle">{ui.contactTitle}</h2><p className="tsp__sectionSub">{ui.contactSub}</p></div><div className="tsp__contactWrap"><div className="tsp__card"><div className="tsp__row2"><div><label className="tsp__fieldLabel" htmlFor="contactFirst">{ui.firstName}</label><input id="contactFirst" className="tsp__input" value={contact.firstName} onChange={(e) => setContact((prev) => ({ ...prev, firstName: e.target.value }))} /></div><div><label className="tsp__fieldLabel" htmlFor="contactLast">{ui.lastName}</label><input id="contactLast" className="tsp__input" value={contact.lastName} onChange={(e) => setContact((prev) => ({ ...prev, lastName: e.target.value }))} /></div></div><label className="tsp__fieldLabel" htmlFor="contactEmail">{ui.email}</label><input id="contactEmail" type="email" className="tsp__input" value={contact.email} onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))} /><label className="tsp__fieldLabel" htmlFor="contactMessage">{ui.message}</label><textarea id="contactMessage" className="tsp__input tsp__textarea" value={contact.message} onChange={(e) => setContact((prev) => ({ ...prev, message: e.target.value }))} rows={5} />{contactError ? <p className="tsp__error">{contactError}</p> : null}{contactStatus ? <p className="tsp__success">{contactStatus}</p> : null}<button type="button" className="tsp__btn tsp__btn--primary" onClick={sendContactMessage}>{ui.send}</button></div></div></section>
      </main>

      {activeItem ? <div className="tsp__modalBackdrop" role="dialog" aria-modal="true"><div className="tsp__modal"><h3 className="tsp__cardTitle">{ui.customize} {tTerm(lang, activeItem.name)}</h3><p className="tsp__cardBody">{ui.basePrice}: {activeItem.price}</p>
        {activeItem.itemType !== "food" ? <><div><p className="tsp__fieldLabel">{ui.sweetnessLevel}</p><div className="tsp__chips">{activeSweetnessOptions.map((option) => <button key={option} type="button" className={selectedSweetness === option ? "tsp__chip tsp__chip--on" : "tsp__chip"} onClick={() => setSelectedSweetness(option)}>{tTerm(lang, option)}</button>)}</div></div><div><p className="tsp__fieldLabel">{ui.toppings}</p><div className="tsp__toppingList">{activeToppingOptions.map((option) => { const checked = selectedToppings.some((t) => t.id === option.id); return <label key={option.id} className="tsp__checkRow"><input type="checkbox" checked={checked} onChange={(e) => setSelectedToppings((prev) => e.target.checked ? [...prev, option] : prev.filter((t) => t.id !== option.id))} /><span>{tTerm(lang, option.name)} {option.priceDelta ? `(+${formatUsd(option.priceDelta)})` : ""}</span></label>; })}</div></div></> : <p className="tsp__cardBody">{ui.nonDrinkMessage}</p>}
        <div className="tsp__ctaRow"><button type="button" className="tsp__btn tsp__btn--ghost" onClick={() => setActiveItem(null)}>{ui.cancel}</button><button type="button" className="tsp__btn tsp__btn--primary" onClick={addToCart}>{ui.addToOrder}</button></div>
      </div></div> : null}

      <style>{`
        .tsp { font-family: "Source Sans 3", system-ui, sans-serif; color: var(--tsp-deep); background: var(--tsp-page-bg); min-height: 100%; }
        .tsp__promo { background: var(--tsp-promo-bg); color: var(--tsp-promo-ink); text-align: center; font-size: .72rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: .45rem 1rem; }
        .tsp__nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1.25rem; position: sticky; top: 0; background: var(--tsp-nav-bg); color: var(--tsp-nav-ink); z-index: 2; }
        .tsp__brand { display: flex; align-items: center; gap: .65rem; }
        .tsp__logo { width: 2.5rem; height: 2.5rem; border-radius: 999px; background: #0a0a0a; border: 2px solid var(--tsp-accent); display: inline-block; }
        .tsp__logoImage { width: 2.5rem; height: 2.5rem; border-radius: 999px; border: 2px solid var(--tsp-accent); object-fit: cover; display: inline-block; }
        .tsp__name { font-family: "Fraunces", Georgia, serif; font-weight: 700; font-size: 1rem; color: var(--tsp-accent); text-transform: uppercase; letter-spacing: .04em; }
        .tsp__city { font-size: .78rem; color: var(--tsp-nav-muted); text-transform: uppercase; letter-spacing: .08em; }
        .tsp__links { display: flex; align-items: center; gap: 1.1rem; font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .tsp__links a { color: var(--tsp-nav-ink); text-decoration: none; }
        .tsp__langToggle { border: 1px solid var(--tsp-border); background: transparent; color: var(--tsp-nav-ink); border-radius: 999px; padding: .2rem .55rem; font: inherit; cursor: pointer; }
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
        .tsp__menuGrid { display: grid; gap: 1.5rem; grid-template-columns: 1fr; }
        @media (min-width: 720px) { .tsp__menuGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; } }
        @media (min-width: 1024px) { .tsp__menuGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
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
        .tsp__textarea { resize: vertical; min-height: 7rem; }
        .tsp__contactWrap { max-width: 42rem; }
        .tsp__error { color: #b42318; font-weight: 600; margin: .75rem 0; }
        .tsp__success { color: #047857; font-weight: 600; margin: .75rem 0 0; }
        .tsp__modalBackdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, .45); display: grid; place-items: center; padding: 1rem; z-index: 20; }
        .tsp__modal { width: min(520px, 100%); background: var(--tsp-surface); border-radius: .85rem; border: 1px solid var(--tsp-border); padding: 1rem; }
        .tsp__chips { display: flex; flex-wrap: wrap; gap: .45rem; }
        .tsp__chip { border: 1px solid var(--tsp-border); background: transparent; border-radius: 999px; padding: .32rem .62rem; cursor: pointer; font: inherit; }
        .tsp__chip--on { background: var(--tsp-accent-soft); border-color: var(--tsp-accent); color: var(--tsp-accent); font-weight: 700; }
        .tsp__toppingList { display: grid; gap: .35rem; }
        .tsp__checkRow { display: flex; align-items: center; gap: .5rem; color: var(--tsp-muted); }
        .tsp__editable { cursor: text; border-bottom: 1px dashed transparent; }
        .tsp__editable:hover { border-bottom-color: var(--tsp-accent); }
        .tsp__inlineEditor { width: 100%; font: inherit; border: 1px solid var(--tsp-accent); border-radius: .45rem; background: var(--tsp-surface); color: var(--tsp-deep); padding: .35rem .5rem; }
      `}</style>
    </div>);
}
