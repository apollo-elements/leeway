module.exports = {
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
};
