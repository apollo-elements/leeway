// rollup 0.62.0
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import string from 'rollup-plugin-string';
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

    string({ include: '**/*.graphql' }),

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
        'apollo-cache-persist': ['persistCache']
      }
    }),

    process.env.NODE_ENV === 'production' && terser({
      mangle: false,
    }),

  ]
};
