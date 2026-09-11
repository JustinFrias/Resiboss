/// <reference lib="dom" />

// Type definitions for Supabase Edge Functions (Deno runtime)

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export type Handler = (req: Request) => Response | Promise<Response>;
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }
  export function serve(handler: Handler, options?: ServeOptions): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "https://*" {
  const content: any;
  export default content;
  export const serve: any;
  export const createClient: any;
  export const corsHeaders: any;
}
