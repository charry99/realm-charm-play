import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Coins, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Dice } from "./Dice";
import { cn } from "@/lib/utils";

type Direction = "over" | "under";

interface Roll {
  id: number;
  d1: number;
  d2: number;
  total: number;
  prediction: Direction;
  threshold: number;
  bet: number;
  payout: number;
  win: boolean;
}

const STORAGE_KEY = "neonroll-state-v1";
const STARTING_BALANCE = 1000;

interface PersistedState {
  balance: number;
  history: Roll[];
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { balance: STARTING_BALANCE, history: [] };
}

// probability that sum of 2d6 > threshold
function probOver(threshold: number): number {
  // sum distribution counts for 2d6
  const counts: Record<number, number> = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
  };
  let win = 0;
  for (let s = 2; s <= 12; s++) if (s > threshold) win += counts[s];
  return win / 36;
}

interface Props {
  walletConnected: boolean;
  onRequireConnect: () => void;
}

export const DiceGame = ({ walletConnected, onRequireConnect }: Props) => {
  const [{ balance, history }, setState] = useState<PersistedState>(() => loadState());
  const [bet, setBet] = useState(50);
  const [threshold, setThreshold] = useState(7);
  const [direction, setDirection] = useState<Direction>("over");
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number]>([1, 1]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, history }));
  }, [balance, history]);

  const winChance = useMemo(() => {
    const p = direction === "over" ? probOver(threshold) : 1 - probOver(threshold) - (
      // remove ties (sum === threshold) so "under" means strictly under
      ((): number => {
        const counts: Record<number, number> = {
          2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
        };
        return (counts[threshold] ?? 0) / 36;
      })()
    );
    return Math.max(0.0001, Math.min(0.9999, p));
  }, [direction, threshold]);

  const multiplier = useMemo(() => {
    // 2% house edge
    return (0.98 / winChance);
  }, [winChance]);

  const potentialPayout = bet * multiplier;

  const canRoll = walletConnected && bet > 0 && bet <= balance && !rolling;

  const handleRoll = async () => {
    if (!walletConnected) {
      onRequireConnect();
      return;
    }
    if (bet <= 0 || bet > balance) {
      toast.error("Invalid bet amount");
      return;
    }
    setRolling(true);

    // animate dice
    const ticker = setInterval(() => {
      setDice([
        (Math.floor(Math.random() * 6) + 1) as number,
        (Math.floor(Math.random() * 6) + 1) as number,
      ]);
    }, 80);

    await new Promise((r) => setTimeout(r, 900));
    clearInterval(ticker);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    setDice([d1, d2]);

    const win = direction === "over" ? total > threshold : total < threshold;
    const payout = win ? Math.round(bet * multiplier) : 0;

    const roll: Roll = {
      id: Date.now(),
      d1, d2, total,
      prediction: direction,
      threshold,
      bet,
      payout,
      win,
    };

    setState((s) => ({
      balance: s.balance - bet + payout,
      history: [roll, ...s.history].slice(0, 20),
    }));

    if (win) {
      toast.success(`+${payout} $NEON`, {
        description: `Rolled ${total} — ${direction} ${threshold} ✓`,
      });
    } else {
      toast.error(`-${bet} $NEON`, {
        description: `Rolled ${total} — ${direction} ${threshold} ✗`,
      });
    }
    setRolling(false);
  };

  const resetBalance = () => {
    setState({ balance: STARTING_BALANCE, history: [] });
    toast("Balance reset to 1000 $NEON");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* GAME PANEL */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-card p-6 sm:p-8 shadow-neon clip-corner">
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-secondary text-glow-cyan">
              Roll the dice
            </p>
            <h2 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              PREDICT · BET · WIN
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 px-3 py-1.5 text-xs font-mono uppercase text-success">
            <Coins className="h-3 w-3" />
            {balance.toLocaleString()} $NEON
          </div>
        </div>

        {/* Dice display */}
        <div className="my-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <Dice value={dice[0]} rolling={rolling} variant="primary" />
            <span className="font-display text-3xl text-muted-foreground">+</span>
            <Dice value={dice[1]} rolling={rolling} variant="secondary" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
              Total
            </span>
            <span
              className={cn(
                "font-display text-5xl font-black tabular-nums",
                rolling
                  ? "text-muted-foreground"
                  : history[0]?.win
                  ? "text-success text-glow-success"
                  : history.length === 0
                  ? "text-foreground"
                  : "text-destructive text-glow-destructive"
              )}
            >
              {dice[0] + dice[1]}
            </span>
          </div>
        </div>

        {/* Direction toggle */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setDirection("over")}
            className={cn(
              "group relative rounded-xl border-2 p-4 transition-all clip-corner",
              direction === "over"
                ? "border-primary bg-primary/15 shadow-neon"
                : "border-border bg-card/40 hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowUp className={cn("h-5 w-5", direction === "over" ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("font-display font-bold uppercase tracking-wider", direction === "over" ? "text-primary text-glow-primary" : "text-muted-foreground")}>
                Roll Over
              </span>
            </div>
          </button>
          <button
            onClick={() => setDirection("under")}
            className={cn(
              "group relative rounded-xl border-2 p-4 transition-all clip-corner",
              direction === "under"
                ? "border-secondary bg-secondary/15 shadow-cyan"
                : "border-border bg-card/40 hover:border-secondary/40"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowDown className={cn("h-5 w-5", direction === "under" ? "text-secondary" : "text-muted-foreground")} />
              <span className={cn("font-display font-bold uppercase tracking-wider", direction === "under" ? "text-secondary text-glow-cyan" : "text-muted-foreground")}>
                Roll Under
              </span>
            </div>
          </button>
        </div>

        {/* Threshold slider */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-display text-xs uppercase tracking-widest text-muted-foreground">
              Threshold
            </label>
            <span className="font-display text-2xl font-black text-foreground tabular-nums">
              {threshold}
            </span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={(v) => setThreshold(v[0])}
            min={3}
            max={11}
            step={1}
          />
          <div className="flex justify-between font-mono text-xs text-muted-foreground">
            <span>3</span><span>5</span><span>7</span><span>9</span><span>11</span>
          </div>
        </div>

        {/* Bet input */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-display text-xs uppercase tracking-widest text-muted-foreground">
              Bet amount
            </label>
            <div className="flex gap-2">
              {[10, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBet(Math.min(amt, balance))}
                  className="rounded border border-border bg-card/60 px-2 py-0.5 font-mono text-xs text-muted-foreground hover:border-primary/60 hover:text-primary"
                >
                  {amt}
                </button>
              ))}
              <button
                onClick={() => setBet(Math.max(1, Math.floor(balance / 2)))}
                className="rounded border border-border bg-card/60 px-2 py-0.5 font-mono text-xs text-muted-foreground hover:border-primary/60 hover:text-primary"
              >
                ½
              </button>
              <button
                onClick={() => setBet(balance)}
                className="rounded border border-border bg-card/60 px-2 py-0.5 font-mono text-xs text-muted-foreground hover:border-primary/60 hover:text-primary"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={balance}
              value={bet}
              onChange={(e) => setBet(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className="bg-input/80 border-primary/30 font-mono text-lg pr-20 focus-visible:ring-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-xs uppercase tracking-widest text-secondary">
              $NEON
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard
            label="Win chance"
            value={`${(winChance * 100).toFixed(1)}%`}
            color="secondary"
          />
          <StatCard
            label="Multiplier"
            value={`${multiplier.toFixed(2)}x`}
            color="primary"
          />
          <StatCard
            label="Payout"
            value={`+${Math.round(potentialPayout).toLocaleString()}`}
            color="success"
          />
        </div>

        {/* Roll button */}
        <Button
          onClick={handleRoll}
          disabled={!canRoll && walletConnected}
          className={cn(
            "w-full h-14 text-lg font-display font-black uppercase tracking-widest clip-corner transition-all",
            walletConnected
              ? "bg-gradient-primary text-primary-foreground shadow-neon hover:brightness-110 disabled:opacity-50"
              : "bg-card border-2 border-primary/40 text-primary hover:bg-primary/10"
          )}
        >
          <Zap className="mr-2 h-5 w-5" />
          {!walletConnected
            ? "Connect Wallet to Play"
            : rolling
            ? "Rolling…"
            : bet > balance
            ? "Insufficient Balance"
            : `Roll · Risk ${bet} $NEON`}
        </Button>

        {balance === 0 && walletConnected && (
          <button
            onClick={resetBalance}
            className="mt-4 w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-secondary"
          >
            ↻ Reset balance to 1000 $NEON
          </button>
        )}
      </div>

      {/* HISTORY PANEL */}
      <aside className="rounded-2xl border border-secondary/30 bg-gradient-card p-5 shadow-cyan clip-corner">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-secondary text-glow-cyan flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Rolls
          </h3>
          {history.length > 0 && (
            <button
              onClick={resetBalance}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
            >
              Reset
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-3 h-12 w-12 rounded-full border-2 border-dashed border-border" />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No rolls yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Connect wallet & roll to begin
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {history.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "animate-float-up rounded-lg border p-3 transition-all",
                  r.win
                    ? "border-success/40 bg-success/5"
                    : "border-destructive/40 bg-destructive/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-black tabular-nums text-foreground">
                      {r.total}
                    </span>
                    <div className="flex flex-col text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <span>{r.prediction} {r.threshold}</span>
                      <span>{r.d1} + {r.d2}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "font-display font-black tabular-nums",
                      r.win ? "text-success text-glow-success" : "text-destructive"
                    )}
                  >
                    {r.win ? "+" : "-"}
                    {r.win ? r.payout : r.bet}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "primary" | "secondary" | "success";
}) => {
  const colorClass = {
    primary: "text-primary text-glow-primary border-primary/30",
    secondary: "text-secondary text-glow-cyan border-secondary/30",
    success: "text-success text-glow-success border-success/30",
  }[color];
  return (
    <div className={cn("rounded-lg border bg-card/40 p-3 text-center", colorClass)}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("font-display text-lg font-bold tabular-nums", colorClass)}>
        {value}
      </p>
    </div>
  );
};
