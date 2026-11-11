"use client";

import { deliveryZones, shop } from "@/lib/data";
import { useCart } from "@/components/Cart";

/** The two ways to get an order. Each button jumps into that checkout path. */
export function OrderWays() {
  const { startOrder } = useCart();
  const ways = [
    {
      mode: "pickup" as const,
      title: "Recoger en tienda",
      price: "Gratis",
      steps: ["Arma tu ramo y paga en línea o al recoger", "Escoge el día y la hora", "Te mandamos un texto cuando esté listo"],
      foot: `${shop.address}, ${shop.city}`,
      cta: "Ordenar para recoger",
    },
    {
      mode: "delivery" as const,
      title: "Entrega a domicilio",
      price: `Desde $${Math.min(...deliveryZones.map((z) => z.fee))}`,
      steps: ["Arma tu ramo y escribe la dirección", "Escoge el día y el horario de entrega", "Lo llevamos hasta su puerta, con tu tarjeta"],
      foot: deliveryZones.map((z) => z.area).join(" · "),
      cta: "Ordenar para entrega",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {ways.map((w) => (
        <div key={w.mode} data-fade className="flex flex-col border border-ink/15 bg-ivory p-8 sm:p-10">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-serif text-4xl leading-none">{w.title}</h3>
            <span className="eyebrow shrink-0 text-rose">{w.price}</span>
          </div>
          <ol className="mt-8 flex-1 space-y-4">
            {w.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="font-script text-3xl leading-none text-gold">{i + 1}</span>
                <span className="text-ink/75">{s}</span>
              </li>
            ))}
          </ol>
          <p className="eyebrow mt-8 text-ink/45">{w.foot}</p>
          <button type="button" data-magnetic onClick={() => startOrder(w.mode)} className="eyebrow mt-6 cursor-pointer bg-wine py-4 text-ivory transition-colors hover:bg-rose-dark">
            {w.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
