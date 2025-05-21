/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_COMPANY_NAME: string;
  readonly VITE_TAGLINE: string;
  readonly VITE_PRIMARY_COLOR: string;
  readonly VITE_SECONDARY_COLOR: string;
  readonly VITE_ENABLE_WAITLIST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
