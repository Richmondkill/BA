import React from "react";

export default function VirtualCard({
  holder,
  last4,
  expiry,
  status = "Active",
  tier = "PLATINUM",
  bin = "5412",
}: {
  holder: string;
  last4: string;
  expiry: string;
  status?: "Active" | "Suspended";
  tier?: string;
  bin?: string;
}) {
  return (
    <div
      className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl text-white shadow-theme-lg"
      style={{
        background:
          "linear-gradient(135deg,#3a1014 0%,#1c0b0d 48%,#0b0809 100%)",
      }}
    >
      {/* guilloché / texture layers */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(120% 120% at 100% 0%, rgba(236,17,26,0.42), transparent 45%), radial-gradient(90% 90% at 0% 100%, rgba(255,95,107,0.18), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 9px)",
        }}
      />
      {/* diagonal sheen */}
      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-5">
        {/* top */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide">Scotiabank</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              {tier}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                status === "Active"
                  ? "bg-success-500/20 text-success-300"
                  : "bg-error-500/20 text-error-300"
              }`}
            >
              {status}
            </span>
            {/* contactless */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white/70">
              <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a9 9 0 0 1 0 12M5 11.2a2.5 2.5 0 0 1 0 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* chip */}
        <div className="mt-1">
          <svg width="46" height="34" viewBox="0 0 46 34" className="drop-shadow">
            <defs>
              <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f9e9b0" />
                <stop offset="0.5" stopColor="#d9b451" />
                <stop offset="1" stopColor="#b8892f" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="44" height="32" rx="6" fill="url(#chip)" />
            <path
              d="M16 1v32M30 1v32M1 12h44M1 22h44M16 12h14v10H16z"
              stroke="rgba(120,86,25,0.55)"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
        </div>

        {/* number */}
        <div className="font-mono text-lg tracking-[0.18em] text-white/95 drop-shadow-sm">
          {bin} <span className="align-middle">••••</span>{" "}
          <span className="align-middle">••••</span> {last4}
        </div>

        {/* bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
              Card holder
            </p>
            <p className="text-sm font-medium uppercase tracking-wide text-white/95">
              {holder}
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
                Valid thru
              </p>
              <p className="text-sm font-medium text-white/95">{expiry}</p>
            </div>
            {/* Mastercard mark */}
            <div className="flex flex-col items-center">
              <span className="relative inline-flex h-7 w-12 items-center">
                <span className="absolute left-0 h-7 w-7 rounded-full bg-[#eb001b]" />
                <span className="absolute left-5 h-7 w-7 rounded-full bg-[#f79e1b] mix-blend-screen" />
              </span>
              <span className="mt-0.5 text-[8px] lowercase tracking-wide text-white/60">
                mastercard
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
