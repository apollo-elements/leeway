import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import graphql from '@apollo-elements/rollup-plugin-graphql';
import litcss from 'rollup-plugin-lit-css';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import modulepreload from 'rollup-plugin-modulepreload';
import notify from 'rollup-plugin-notify';
import visualizer from 'rollup-plugin-visualizer';
import license from 'rollup-plugin-license';
import watchAssets from 'rollup-plugin-watch-assets';
import { generateSW } from 'rollup-plugin-workbox';
import { terser } from 'rollup-plugin-terser';

function onwarn(warning, warn) {
  if (warning.code === 'THIS_IS_UNDEFINED') return;
  else warn(warning);
}

const isProduction = arg => arg.includes('production');

const {
  PRODUCTION =
  process.env.NODE_ENV === 'production' ||
  process.env.NETLIFY_ENV === 'production' ||
  process.argv.some(isProduction),
} = process.env;

const WATCH = process.argv.includes('-w') || process.argv.includes('--watch');

console.log('Production?', PRODUCTION);

console.log('Watch mode?', WATCH);

export default {
  onwarn,
  preserveEntrySignatures: false,
  treeshake: !!PRODUCTION,
  input: 'src/app.js',
  output: [{
    dir: 'build',
    format: 'es',
    sourcemap: true,
  }, WATCH ? null : {
    dir: 'build/system',
    format: 'system',
    sourcemap: true,
  }].filter(Boolean),

  plugins: [

    commonjs(),

    {
      // needed to specifically use the browser bundle for subscriptions-transport-ws
      name: 'use-browser-for-subscriptions-transport-ws',
      resolveId(id) {
        if (id === 'subscriptions-transport-ws')
          return path.resolve('node_modules/subscriptions-transport-ws/dist/client.js');
      },
    },

    resolve(),

    json(),

    graphql(),

    litcss({ uglify: PRODUCTION }),

    watchAssets({
      assets: [
        'src/index.html',
        'src/style.css',
      ],
    }),

    copy({
      targets: [
        { src: 'dependencies.txt', dest: 'build' },
        { src: 'src/index.html', dest: 'build' },
        { src: 'src/manifest.webmanifest', dest: 'build' },
        { src: 'src/style.css', dest: 'build' },
      ],
    }),

    copy({
      flatten: false,
      targets: [
        { src: 'src/fonts', dest: 'build' },
        { src: 'node_modules/@webcomponents/**/*.js', dest: 'build/assets' },
        { src: 'node_modules/systemjs/dist/**/*.js', dest: 'build/assets' },
      ],
    }),

    WATCH ? generateSW({
      swDest: 'build/sw.js',
      globPatterns: ['nothing'],
      globDirectory: 'build',
      globIgnores: ['**/*'],
      runtimeCaching: [
        {
          // You can use a RegExp as the pattern:
          urlPattern: '*',
          handler: 'NetworkOnly',
        },
      ],
    })
      : generateSW(require('./workbox-config')),

    modulepreload({ index: 'build/index.html', prefix: 'module' }),

    WATCH ? null : license({
      thirdParty: {
        includePrivate: true,
        output: {
          file: './dependencies.txt',
        },
      },
    }),

    ...(PRODUCTION && !WATCH ? [

      minifyHTML({
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

      terser({ mangle: false }),

    ] : [

     WATCH ? null : visualizer({ sourcemap: true }),

     WATCH ? null : notify(),

    ]),

  ],
};
