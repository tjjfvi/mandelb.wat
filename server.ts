import { assert } from "https://deno.land/std@0.174.0/testing/asserts.ts";
import { serve } from "https://deno.land/std@0.167.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.167.0/http/file_server.ts";

Deno.run({ cmd: ["wat2wasm", "mandelb.wat"] });
Deno.run({
  cmd: [
    "deno",
    "bundle",
    "--no-check",
    "mandelbwat.ts",
    "mandelbwat.js",
  ],
});

serve((req) => {
  return serveDir(req);
});
