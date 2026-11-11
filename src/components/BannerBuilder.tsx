"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { bannerSizes } from "@/lib/data";
import { useCart } from "@/components/Cart";

const RIBBONS = [
  { id: "blanco", label: "Blanco", fill: "#f6f1ec", ink: "#b08a4a" },
  { id: "negro", label: "Negro", fill: "#1d1416", ink: "#d9b878" },
  { id: "rosa", label: "Rosa", fill: "#f2b9c4", ink: "#8f4d48" },
];

/** Her rose bouquets with a banner: pick a size, type the banner, see it on the bouquet */
export function BannerBuilder() {
  const id = useId().replace(/:/g, "");
  const { add } = useCart();
  const [size, setSize] = useState(bannerSizes[1]);
  const [text, setText] = useState("Feliz Cumpleaños");
  const [ribbon, setRibbon] = useState(RIBBONS[0]);
  const shown = text.trim() || "Tu mensaje aquí";

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative mx-auto w-full max-w-lg">
        <div className="relative aspect-[4/5] overflow-hidden bg-blush">
          {bannerSizes.map((s) => (
            <Image key={s.roses} src={`/img/rosas-${s.roses}.webp`} alt={`Ramo de ${s.roses} rosas con banner`} fill sizes="(min-width:1024px) 32rem, 92vw" className={`object-cover transition-opacity duration-700 ${s.roses === size.roses ? "opacity-100" : "opacity-0"}`} />
          ))}
          {/* Live preview of the satin banner across the bouquet */}
          <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden>
            <path id={`${id}-arc`} d="M30 300 Q200 220 370 300" fill="none" />
            <path d="M18 312 Q200 222 382 312 L382 266 Q200 176 18 266 Z" fill={ribbon.fill} opacity="0.95" style={{ transition: "fill .4s" }} />
            <path d="M18 266 Q200 176 382 266" stroke="#000" strokeOpacity="0.12" fill="none" />
            <text fontFamily="var(--font-pinyon)" fontSize={shown.length > 18 ? 22 : 28} fill={ribbon.ink} textAnchor="middle" style={{ transition: "fill .4s" }}>
              <textPath href={`#${id}-arc`}  startOffset="50%">
                {shown}
              </textPath>
            </text>
          </svg>
        </div>
        <p className="eyebrow mt-3 text-ink/50">Vista previa del banner · foto de ejemplo de la tienda</p>
      </div>

      <div>
        <p className="eyebrow text-rose">Personalizado</p>
        <h3 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">Rosas con banner</h3>
        <p className="mt-4 font-serif text-4xl text-wine">${size.price}</p>

        <p className="eyebrow mt-8 text-ink/70">Tamaño</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {bannerSizes.map((s) => (
            <button
              key={s.roses}
              type="button"
              aria-pressed={s.roses === size.roses}
              onClick={() => setSize(s)}
              className={`cursor-pointer border py-3 text-center transition-colors ${s.roses === size.roses ? "border-wine bg-wine text-ivory" : "border-ink/20 hover:border-wine"}`}
            >
              <span className="block font-serif text-2xl leading-none">{s.roses}</span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em]">rosas</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink/70">Incluye: {size.includes}.</p>

        <label className="eyebrow mt-8 block text-ink/70" htmlFor={`${id}-msg`}>
          Mensaje del banner
        </label>
        <input
          id={`${id}-msg`}
          value={text}
          maxLength={28}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full border-b border-ink/30 bg-transparent py-3 font-serif text-2xl italic outline-none focus:border-wine"
        />

        <p className="eyebrow mt-8 text-ink/70">Color del banner</p>
        <div className="mt-3 flex gap-3">
          {RIBBONS.map((r) => (
            <button key={r.id} type="button" aria-pressed={r.id === ribbon.id} onClick={() => setRibbon(r)} className={`flex cursor-pointer items-center gap-2 border px-4 py-2 text-sm ${r.id === ribbon.id ? "border-wine" : "border-ink/20"}`}>
              <span className="h-4 w-4 rounded-full border border-ink/20" style={{ background: r.fill }} />
              {r.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-magnetic
          onClick={() => add({ key: `banner-${size.roses}-${ribbon.id}-${shown}`, name: `${size.roses} rosas con banner`, detail: `Banner ${ribbon.label.toLowerCase()}: “${shown}”`, price: size.price, image: `/img/rosas-${size.roses}.webp`, banner: shown, ribbon: ribbon.label })}
          className="eyebrow mt-10 w-full cursor-pointer bg-wine py-5 text-ivory transition-colors hover:bg-rose-dark"
        >
          Agregar al carrito
        </button>
        <p className="mt-3 text-xs text-ink/50">Precios de su lista publicada; se confirman con la tienda.</p>
      </div>
    </div>
  );
}
