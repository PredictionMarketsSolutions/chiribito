/// <reference types="vite/client" />

type ViteEnv = {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
};

declare interface ImportMetaEnv extends ViteEnv {}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
