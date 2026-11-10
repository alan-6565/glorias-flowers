"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/Cart";

/** Sits on the dark hero, then turns ivory once you scroll */
export function Nav() {
  const { items, setOpen } = useCart();
  const [solid, setSolid] = useState(false);
  const count = items.reduce((n, i) => n + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? "bg-ivory/90 text-ink shadow-[0_1px_0_rgba(42,26,28,0.08)] backdrop-blur" : "text-ivory"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <a href="#inicio" className="font-script text-3xl leading-none sm:text-4xl">
          Gloria&apos;s
        </a>
        <div className="eyebrow hidden items-center gap-8 lg:flex">
          <a href="#ramos" className="hover:opacity-60">Ramos</a>
          <a href="#colecciones" className="hover:opacity-60">Colecciones</a>
          <a href="#perfumes" className="hover:opacity-60">Perfumes</a>
          <a href="#pedido" className="hover:opacity-60">Pedido especial</a>
          <a href="#visitanos" className="hover:opacity-60">Visítanos</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="eyebrow cursor-pointer hover:opacity-60">
            Carrito ({count})
          </button>
          <a href="#ramos" className={`eyebrow hidden px-5 py-3 transition-colors sm:inline-block ${solid ? "bg-wine text-ivory hover:bg-rose-dark" : "bg-ivory text-wine hover:bg-blush"}`}>
            Ordenar
          </a>
        </div>
      </nav>
    </header>
  );
}
