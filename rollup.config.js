import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import graphql from 'rollup-plugin-graphql';
import litcss from 'rollup-plugin-lit-css';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import modulepreload from 'rollup-plugin-modulepreload';
import notify from 'rollup-plugin-notify';
import { generateSW } from 'rollup-plugin-workbox';
import visualizer from 'rollup-plugin-visualizer';
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

console.log('Production?', PRODUCTION);

export default {
  onwarn,
  treeshake: !!PRODUCTION,
  input: 'src/app.js',
  output: [{
    dir: 'build/module',
    format: 'es',
    sourcemap: true,
  }, {
    dir: 'build/system',
    format: 'system',
    sourcemap: true,
  }],

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

    graphql(),

    litcss({ uglify: PRODUCTION }),

    copy({
      targets: [
        { src: 'src/index.html', dest: 'build' },
        { src: 'src/manifest.webmanifest', dest: 'build' },
        { src: 'src/style.css', dest: 'build' },
      ],
    }),

    generateSW(require('./workbox-config')),

    modulepreload({ index: 'build/index.html', prefix: 'module' }),

    ...(PRODUCTION ? [

      copy({
        flatten: false,
        targets: [
          { src: 'node_modules/@webcomponents/**/*.js', dest: 'build/assets' },
          { src: 'node_modules/systemjs/dist/**/*.js', dest: 'build/assets' },
        ],
      }),

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

      visualizer({ sourcemap: true }),

      notify(),

    ]),

  ],
};
