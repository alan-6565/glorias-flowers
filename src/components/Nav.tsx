"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/Cart";
import type { Variant } from "@/components/Site";

/** Sits on the dark hero, then turns ivory once you scroll */
export function Nav({ variant }: { variant: Variant }) {
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
          <a href="#entrega" className="hover:opacity-60">Entrega</a>
          <a href="#colecciones" className="hover:opacity-60">Colecciones</a>
          <a href="#perfumes" className="hover:opacity-60">Perfumes</a>
          <a href="#pedido" className="hover:opacity-60">Pedido especial</a>
          <a href="#visitanos" className="hover:opacity-60">Visítanos</a>
        </div>
        <div className="flex items-center gap-4">
          {/* Flip between the two looks */}
          <div className="eyebrow hidden items-center gap-1 rounded-full border border-current/30 p-1 sm:flex">
            <Link href="/" aria-current={variant === "clasica" ? "page" : undefined} className={`rounded-full px-3 py-1 ${variant === "clasica" ? "bg-current/15" : "opacity-60 hover:opacity-100"}`}>Clásica</Link>
            <Link href="/pink" aria-current={variant === "rosa" ? "page" : undefined} className={`rounded-full px-3 py-1 ${variant === "rosa" ? "bg-current/15" : "opacity-60 hover:opacity-100"}`}>Rosa</Link>
          </div>
          <button onClick={() => setOpen(true)} className="eyebrow cursor-pointer hover:opacity-60">
            Carrito ({count})
          </button>
          <a href="#ramos" className={`eyebrow hidden px-5 py-3 transition-colors xl:inline-block ${solid ? "bg-wine text-ivory hover:bg-rose-dark" : "bg-ivory text-wine hover:bg-blush"}`}>
            Ordenar
          </a>
        </div>
      </nav>
    </header>
  );
}
