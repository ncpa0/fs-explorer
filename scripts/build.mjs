import { build } from "@ncpa0cpl/nodepack";
import dedent from "dedent";
import { bundle } from "lightningcss";
import fs from "node:fs/promises";
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
      // sourcemap: isDev ? "inline" : false,
      jsxImportSource: "@ncpa0cpl/vanilla-jsx",
      plugins: [cssPlugin(), svgLoaderPlugin()],
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
    external: [
      "@ncpa0cpl/vanilla-jsx",
      "@ncpa0cpl/vanilla-jsx/signals",
      "@ncpa0cpl/vanilla-jsx/jsx-runtime",
      "adwaveui",
    ],
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

/**
 * @returns {import("esbuild").Plugin}
 */
function svgLoaderPlugin() {
  return {
    name: "svg-loader",
    setup(build) {
      build.onLoad({ filter: /\.svg$/ }, async (args) => {
        const contents = await fs.readFile(args.path, "utf-8");

        const code = JsxComponentForSvg(contents);

        return {
          contents: code,
          loader: "js",
        };
      });
    },
  };
}

function JsxComponentForSvg(svgContent) {
  const code = /** js */ `
    function htmlstr(html) {
      if (typeof window.trustedTypes !== "undefined") {
        const sanitizer = trustedTypes.createPolicy("known-trusted", {
          createHTML: (input) => input,
        });
        const content = sanitizer.createHTML(html);
      }
      return html;
    }

    const content = htmlstr(${JSON.stringify(svgContent)});

    export default function Svg(props) {
      const tmp = document.createElement("div");
      tmp.innerHTML = content;

      const elem = tmp.children[0];

      for (const [key, value] of Object.entries(props)) {
        if (key in elem) {
          elem[key] = value;
          continue;
        }
        elem.setAttribute(key, String(value));
      }
      return elem;
    }
  `;

  return dedent(code);
}
