import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { parseArbCommand, SUGGESTED_COMMANDS } from "../../lib/commandRouter";
import { cn } from "../ui/utils";

type CommandBarProps = {
  className?: string;
};

export function CommandBar({ className }: CommandBarProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const runCommand = (raw: string) => {
    const { to } = parseArbCommand(raw);
    navigate(to);
    setValue("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runCommand(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setValue("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <form onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="arb-command-bar">
          Command
        </label>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-slate-700/90 bg-slate-900/80",
            "shadow-sm shadow-black/20 ring-1 ring-white/[0.04] transition-colors",
            "focus-within:border-emerald-600/50 focus-within:ring-emerald-500/20"
          )}
        >
          <span
            className="pl-3 font-mono text-sm font-medium text-emerald-500/90 select-none"
            aria-hidden
          >
            ›
          </span>
          <input
            id="arb-command-bar"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="scan markets for arbitrage"
            className={cn(
              "h-9 min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-slate-200 outline-none",
              "placeholder:text-slate-600 placeholder:font-sans"
            )}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-600">
          Press Enter to run · natural phrases and shortcuts supported
        </p>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => runCommand(cmd)}
            className={cn(
              "rounded border border-slate-800/90 bg-slate-900/60 px-2 py-1 text-left text-[10px] text-slate-400",
              "transition-colors hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-300"
            )}
          >
            <span className="font-mono text-emerald-600/80">›</span>{" "}
            <span className="font-sans">{cmd}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
