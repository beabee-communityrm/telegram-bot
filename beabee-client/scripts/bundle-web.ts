// Based on https://github.com/grammyjs/grammY/blob/main/bundling/bundle-web.ts
import { bundle } from "https://deno.land/x/emit@0.28.0/mod.ts";
import { createCache } from "https://deno.land/x/deno_cache@0.6.0/mod.ts";

// Parse args
const entryPoint = Deno.args[0];

const url = new URL(entryPoint, import.meta.url);

// Rewrite imports from .deno.ts to .web.ts
const cache = createCache();
const load = (specifier: string) => {
  if (specifier.endsWith(".deno.ts")) {
    const baseLength = specifier.length - ".deno.ts".length;
    specifier = specifier.substring(0, baseLength) + ".web.ts";
  }
  return cache.load(specifier);
};

console.log(`Bundling from ${entryPoint} ...`);
// Bundle code
const { code: bundledCode } = await bundle(url, {
  load,
  compilerOptions: {
    sourceMap: false,
    inlineSources: false,
    inlineSourceMap: false,
    emitDecoratorMetadata: true,
  },
});

console.log("Emitting ...");

// Strip the huge inline source map which is somehow generated anyway
await Deno.writeTextFile(
  "../out/web.js",
  bundledCode.replace(/\/\/# sourceMappingURL=.*\n/, ""),
);
await Deno.writeTextFile(
  "../out/web.d.ts",
  'export * from "./mod.d.ts";\n',
);

console.log("Done.");
