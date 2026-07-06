"use client";

import { useEffect, useState, type ReactNode } from "react";

const LOGO_SRC = "/scotiabanklogo.png";

const SLIDES = [
  {
    image: "/pic1.jpg",
    title: "Banking built around you",
    text: "A modern console for your wallet, clear, fast and secure.",
  },
  {
    image: "/pic2.jpg",
    title: "A team that has your back",
    text: "Our specialists keep your account moving, around the clock.",
  },
  {
    image: "/pic3.jpg",
    title: "Advice you can trust",
    text: "Guidance from people who put your goals first.",
  },
  {
    image: "/pic4.jpg",
    title: "Watch your money grow",
    text: "Track every transfer with beautiful, real-time insight.",
  },
];

export default function AuthCarousel({
  year,
  action,
}: {
  year: number;
  action?: ReactNode;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0">
      {SLIDES.map((s, idx) => (
        <div
          key={s.image}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 70% at 18% 12%, rgba(255,95,107,0.46), transparent 58%), linear-gradient(135deg, #ec111a 0%, #8f1016 42%, #120405 100%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 saturate-0 opacity-50 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(10,2,3,0.92) 0%, rgba(117,21,26,0.58) 48%, rgba(236,17,26,0.46) 100%)",
            }}
          />
        </div>
      ))}

      <div className="relative flex h-full flex-col justify-between p-6 text-white sm:p-8 lg:p-12">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Scotiabank"
            className="h-11 w-11 rounded-xl object-cover shadow-theme-md"
          />
          <span className="text-lg font-semibold">Scotiabank</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{SLIDES[i].title}</h2>
          <p className="mt-4 text-white/75">{SLIDES[i].text}</p>
          <div className="mt-8 flex gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          {action && <div className="mt-8">{action}</div>}
        </div>

        <p className="text-xs text-white/50">
          (c) {year} Scotiabank. Simulated banking.
        </p>
      </div>
    </div>
  );
}
