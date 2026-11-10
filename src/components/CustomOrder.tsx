"use client";

import { useState } from "react";
import { occasions } from "@/lib/data";

const field = "w-full border-b border-ivory/30 bg-transparent py-3 text-ivory placeholder:text-ivory/40 outline-none focus:border-gold";
const label = "eyebrow text-ivory/60";

/** A request form for one-of-a-kind arrangements. Demo only: nothing is sent. */
export function CustomOrder() {
  const [sent, setSent] = useState(false);
  const [how, setHow] = useState<"pickup" | "delivery">("pickup");

  if (sent) {
    return (
      <div className="border border-ivory/20 p-10 text-center">
        <p className="font-script text-6xl text-gold">¡Gracias!</p>
        <p className="mt-4 font-serif text-2xl text-ivory">Recibimos tu idea. Te contactamos pronto para confirmar los detalles.</p>
        <p className="mt-4 text-sm text-ivory/50">Diseño de muestra: este formulario todavía no envía mensajes.</p>
        <button onClick={() => setSent(false)} className="eyebrow mt-8 cursor-pointer text-gold underline underline-offset-4">Enviar otra idea</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="grid gap-8 sm:grid-cols-2"
    >
      <label className="block">
        <span className={label}>Tu nombre</span>
        <input required className={field} placeholder="Nombre completo" autoComplete="name" />
      </label>
      <label className="block">
        <span className={label}>Teléfono</span>
        <input required type="tel" className={field} placeholder="(510) 000-0000" autoComplete="tel" />
      </label>
      <label className="block">
        <span className={label}>Ocasión</span>
        <select className={`${field} cursor-pointer`} defaultValue="">
          <option value="" disabled className="text-ink">Escoge una</option>
          {occasions.map((o) => (
            <option key={o} className="text-ink">{o}</option>
          ))}
          <option className="text-ink">Otra</option>
        </select>
      </label>
      <label className="block">
        <span className={label}>Fecha</span>
        <input type="date" className={`${field} [color-scheme:dark]`} />
      </label>
      <div className="sm:col-span-2">
        <span className={label}>Entrega</span>
        <div className="mt-3 flex gap-3">
          {(
            [
              ["pickup", "Recoger en tienda"],
              ["delivery", "Entrega a domicilio"],
            ] as const
          ).map(([v, t]) => (
            <button key={v} type="button" aria-pressed={how === v} onClick={() => setHow(v)} className={`eyebrow cursor-pointer border px-5 py-3 transition-colors ${how === v ? "border-gold bg-gold text-wine-deep" : "border-ivory/30 text-ivory hover:border-gold"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <label className="block sm:col-span-2">
        <span className={label}>Cuéntanos tu idea</span>
        <textarea rows={3} className={`${field} resize-none`} placeholder="Colores, flores, banner, peluche, presupuesto…" />
      </label>
      <button type="submit" data-magnetic className="eyebrow cursor-pointer bg-ivory py-5 text-wine transition-colors hover:bg-gold sm:col-span-2">
        Enviar mi idea
      </button>
    </form>
  );
}
