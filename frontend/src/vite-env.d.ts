/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Preferred: full API origin, e.g. `https://arbscanner-api.onrender.com` (no `/api` suffix). */
  readonly VITE_API_BASE_URL?: string;
  /** Legacy alias for `VITE_API_BASE_URL`. */
  readonly VITE_API_URL?: string;
  /** Optional: override Vite dev proxy target (default `http://127.0.0.1:3001`). */
  readonly VITE_DEV_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
