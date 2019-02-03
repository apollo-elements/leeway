// rollup 0.62.0
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import workbox from 'rollup-plugin-workbox';
import graphql from 'rollup-plugin-graphql';
import litcss from 'rollup-plugin-lit-css';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/app.js',
  output: [{
    dir: 'public/modules',
    format: 'es',
    sourcemap: true,
  }, {
    dir: 'public/system',
    format: 'system',
    sourcemap: true,
  }],

  plugins: [

    graphql(),
    litcss({ uglify: !process.env.PRODUCTION }),

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

    process.env.PRODUCTION && terser({
      mangle: false,
    }),

    workbox({ workboxConfig: require('./workbox-config') }),
  ]
};
