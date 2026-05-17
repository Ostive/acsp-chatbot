"use client";

import Image from "next/image";
import { useState } from "react";
import Chat from "./chat";

export default function Home() {
  const [chatKey, setChatKey] = useState(0);

  const resetChat = () => setChatKey((k) => k + 1);

  return (
    <div className="flex h-dvh flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 border-b border-acsp-border bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={resetChat}
            className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-acsp-teal"
            aria-label="Revenir à l'accueil"
          >
            <Image
              src="/ACSP-Formations-Occitanie.webp"
              alt="ACSP Formations"
              width={56}
              height={56}
              priority
              style={{ height: "auto" }}
              className="h-12 w-auto"
            />
            <span className="hidden flex-col leading-tight text-left sm:flex">
              <span className="text-sm font-semibold text-acsp-navy">
                ACSP Formations
              </span>
              <span className="text-xs text-acsp-text-soft">
                Occitanie · Labastide-Saint-Pierre
              </span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-acsp-border bg-white px-3 py-1.5 text-xs font-medium text-acsp-text-soft sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acsp-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-acsp-green" />
              </span>
              Julie · en ligne
            </span>
            <a
              href="tel:+33766121571"
              className="inline-flex items-center gap-2 rounded-full bg-acsp-navy px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-acsp-navy-soft sm:text-sm"
            >
              <PhoneIcon />
              <span className="hidden sm:inline">07 66 12 15 71</span>
              <span className="sm:hidden">Appeler</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <Chat key={chatKey} />
      </main>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
