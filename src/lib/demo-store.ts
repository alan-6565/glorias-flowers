"use client";

// The dashboard demo's data. A month of sample orders is made around today's
// date, and orders placed on the site (checkout or the special-order form)
// are saved in this browser so they show up in the panel. Nothing leaves the
// device: it's a pitch demo, not a backend.
//
// Each order has two dates: when it's due (pickup or delivery) and when it
// has to be made, which comes earlier for big arrangements. The day's
// workload counts "units": a 12-rose bouquet is 1, a 100-rose one is 4.

export type Mode = "pickup" | "delivery";
export type Status = "nuevo" | "preparando" | "listo" | "en_camino" | "entregado";

export type OrderItem = { name: string; detail?: string; banner?: string; ribbon?: string; qty: number; price: number; image: string; units?: number; lead?: number };

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  customer: string;
  phone: string;
  mode: Mode;
  date: string; // due day, YYYY-MM-DD
  time: string; // "10" (pickup hour) or "13-16" (delivery window)
  items: OrderItem[];
  card?: string;
  recipient?: string;
  recipientPhone?: string;
  address?: string;
  zone?: string;
  instructions?: string;
  fee: number;
  total: number;
  paid: "online" | "tienda";
  status: Status;
  checks?: number[];
  hold?: boolean;
  notes?: string;
  photo?: string;
  log: { status: Status; at: string }[];
  fromSite?: boolean;
};

export type Special = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  occasion: string;
  date: string;
  mode: Mode;
  address?: string;
  idea: string;
  status: "nueva" | "cotizada" | "pagada";
  quote?: number;
  quoteNote?: string;
  fromSite?: boolean;
};

export type DayRule = { capacity?: number; closed?: boolean };

export type Store = { orders: Order[]; specials: Special[]; days: Record<string, DayRule>; capacity: number };

const KEY = "gloria-demo-v2";

/* ---------- dates ---------- */

export const localDay = (d = new Date()) => d.toLocaleDateString("en-CA");
export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
};
export const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? " AM" : " PM"}`;
export const timeLabel = (time: string) => {
  const [a, b] = time.split("-").map(Number);
  return b ? `${hourLabel(a)} – ${hourLabel(b)}` : hourLabel(a);
};
export const timeSort = (time: string) => Number(time.split("-")[0]);
export const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) => {
  const s = new Date(`${iso}T12:00`).toLocaleDateString("es-MX", opts);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
/** "Hoy", "Mañana", "Ayer" or "jue 12 nov" */
export const shortDay = (iso: string) => {
  const t = localDay();
  if (iso === t) return "Hoy";
  if (iso === addDays(t, 1)) return "Mañana";
  if (iso === addDays(t, -1)) return "Ayer";
  return new Date(`${iso}T12:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
};

/* ---------- workload and prep dates ---------- */

const ROSE_UNITS: Record<number, number> = { 12: 1, 25: 1, 36: 2, 50: 2, 75: 3, 100: 4 };
const ROSE_LEAD: Record<number, number> = { 12: 0, 25: 0, 36: 1, 50: 1, 75: 2, 100: 2 };
const roses = (i: OrderItem) => Number(i.name.match(/^(\d+) rosas/)?.[1]) || 0;

export const itemUnits = (i: OrderItem) => (i.units ?? ROSE_UNITS[roses(i)] ?? 1) * i.qty;
export const itemLead = (i: OrderItem) => i.lead ?? ROSE_LEAD[roses(i)] ?? 0;
export const orderUnits = (o: Order) => o.items.reduce((n, i) => n + itemUnits(i), 0);
export const roseCount = (o: Order) => o.items.reduce((n, i) => n + roses(i) * i.qty, 0);
/** The day it has to be made: the due day, minus the biggest item's lead time */
export const prepDate = (o: Order) => addDays(o.date, -Math.max(0, ...o.items.map(itemLead)));

export const capacityOf = (s: Store, day: string) => s.days[day]?.capacity ?? s.capacity;
export const workload = (s: Store, day: string) => s.orders.filter((o) => prepDate(o) === day).reduce((n, o) => n + orderUnits(o), 0);

/** The steps to make an order, shown as a checklist */
export function checklist(o: Order) {
  const banner = o.items.find((i) => i.banner);
  if (banner) return ["Confirmar rosas y colores", "Preparar papel y listón", "Armar el ramo", `Poner el banner “${banner.banner}”`, "Corona y mariposas", "Tomar la foto final"];
  return ["Confirmar los detalles", "Preparar materiales", "Armar el arreglo", "Tarjeta y moño", "Tomar la foto final"];
}

/* ---------- sample data ---------- */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ["María López", "Carlos Reyes", "Ana García", "Sofía Morales", "José Hernández", "Daniela Flores", "Luis Ortega", "Brenda Torres", "Ricardo Salas", "Yesenia Cruz", "Andrés Molina", "Fernanda Ruiz", "Gabriel Núñez", "Teresa Lara", "Marisol Rangel", "Karla Méndez", "Jorge Ibarra", "Paola Castillo", "Miguel Ángel Paz", "Lucía Vargas", "Héctor Ramos", "Valeria Soto", "Diego Aguilar", "Rosa Delgado"];
const BANNERS = ["Feliz Cumpleaños Mamá", "¿Quieres ser mi novia?", "Happy Birthday Princesa", "Feliz Aniversario", "Te Amo", "Felices 15", "Feliz Cumpleaños Amor", "Gracias Maestra", "Feliz Graduación", "Perdóname", "Para la Reina de la Casa", "Feliz Cumpleaños Abuelita"];
const CARDS = ["Te quiero mucho. Tus hijos.", "Desde el primer día supe que eras tú.", "Para nuestra princesa.", "10 años y te sigo eligiendo.", "Gracias por todo.", ""];
const RIBBONS = ["Blanco", "Negro", "Rosa"];
const STREETS = [
  ["2150 Rumrill Blvd, San Pablo, CA 94806", "San Pablo", 10],
  ["3801 Macdonald Ave, Richmond, CA 94805", "Richmond y El Sobrante", 15],
  ["1501 Tara Hills Dr, Pinole, CA 94564", "Pinole", 20],
  ["900 Alfred Nobel Dr, Hercules, CA 94547", "Hercules", 25],
  ["10500 San Pablo Ave, El Cerrito, CA 94530", "El Cerrito", 20],
] as const;
const PRICE: Record<number, number> = { 12: 60, 25: 95, 36: 140, 50: 170, 75: 250, 100: 335 };
const EXTRAS: OrderItem[] = [
  { name: "Ramo de dinero", qty: 1, price: 120, image: "/img/col-dinero-v2.webp", units: 2, lead: 1, detail: "20 billetes de $5 con rosas rojas" },
  { name: "Rosas azules", qty: 1, price: 85, image: "/img/col-azul-v2.webp" },
  { name: "Peluche con rosas", qty: 1, price: 70, image: "/img/col-peluche-v2.webp" },
  { name: "Caja sorpresa con luces", qty: 1, price: 65, image: "/img/col-caja-v2.webp" },
  { name: "Arreglo fresco", qty: 1, price: 45, image: "/img/col-fresco-v2.webp", detail: "Lirios, rosas y gerberas" },
  { name: "Ramo buchón corazón", qty: 1, price: 150, image: "/img/col-corazon-v2.webp", units: 2, lead: 1 },
  { name: "Quinceañera con tiara", qty: 1, price: 200, image: "/img/col-quince-v2.webp", units: 3, lead: 2, detail: "Número 15, tiara y mariposas" },
];

function sample(): Store {
  const t = localDay();
  const r = rng(Number(t.replace(/-/g, "")));
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const nowHour = new Date().getHours();
  let num = 1040;
  const orders: Order[] = [];

  // How many orders each day gets: busier on Fridays and Saturdays, plus a big day
  for (let d = -6; d <= 30; d++) {
    const day = addDays(t, d);
    const dow = new Date(`${day}T12:00`).getDay();
    let n = Math.floor(r() * 3) + (dow === 5 || dow === 6 ? 2 : 0) + (d >= 0 && d <= 3 ? 1 : 0);
    if (d > 18) n = Math.floor(r() * 2);
    if (d === 4) n = 7;
    if (d === 0) n = 6;
    for (let k = 0; k < n; k++) {
      const mode: Mode = r() < 0.45 ? "delivery" : "pickup";
      const time = mode === "pickup" ? String(10 + Math.floor(r() * 9)) : pick(["10-13", "13-16", "16-19"]);
      const useRoses = r() < 0.7;
      const count = pick([12, 25, 25, 36, 50, 50, 75, 100]);
      const item: OrderItem = useRoses ? { name: `${count} rosas con banner`, banner: pick(BANNERS), ribbon: pick(RIBBONS), qty: 1, price: PRICE[count], image: `/img/rosas-${count}.webp` } : { ...pick(EXTRAS) };
      const street = pick(STREETS);
      const customer = pick(NAMES);
      const o: Order = {
        id: `s-${day}-${k}`,
        number: `GL-${++num}`,
        createdAt: new Date(`${addDays(day, -Math.ceil(r() * 6))}T${String(9 + Math.floor(r() * 9)).padStart(2, "0")}:15`).toISOString(),
        customer,
        phone: `(510) 555-01${String(10 + Math.floor(r() * 89))}`,
        mode,
        date: day,
        time,
        items: [item],
        card: pick(CARDS) || undefined,
        fee: mode === "delivery" ? street[2] : 0,
        total: item.price + (mode === "delivery" ? street[2] : 0),
        paid: mode === "pickup" && r() < 0.3 ? "tienda" : "online",
        status: "nuevo",
        log: [],
        ...(mode === "delivery" ? { recipient: pick(NAMES), recipientPhone: `(510) 555-02${String(10 + Math.floor(r() * 89))}`, address: street[0], zone: street[1] } : {}),
      };
      const steps = checklist(o).length;
      const prep = prepDate(o);
      const stamp = (h: number) => new Date(`${prep}T${String(h).padStart(2, "0")}:20`).toISOString();
      if (day < t) {
        o.status = "entregado";
        o.checks = [...Array(steps).keys()];
        o.photo = item.image;
        o.log = [{ status: "entregado", at: stamp(17) }];
      } else if (day === t) {
        const due = timeSort(time);
        o.status = due + 1 < nowHour ? "entregado" : k % 3 === 0 ? "listo" : k % 3 === 1 || prep < t ? "preparando" : "nuevo";
        if (o.status === "preparando") o.checks = [0, 1, 2];
        if (o.status === "listo" || o.status === "entregado") {
          o.checks = [...Array(steps).keys()];
          o.photo = item.image;
        }
        if (o.status !== "nuevo") o.log = [{ status: o.status, at: stamp(Math.max(9, Math.min(nowHour, due) - 1)) }];
      } else if (prep <= t) {
        o.status = r() < 0.6 ? "preparando" : "nuevo";
        if (o.status === "preparando") o.checks = [0, 1];
      }
      orders.push(o);
    }
  }
  // One order that needs a question answered before it's made
  const ask = orders.find((o) => o.date === addDays(t, 2));
  if (ask) {
    ask.hold = true;
    ask.notes = "Preguntar si quiere el banner en dorado o en negro.";
  }

  const at = (days: number, h: number) => new Date(`${addDays(t, days)}T${String(h).padStart(2, "0")}:10`).toISOString();
  return {
    capacity: 12,
    days: {},
    orders,
    specials: [
      { id: "sp-1", createdAt: at(0, 8), name: "Jessica Ramírez", phone: "(510) 555-0137", occasion: "Quinceañera", date: addDays(t, 12), mode: "pickup", idea: "Ramo de 100 rosas rosas con el número 15 en dorado, tiara grande y mariposas. Presupuesto como $400.", status: "nueva" },
      { id: "sp-2", createdAt: at(-1, 15), name: "Miguel Ángel Paz", phone: "(510) 555-0182", occasion: "Cumpleaños", date: addDays(t, 4), mode: "delivery", address: "2700 El Portal Dr, San Pablo, CA 94806", idea: "Ramo de dinero con 20 billetes de $5 y rosas rojas, con un peluche chiquito.", status: "cotizada", quote: 180, quoteNote: "Los $100 en billetes van aparte del precio del arreglo." },
      { id: "sp-3", createdAt: at(-2, 11), name: "Claudia Vega", phone: "(510) 555-0128", occasion: "Propuesta", date: addDays(t, 6), mode: "pickup", idea: "Caja con rosas en forma de corazón y luces que diga “¿Te casas conmigo?”.", status: "pagada", quote: 220 },
    ],
  };
}

/* ---------- saving ---------- */

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  const s = sample();
  save(s);
  return s;
}

export function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("gloria-demo"));
  } catch {}
}

/** The saved data as text, for React to watch (empty until first load) */
export function readRaw() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Fires when the data changes here or in another tab (like the site placing an order) */
export function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("gloria-demo", cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("gloria-demo", cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function update(fn: (s: Store) => void) {
  const s = load();
  fn(s);
  save(s);
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return load();
}

/** Called by the site's checkout when an order is placed */
export function addOrder(order: Omit<Order, "id" | "createdAt" | "status" | "log" | "fromSite">) {
  update((s) => s.orders.push({ ...order, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "nuevo", log: [], fromSite: true }));
}

/** Called by the site's special-order form */
export function addSpecial(sp: Omit<Special, "id" | "createdAt" | "status" | "fromSite">) {
  update((s) => s.specials.unshift({ ...sp, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "nueva", fromSite: true }));
}

/** Whether the site can still take orders for a day (closed days and the day's workload) */
export function dayOpen(date: string): "ok" | "full" | "closed" {
  const s = load();
  if (s.days[date]?.closed) return "closed";
  return workload(s, date) >= capacityOf(s, date) ? "full" : "ok";
}

/* ---------- steps ---------- */

export const flow: Record<Mode, Status[]> = {
  pickup: ["nuevo", "preparando", "listo", "entregado"],
  delivery: ["nuevo", "preparando", "listo", "en_camino", "entregado"],
};

export const statusName = (st: Status, mode: Mode) =>
  ({ nuevo: "Nuevo", preparando: "Preparando", listo: mode === "pickup" ? "Listo para recoger" : "Listo para entregar", en_camino: "En camino", entregado: mode === "pickup" ? "Recogido" : "Entregado" })[st];

/** Text the customer would get at each step (shown as a toast in the demo) */
export const customerText = (o: Order, st: Status) => {
  const first = o.customer.split(" ")[0];
  if (st === "listo") return o.mode === "pickup" ? `Hola ${first}, tu pedido ${o.number} ya está listo para recoger en Gloria's. 🌹` : `Hola ${first}, tu pedido ${o.number} está listo. Te avisamos cuando salga.`;
  if (st === "en_camino") return `Hola ${first}, tu pedido ${o.number} va en camino a ${o.recipient}. 🚗`;
  if (st === "entregado") return o.mode === "pickup" ? `¡Gracias por tu compra, ${first}! 💐` : `Hola ${first}, entregamos tu pedido a ${o.recipient}. Aquí está la foto. 📸`;
  return "";
};
