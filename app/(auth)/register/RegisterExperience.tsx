"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCarousel from "../login/AuthCarousel";
import RegisterForm from "./RegisterForm";

const LOGO_SRC = "/scotiabanklogo.png";

function AuthPanel() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Scotiabank"
            className="h-10 w-10 rounded-xl object-cover shadow-theme-sm"
          />
          <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Scotiabank
          </span>
        </div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Open a wallet in a minute — no paperwork required.
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterExperience({ year }: { year: number }) {
  const [showMobileAuth, setShowMobileAuth] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="hidden min-h-screen lg:flex">
        <div className="relative w-1/2 overflow-hidden">
          <AuthCarousel year={year} />
        </div>
        <div className="flex w-1/2 items-center justify-center p-6">
          <AuthPanel />
        </div>
      </div>

      <div className="lg:hidden">
        {!showMobileAuth ? (
          <div className="relative min-h-dvh overflow-hidden bg-black">
            <AuthCarousel
              year={year}
              action={
                <button
                  type="button"
                  onClick={() => setShowMobileAuth(true)}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-600 shadow-theme-lg transition hover:bg-brand-50 active:scale-[0.99]"
                >
                  Get Started
                </button>
              }
            />
          </div>
        ) : (
          <div className="min-h-dvh overflow-y-auto">
            <div className="flex min-h-dvh items-center justify-center p-6">
              <AuthPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
