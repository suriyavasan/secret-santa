/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is the modern way to handle Node.js-only packages like pino and thread-stream
    serverExternalPackages: ['pino', 'thread-stream'],

    // Disable Turbopack for production builds if it's causing issues with dependencies
    // Note: In Next.js 15+, Turbopack is the default for dev, but for build it's still often Webpack 
    // unless explicitly enabled. However, the logs show Turbopack being used.
    // We'll use the standard config and let Next.js handle it.
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(tap|tape|why-is-node-running|fastbench|pino-elasticsearch)$/,
            })
        );
        return config;
    },
};

export default nextConfig;
