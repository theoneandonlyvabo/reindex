"use client";

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Standard HSL->hex conversion (fractional s/l), used to generate the
// preset grid below rather than hand-picking ~50 hex values from memory.
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const channel = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * channel)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const GRAYSCALE_ROW = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
];
const HUES = [0, 25, 45, 60, 120, 175, 210, 255, 285, 320];
const SHADE_LIGHTNESS = [0.85, 0.65, 0.5, 0.35, 0.2];
const COLOR_ROWS = SHADE_LIGHTNESS.map((l) =>
  HUES.map((h) => hslToHex(h, 0.7, l)),
);

function Swatch({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-5 shrink-0 rounded-full border border-black/10"
      style={{ backgroundColor: color }}
      aria-label={color}
    />
  );
}

/**
 * Preset swatch grid by default — a full RGB/hex picker up front makes an
 * arbitrary color the path of least resistance, which doesn't fit a thesis
 * body. "Custom colors" opens a native `<input type="color">` for the rare
 * case a specific hex is actually needed, without it being the default.
 */
export function ToolbarColorInput({
  icon: Icon,
  color,
  fallback,
  onChange,
  label,
}: {
  icon: LucideIcon;
  color: string | null;
  fallback: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  function pick(hex: string) {
    onChange(hex);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <Icon style={color ? { color } : undefined} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {GRAYSCALE_ROW.map((hex) => (
              <Swatch key={hex} color={hex} onClick={() => pick(hex)} />
            ))}
          </div>
          {COLOR_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1">
              {row.map((hex, j) => (
                <Swatch key={j} color={hex} onClick={() => pick(hex)} />
              ))}
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <button
          type="button"
          onClick={() => customInputRef.current?.click()}
          className="w-full rounded-md px-1 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Custom colors…
        </button>
        <input
          ref={customInputRef}
          type="color"
          aria-label={`Custom ${label.toLowerCase()}`}
          value={color ?? fallback}
          onChange={(e) => pick(e.target.value)}
          className="absolute size-0 opacity-0"
        />
      </PopoverContent>
    </Popover>
  );
}
