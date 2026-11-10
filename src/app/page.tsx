import Image from "next/image";
import { collections, occasions, shop } from "@/lib/data";
import { Motion } from "@/components/Motion";
import { Nav } from "@/components/Nav";
import { BannerBuilder } from "@/components/BannerBuilder";
import { CustomOrder } from "@/components/CustomOrder";

// All photos are the shop's own, cropped from its Instagram. They're small,
// so the layout keeps them at moderate sizes until better ones arrive.

/** A heading whose lines rise into view one after another */
function Lines({ lines, className = "", hero = false }: { lines: React.ReactNode[]; className?: string; hero?: boolean }) {
  return (
    <span data-lines data-hero={hero || undefined} className={`block ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <span className="block">{l}</span>
        </span>
      ))}
    </span>
  );
}

function Curtain() {
  return (
    <div className="curtain fixed inset-0 z-[80] flex flex-col items-center justify-center bg-wine-deep text-ivory" aria-hidden>
      <p className="curtain-name font-script text-7xl sm:text-8xl">Gloria&apos;s</p>
      <span className="curtain-rule mt-4 block h-px w-40 bg-gold" />
      <p className="eyebrow mt-4 text-ivory/60">Gift &amp; Flower Shop</p>
    </div>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-wine-deep text-ivory">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(184,112,106,0.25),transparent_60%)]" />
      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pb-24 pt-32 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p data-fade data-hero className="eyebrow text-gold">San Pablo, CA · Flores · Perfumes · Regalos</p>
          <h1 className="mt-6">
            <Lines hero lines={[<span key="g" className="font-script text-[clamp(5rem,13vw,10.5rem)] leading-[0.95]">Gloria&apos;s</span>, <span key="s" className="font-serif text-[clamp(1.4rem,3vw,2.4rem)] uppercase tracking-[0.28em] text-ivory/90">Gift &amp; Flower Shop</span>]} />
          </h1>
          <p data-fade data-hero className="mt-6 max-w-md font-serif text-2xl italic text-ivory/75">Ramos que dicen lo que tú quieres decir.</p>
          <div data-fade data-hero className="mt-10 flex flex-wrap gap-4">
            <a href="#ramos" data-magnetic className="eyebrow inline-block bg-ivory px-8 py-4 text-wine transition-colors hover:bg-blush">Ordenar un ramo</a>
            <a href="#pedido" data-magnetic className="eyebrow inline-block border border-ivory/40 px-8 py-4 transition-colors hover:border-gold hover:text-gold">Pedido especial</a>
          </div>
        </div>
        <div data-parallax="0.6" className="relative mx-auto w-full max-w-sm lg:max-w-md">
          <div data-clip data-hero className="arch relative aspect-[658/958] overflow-hidden">
            <Image src="/img/propuesta.webp" alt="Ramo de rosas rosas con banner ¿Quieres ser mi novia? y mariposas doradas" fill priority sizes="(min-width:1024px) 28rem, 90vw" className="object-cover" />
          </div>
          <p data-fade data-hero className="mt-4 text-right font-serif text-lg italic text-ivory/60">“¿Quieres ser mi novia?” — hecho en la tienda</p>
        </div>
      </div>
      <div className="eyebrow absolute inset-x-0 bottom-6 mx-auto flex max-w-7xl justify-between px-5 text-ivory/50 sm:px-8">
        <span>{shop.address} · {shop.city}</span>
        <span>Desliza ↓</span>
      </div>
    </section>
  );
}

function Occasions() {
  const row = [...occasions, ...occasions];
  return (
    <div className="overflow-hidden bg-rose py-3 text-ivory">
      <div className="marquee flex w-max gap-10 font-serif text-lg italic">
        {[...row, ...row].map((o, i) => (
          <span key={i} className="flex items-center gap-10">
            {o} <span className="text-xs not-italic text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Story() {
  return (
    <section className="bg-ivory py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
        <div data-parallax="0.3" className="mx-auto w-full max-w-sm">
          <div data-clip className="arch relative aspect-[658/898] overflow-hidden">
            <Image src="/img/princesa.webp" alt="Ramo de rosas azules y rosas con banner Happy Birthday Princesa" fill sizes="(min-width:768px) 24rem, 90vw" className="object-cover" />
          </div>
        </div>
        <div>
          <p data-fade className="eyebrow text-rose">Nuestra tienda</p>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.02]">
            <Lines lines={[<span key="a" className="font-script text-[1.35em] text-rose">Con amor,</span>, "flores que hablan", <em key="c" className="text-rose-dark">por ti.</em>]} />
          </h2>
          <p data-fade className="mt-8 max-w-md text-lg leading-relaxed text-ink/75">
            En nuestra tienda de Market Ave armamos ramos buchones, arreglos personalizados y regalos para cada ocasión. También vas a encontrar perfumes 100% originales y globos para completar la sorpresa.
          </p>
          <a href="#ramos" data-fade className="eyebrow mt-10 inline-block border-b border-wine pb-1 text-wine hover:text-rose">Ver los ramos →</a>
        </div>
      </div>
    </section>
  );
}

function Ramos() {
  return (
    <section id="ramos" className="bg-blush/60 py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <BannerBuilder />
      </div>
    </section>
  );
}

function Colecciones() {
  return (
    <section id="colecciones" data-hscroll className="relative overflow-hidden bg-wine text-ivory">
      <div data-track className="flex snap-x snap-mandatory overflow-x-auto py-24 lg:min-h-screen lg:items-center lg:overflow-visible lg:py-0">
        <div className="flex w-[85vw] shrink-0 snap-start flex-col justify-center px-8 sm:w-[60vw] lg:w-[38vw] lg:px-16">
          <p className="eyebrow text-gold">Hechos en la tienda</p>
          <h2 className="mt-4 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-none">
            Colecciones
          </h2>
          <p className="mt-6 max-w-sm font-serif text-xl italic text-ivory/70">Cada ramo se arma a mano, con el mensaje y los detalles que tú escojas.</p>
          <p className="eyebrow mt-10 text-ivory/50">Desliza →</p>
        </div>
        {collections.map((c, i) => (
          <article key={c.id} className="group w-[72vw] shrink-0 snap-start px-4 sm:w-[44vw] lg:w-[26vw] lg:px-6">
            <div className="relative aspect-[422/456] overflow-hidden">
              <Image src={`/img/col-${c.id}-v2.webp`} alt={c.name} fill sizes="(min-width:1024px) 26vw, 72vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
            </div>
            <p className="eyebrow mt-5 text-gold">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 font-serif text-3xl">{c.name}</h3>
            <p className="mt-2 text-ivory/65">{c.line}</p>
          </article>
        ))}
        <div className="w-[10vw] shrink-0" />
      </div>
    </section>
  );
}

function Perfumes() {
  return (
    <section id="perfumes" className="relative overflow-hidden bg-wine-deep py-28 text-ivory">
      <p className="pointer-events-none absolute -right-10 top-10 select-none font-script text-[16rem] leading-none text-ivory/[0.04]" aria-hidden>
        Parfum
      </p>
      <div className="relative mx-auto grid max-w-6xl gap-16 px-5 sm:px-8 md:grid-cols-2">
        <div>
          <p data-fade className="eyebrow text-gold">100% originales</p>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.02]">
            <Lines lines={["Perfumes", <em key="o" className="text-blush">originales</em>]} />
          </h2>
          <p data-fade className="mt-6 max-w-md text-lg leading-relaxed text-ivory/70">Perfumes auténticos para regalar solos o junto con tu ramo. Pregunta por las marcas y la disponibilidad en la tienda.</p>
        </div>
        <div className="md:pt-24">
          <p data-fade className="eyebrow text-gold">Para completar la sorpresa</p>
          <h2 className="mt-5 font-serif text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.05]">
            <Lines lines={["Globos y", <em key="e" className="text-blush">detalles</em>]} />
          </h2>
          <ul data-fade className="mt-6 divide-y divide-ivory/15 border-y border-ivory/15 font-serif text-xl">
            {["Globos de corazón", "Globos de cumpleaños", "Peluches", "Coronas, tiaras y mariposas"].map((t) => (
              <li key={t} className="flex justify-between py-4">
                {t} <span className="eyebrow self-center text-ivory/40">en tienda</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Pedido() {
  return (
    <section id="pedido" className="bg-wine py-28 text-ivory">
      <div className="mx-auto grid max-w-6xl gap-16 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p data-fade className="eyebrow text-gold">Pedido especial</p>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.02]">
            <Lines lines={["¿Tienes una idea?", <em key="r" className="text-blush">La hacemos realidad.</em>]} />
          </h2>
          <p data-fade className="mt-6 max-w-sm text-lg leading-relaxed text-ivory/70">Quinceañeras, propuestas, ramos de dinero o algo que nadie ha visto. Cuéntanos y te contactamos para confirmar el precio.</p>
        </div>
        <div data-fade>
          <CustomOrder />
        </div>
      </div>
    </section>
  );
}

function Visitanos() {
  return (
    <section id="visitanos" className="bg-ivory py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p data-fade className="eyebrow text-rose">Visítanos</p>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.02]">
            <Lines lines={["Te esperamos en", <em key="t" className="text-rose-dark">la tienda.</em>]} />
          </h2>
          <dl data-fade className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {[
              ["Dirección", `${shop.address}, ${shop.city}`],
              ["Teléfono / texto", shop.phone],
              ["Horario", shop.hours],
              ["Instagram", `@${shop.instagram}`],
              ["TikTok", `@${shop.tiktok}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-4">
                <dt className="eyebrow self-center text-ink/50">{k}</dt>
                <dd className="text-right font-serif text-xl">{v}</dd>
              </div>
            ))}
          </dl>
          <div data-fade className="mt-10 flex flex-wrap gap-4">
            <a href={shop.mapsHref} target="_blank" rel="noreferrer" data-magnetic className="eyebrow inline-block bg-wine px-8 py-4 text-ivory hover:bg-rose-dark">Cómo llegar</a>
            <a href={shop.smsHref} data-magnetic className="eyebrow inline-block border border-wine px-8 py-4 text-wine hover:bg-blush">Mándanos un texto</a>
          </div>
        </div>
        <div data-clip className="relative aspect-[4/5] overflow-hidden">
          <iframe title="Mapa de la tienda" src={shop.mapEmbed} className="absolute inset-0 h-full w-full grayscale-[0.4] sepia-[0.2]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-wine-deep px-5 py-14 text-ivory sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8">
        <div>
          <p className="font-script text-5xl">Gloria&apos;s</p>
          <p className="eyebrow mt-2 text-ivory/50">Gift &amp; Flower Shop · {shop.city}</p>
        </div>
        <p className="max-w-sm text-sm text-ivory/45">Diseño de muestra. Precios de su lista publicada y horario por confirmar con la tienda.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Curtain />
      <div className="grain" aria-hidden />
      <Motion />
      <Nav />
      <main>
        <Hero />
        <Occasions />
        <Story />
        <Ramos />
        <Colecciones />
        <Perfumes />
        <Pedido />
        <Visitanos />
      </main>
      <Footer />
    </>
  );
}
