import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import sveltePreprocess from "svelte-preprocess";
import typescript from 'rollup-plugin-typescript2';
import execute from "rollup-plugin-execute";
import css from "rollup-plugin-import-css";
import pkg from "./package.json";

const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, "$3")
  .replace(/^\w/, (m) => m.toUpperCase())
  .replace(/-\w/g, (m) => m[1].toUpperCase());

export default [
  {
    input: "src/index.ts",
    output: [
      { file: pkg.module, format: "es", sourcemap: true },
      {
        file: pkg.main,
        format: "umd",
        name,
        sourcemap: true,
        plugins: [
          execute([
            "tsc --outDir ./dist --declaration",
            "node scripts/preprocess.js",
          ]),
        ],
      },
    ],
    plugins: [
      svelte({
        preprocess: sveltePreprocess(),
      }),
      resolve(),
      css(),
      typescript(),
    ],
  },
];
