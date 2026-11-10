import type { Metadata } from "next";
import { Site } from "@/components/Site";

export const metadata: Metadata = { title: "Gloria's Gift & Flower Shop — Versión rosa" };

/** The bright pink version, after her flyer and price list */
export default function Pink() {
  return <Site variant="rosa" />;
}
