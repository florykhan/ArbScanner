/**
 * Lightweight keyword router for CLI-style commands → in-app routes + query params.
 * Extend this map as you add real backend-driven intents.
 */
export type ArbCommandResult = { to: string };

export function parseArbCommand(raw: string): ArbCommandResult {
  const trimmed = raw.trim().replace(/^>\s*/, "");
  const s = trimmed.toLowerCase();
  if (!s) return { to: "/events" };

  if (
    /\b(scan|scann).*(market|arbitrage)|arbitrage.*scan|detect.*arbitrage/.test(s)
  ) {
    return { to: "/dashboard" };
  }
  if (
    /^go\s+to\s+dashboard$|^dashboard$|\bopen dashboard\b/.test(s) ||
    s === "d"
  ) {
    return { to: "/dashboard" };
  }
  if (/^events?$|^list events$|^go\s+to\s+events/.test(s)) {
    return { to: "/events" };
  }
  if (/\balerts?\b/.test(s)) {
    return { to: "/alerts" };
  }
  if (/\blive\b.*\bopportunit|\bopportunit.*\blive\b|show.*opportunit/.test(s)) {
    return { to: "/dashboard" };
  }

  if (/find tesla|tesla stock|tesla opportun/.test(s)) {
    return { to: "/events?q=tesla" };
  }
  if (/\bbitcoin\b|\bbtc\b/.test(s)) {
    return { to: "/events?q=bitcoin" };
  }
  if (/\bcrypto\b/.test(s) && /\bactive\b/.test(s)) {
    return { to: "/events?status=active&cat=Crypto" };
  }
  if (/\bcrypto\b/.test(s)) {
    return { to: "/events?cat=Crypto" };
  }
  if (/\bstocks?\b/.test(s) && !/tesla/.test(s)) {
    return { to: "/events?cat=Stocks" };
  }
  if (/\bactive\b/.test(s)) {
    return { to: "/events?status=active" };
  }
  if (/compare.*kalshi|kalshi.*manifold|manifold.*kalshi/.test(s)) {
    return { to: "/events?q=kalshi+manifold" };
  }
  if (/show active crypto|active crypto events/.test(s)) {
    return { to: "/events?status=active&cat=Crypto" };
  }

  return { to: `/events?q=${encodeURIComponent(trimmed)}` };
}

/** Suggested one-liners for the home command bar (display only). */
export const SUGGESTED_COMMANDS = [
  "scan markets for arbitrage",
  "compare kalshi manifold bitcoin",
  "find tesla opportunities",
  "show active crypto events",
] as const;
