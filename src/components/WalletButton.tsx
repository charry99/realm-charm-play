import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chainName, useWallet } from "@/hooks/useWallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  wallet: ReturnType<typeof useWallet>;
}

export const WalletButton = ({ wallet }: Props) => {
  if (!wallet.address) {
    return (
      <Button
        onClick={wallet.connect}
        disabled={wallet.isConnecting}
        className="bg-gradient-primary text-primary-foreground font-display font-bold uppercase tracking-wider clip-corner shadow-neon hover:shadow-neon hover:brightness-110 transition-all"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {wallet.isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const short = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-secondary/60 bg-card/60 text-secondary font-mono shadow-cyan hover:bg-secondary/10 hover:text-secondary"
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-success shadow-success animate-pulse-glow" />
          {short}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card/95 border-primary/40 backdrop-blur-md">
        <DropdownMenuLabel className="font-display text-primary">Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="flex-col items-start gap-1 opacity-100">
          <span className="text-xs uppercase text-muted-foreground">Network</span>
          <span className="font-mono text-secondary">{chainName(wallet.chainId)}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex-col items-start gap-1 opacity-100">
          <span className="text-xs uppercase text-muted-foreground">Balance</span>
          <span className="font-mono text-foreground">
            {wallet.ethBalance ?? "—"} ETH
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={wallet.disconnect} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
