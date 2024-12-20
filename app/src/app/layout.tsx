import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import WalletProvider from "@/components/providers/wallet-provider";
import ModeToggle from "@/components/ModeToggle";

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
          <ModeToggle />
          <WalletProvider>
            <Navbar />

            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
