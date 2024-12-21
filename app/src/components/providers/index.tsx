"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/providers/theme-provider";
import WalletProvider from "@/components/providers/wallet-provider";

type Props = {
  children: React.ReactNode;
};

const Provider = ({ children }: Props) => {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster richColors />
          {children}
        </QueryClientProvider>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default Provider;
