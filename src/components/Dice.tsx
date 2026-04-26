import { cn } from "@/lib/utils";

const DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

interface DiceProps {
  value: number;
  rolling?: boolean;
  variant?: "primary" | "secondary";
}

export const Dice = ({ value, rolling, variant = "primary" }: DiceProps) => {
  const dots = DOTS[value] ?? [];
  const glow = variant === "primary" ? "shadow-neon border-primary/60" : "shadow-cyan border-secondary/60";
  const dotColor = variant === "primary" ? "bg-primary shadow-neon" : "bg-secondary shadow-cyan";

  return (
    <div
      className={cn(
        "relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 bg-gradient-card",
        "grid grid-cols-3 grid-rows-3 gap-1 p-3",
        glow,
        rolling && "animate-dice-roll"
      )}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const active = dots.some(([r, c]) => r === row && c === col);
        return (
          <div
            key={i}
            className={cn(
              "rounded-full transition-opacity",
              active ? dotColor : "bg-transparent"
            )}
          />
        );
      })}
    </div>
  );
};
