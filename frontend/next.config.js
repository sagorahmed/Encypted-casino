/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TS errors won't block builds
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Some dependencies (e.g. wallet SDKs) may reference React Native-only modules
    // as optional peers. Alias them to a browser-safe shim so `next build` doesn't fail.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/lib/shims/async-storage.js'
      ),
    };

    return config;
  },
};

module.exports = nextConfig;
