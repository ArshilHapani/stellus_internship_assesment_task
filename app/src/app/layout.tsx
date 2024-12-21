import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";
import ModeToggle from "@/components/ModeToggle";
import Provider from "@/components/providers";
import NetworkIndicator from "@/components/NetworkIndicator";

import "./globals.css";

export const metadata: Metadata = {
  title: "Token Staking App",
  description: "Stake your tokens and earn rewards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="dark:bg-[var(--background-dark)]">
          <Provider>
            <ModeToggle />
            <Navbar />
            {children}
            <NetworkIndicator />
          </Provider>
        </main>
      </body>
    </html>
  );
}
