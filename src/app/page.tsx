"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/today");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-6 text-6xl">🌤️</p>
      <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
        What should I wear?
      </h1>
      <p className="mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-400">
        Save the cities you care about, keep a digital closet of what you own,
        and get a daily outfit suggestion tuned to the weather and your style.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <SignUpButton mode="modal">
          <button className="cursor-pointer rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
            Get started
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="cursor-pointer rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-100 dark:hover:border-gray-500 dark:hover:bg-gray-800">
            Sign in
          </button>
        </SignInButton>
      </div>

      <div className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
        <FeatureCard
          emoji="🏙️"
          title="Your cities"
          body="Track weather in every place you live or travel to."
        />
        <FeatureCard
          emoji="👕"
          title="Your closet"
          body="Tell us what you own; we only suggest items you actually have."
        />
        <FeatureCard
          emoji="✨"
          title="Your style"
          body="Casual, business, streetwear — tuned to your personal vibe."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-2xl">{emoji}</p>
      <h3 className="mt-2 font-serif text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{body}</p>
    </div>
  );
}
