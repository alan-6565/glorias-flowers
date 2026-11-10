"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// The page's motion, kept quiet and slow on purpose. Hooked up by attributes:
//   data-lines     its .line-mask > span children rise into view, one by one
//   data-clip      a photo frame that unveils from the bottom, image settling as it does
//   data-parallax  drifts at a different speed while scrolling (value = strength)
//   data-fade      fades up the first time it's scrolled to
//   data-hscroll   on wide screens, pins and slides its [data-track] sideways
//   data-magnetic  leans gently toward the pointer
// With "reduce motion" on, none of it runs and everything shows as-is.
export function Motion() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ duration: 1.25, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
        const lines = el.querySelectorAll(".line-mask > span");
        const hero = el.hasAttribute("data-hero");
        gsap.from(lines, {
          yPercent: 110,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.12,
          delay: hero ? 1.6 : 0,
          scrollTrigger: hero ? undefined : { trigger: el, start: "top 85%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((frame) => {
        const img = frame.querySelector("img");
        const hero = frame.hasAttribute("data-hero");
        const tl = gsap.timeline({ delay: hero ? 1.4 : 0, scrollTrigger: hero ? undefined : { trigger: frame, start: "top 85%", once: true } });
        tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
        if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.2);
        // Drop the mask once it's open, so frames drawn outside the photo show
        tl.set(frame, { clearProps: "clipPath" });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const k = Number(el.dataset.parallax) || 0.2;
        gsap.fromTo(el, { yPercent: 20 * k }, { yPercent: -20 * k, ease: "none", scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.from(el, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", delay: el.hasAttribute("data-hero") ? 2 : 0, scrollTrigger: el.hasAttribute("data-hero") ? undefined : { trigger: el, start: "top 88%", once: true } });
      });

      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });

    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-hscroll]").forEach((wrap) => {
        const track = wrap.querySelector<HTMLElement>("[data-track]");
        if (!track) return;
        const distance = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, { x: () => -distance(), ease: "none", scrollTrigger: { trigger: wrap, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true } });
      });
    });

    // Only with a real mouse: phones don't hover
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const off: (() => void)[] = [];
      gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: "power3.out" });
        };
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        off.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
      return () => off.forEach((f) => f());
    });

    return () => mm.revert();
  }, []);

  return null;
}
