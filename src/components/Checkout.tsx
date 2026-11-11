"use client";

import { useMemo, useState } from "react";
import { deliveryWindows, deliveryZones, pickupHours, prepHours, shop } from "@/lib/data";
import type { CartItem } from "@/components/Cart";
import { dayOpen } from "@/lib/demo-store";

// Checkout after the cart: how they get it (pickup or delivery, day and time),
// then who it's from and how they pay, then a confirmation. Demo only: no
// order is sent and no payment is taken.

export type Mode = "pickup" | "delivery";
export type Step = "cart" | "entrega" | "datos" | "listo";

export type Details = {
  date: string;
  time: string;
  recipient: string;
  recipientPhone: string;
  street: string;
  zip: string;
  instructions: string;
  card: string;
  name: string;
  phone: string;
  email: string;
  pay: "online" | "tienda";
};

export const emptyDetails: Details = { date: "", time: "", recipient: "", recipientPhone: "", street: "", zip: "", instructions: "", card: "", name: "", phone: "", email: "", pay: "online" };

const input = "w-full border-b border-ink/25 bg-transparent py-2.5 text-ink placeholder:text-ink/35 outline-none focus:border-wine";
const labelCls = "eyebrow text-ink/60";

const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? " AM" : " PM"}`;
const localDay = (d = new Date()) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD
const longDay = (iso: string) => {
  const d = new Date(`${iso}T12:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return d.charAt(0).toUpperCase() + d.slice(1);
};

export function zoneFor(zip: string) {
  return deliveryZones.find((z) => z.zips.includes(zip.trim()));
}

/** The times open for a given day; today drops whatever can't be ready in time */
function slotsFor(mode: Mode, date: string) {
  const all = mode === "pickup" ? pickupHours.map((h) => ({ id: `${h}`, start: h, label: hourLabel(h) })) : deliveryWindows.map((w) => ({ id: `${w.start}-${w.end}`, start: w.start, label: `${hourLabel(w.start)} – ${hourLabel(w.end)}` }));
  if (date !== localDay()) return all;
  const ready = new Date().getHours() + prepHours;
  return all.filter((s) => s.start >= ready);
}

export function slotLabel(mode: Mode, id: string) {
  return slotsFor(mode, "").find((s) => s.id === id)?.label ?? id;
}

type Props = {
  step: Exclude<Step, "cart">;
  setStep: (s: Step) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  items: CartItem[];
  details: Details;
  setDetails: (d: Details) => void;
  order: string;
  onDone: () => void;
};

export function Checkout({ step, setStep, mode, setMode, items, details, setDetails, order, onDone }: Props) {
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setDetails({ ...details, [k]: v });
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const zone = mode === "delivery" ? zoneFor(details.zip) : undefined;
  const fee = zone?.fee ?? 0;
  const total = subtotal + fee;

  if (step === "listo") return <Done mode={mode} details={details} order={order} total={total} zone={zone?.area} onDone={onDone} />;
  if (step === "entrega") return <Entrega mode={mode} setMode={setMode} details={details} set={set} subtotal={subtotal} onBack={() => setStep("cart")} onNext={() => setStep("datos")} />;
  return <Datos mode={mode} details={details} set={set} subtotal={subtotal} fee={fee} total={total} onBack={() => setStep("entrega")} onNext={() => setStep("listo")} />;
}

type SetFn = <K extends keyof Details>(k: K, v: Details[K]) => void;

/** Shared bottom bar: running total plus the step's main button */
function Bar({ subtotal, fee, mode, cta, onBack, error }: { subtotal: number; fee: number; mode: Mode; cta: string; onBack: () => void; error?: string }) {
  return (
    <div className="border-t border-ink/10 bg-wine px-6 py-5 text-ivory">
      <div className="space-y-1 text-sm text-ivory/75">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal}</span></div>
        <div className="flex justify-between"><span>{mode === "pickup" ? "Recoger en tienda" : "Entrega a domicilio"}</span><span>{mode === "pickup" ? "Gratis" : fee ? `$${fee}` : "—"}</span></div>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-ivory/15 pt-3">
        <span className="eyebrow">Total</span>
        <span className="font-serif text-3xl">${subtotal + fee}</span>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-gold">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onBack} className="eyebrow cursor-pointer border border-ivory/40 px-5 py-4 hover:border-ivory">←</button>
        <button type="submit" className="eyebrow flex-1 cursor-pointer bg-ivory py-4 text-wine transition-colors hover:bg-blush">{cta}</button>
      </div>
    </div>
  );
}

function Entrega({ mode, setMode, details, set, subtotal, onBack, onNext }: { mode: Mode; setMode: (m: Mode) => void; details: Details; set: SetFn; subtotal: number; onBack: () => void; onNext: () => void }) {
  const [error, setError] = useState("");
  const [[today, lastDay]] = useState(() => [localDay(), localDay(new Date(Date.now() + 60 * 864e5))]);
  const slots = useMemo(() => (details.date ? slotsFor(mode, details.date) : []), [mode, details.date]);
  const zip = details.zip.trim();
  const zone = zoneFor(zip);
  const outOfZone = mode === "delivery" && zip.length === 5 && !zone;

  const pickMode = (m: Mode) => {
    setMode(m);
    set("time", "");
    setError("");
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        const open = dayOpen(details.date);
        if (open !== "ok") return setError(open === "closed" ? "La tienda está cerrada ese día. Escoge otro día." : "Ese día ya está lleno. Escoge otro día o llámanos.");
        if (!details.time || !slots.some((s) => s.id === details.time)) return setError(mode === "pickup" ? "Escoge a qué hora pasas por tu pedido." : "Escoge un horario de entrega.");
        if (mode === "delivery" && !zone) return setError(outOfZone ? `Todavía no entregamos en ${zip}. Llámanos al ${shop.phone} y lo vemos.` : "Escribe un código postal válido.");
        onNext();
      }}
    >
      <div data-lenis-prevent className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        {/* Pickup or delivery */}
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["pickup", "Recoger", "En la tienda · gratis"],
              ["delivery", "Entrega", "A domicilio · desde $10"],
            ] as const
          ).map(([v, t, sub]) => (
            <button key={v} type="button" aria-pressed={mode === v} onClick={() => pickMode(v)} className={`cursor-pointer border p-4 text-left transition-colors ${mode === v ? "border-wine bg-wine text-ivory" : "border-ink/20 hover:border-wine"}`}>
              <span className="block font-serif text-2xl leading-none">{t}</span>
              <span className={`mt-1 block text-xs ${mode === v ? "text-ivory/70" : "text-ink/55"}`}>{sub}</span>
            </button>
          ))}
        </div>

        {mode === "pickup" ? (
          <p className="border-l-2 border-gold pl-4 text-sm text-ink/70">
            Pasa por tu pedido a <strong className="font-medium text-ink">{shop.address}, {shop.city}</strong>. Te mandamos un texto cuando esté listo.
          </p>
        ) : (
          <div className="space-y-5">
            <p className="eyebrow text-rose">¿A quién se lo llevamos?</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Nombre de quien recibe</span>
                <input required value={details.recipient} onChange={(e) => set("recipient", e.target.value)} className={input} placeholder="Nombre" />
              </label>
              <label className="block">
                <span className={labelCls}>Su teléfono</span>
                <input required type="tel" value={details.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} className={input} placeholder="(510) 000-0000" />
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>Dirección</span>
              <input required value={details.street} onChange={(e) => set("street", e.target.value)} className={input} placeholder="Calle, número, apartamento" autoComplete="street-address" />
            </label>
            <label className="block">
              <span className={labelCls}>Código postal</span>
              <input required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={details.zip} onChange={(e) => (set("zip", e.target.value.replace(/\D/g, "")), setError(""))} className={input} placeholder="94806" autoComplete="postal-code" />
              {zone && <span className="mt-2 block text-sm text-rose-dark">✓ Entregamos en {zone.area} · ${zone.fee}</span>}
              {outOfZone && <span className="mt-2 block text-sm text-rose-dark">Esa zona no está en la lista. Llámanos al {shop.phone}.</span>}
            </label>
            <label className="block">
              <span className={labelCls}>Instrucciones (opcional)</span>
              <input value={details.instructions} onChange={(e) => set("instructions", e.target.value)} className={input} placeholder="Código del portón, dejar en recepción…" />
            </label>
            <details className="text-sm text-ink/60">
              <summary className="cursor-pointer">Zonas de entrega</summary>
              <ul className="mt-2 space-y-1">
                {deliveryZones.map((z) => (
                  <li key={z.area} className="flex justify-between"><span>{z.area} <span className="text-ink/40">({z.zips.join(", ")})</span></span><span>${z.fee}</span></li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* Day and time */}
        <div className="space-y-4">
          <label className="block">
            <span className={labelCls}>{mode === "pickup" ? "¿Qué día pasas?" : "¿Qué día lo entregamos?"}</span>
            <input
              required
              type="date"
              min={today}
              max={lastDay}
              value={details.date}
              onChange={(e) => {
                const date = e.target.value;
                set("date", date);
                setError("");
              }}
              className={`${input} cursor-pointer`}
            />
          </label>
          {details.date && dayOpen(details.date) !== "ok" && (
            <p className="text-sm text-rose-dark">{dayOpen(details.date) === "closed" ? "La tienda está cerrada ese día." : "Ese día ya está lleno."} Escoge otro día o llámanos al {shop.phone}.</p>
          )}
          {details.date && dayOpen(details.date) === "ok" && (
            <div>
              <p className={labelCls}>{mode === "pickup" ? "Hora para recoger" : "Horario de entrega"}</p>
              {slots.length === 0 ? (
                <p className="mt-3 text-sm text-rose-dark">Ya no alcanzamos a prepararlo hoy. Escoge otro día o llámanos al {shop.phone}.</p>
              ) : (
                <div className={`mt-3 grid gap-2 ${mode === "pickup" ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
                  {slots.map((s) => (
                    <button key={s.id} type="button" aria-pressed={details.time === s.id} onClick={() => (set("time", s.id), setError(""))} className={`cursor-pointer border py-2.5 text-sm transition-colors ${details.time === s.id ? "border-wine bg-wine text-ivory" : "border-ink/20 hover:border-wine"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              {details.date === today && slots.length > 0 && <p className="mt-2 text-xs text-ink/50">Pedidos para hoy: con {prepHours} horas de anticipación.</p>}
            </div>
          )}
        </div>
      </div>
      <Bar subtotal={subtotal} fee={mode === "delivery" ? (zone?.fee ?? 0) : 0} mode={mode} cta="Continuar" onBack={onBack} error={error} />
    </form>
  );
}

function Datos({ mode, details, set, subtotal, fee, total, onBack, onNext }: { mode: Mode; details: Details; set: SetFn; subtotal: number; fee: number; total: number; onBack: () => void; onNext: () => void }) {
  const pay = mode === "delivery" ? "online" : details.pay;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <div data-lenis-prevent className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        {/* Summary of the step before */}
        <div className="bg-blush/60 p-4 text-sm">
          <p className="eyebrow text-rose">{mode === "pickup" ? "Recoger en tienda" : "Entrega a domicilio"}</p>
          <p className="mt-2 font-serif text-xl">{longDay(details.date)} · {slotLabel(mode, details.time)}</p>
          <p className="mt-1 text-ink/65">{mode === "pickup" ? `${shop.address}, ${shop.city}` : `Para ${details.recipient} · ${details.street}, ${details.zip}`}</p>
        </div>

        <div className="space-y-5">
          <p className="eyebrow text-rose">Tus datos</p>
          <label className="block">
            <span className={labelCls}>Tu nombre</span>
            <input required value={details.name} onChange={(e) => set("name", e.target.value)} className={input} placeholder="Nombre completo" autoComplete="name" />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Teléfono</span>
              <input required type="tel" value={details.phone} onChange={(e) => set("phone", e.target.value)} className={input} placeholder="(510) 000-0000" autoComplete="tel" />
            </label>
            <label className="block">
              <span className={labelCls}>Correo (opcional)</span>
              <input type="email" value={details.email} onChange={(e) => set("email", e.target.value)} className={input} placeholder="tu@correo.com" autoComplete="email" />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Mensaje para la tarjeta (opcional)</span>
            <textarea rows={2} maxLength={200} value={details.card} onChange={(e) => set("card", e.target.value)} className={`${input} resize-none`} placeholder="Feliz cumpleaños, mi amor…" />
          </label>
        </div>

        <div className="space-y-3">
          <p className="eyebrow text-rose">Pago</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["online", "Pagar ahora", "Tarjeta, Apple Pay o Google Pay"],
                ["tienda", "Pagar al recoger", "Efectivo o tarjeta en la tienda"],
              ] as const
            ).map(([v, t, sub]) => {
              const off = v === "tienda" && mode === "delivery";
              return (
                <button key={v} type="button" disabled={off} aria-pressed={pay === v} onClick={() => set("pay", v)} className={`border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pay === v ? "border-wine bg-wine text-ivory" : "cursor-pointer border-ink/20 hover:border-wine"}`}>
                  <span className="block font-serif text-xl leading-none">{t}</span>
                  <span className={`mt-1 block text-xs ${pay === v ? "text-ivory/70" : "text-ink/55"}`}>{off ? "Solo para pedidos que recoges" : sub}</span>
                </button>
              );
            })}
          </div>
          {pay === "online" && <p className="border border-dashed border-ink/25 p-4 text-center text-sm text-ink/55">Aquí va el pago seguro con tarjeta (Square o Stripe).<br />Diseño de muestra: no se cobra nada.</p>}
        </div>
      </div>
      <Bar subtotal={subtotal} fee={fee} mode={mode} cta={pay === "online" ? `Pagar $${total}` : "Hacer mi pedido"} onBack={onBack} />
    </form>
  );
}

function Done({ mode, details, order, total, zone, onDone }: { mode: Mode; details: Details; order: string; total: number; zone?: string; onDone: () => void }) {
  const pay = mode === "delivery" ? "online" : details.pay;
  return (
    <div data-lenis-prevent className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-10 text-center">
      <p className="font-script text-7xl text-rose">¡Gracias!</p>
      <p className="mt-3 font-serif text-2xl">Recibimos tu pedido, {details.name.split(" ")[0]}.</p>
      <p className="eyebrow mt-6 text-ink/50">Pedido {order}</p>
      <div className="mt-6 w-full border-y border-ink/10 py-5 text-left text-sm">
        <p className="eyebrow text-rose">{mode === "pickup" ? "Recoger en tienda" : `Entrega · ${zone}`}</p>
        <p className="mt-2 font-serif text-xl">{longDay(details.date)} · {slotLabel(mode, details.time)}</p>
        <p className="mt-1 text-ink/65">{mode === "pickup" ? `${shop.address}, ${shop.city}` : `Para ${details.recipient} · ${details.street}, ${details.zip}`}</p>
        <p className="mt-3 flex justify-between font-serif text-xl"><span>Total</span><span>${total}{pay === "tienda" ? " · pagas al recoger" : " · pagado"}</span></p>
      </div>
      <p className="mt-6 text-ink/70">{mode === "pickup" ? `Te mandamos un texto al ${details.phone} cuando esté listo para recoger.` : `Te mandamos un texto al ${details.phone} cuando vaya en camino.`}</p>
      <p className="mt-2 text-xs text-ink/45">Diseño de muestra: este pedido no se envió a la tienda.</p>
      <button onClick={onDone} className="eyebrow mt-8 cursor-pointer bg-wine px-8 py-4 text-ivory hover:bg-rose-dark">Seguir viendo</button>
    </div>
  );
}
