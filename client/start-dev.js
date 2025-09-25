#!/usr/bin/env node

// Ensure NODE_ENV is set for development
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

console.log(`Starting development server with NODE_ENV=${process.env.NODE_ENV}`);

// Register ts-node to handle TypeScript files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments to determine if we should enable HMR
const args = process.argv.slice(2);
const enableHMR = args.includes('--hot') || args.includes('--live-reload');

// Set environment variable to indicate we're using custom dev server
process.env.USE_CUSTOM_DEV_SERVER = 'true';
process.env.ENABLE_HMR = enableHMR ? 'true' : 'false';

// Start webpack in watch mode and then start our Express server
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.ts').default;

// Get the webpack configuration
const configs = webpackConfig({}, { mode: 'development' });
const clientConfig = configs[0];

// Add HMR entry point if requested
if (enableHMR) {
  // Augment the existing entry point instead of replacing it
  if (typeof clientConfig.entry === 'string') {
    clientConfig.entry = [
      'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true',
      clientConfig.entry
    ];
  } else if (Array.isArray(clientConfig.entry)) {
    clientConfig.entry.unshift('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true');
  } else {
    // Handle object entry - this shouldn't happen with our config but just in case
    clientConfig.entry = {
      main: [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true',
        './src/index.ts'
      ]
    };
  }
  
  // Add HMR plugin
  clientConfig.plugins = clientConfig.plugins || [];
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}

// Start the Express server with webpack middleware
const { startDevServer } = require('./dev-server.js');

console.log('Starting development server...');
startDevServer(configs, 8070);
