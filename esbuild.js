const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Plugin to log build start, errors, and finish messages.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] Build started...');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}`);
        }
      });
      console.log('[watch] Build finished.');
    });
  },
};

/**
 * Copies static assets (e.g., webview.html) from the source folder to the output folder.
 */
async function copyAssets() {
  const srcFile = path.join(__dirname, 'src', 'webview.html');
  const destFile = path.join(__dirname, 'dist', 'webview.html');

  return new Promise((resolve, reject) => {
    fs.copyFile(srcFile, destFile, (err) => {
      if (err) {
        console.error('Error copying webview.html:', err);
        return reject(err);
      }
      console.log('Copied webview.html to the dist folder.');
      resolve();
    });
  });
}

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    await copyAssets();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
