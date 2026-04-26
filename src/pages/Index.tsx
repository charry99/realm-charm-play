import { Dices, Github, Shield, Zap } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { WalletButton } from "@/components/WalletButton";
import { DiceGame } from "@/components/DiceGame";

const Index = () => {
  const wallet = useWallet();

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="relative z-10 border-b border-primary/20 backdrop-blur-md bg-background/60">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-neon">
              <Dices className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-black tracking-widest text-foreground">
                NEON<span className="text-primary text-glow-primary">ROLL</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary">
                web3 · dice · prediction
              </span>
            </div>
          </a>
          <WalletButton wallet={wallet} />
        </div>
      </header>

      <main className="relative z-10 container py-8 sm:py-12">
        {/* Hero */}
        <section className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/5 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-secondary">
            <Zap className="h-3 w-3" /> Provably degen · 2% house edge
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-foreground">
            Predict the <span className="text-primary text-glow-primary">Roll</span>.
            <br />
            Stack the <span className="text-secondary text-glow-cyan">Pot</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Bet on whether two neon dice land over or under your threshold.
            Connect your MetaMask wallet to enter the arena.
          </p>
        </section>

        {/* Game */}
        <DiceGame
          walletConnected={!!wallet.address}
          onRequireConnect={wallet.connect}
        />

        {/* Features */}
        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Non-custodial"
            text="We never touch your keys. Connect, play, walk away."
            color="primary"
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Instant rolls"
            text="No waiting on blocks. Pure adrenaline, neon-fast."
            color="secondary"
          />
          <FeatureCard
            icon={<Dices className="h-5 w-5" />}
            title="Fair odds"
            text="Transparent multipliers based on dice probability."
            color="success"
          />
        </section>

        <footer className="mt-16 flex flex-col items-center gap-2 border-t border-primary/10 pt-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            $NEON balance is simulated · No real funds at risk
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary"
          >
            <Github className="h-3 w-3" /> built on the grid
          </a>
        </footer>
      </main>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: "primary" | "secondary" | "success";
}) => {
  const colorMap = {
    primary: "border-primary/30 text-primary text-glow-primary shadow-neon",
    secondary: "border-secondary/30 text-secondary text-glow-cyan shadow-cyan",
    success: "border-success/30 text-success text-glow-success shadow-success",
  }[color];
  return (
    <div className={`rounded-xl border bg-gradient-card p-5 clip-corner ${colorMap}`}>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap}`}>
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
};

export default Index;
