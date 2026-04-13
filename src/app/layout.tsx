import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "What Should I Wear?",
  description:
    "Weather-aware outfit suggestions using only the clothes you actually own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-6 py-3 dark:border-gray-800">
            <Link
              href="/"
              className="font-serif text-lg font-semibold tracking-tight"
            >
              ☁︎ what should i wear
            </Link>
            <div className="flex items-center gap-3">
              <Nav />
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="cursor-pointer rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="cursor-pointer rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                    Sign up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
