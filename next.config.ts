import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer, webpack }) => {
    // Ignore test files, README files, and problematic extensions
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /README\.md$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.d\.(mts|cts)$/,
      })
    );
    
    // Handle .mts and .cts files
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    };
    
    // Fallback for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
