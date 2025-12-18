/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is the modern way to handle Node.js-only packages like pino and thread-stream
    serverExternalPackages: ['pino', 'thread-stream', 'pino-pretty'],

    // Disable Turbopack for production builds if it's causing issues with dependencies
    // Note: In Next.js 15+, Turbopack is the default for dev, but for build it's still often Webpack 
    // unless explicitly enabled. However, the logs show Turbopack being used.
    // We'll use the standard config and let Next.js handle it.
};

export default nextConfig;
