/// <reference types="vite/client" />

interface ImportMetaEnv {
  [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css';