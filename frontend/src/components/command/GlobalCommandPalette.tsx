import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Command as CommandPrimitive } from "cmdk";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Zap,
  Bitcoin,
  Car,
  Radio,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { cn } from "../ui/utils";

type GlobalCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: GlobalCommandPaletteProps) {
  const navigate = useNavigate();

  const go = useCallback(
    (to: string) => {
      navigate(to);
      onOpenChange(false);
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-[480px]",
          "border-slate-800 bg-slate-950 shadow-2xl shadow-black/50"
        )}
      >
        <DialogHeader className="border-b border-slate-800/90 px-3 py-2">
          <DialogTitle className="text-left text-xs font-medium tracking-wide text-slate-400">
            Command palette
          </DialogTitle>
        </DialogHeader>
        <Command
          className={cn(
            "bg-slate-950 text-slate-200 [&_[cmdk-group-heading]]:text-slate-500",
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
            "[&_[cmdk-input-wrapper]]:border-slate-800"
          )}
          shouldFilter
        >
          <div className="flex items-center gap-2 border-b border-slate-800 px-3">
            <span className="font-mono text-sm text-emerald-500/90" aria-hidden>
              ›
            </span>
            <CommandPrimitive.Input
              placeholder="Search actions, pages, events…"
              className={cn(
                "flex h-11 w-full bg-transparent py-3 text-sm text-slate-200 outline-none",
                "placeholder:text-slate-600"
              )}
            />
          </div>
          <CommandList className="max-h-[min(50vh,320px)]">
            <CommandEmpty className="py-6 text-xs text-slate-500">
              No matches — try “dashboard”, “crypto”, or “tesla”.
            </CommandEmpty>

            <CommandGroup heading="Navigate">
              <CommandItem
                onSelect={() => go("/dashboard")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <LayoutDashboard className="text-slate-500" />
                Go to dashboard
              </CommandItem>
              <CommandItem
                onSelect={() => go("/events")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Calendar className="text-slate-500" />
                Go to events
              </CommandItem>
              <CommandItem
                onSelect={() => go("/alerts")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Bell className="text-slate-500" />
                Go to alerts
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="bg-slate-800" />

            <CommandGroup heading="Scanner">
              <CommandItem
                onSelect={() => go("/dashboard")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Zap className="text-amber-500/80" />
                Show live opportunities
              </CommandItem>
              <CommandItem
                onSelect={() => go("/events?cat=Crypto")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Bitcoin className="text-orange-400/80" />
                Find crypto events
              </CommandItem>
              <CommandItem
                onSelect={() => go("/events/3")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Car className="text-slate-500" />
                Open Tesla stock event
              </CommandItem>
              <CommandItem
                onSelect={() => go("/events/1")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Bitcoin className="text-orange-400/80" />
                Show Bitcoin event
              </CommandItem>
              <CommandItem
                onSelect={() => go("/events?status=active")}
                className="cursor-pointer text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white"
              >
                <Radio className="text-emerald-500/80" />
                Active events only
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t border-slate-800/90 px-3 py-2 text-[10px] text-slate-600">
          <kbd className="rounded border border-slate-700 bg-slate-900 px-1 font-mono text-slate-500">
            Esc
          </kbd>{" "}
          close ·{" "}
          <kbd className="rounded border border-slate-700 bg-slate-900 px-1 font-mono text-slate-500">
            ⌘K
          </kbd>{" "}
          toggle
        </div>
      </DialogContent>
    </Dialog>
  );
}
