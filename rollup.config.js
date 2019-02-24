import commonjs from 'rollup-plugin-commonjs';
import graphql from 'rollup-plugin-graphql';
import litcss from 'rollup-plugin-lit-css';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import modulepreload from 'rollup-plugin-modulepreload';
import notify from 'rollup-plugin-notify';
import resolve from 'rollup-plugin-node-resolve';
import workbox from 'rollup-plugin-workbox';
import visualizer from 'rollup-plugin-visualizer';
import { terser } from 'rollup-plugin-terser';

function onwarn(warning, warn) {
  if (warning.code === 'THIS_IS_UNDEFINED') return;
  else warn(warning);
}

const isProduction = arg => arg.includes('production');
const  {
  PRODUCTION =
  process.env.NODE_ENV === 'production' ||
  process.argv.some(isProduction)
} = process.env;

console.log('Production?', PRODUCTION);

export default {
  onwarn,
  treeshake: !!PRODUCTION,
  input: 'src/app.js',
  output: [{
    dir: 'public/module',
    format: 'es',
    sourcemap: true,
  }, {
    dir: 'public/system',
    format: 'system',
    sourcemap: true,
  }],

  plugins: [

    graphql(),

    litcss({ uglify: PRODUCTION }),

    // REQUIRED to roll apollo-client up
    resolve({
      browser: true,
      jsnext: true,
      module: true,
    }),

    commonjs({
      namedExports: {
        // Necessary to roll apollo-link-state up.
        // until graphql-anywhere 5.0
        'graphql-anywhere/lib/async': ['graphql'],
        // Needed to roll up apollo-cache-persist
        'apollo-cache-persist': ['persistCache']
      }
    }),

    ...(PRODUCTION ? [
      minifyHTML({
        failOnError: true,
        options: {
          shouldMinify(template) {
            if (template.tag) {
              return template.tag.toLowerCase().includes('html');
            } else {
              return template.parts.some(part => (
                part.text.includes('<style') ||
                part.text.includes('<dom-module')));
            }
          }
        }
      }),

      terser({ mangle: false }),
    ] : []),

    workbox({ workboxConfig: require('./workbox-config') }),

    modulepreload({ index: 'public/index.html', prefix: 'module' }),

    visualizer({ sourcemap: true }),

    notify({ success: true }),

  ]
};
