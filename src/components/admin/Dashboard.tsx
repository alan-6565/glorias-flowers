"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  addDays,
  capacityOf,
  checklist,
  customerText,
  dayLabel,
  flow,
  load,
  localDay,
  prepDate,
  readRaw,
  reset,
  roseCount,
  shortDay,
  statusName,
  subscribe,
  timeLabel,
  timeSort,
  update,
  workload,
  type Order,
  type Special,
  type Status,
  type Store,
} from "@/lib/demo-store";

// The shop's panel (demo). One login for the whole shop. The calendar is the
// home screen: tap a day to see its pickups and deliveries, and the side list
// shows what has to be made next, since big arrangements start days early.

type Page = "inicio" | "preparar" | "pedidos" | "especiales";
type Toast = (title: string, body?: string) => void;

const noop = () => () => {};
const card = "rounded-3xl bg-white shadow-[0_1px_2px_rgba(92,21,32,0.06),0_8px_24px_-12px_rgba(92,21,32,0.18)] ring-1 ring-wine/5";
const digits = (p: string) => p.replace(/\D/g, "");
const clock = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
const active = (o: Order) => o.status === "nuevo" || o.status === "preparando";

const PILL: Record<Status, string> = {
  nuevo: "bg-amber-100 text-amber-800",
  preparando: "bg-rose-100 text-rose-700",
  listo: "bg-emerald-100 text-emerald-800",
  en_camino: "bg-sky-100 text-sky-800",
  entregado: "bg-stone-100 text-stone-500",
};

const nextStep = (o: Order) => {
  const steps = flow[o.mode];
  return steps[steps.indexOf(o.status) + 1] as Status | undefined;
};
const nextLabel = (o: Order) =>
  ({ preparando: "Empezar a preparar", listo: "📸  Marcar listo", en_camino: "🚗  Salió a entregar", entregado: o.mode === "pickup" ? "✓  Ya lo recogieron" : "✓  Ya se entregó", nuevo: "" })[nextStep(o) ?? "nuevo"];

/* ================================================================ */

export function Dashboard() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const store = useMemo<Store | null>(() => (raw ? (JSON.parse(raw) as Store) : null), [raw]);
  useEffect(() => {
    if (!readRaw()) load(); // first visit: make the sample orders
  }, []);

  if (!mounted || !store) return <div className="min-h-screen bg-[#fbf4f2]" />;
  return <Panel store={store} />;
}

function Panel({ store }: { store: Store }) {
  const [inside, setInside] = useState(() => {
    try {
      return sessionStorage.getItem("gloria-admin") === "1";
    } catch {
      return false;
    }
  });
  const [page, setPage] = useState<Page>("inicio");
  const [day, setDay] = useState(localDay());
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toasts, setToasts] = useState<{ id: number; title: string; body?: string }[]>([]);

  const toast: Toast = (title, body) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  // A chime and a banner when an order arrives from the website
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seen.current) {
      for (const o of store.orders)
        if (o.fromSite && !seen.current.has(o.id)) {
          chime();
          const id = Date.now() + Math.random();
          setToasts((t) => [...t, { id, title: `🔔 ¡Nuevo pedido de ${o.customer.split(" ")[0]}!`, body: `${o.mode === "pickup" ? "Recoger" : "Entrega"} · ${dayLabel(o.date, { weekday: "long", day: "numeric", month: "short" })} · ${timeLabel(o.time)}` }]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
        }
    }
    seen.current = new Set(store.orders.map((o) => o.id));
  }, [store.orders]);

  if (!inside)
    return (
      <Login
        onEnter={() => {
          try {
            sessionStorage.setItem("gloria-admin", "1");
          } catch {}
          setInside(true);
        }}
      />
    );

  const today = localDay();
  const open = store.orders.find((o) => o.id === openId) ?? null;
  // New orders that have to be started by tomorrow (the rest can wait)
  const fresh = store.orders.filter((o) => o.status === "nuevo" && o.date >= today && prepDate(o) <= addDays(today, 1)).length;
  const toMake = store.orders.filter((o) => active(o) && prepDate(o) <= today).length;
  const newSpecials = store.specials.filter((s) => s.status === "nueva").length;

  const nav = [
    { id: "inicio" as const, label: "Calendario", icon: "📅", badge: 0 },
    { id: "preparar" as const, label: "Por preparar", icon: "✂️", badge: toMake },
    { id: "pedidos" as const, label: "Pedidos", icon: "🌹", badge: fresh },
    { id: "especiales" as const, label: "Especiales", icon: "✨", badge: newSpecials },
  ];
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-[#fbf4f2] font-sans text-ink lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden bg-wine-deep text-white lg:flex">
        <div className="px-6 pb-6 pt-7 text-center">
          <p className="font-script text-5xl leading-none">Gloria&apos;s</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50">Gift &amp; Flower Shop</p>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] transition-colors ${page === n.id ? "bg-white/[0.14] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`}>
              <span className="text-lg">{n.icon}</span>
              {n.label}
              {n.badge > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-xs">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="relative mt-auto h-72">
          <Image src="/img/princesa.webp" alt="" fill sizes="15rem" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-wine-deep via-wine-deep/40 to-wine-deep/10" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-sm">
            <Link href="/" className="block text-white/70 hover:text-white">↗ Ver el sitio</Link>
            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem("gloria-admin");
                } catch {}
                setInside(false);
              }}
              className="cursor-pointer text-white/70 hover:text-white"
            >
              ⎋ Salir
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-wine/5 bg-[#fbf4f2]/90 backdrop-blur">
          <div className="mx-auto flex max-w-[84rem] items-center gap-3 px-4 py-3 sm:px-8">
            <span className="font-script text-3xl leading-none text-wine lg:hidden">Gloria&apos;s</span>
            <label className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-wine/10 focus-within:ring-wine/40 sm:ml-0">
              <span className="text-ink/40">🔍</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value) setPage("pedidos");
                }}
                placeholder="Buscar nombre, teléfono o #"
                className="w-full bg-transparent outline-none placeholder:text-ink/35"
              />
            </label>
            <button onClick={() => go("pedidos")} className="relative ml-auto grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white ring-1 ring-wine/10" aria-label="Pedidos nuevos">
              🔔
              {fresh > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] text-white">{fresh}</span>}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[84rem] px-4 py-6 sm:px-8 sm:py-8">
          {page === "inicio" && <Home store={store} day={day} setDay={setDay} openOrder={setOpenId} goPrep={() => go("preparar")} />}
          {page === "preparar" && <WorkQueue store={store} openOrder={setOpenId} toast={toast} />}
          {page === "pedidos" && <AllOrders store={store} query={query} setQuery={setQuery} openOrder={setOpenId} />}
          {page === "especiales" && <Specials store={store} toast={toast} />}

          <p className="mt-16 text-center text-xs text-ink/40">
            Demostración con pedidos de ejemplo: todo se guarda solo en este navegador.{" "}
            <button
              onClick={() => {
                reset();
                toast("Listo", "Volvieron los pedidos de ejemplo.");
              }}
              className="cursor-pointer underline underline-offset-2 hover:text-wine"
            >
              Reiniciar demo
            </button>
          </p>
        </main>
      </div>

      {/* Bottom bar (phone and tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-wine/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.map((n) => (
          <button key={n.id} onClick={() => go(n.id)} className={`relative flex cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px] ${page === n.id ? "text-wine" : "text-ink/45"}`}>
            <span className={`text-xl ${page === n.id ? "" : "opacity-60 grayscale-[0.5]"}`}>{n.icon}</span>
            {n.label}
            {n.badge > 0 && <span className="absolute right-[calc(50%-24px)] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] text-white">{n.badge}</span>}
          </button>
        ))}
      </nav>

      {open && <OrderDrawer o={open} onClose={() => setOpenId(null)} toast={toast} />}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full max-w-md rounded-2xl bg-wine-deep px-5 py-4 text-white shadow-2xl">
            <p className="font-medium">{t.title}</p>
            {t.body && <p className="mt-1 text-sm text-white/75">{t.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.18;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
  } catch {}
}

/** One login for the whole shop. Demo: any password opens it. */
function Login({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-wine-deep px-4 text-white">
      <Image src="/img/propuesta.webp" alt="" fill sizes="100vw" className="object-cover opacity-25 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-wine-deep via-wine-deep/80 to-wine-deep/40" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
        className="relative w-full max-w-sm text-center"
      >
        <p className="font-script text-7xl">Gloria&apos;s</p>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/55">Panel de la tienda</p>
        <input type="password" required placeholder="Contraseña" autoComplete="current-password" className="mt-12 w-full rounded-2xl bg-white/10 px-5 py-4 text-center text-lg outline-none ring-1 ring-white/20 placeholder:text-white/40 focus:ring-gold" />
        <button className="mt-3 w-full cursor-pointer rounded-2xl bg-gold py-4 text-lg font-medium text-wine-deep hover:bg-[#d8b77f]">Entrar</button>
        <p className="mt-8 text-xs text-white/40">Demostración: escribe cualquier contraseña.</p>
      </form>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/* ================================================================
   Inicio: calendar + the chosen day + what to make next
   ================================================================ */

function Home({ store, day, setDay, openOrder, goPrep }: { store: Store; day: string; setDay: (d: string) => void; openOrder: (id: string) => void; goPrep: () => void }) {
  const [filter, setFilter] = useState<"todos" | "pickup" | "delivery">("todos");
  const ofDay = store.orders.filter((o) => o.date === day).sort((a, b) => Number(a.status === "entregado") - Number(b.status === "entregado") || timeSort(a.time) - timeSort(b.time));
  const shown = ofDay.filter((o) => filter === "todos" || o.mode === filter);
  const today = localDay();
  const upcoming = store.orders
    .filter((o) => active(o) && prepDate(o) >= addDays(today, -3))
    .sort((a, b) => prepDate(a).localeCompare(prepDate(b)) || a.date.localeCompare(b.date) || timeSort(a.time) - timeSort(b.time))
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl leading-tight sm:text-[2.75rem]">{greeting()} 🌸</h1>
          <p className="text-ink/55">Planea, prepara y entrega tus pedidos.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 min-[1180px]:grid-cols-[1fr_20rem]">
        <MonthCard store={store} day={day} setDay={setDay} />
        <div className="grid gap-5 sm:max-[1179px]:grid-cols-2">
          <DayCard store={store} day={day} />
          <WorkloadCard store={store} day={day} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 min-[1180px]:grid-cols-[1fr_20rem]">
        {/* The chosen day's list */}
        <section className={`${card} min-w-0 p-4 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl">{shortDay(day) === "Hoy" ? "Pedidos de hoy" : `Pedidos · ${dayLabel(day, { weekday: "long", day: "numeric", month: "short" })}`}</h2>
            <div className="flex w-full gap-1 overflow-x-auto rounded-full bg-[#fbf4f2] p-1 sm:ml-auto sm:w-auto">
              {(
                [
                  ["todos", `Todos (${ofDay.length})`],
                  ["pickup", `🛍 Recoger (${ofDay.filter((o) => o.mode === "pickup").length})`],
                  ["delivery", `🚗 Entrega (${ofDay.filter((o) => o.mode === "delivery").length})`],
                ] as const
              ).map(([id, l]) => (
                <button key={id} onClick={() => setFilter(id)} className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm ${filter === id ? "bg-wine text-white" : "text-ink/60 hover:text-ink"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 divide-y divide-wine/5">
            {shown.length === 0 && <p className="py-12 text-center font-serif text-xl italic text-ink/40">No hay pedidos este día.</p>}
            {shown.map((o) => (
              <OrderRow key={o.id} o={o} onOpen={() => openOrder(o.id)} />
            ))}
          </div>
        </section>

        {/* What to make next */}
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 font-serif text-2xl">✂️ Próximo por preparar</h2>
          <p className="text-sm text-ink/50">Los ramos grandes se empiezan antes.</p>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 && <p className="py-8 text-center text-sm text-ink/40">Todo al día 🎉</p>}
            {upcoming.map((o) => (
              <button key={o.id} onClick={() => openOrder(o.id)} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left hover:bg-[#fbf4f2]">
                <Thumb o={o} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <PrepTag o={o} />
                  <p className="truncate text-[15px] font-medium">{o.items[0]?.name}</p>
                  <p className="text-xs text-ink/50">
                    Para {shortDay(o.date).toLowerCase()} · {timeLabel(o.time)}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={goPrep} className="mt-3 w-full cursor-pointer rounded-2xl bg-wine py-3 text-sm font-medium text-white hover:bg-rose-dark">
            Ver todo lo que hay que preparar →
          </button>
        </section>
      </div>
    </div>
  );
}

/** When to make it. Late only if it should have been started and nobody has. */
function PrepTag({ o }: { o: Order }) {
  const t = localDay();
  const day = prepDate(o);
  const [label, cls] =
    day < t && o.status === "nuevo" ? ["⚠️ Sin empezar", "bg-red-100 text-red-700"] : day < t ? ["En proceso", "bg-rose-100 text-rose-700"] : day === t ? ["Preparar: Hoy", "bg-rose-100 text-rose-700"] : [`Preparar: ${shortDay(day)}`, "bg-stone-100 text-stone-600"];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

function MonthCard({ store, day, setDay }: { store: Store; day: string; setDay: (d: string) => void }) {
  const today = localDay();
  const [month, setMonth] = useState(day.slice(0, 7)); // YYYY-MM
  const first = `${month}-01`;
  const start = addDays(first, -new Date(`${first}T12:00`).getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = cells[35].slice(0, 7) === month ? 6 : 5;
  const shift = (n: number) => {
    const d = new Date(`${first}T12:00`);
    d.setMonth(d.getMonth() + n);
    setMonth(localDay(d).slice(0, 7));
  };

  const due = (d: string) => store.orders.filter((o) => o.date === d).length;
  const prepping = (d: string) => store.orders.some((o) => prepDate(o) === d && o.date !== d);

  return (
    <section className={`${card} p-4 sm:p-6`}>
      <div className="flex items-center gap-2">
        <button onClick={() => shift(-1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full ring-1 ring-wine/10 hover:bg-[#fbf4f2]" aria-label="Mes anterior">‹</button>
        <h2 className="min-w-44 text-center font-serif text-2xl">{dayLabel(first, { month: "long" })} {first.slice(0, 4)}</h2>
        <button onClick={() => shift(1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full ring-1 ring-wine/10 hover:bg-[#fbf4f2]" aria-label="Mes siguiente">›</button>
        <button
          onClick={() => {
            setMonth(today.slice(0, 7));
            setDay(today);
          }}
          className="ml-auto cursor-pointer rounded-full bg-wine px-4 py-1.5 text-sm text-white hover:bg-rose-dark"
        >
          Hoy
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wider text-ink/40">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <span key={d} className="pb-2">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.slice(0, weeks * 7).map((d) => {
          const inMonth = d.slice(0, 7) === month;
          const n = due(d);
          const closed = store.days[d]?.closed;
          const full = !closed && workload(store, d) >= capacityOf(store, d);
          const picked = d === day;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`relative flex h-14 cursor-pointer flex-col items-center justify-start gap-1 rounded-2xl pt-1.5 transition sm:h-[4.25rem] sm:pt-2 ${picked ? "bg-blush ring-2 ring-wine" : closed ? "bg-stone-100" : full ? "bg-rose-50" : "hover:bg-[#fbf4f2]"} ${inMonth ? "" : "opacity-30"} ${d < today && !picked ? "text-ink/40" : ""}`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-sm ${d === today ? "bg-wine font-medium text-white" : ""}`}>{Number(d.slice(8))}</span>
              {closed ? (
                <span className="text-xs">🔒</span>
              ) : (
                n > 0 && <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-medium sm:h-7 sm:min-w-7 sm:text-sm ${full ? "bg-rose text-white" : "bg-wine/90 text-white"}`}>{n}</span>
              )}
              {prepping(d) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-white sm:right-2.5 sm:top-2.5" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/55">
        <span className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-wine text-[9px] text-white">3</span> Pedidos para ese día</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose" /> Hay que preparar algo</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-50 ring-1 ring-rose-200" /> Día lleno</span>
        <span className="flex items-center gap-1.5">🔒 Cerrado</span>
      </div>
    </section>
  );
}

function DayCard({ store, day }: { store: Store; day: string }) {
  const ofDay = store.orders.filter((o) => o.date === day);
  const rows = [
    ["🛍", "Para recoger", ofDay.filter((o) => o.mode === "pickup").length],
    ["🚗", "Entregas", ofDay.filter((o) => o.mode === "delivery").length],
    ["✂️", "Por preparar", ofDay.filter(active).length],
    ["✅", "Listos", ofDay.filter((o) => o.status === "listo" || o.status === "en_camino").length],
  ] as const;
  const d = new Date(`${day}T12:00`);
  return (
    <section className={`${card} relative overflow-hidden p-5`}>
      <div className="absolute -right-6 -top-6 h-36 w-36 overflow-hidden rounded-full opacity-90">
        <Image src="/img/rosas-50.webp" alt="" fill sizes="9rem" className="object-cover" />
      </div>
      <p className="text-sm text-ink/55">{shortDay(day) === "Hoy" ? "Hoy" : d.toLocaleDateString("es-MX", { weekday: "long" })}</p>
      <p className="font-serif text-4xl capitalize leading-none">{d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "")}</p>
      <span className="mt-2 inline-block rounded-full bg-wine px-3 py-1 text-xs font-medium text-white">{ofDay.length} pedidos</span>
      <ul className="mt-4 divide-y divide-wine/5">
        {rows.map(([i, l, n]) => (
          <li key={l} className="flex items-center gap-3 py-2 text-[15px]">
            <span className="w-6 text-center">{i}</span>
            {l}
            <span className="ml-auto font-serif text-xl">{n}</span>
          </li>
        ))}
      </ul>
      {ofDay.reduce((n, o) => n + roseCount(o), 0) > 0 && <p className="mt-2 rounded-xl bg-[#fbf4f2] px-3 py-2 text-sm text-ink/65">🌹 {ofDay.reduce((n, o) => n + roseCount(o), 0)} rosas en total</p>}
    </section>
  );
}

function Stepper({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const b = "grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[#fbf4f2] text-lg text-wine ring-1 ring-wine/10 hover:bg-blush disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <button disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} className={b} aria-label="Menos">−</button>
      <span className="w-7 text-center font-serif text-2xl">{value}</span>
      <button disabled={disabled || value >= 60} onClick={() => onChange(value + 1)} className={b} aria-label="Más">+</button>
    </div>
  );
}

function WorkloadCard({ store, day }: { store: Store; day: string }) {
  const used = workload(store, day);
  const cap = capacityOf(store, day);
  const pct = Math.min(100, Math.round((used / cap) * 100));
  const closed = !!store.days[day]?.closed;
  const state = closed ? ["Cerrado", "bg-stone-200 text-stone-600"] : used >= cap ? ["Lleno", "bg-rose text-white"] : pct >= 70 ? ["Casi lleno", "bg-amber-100 text-amber-800"] : ["Con espacio", "bg-emerald-100 text-emerald-800"];
  const setRule = (r: { capacity?: number; closed?: boolean }) => update((s) => void (s.days[day] = { ...s.days[day], ...r }));

  return (
    <section className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl">Trabajo del día</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${state[1]}`}>{state[0]}</span>
      </div>
      <p className="text-sm text-ink/50">Ramos chicos cuentan 1, los de 100 rosas cuentan 4.</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-serif text-4xl leading-none">{used}</span>
        <span className="text-ink/50">de {cap}</span>
        <span className="ml-auto text-sm text-ink/50">{closed ? "" : used >= cap ? "Sin espacio" : `Quedan ${cap - used}`}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f3e6e3]">
        <div className={`h-full rounded-full transition-all ${used >= cap ? "bg-rose" : "bg-gradient-to-r from-rose to-wine"}`} style={{ width: `${closed ? 0 : pct}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-wine/5 pt-3 text-sm">
        <span>Máximo este día</span>
        <Stepper value={cap} disabled={closed} onChange={(n) => setRule({ capacity: n })} />
      </div>
      <label className="mt-2 flex cursor-pointer items-center justify-between text-sm">
        <span>Cerrar este día</span>
        <input type="checkbox" checked={closed} onChange={() => setRule({ closed: !closed })} className="peer sr-only" />
        <span className="relative h-6 w-11 rounded-full bg-ink/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-wine peer-checked:after:translate-x-5" />
      </label>
      <p className="mt-3 text-xs text-ink/40">Cuando se llena o está cerrado, el sitio ya no deja escoger ese día.</p>
    </section>
  );
}

/* ================================================================
   Shared pieces
   ================================================================ */

function Thumb({ o, className = "" }: { o: Order; className?: string }) {
  const img = o.items[0]?.image ?? "/img/princesa.webp";
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-2xl bg-blush ${className}`}>
      <Image src={img} alt="" fill sizes="80px" className="object-cover" />
    </span>
  );
}

function StatusPill({ o }: { o: Order }) {
  if (o.hold) return <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">❓ Falta preguntar</span>;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PILL[o.status]}`}>{statusName(o.status, o.mode)}</span>;
}

function Progress({ o }: { o: Order }) {
  const total = checklist(o).length;
  const done = o.checks?.length ?? 0;
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink/45">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-ink/10">
        <span className="block h-full rounded-full bg-wine" style={{ width: `${(done / total) * 100}%` }} />
      </span>
      {done}/{total}
    </span>
  );
}

function OrderRow({ o, onOpen, showDay }: { o: Order; onOpen: () => void; showDay?: boolean }) {
  const item = o.items[0];
  return (
    <button onClick={onOpen} className={`flex w-full cursor-pointer items-center gap-3 py-3 text-left transition hover:bg-[#fdf9f8] sm:gap-4 sm:px-2 ${o.status === "entregado" ? "opacity-55" : ""}`}>
      <Thumb o={o} className="h-14 w-14 sm:h-16 sm:w-16" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[15px]">
          <span className="text-ink/40">#{o.number.replace("GL-", "")}</span>
          <span className="truncate font-medium">{o.customer}</span>
          {o.fromSite && o.status === "nuevo" && <span className="shrink-0 rounded-full bg-rose px-2 py-0.5 text-[10px] font-medium text-white">WEB</span>}
        </p>
        <p className="truncate text-sm text-ink/55">{item?.banner ? `${item.name.replace(" con banner", "")} · “${item.banner}”` : item?.name}</p>
        <p className="mt-1 flex items-center gap-3 text-xs text-ink/55 sm:hidden">
          {o.mode === "pickup" ? "🛍" : "🚗"} {showDay ? `${shortDay(o.date)} · ` : ""}
          {timeLabel(o.time)}
          <Progress o={o} />
        </p>
      </div>
      <div className="hidden w-32 shrink-0 text-sm sm:block">
        <p>{o.mode === "pickup" ? "🛍 Recoger" : "🚗 Entrega"}</p>
        <p className="text-ink/50">
          {showDay ? `${shortDay(o.date)} · ` : ""}
          {timeLabel(o.time)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusPill o={o} />
        <span className="hidden sm:block">
          <Progress o={o} />
        </span>
      </div>
      <span className="hidden text-ink/25 sm:block">›</span>
    </button>
  );
}

/* ================================================================
   Por preparar: the work list by the day it has to be made
   ================================================================ */

function WorkQueue({ store, openOrder, toast }: { store: Store; openOrder: (id: string) => void; toast: Toast }) {
  const today = localDay();
  const todo = store.orders.filter(active).sort((a, b) => prepDate(a).localeCompare(prepDate(b)) || a.date.localeCompare(b.date) || timeSort(a.time) - timeSort(b.time));
  const groups = [
    { title: "⚠️ Ya debían empezar", hint: "Su día de preparar ya pasó y nadie los ha empezado", list: todo.filter((o) => prepDate(o) < today && o.status === "nuevo") },
    { title: "Hoy", hint: "Para trabajar hoy", list: todo.filter((o) => prepDate(o) === today || (prepDate(o) < today && o.status === "preparando")) },
    { title: "Mañana", hint: "Para empezar mañana", list: todo.filter((o) => prepDate(o) === addDays(today, 1)) },
    { title: "Esta semana", hint: "Del pasado mañana en adelante", list: todo.filter((o) => prepDate(o) > addDays(today, 1) && prepDate(o) <= addDays(today, 7)) },
  ].filter((g) => g.list.length);

  const todayList = todo.filter((o) => prepDate(o) <= today);
  const roses = todayList.reduce((n, o) => n + roseCount(o), 0);
  const ready = store.orders.filter((o) => o.status === "listo" || o.status === "en_camino");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl leading-tight sm:text-[2.75rem]">Por preparar ✂️</h1>
          <p className="text-ink/55">Lo que hay que armar, según el día en que se debe empezar.</p>
        </div>
        <button onClick={() => window.print()} className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm ring-1 ring-wine/15 hover:ring-wine/40">
          🖨 Imprimir la hoja de hoy
        </button>
      </div>

      {/* Today's sheet in one line */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["✂️", `${todayList.length} arreglos`, "para preparar hoy"],
          ["🌹", `${roses} rosas`, "que se necesitan hoy"],
          ["✅", `${ready.length} listos`, "esperando que los recojan o entreguen"],
        ].map(([i, b, s]) => (
          <div key={b} className={`${card} flex items-center gap-4 p-4`}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blush/70 text-2xl">{i}</span>
            <div>
              <p className="font-serif text-3xl leading-none">{b}</p>
              <p className="mt-1 text-sm text-ink/50">{s}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {groups.length === 0 && <p className={`${card} py-16 text-center font-serif text-2xl italic text-ink/40`}>Nada por preparar. 🎉</p>}
        {groups.map((g) => (
          <section key={g.title}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-serif text-2xl">{g.title}</h2>
              <span className="text-sm text-ink/45">
                {g.list.length} · {g.hint}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {g.list.map((o) => (
                <WorkCard key={o.id} o={o} onOpen={() => openOrder(o.id)} toast={toast} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function advance(o: Order, toast: Toast) {
  const to = nextStep(o);
  if (!to) return;
  update((s) => {
    const x = s.orders.find((y) => y.id === o.id)!;
    x.status = to;
    x.hold = false;
    if (to === "listo") {
      x.checks = [...checklist(x).keys()];
      x.photo = x.photo ?? x.items[0]?.image;
    }
    x.log.push({ status: to, at: new Date().toISOString() });
  });
  const text = customerText(o, to);
  toast(text ? `💬 Le avisamos a ${o.customer.split(" ")[0]}` : `${statusName(to, o.mode)} ✓`, text || undefined);
}

function WorkCard({ o, onOpen, toast }: { o: Order; onOpen: () => void; toast: Toast }) {
  const item = o.items[0];
  return (
    <article className={`${card} flex flex-col overflow-hidden`}>
      <button onClick={onOpen} className="cursor-pointer text-left">
        <div className="relative h-36 bg-blush">
          {item && <Image src={item.image} alt="" fill sizes="(min-width:1280px) 24vw, (min-width:640px) 45vw, 92vw" className="object-cover" />}
          <span className="absolute left-3 top-3">
            <PrepTag o={o} />
          </span>
          <span className="absolute right-3 top-3">
            <StatusPill o={o} />
          </span>
        </div>
        <div className="px-4 pt-3">
          {item?.banner ? <p className="font-serif text-2xl italic leading-tight text-wine">“{item.banner}”</p> : <p className="font-serif text-xl leading-tight">{item?.name}</p>}
          <p className="mt-0.5 text-sm text-ink/55">
            {item?.banner ? `${item.name.replace(" con banner", "")} · banner ${item.ribbon?.toLowerCase()}` : item?.detail}
          </p>
          <p className="mt-2 text-sm">
            {o.mode === "pickup" ? "🛍 Recoge" : "🚗 Se entrega"} <strong className="font-medium">{shortDay(o.date).toLowerCase()}</strong> · {timeLabel(o.time)}
          </p>
          <div className="mt-2">
            <Progress o={o} />
          </div>
        </div>
      </button>
      <div className="mt-auto p-4 pt-3">
        <button onClick={() => advance(o, toast)} className="w-full cursor-pointer rounded-2xl bg-wine py-3 text-[15px] font-medium text-white hover:bg-rose-dark">
          {nextLabel(o)}
        </button>
      </div>
    </article>
  );
}

/* ================================================================
   Pedidos: every order, searchable
   ================================================================ */

function AllOrders({ store, query, setQuery, openOrder }: { store: Store; query: string; setQuery: (q: string) => void; openOrder: (id: string) => void }) {
  const today = localDay();
  const [range, setRange] = useState<"proximos" | "hoy" | "manana" | "semana" | "pasados">("proximos");
  const [status, setStatus] = useState<"todos" | Status>("todos");
  const q = query.trim().toLowerCase();

  const inRange = (o: Order) =>
    ({ proximos: o.date >= today, hoy: o.date === today, manana: o.date === addDays(today, 1), semana: o.date >= today && o.date <= addDays(today, 7), pasados: o.date < today })[range];
  const list = store.orders
    .filter((o) => (q ? [o.customer, o.phone, digits(o.phone), o.number, o.recipient ?? "", o.items[0]?.banner ?? ""].some((v) => v.toLowerCase().includes(q)) : inRange(o)))
    .filter((o) => status === "todos" || o.status === status)
    .sort((a, b) => (range === "pasados" && !q ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) || timeSort(a.time) - timeSort(b.time));

  const chip = (on: boolean) => `shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm ${on ? "bg-wine text-white" : "bg-white ring-1 ring-wine/10 hover:ring-wine/30"}`;

  return (
    <div>
      <h1 className="font-serif text-4xl leading-tight sm:text-[2.75rem]">Pedidos 🌹</h1>
      <p className="text-ink/55">Todos los pedidos para recoger y entregar.</p>

      {q && (
        <p className="mt-4 text-sm">
          Buscando “{query}” ·{" "}
          <button onClick={() => setQuery("")} className="cursor-pointer text-rose-dark underline">
            quitar
          </button>
        </p>
      )}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {(
          [
            ["proximos", "Próximos"],
            ["hoy", "Hoy"],
            ["manana", "Mañana"],
            ["semana", "Esta semana"],
            ["pasados", "Pasados"],
          ] as const
        ).map(([id, l]) => (
          <button key={id} onClick={() => (setRange(id), setQuery(""))} className={chip(!q && range === id)}>
            {l}
          </button>
        ))}
      </div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
        {(["todos", "nuevo", "preparando", "listo", "en_camino", "entregado"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`${chip(status === s)} !py-1 text-xs`}>
            {s === "todos" ? "Cualquier estado" : statusName(s, "delivery").replace(" para entregar", "")}
          </button>
        ))}
      </div>

      <section className={`${card} mt-5 px-3 py-1 sm:px-5`}>
        {list.length === 0 && <p className="py-14 text-center font-serif text-xl italic text-ink/40">No se encontró nada.</p>}
        <div className="divide-y divide-wine/5">
          {list.map((o, i) => (
            <div key={o.id}>
              {(i === 0 || list[i - 1].date !== o.date) && <p className="pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-ink/40">{dayLabel(o.date)}</p>}
              <OrderRow o={o} onOpen={() => openOrder(o.id)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   One order, full detail
   ================================================================ */

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-wine/5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbf4f2] text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink/50">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function OrderDrawer({ o, onClose, toast }: { o: Order; onClose: () => void; toast: Toast }) {
  const steps = flow[o.mode];
  const at = steps.indexOf(o.status);
  const list = checklist(o);
  const checks = new Set(o.checks ?? []);
  const item = o.items[0];
  const linkChip = "inline-flex items-center gap-1 rounded-full bg-[#fbf4f2] px-3 py-1.5 text-sm text-wine ring-1 ring-wine/10 hover:bg-blush";

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const edit = (fn: (x: Order) => void) => update((s) => fn(s.orders.find((y) => y.id === o.id)!));
  const toggle = (i: number) =>
    edit((x) => {
      const c = new Set(x.checks ?? []);
      if (c.has(i)) c.delete(i);
      else c.add(i);
      x.checks = [...c].sort();
      if (i === list.length - 1 && c.has(i)) x.photo = x.items[0]?.image; // last step is the photo
      if (x.status === "nuevo" && c.size) {
        x.status = "preparando";
        x.log.push({ status: "preparando", at: new Date().toISOString() });
      }
    });
  const back = () =>
    edit((x) => {
      if (at > 0) {
        x.status = steps[at - 1];
        x.log.pop();
      }
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label={`Pedido ${o.number}`}>
      <div className="absolute inset-0 bg-wine-deep/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex-1 overflow-y-auto">
          <div className="relative h-56 bg-blush sm:h-64">
            <Image src={o.photo ?? item?.image ?? "/img/princesa.webp"} alt="" fill sizes="36rem" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <button onClick={onClose} className="absolute left-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/95 text-lg shadow" aria-label="Cerrar">
              ←
            </button>
            <div className="absolute inset-x-5 bottom-4 text-white">
              <p className="text-sm text-white/80">Pedido {o.number}</p>
              <p className="font-serif text-3xl leading-tight">{o.customer}</p>
            </div>
            {o.photo && at >= 2 && <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">📸 Foto enviada</span>}
          </div>

          <div className="px-5 pb-6 sm:px-6">
            {/* Steps */}
            <ol className="mt-5 flex gap-1">
              {steps.map((st, i) => (
                <li key={st} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <span className={`h-2 w-full rounded-full ${i <= at ? "bg-wine" : "bg-ink/10"}`} />
                  <span className={`text-[11px] leading-tight ${i === at ? "font-medium text-wine" : "text-ink/40"}`}>{statusName(st, o.mode).replace(" para recoger", "").replace(" para entregar", "")}</span>
                </li>
              ))}
            </ol>

            {/* The two dates */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-rose-50 p-3">
                <p className="text-xs text-rose-700">✂️ Empezar a preparar</p>
                <p className="mt-0.5 font-serif text-xl">{dayLabel(prepDate(o), { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "")}</p>
              </div>
              <div className="rounded-2xl bg-[#fbf4f2] p-3">
                <p className="text-xs text-ink/55">{o.mode === "pickup" ? "🛍 Lo recogen" : "🚗 Se entrega"}</p>
                <p className="mt-0.5 font-serif text-xl">
                  {dayLabel(o.date, { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "")} · {timeLabel(o.time)}
                </p>
              </div>
            </div>

            {o.hold && <p className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm text-orange-800">❓ Falta preguntarle algo al cliente antes de hacerlo.</p>}

            <div className="mt-4">
              {o.items.map((i, k) => (
                <Section key={k} icon="🎀" title={`${i.qty > 1 ? `${i.qty} × ` : ""}${i.name}${i.ribbon ? ` · banner ${i.ribbon.toLowerCase()}` : ""} · $${i.price}`}>
                  {i.banner ? <p className="font-serif text-3xl italic leading-tight text-wine">“{i.banner}”</p> : <p className="font-medium">{i.detail ?? i.name}</p>}
                </Section>
              ))}

              <Section icon="✅" title={`Pasos · ${checks.size} de ${list.length}`}>
                <ul className="mt-1 space-y-1">
                  {list.map((step, i) => (
                    <li key={i}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[#fbf4f2]">
                        <input type="checkbox" checked={checks.has(i)} onChange={() => toggle(i)} className="peer sr-only" />
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 ring-wine/25 peer-checked:bg-wine peer-checked:ring-wine">
                          <span className={checks.has(i) ? "text-sm text-white" : "hidden"}>✓</span>
                        </span>
                        <span className={checks.has(i) ? "text-ink/40 line-through" : ""}>{step}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </Section>

              {o.card && (
                <Section icon="💌" title="Mensaje de la tarjeta">
                  <p className="font-serif text-xl italic">{o.card}</p>
                </Section>
              )}

              <Section icon="👤" title="Cliente">
                <p className="font-medium">
                  {o.customer} · <span className="font-normal text-ink/60">{o.phone}</span>
                </p>
                <div className="mt-2 flex gap-2">
                  <a href={`tel:${digits(o.phone)}`} className={linkChip}>📞 Llamar</a>
                  <a href={`sms:${digits(o.phone)}`} className={linkChip}>💬 Texto</a>
                </div>
              </Section>

              {o.mode === "delivery" && (
                <Section icon="📍" title={`Entregar a${o.zone ? ` · ${o.zone}` : ""}`}>
                  <p className="font-medium">{o.recipient}</p>
                  <p className="text-ink/70">{o.address}</p>
                  {o.instructions && <p className="mt-1 text-sm italic text-ink/55">“{o.instructions}”</p>}
                  <div className="mt-2 flex gap-2">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.address ?? "")}`} target="_blank" rel="noreferrer" className={linkChip}>🗺 Cómo llegar</a>
                    {o.recipientPhone && <a href={`tel:${digits(o.recipientPhone)}`} className={linkChip}>📞 Llamar</a>}
                  </div>
                </Section>
              )}

              <Section icon={o.paid === "tienda" ? "💵" : "💳"} title="Pago">
                <p className="flex items-baseline justify-between">
                  <span className={o.paid === "tienda" ? "font-medium text-rose-dark" : "text-emerald-700"}>{o.paid === "tienda" ? "Se cobra en la tienda" : "✓ Ya pagó en línea"}</span>
                  <span className="font-serif text-2xl">${o.total}</span>
                </p>
                {o.fee > 0 && <p className="text-xs text-ink/45">Incluye ${o.fee} de entrega</p>}
              </Section>

              <Section icon="📝" title="Notas de la tienda">
                <textarea defaultValue={o.notes} onBlur={(e) => edit((x) => void (x.notes = e.target.value || undefined))} rows={2} placeholder="Solo las ve la tienda…" className="w-full resize-none rounded-xl bg-[#fbf4f2] px-3 py-2 text-sm outline-none ring-1 ring-wine/10 focus:ring-wine/40" />
                {o.status !== "entregado" && (
                  <button
                    onClick={() => {
                      edit((x) => void (x.hold = !x.hold));
                      if (!o.hold) toast("❓ Marcado para preguntar", "Se queda en su lugar hasta que respondan.");
                    }}
                    className="mt-2 cursor-pointer text-sm text-orange-700 underline-offset-2 hover:underline"
                  >
                    {o.hold ? "✓ Ya respondieron" : "❓ Falta preguntarle algo al cliente"}
                  </button>
                )}
              </Section>

              {o.log.length > 0 && (
                <Section icon="🕒" title="Historial">
                  <ul className="space-y-0.5 text-sm text-ink/65">
                    {o.log.map((l, k) => (
                      <li key={k}>
                        {statusName(l.status, o.mode)} · {shortDay(l.at.slice(0, 10))} {clock(l.at)}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-wine/10 bg-white p-4">
          {at > 0 && (
            <button onClick={back} className="cursor-pointer rounded-2xl px-4 text-sm text-ink/55 ring-1 ring-wine/15 hover:text-wine">
              ↶ Regresar
            </button>
          )}
          {o.status !== "entregado" ? (
            <button onClick={() => advance(o, toast)} className="flex-1 cursor-pointer rounded-2xl bg-wine py-4 font-medium text-white hover:bg-rose-dark">
              {nextLabel(o)}
            </button>
          ) : (
            <p className="flex-1 py-3 text-center text-ink/50">💐 Pedido terminado</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Especiales: custom requests with a price
   ================================================================ */

function Specials({ store, toast }: { store: Store; toast: Toast }) {
  const rank = { nueva: 0, cotizada: 1, pagada: 2 };
  const list = [...store.specials].sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <h1 className="font-serif text-4xl leading-tight sm:text-[2.75rem]">Pedidos especiales ✨</h1>
      <p className="max-w-2xl text-ink/55">Ideas que mandan los clientes desde el sitio. Ponles precio, el cliente paga en línea y el pedido pasa solo al calendario.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {list.map((s) => (
          <SpecialCard key={s.id} s={s} toast={toast} />
        ))}
      </div>
    </div>
  );
}

function SpecialCard({ s, toast }: { s: Special; toast: Toast }) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const first = s.name.split(" ")[0];
  const step = { nueva: 0, cotizada: 1, pagada: 2 }[s.status];

  const sendQuote = () => {
    const q = Number(price);
    if (!q) return;
    update((st) => {
      const x = st.specials.find((y) => y.id === s.id)!;
      x.status = "cotizada";
      x.quote = q;
      x.quoteNote = note || undefined;
    });
    toast(`💬 Le mandamos el precio a ${first}`, `Hola ${first}, tu pedido especial cuesta $${q}. Paga aquí para apartarlo: [enlace de pago]`);
  };

  // Demo only: pretend the customer paid, which puts it on the calendar
  const markPaid = () => {
    update((st) => {
      st.specials.find((y) => y.id === s.id)!.status = "pagada";
      st.orders.push({
        id: crypto.randomUUID(),
        number: `GL-${Math.floor(2000 + Math.random() * 8000)}`,
        createdAt: new Date().toISOString(),
        customer: s.name,
        phone: s.phone,
        mode: s.mode,
        date: s.date || localDay(),
        time: s.mode === "pickup" ? "12" : "13-16",
        items: [{ name: `Especial · ${s.occasion}`, detail: s.idea, qty: 1, price: s.quote ?? 0, image: "/img/princesa.webp", units: 3, lead: 2 }],
        recipient: s.mode === "delivery" ? s.name : undefined,
        recipientPhone: s.mode === "delivery" ? s.phone : undefined,
        address: s.address,
        zone: s.mode === "delivery" ? "Por confirmar" : undefined,
        fee: 0,
        total: s.quote ?? 0,
        paid: "online",
        status: "nuevo",
        log: [],
      });
    });
    toast(`💳 ¡${first} pagó $${s.quote}!`, `Ya está en el calendario para el ${s.date ? dayLabel(s.date, { weekday: "long", day: "numeric" }).toLowerCase() : "día"}, y se empieza 2 días antes.`);
  };

  return (
    <article className={`${card} flex flex-col p-5 ${s.status === "nueva" ? "ring-2 ring-amber-300" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight">{s.occasion}</p>
          <p className="text-sm text-ink/55">
            {s.name} · {s.date ? dayLabel(s.date, { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "") : "día por confirmar"} · {s.mode === "pickup" ? "🛍 Recoger" : "🚗 Entrega"}
          </p>
        </div>
        {s.status === "nueva" && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Nueva</span>}
      </div>

      <p className="mt-4 rounded-2xl bg-[#fbf4f2] p-4 font-serif text-xl italic leading-snug">“{s.idea || "Sin descripción"}”</p>

      <div className="mt-3 flex gap-2">
        <a href={`tel:${digits(s.phone)}`} className="rounded-full bg-[#fbf4f2] px-3 py-1.5 text-sm text-wine ring-1 ring-wine/10 hover:bg-blush">📞 Llamar</a>
        <a href={`sms:${digits(s.phone)}`} className="rounded-full bg-[#fbf4f2] px-3 py-1.5 text-sm text-wine ring-1 ring-wine/10 hover:bg-blush">💬 Texto</a>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-1 text-center text-xs">
        {["Ponle precio", "Esperando pago", "Pagado"].map((t, i) => (
          <li key={t} className="flex flex-col items-center gap-1">
            <span className={`h-2 w-full rounded-full ${i <= step ? "bg-wine" : "bg-ink/10"}`} />
            <span className={i === step ? "font-medium text-wine" : "text-ink/40"}>{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4">
        {s.status === "nueva" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex items-center rounded-2xl bg-white ring-1 ring-wine/15 focus-within:ring-wine/50">
                <span className="pl-3 text-lg text-ink/45">$</span>
                <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="Precio" className="w-24 bg-transparent px-2 py-3 text-lg outline-none" />
              </label>
              <button onClick={sendQuote} disabled={!Number(price)} className="flex-1 cursor-pointer rounded-2xl bg-wine py-3 font-medium text-white hover:bg-rose-dark disabled:cursor-not-allowed disabled:opacity-40">
                Mandar precio
              </button>
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota para el cliente (opcional)" className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none ring-1 ring-wine/15 focus:ring-wine/50" />
          </div>
        )}
        {s.status === "cotizada" && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4">
            <div>
              <p className="text-sm text-sky-800">Le mandaste</p>
              <p className="font-serif text-3xl leading-none">${s.quote}</p>
              {s.quoteNote && <p className="mt-1 text-xs text-ink/55">{s.quoteNote}</p>}
            </div>
            <button onClick={markPaid} className="cursor-pointer rounded-2xl bg-white px-4 py-2.5 text-sm ring-1 ring-wine/15 hover:ring-wine/40">
              Demo: el cliente pagó
            </button>
          </div>
        )}
        {s.status === "pagada" && <p className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">✓ Pagó ${s.quote}. Ya está en el calendario.</p>}
      </div>
    </article>
  );
}
