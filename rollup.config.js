// rollup 0.62.0
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/app.js',
  output: {
    file: 'public/bundle.js',
    format: 'es',
    sourcemap: true,
  },

  plugins: [

    // REQUIRED to roll apollo-client up
    resolve({
      browser: true,
      jsnext: true,
      module: true,
    }),

    commonjs({
      namedExports: {
        // Necessary to roll apollo-link-state up.
        'graphql-anywhere/lib/async': ['graphql']
      }
    })

  ]
};
