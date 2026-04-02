import { cn } from "../ui/utils";

export type ScannerConsoleLine = {
  text: string;
  /** Visual weight — default neutral */
  variant?: "default" | "accent" | "muted";
};

type ScannerConsoleProps = {
  lines: ScannerConsoleLine[];
  className?: string;
  title?: string;
};

/**
 * Compact scanner / system log strip for the dashboard.
 * Pass `lines` from props later when wired to a live feed.
 */
export function ScannerConsole({
  lines,
  className,
  title = "Scanner console",
}: ScannerConsoleProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-slate-800/90 bg-[#0a0f14] ring-1 ring-white/[0.03]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-2.5 py-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </span>
        <span className="font-mono text-[8px] text-slate-600">SYS.LOG</span>
      </div>
      <ul className="space-y-0.5 px-2.5 py-2 font-mono text-[10px] leading-snug">
        {lines.map((line, i) => (
          <li
            key={`${i}-${line.text.slice(0, 24)}`}
            className={cn(
              "flex gap-1.5 border-l border-transparent pl-1",
              line.variant === "accent" && "border-l-emerald-500/50 text-emerald-400/95",
              line.variant === "muted" && "text-slate-600",
              (!line.variant || line.variant === "default") && "text-slate-400"
            )}
          >
            <span className="shrink-0 text-slate-600 select-none">›</span>
            <span>{line.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
