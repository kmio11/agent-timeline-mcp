/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATABASE_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
