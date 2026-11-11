import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/Dashboard";

export const metadata: Metadata = { title: "Panel · Gloria's", robots: { index: false } };

/** The shop's order panel (demo) */
export default function Admin() {
  return <Dashboard />;
}
