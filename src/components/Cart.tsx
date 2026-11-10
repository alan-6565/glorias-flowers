"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useState } from "react";

// A demo cart: it holds items and slides in from the side, but checkout
// isn't connected yet.

export type CartItem = { key: string; name: string; detail: string; price: number; image: string; qty: number };

type Cart = {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "qty">) => void;
  setQty: (key: string, qty: number) => void;
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

  const add: Cart["add"] = (item) => {
    setItems((list) => {
      const found = list.find((i) => i.key === item.key);
      return found ? list.map((i) => (i.key === item.key ? { ...i, qty: i.qty + 1 } : i)) : [...list, { ...item, qty: 1 }];
    });
    setOpen(true);
  };
  const setQty: Cart["setQty"] = (key, qty) => setItems((list) => (qty < 1 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, qty } : i))));

  return (
    <CartContext.Provider value={{ items, open, setOpen, add, setQty }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

function CartDrawer() {
  const { items, open, setOpen, setQty } = useCart();
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-wine-deep/50 backdrop-blur-[2px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label="Tu carrito"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <p className="font-serif text-3xl">Tu carrito <span className="text-rose">({items.reduce((n, i) => n + i.qty, 0)})</span></p>
          <button onClick={() => setOpen(false)} className="eyebrow cursor-pointer text-ink/60 hover:text-wine">Cerrar ✕</button>
        </div>
        <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
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
          <button className="eyebrow mt-5 w-full cursor-pointer bg-ivory py-4 text-wine transition-colors hover:bg-blush">Continuar al pago</button>
          <p className="mt-3 text-center text-xs text-ivory/60">Diseño de muestra: el pago aún no está conectado.</p>
        </div>
      </aside>
    </div>
  );
}
