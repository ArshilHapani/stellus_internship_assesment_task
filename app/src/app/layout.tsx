import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";

import { ThemeProvider } from "@/components/providers/theme-provider";
import WalletProvider from "@/components/providers/wallet-provider";
import ModeToggle from "@/components/ModeToggle";
import Provider from "@/components/providers";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Provider>
            <ModeToggle />
            <WalletProvider>
              <Navbar />
              {children}
            </WalletProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
