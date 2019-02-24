module.exports = {
  skipWaiting: true,
  clientsClaim: true,
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{html,js,css}'
  ],
  globIgnores: [
    // For now ignoring split chunks, since rollup-plugin-workbox is not as robust as the webpack version
    '**/chunk*.js',
  ],
  swDest: 'public/sw.js',

  // Define runtime caching rules.
  runtimeCaching: [{
    // Match any request ends with .png, .jpg, .jpeg or .svg.
    urlPattern: /(.*)index\.html$/,

    // Apply a cache-first strategy.
    handler: 'networkFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'critical-path',

      // Only cache 10 images.
      expiration: {
        maxEntries: 1,
      },
    },
  }, {
    // Match any request ends with .png, .jpg, .jpeg or .svg.
    urlPattern: /(.*)app\.js/,

    // Apply a cache-first strategy.
    handler: 'networkFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'critical-path',

      // Only cache 10 images.
      expiration: {
        maxEntries: 1,
      },
    },
  }, {
    // Match any request ends with .png, .jpg, .jpeg or .svg.
    urlPattern: /(.*)chunk(.*)\.js/,

    // Apply a cache-first strategy.
    handler: 'cacheFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'scripts',

      // Only cache 10 images.
      expiration: {
        maxEntries: 100,
      },
    },
  }, {
    // Match any request ends with .png, .jpg, .jpeg or .svg.
    urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

    // Apply a cache-first strategy.
    handler: 'cacheFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'images',

      // Only cache 10 images.
      expiration: {
        maxEntries: 100,
      },
    },
  }],
};
