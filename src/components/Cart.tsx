"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useState } from "react";
import { Checkout, emptyDetails, zoneFor, type Details, type Mode, type Step } from "@/components/Checkout";
import { addOrder } from "@/lib/demo-store";

// A demo cart: it holds items, slides in from the side, and walks through a
// pickup-or-delivery checkout. Nothing is sent and no payment is taken yet.

export type CartItem = { key: string; name: string; detail: string; price: number; image: string; qty: number; banner?: string; ribbon?: string };

type Cart = {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "qty">) => void;
  setQty: (key: string, qty: number) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  step: Step;
  setStep: (s: Step) => void;
  /** From the page: pick pickup or delivery, then go straight to checkout */
  startOrder: (m: Mode) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | null>(null);

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart needs CartProvider");
  return cart;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("pickup");
  const [step, setStep] = useState<Step>("cart");

  const add: Cart["add"] = (item) => {
    setItems((list) => {
      const found = list.find((i) => i.key === item.key);
      return found ? list.map((i) => (i.key === item.key ? { ...i, qty: i.qty + 1 } : i)) : [...list, { ...item, qty: 1 }];
    });
    setStep("cart");
    setOpen(true);
  };
  const startOrder = (m: Mode) => {
    setMode(m);
    if (items.length) {
      setStep("entrega");
      setOpen(true);
    } else {
      document.getElementById("ramos")?.scrollIntoView({ behavior: "smooth" });
    }
  };
  const clear = () => setItems([]);
  const setQty: Cart["setQty"] = (key, qty) => setItems((list) => (qty < 1 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, qty } : i))));

  return (
    <CartContext.Provider value={{ items, open, setOpen, add, setQty, mode, setMode, step, setStep, startOrder, clear }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

function CartDrawer() {
  const { items, open, setOpen, setQty, mode, setMode, step, setStep, clear } = useCart();
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [order, setOrder] = useState("");
  const titles: Record<Step, string> = { cart: "Tu carrito", entrega: "¿Cómo lo quieres?", datos: "Tus datos", listo: "Pedido listo" };

  const goTo = (s: Step) => {
    if (s === "listo") {
      const number = `GL-${Math.floor(2000 + Math.random() * 8000)}`;
      setOrder(number);
      // Hand the order to the dashboard demo (saved in this browser only)
      const zone = mode === "delivery" ? zoneFor(details.zip) : undefined;
      addOrder({
        number,
        customer: details.name,
        phone: details.phone,
        mode,
        date: details.date,
        time: details.time,
        items: items.map((i) => ({ name: i.name, detail: i.detail, banner: i.banner, ribbon: i.ribbon, qty: i.qty, price: i.price, image: i.image })),
        card: details.card || undefined,
        ...(mode === "delivery" ? { recipient: details.recipient, recipientPhone: details.recipientPhone, address: `${details.street}, ${details.zip}`, zone: zone?.area, instructions: details.instructions || undefined } : {}),
        fee: zone?.fee ?? 0,
        total: subtotal + (zone?.fee ?? 0),
        paid: mode === "delivery" ? "online" : details.pay,
      });
    }
    setStep(s);
  };
  const close = () => {
    setOpen(false);
    // After a finished order, start the next one fresh
    if (step === "listo") {
      clear();
      setDetails(emptyDetails);
      setTimeout(() => setStep("cart"), 500);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={close} className={`absolute inset-0 bg-wine-deep/50 backdrop-blur-[2px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label={titles[step]}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div>
            <p className="font-serif text-3xl">
              {titles[step]} {step === "cart" && <span className="text-rose">({items.reduce((n, i) => n + i.qty, 0)})</span>}
            </p>
            {step !== "cart" && step !== "listo" && <p className="eyebrow mt-1 text-ink/45">Paso {step === "entrega" ? 1 : 2} de 2</p>}
          </div>
          <button onClick={close} className="eyebrow cursor-pointer text-ink/60 hover:text-wine">Cerrar ✕</button>
        </div>
        {step !== "cart" ? (
          <Checkout step={step} setStep={goTo} mode={mode} setMode={setMode} items={items} details={details} setDetails={setDetails} order={order} onDone={close} />
        ) : (
        <>
        <ul data-lenis-prevent className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
          {items.length === 0 && <li className="py-16 text-center font-serif text-xl italic text-ink/60">Aún no hay nada aquí.</li>}
          {items.map((i) => (
            <li key={i.key} className="flex gap-4 py-5">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden">
                <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <p className="font-serif text-xl leading-tight">{i.name}</p>
                  <p className="font-serif text-xl">${i.price * i.qty}</p>
                </div>
                <p className="mt-1 text-sm text-ink/60">{i.detail}</p>
                <div className="mt-3 inline-flex items-center border border-ink/20">
                  <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Quitar uno" className="h-8 w-8 cursor-pointer hover:bg-blush">−</button>
                  <span className="w-8 text-center text-sm">{i.qty}</span>
                  <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Agregar uno" className="h-8 w-8 cursor-pointer hover:bg-blush">+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink/10 bg-wine px-6 py-6 text-ivory">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Subtotal</span>
            <span className="font-serif text-3xl">${subtotal}</span>
          </div>
          <p className="mt-1 text-right text-xs text-ivory/60">Recoger gratis o entrega desde $10</p>
          <button disabled={!items.length} onClick={() => setStep("entrega")} className="eyebrow mt-5 w-full cursor-pointer bg-ivory py-4 text-wine transition-colors hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50">Recoger o entrega →</button>
          <p className="mt-3 text-center text-xs text-ivory/60">Diseño de muestra: el pago aún no está conectado.</p>
        </div>
        </>
        )}
      </aside>
    </div>
  );
}
