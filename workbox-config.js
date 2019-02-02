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
    urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

    // Apply a cache-first strategy.
    handler: 'cacheFirst',

    options: {
      // Use a custom cache name.
      cacheName: 'images',

      // Only cache 10 images.
      expiration: {
        maxEntries: 10,
      },
    },
  }],
};
