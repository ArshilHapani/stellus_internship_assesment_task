import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateWalletProps {
  onConnect: () => void;
}

export function EmptyStateWallet({ onConnect }: EmptyStateWalletProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 my-10">
      <Wallet className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Connect Your Wallet
      </h2>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        To view your staking information and manage your assets, please connect
        your wallet.
      </p>
      <Button
        onClick={onConnect}
        className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-200 ease-in-out transform hover:scale-105"
      >
        Connect Wallet
      </Button>
    </div>
  );
}
