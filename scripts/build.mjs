import { build } from "@ncpa0cpl/nodepack";
import { bundle } from "lightningcss";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

async function main() {
  /**
   * @type {import("@ncpa0cpl/nodepack").BuildConfig}
   */
  const bldOptions = {
    tsConfig: p("tsconfig.json"),
    srcDir: p("src"),
    outDir: p("dist"),
    target: "ES2022",
    formats: ["esm", "cjs", "legacy"],
    declarations: true,
    watch: watch,
    esbuildOptions: {
      minify: !isDev,
      sourcemap: isDev ? "inline" : false,
      jsxImportSource: "@ncpa0cpl/vanilla-jsx",
      plugins: [cssPlugin()],
    },
  };
  /**
   * @type {import("@ncpa0cpl/nodepack").BuildConfig}
   */
  const bundleOptions = {
    ...bldOptions,
    bundle: true,
    entrypoint: p("src/index.js"),
    outDir: p("dist/bundle"),
    formats: ["esm"],
  };

  await Promise.all([build(bldOptions), build(bundleOptions)]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * @returns {import("esbuild").Plugin}
 */
function cssPlugin() {
  /**
   * @param {string} filename
   */
  const bundleCss = (filename) => {
    const result = bundle({
      filename,
      minify: true,
    });
    const decoder = new TextDecoder();
    return decoder.decode(result.code);
  };

  /**
   * @param {string} stylesheet
   */
  const injectorSnippet = (stylesheet) => {
    return `
const stylesheet = ${stylesheet};
export default stylesheet;
`.trim();
  };

  return {
    name: "css-plugin",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const stringified = JSON.stringify(bundleCss(args.path));
        return {
          contents: injectorSnippet(stringified),
          loader: "js",
        };
      });
    },
  };
}
