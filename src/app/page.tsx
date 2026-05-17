"use client";

import dynamic from "next/dynamic";
import LandingOverlay from "@/components/LandingOverlay";

const OceanScene = dynamic(() => import("@/components/OceanScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative">
      <OceanScene />
      <LandingOverlay />
    </main>
  );
}
