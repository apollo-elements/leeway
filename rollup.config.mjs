// @ts-check
import path from 'path';
import fs from 'fs';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import modulepreload from 'rollup-plugin-modulepreload';
import notify from 'rollup-plugin-notify';
import license from 'rollup-plugin-license';
import watchAssets from 'rollup-plugin-watch-assets';
import { minify } from 'html-minifier-terser';

import { visualizer } from 'rollup-plugin-visualizer';
import { copy } from '@web/rollup-plugin-copy';
import { generateSW } from 'rollup-plugin-workbox';
import { terser } from 'rollup-plugin-terser';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function onwarn(warning, warn) {
  if (warning.code === 'THIS_IS_UNDEFINED') return;
  else warn(warning);
}

const isProduction = arg => arg.includes('production');

const PRODUCTION =
  process.env.NODE_ENV === 'production' ||
  process.env.NETLIFY_ENV === 'production' ||
  process.env.PRODUCTION === 'true' ||
  process.argv.some(isProduction);

const WATCH = process.argv.includes('-w') || process.argv.includes('--watch');

console.log('Production?', PRODUCTION);

console.log('Watch mode?', WATCH);

export default {
  onwarn,
  preserveEntrySignatures: false,
  treeshake: !!PRODUCTION,
  input: 'index.html',
  output: {
    dir: 'public',
    format: 'es',
    sourcemap: true,
  },

  plugins: [

    {
      // needed to specifically use the browser bundle for subscriptions-transport-ws
      name: 'use-browser-for-subscriptions-transport-ws',
      resolveId(id) {
        if (id === 'subscriptions-transport-ws')
          return path.resolve('node_modules/subscriptions-transport-ws/dist/client.js');
      },
    },

    WATCH ? null : license({
      thirdParty: {
        includePrivate: true,
        output: {
          file: 'client/dependencies.json',
          template(dependencies) {
            return JSON.stringify(dependencies, null, 2);
          },
        },
      },
    }),

    commonjs(),

    html({
      transformHtml: html => !PRODUCTION ? html : minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeScriptTypeAttributes: false,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: false,
        minifyJS: true,
      }),
      rootDir: path.join(process.cwd(), 'client'),
    }),

    {
      name: 'transform-preload-assets',
      writeBundle: () => {
        const INDEX = new URL('./public/index.html', import.meta.url);
        const ASSETS = fs.readdirSync(new URL('./public/assets', import.meta.url));
        const ASSETS_NO_HASHES = ASSETS.map(x => x.replace(/-\w+\./, '.'));
        fs.writeFileSync(
          INDEX,
          fs.readFileSync(INDEX, 'utf8')
            .replace(/href="(\w+)"/, (_match, g1) => `href="${ASSETS[ASSETS_NO_HASHES.findIndex(x => x === g1.replace)] || g1}"`),
          'utf8',
        );
      },
    },

    resolve(),

    json(),

    watchAssets({ assets: ['client/index.html', 'client/style.css'] }),

    copy({ patterns: 'LICENSE.md' }),

    replace({
      preventAssignment: true,
      PROTOCOL_SUFFIX: PRODUCTION ? 's' : '',
    }),

    WATCH ? generateSW({
      swDest: 'public/sw.js',
      globPatterns: ['nothing'],
      globDirectory: 'public',
      globIgnores: ['**/*'],
      runtimeCaching: [
        {
          // You can use a RegExp as the pattern:
          urlPattern: '*',
          handler: 'NetworkOnly',
        },
      ],
    })
      : generateSW(require('./workbox-config.cjs')),

    // modulepreload({ index: 'public/index.html', prefix: 'module' }),

    ...(PRODUCTION && !WATCH ? [

      // @ts-expect-error: ugh..
      (typeof minifyHTML === 'function' ? minifyHTML : minifyHTML.default)({
        failOnError: true,
        options: {
          shouldMinify(template) {
            if (template.tag)
              return template.tag.toLowerCase().includes('html');
            else {
              return template.parts.some(part => (
                part.text.includes('<style') ||
                part.text.includes('<dom-module')));
            }
          },
        },
      }),

      terser({ mangle: false, format: { comments: false } }),

    ] : [

     WATCH ? null : visualizer({ sourcemap: true }),

     WATCH ? null : notify(),

    ]),

  ],
};
