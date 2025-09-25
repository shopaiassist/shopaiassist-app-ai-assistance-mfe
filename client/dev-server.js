const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

function createDevServer(webpackConfig) {
  // Create Express app
  const app = express();
  
  // MANUAL CORS IMPLEMENTATION - No external library interference
  app.use((req, res, next) => {
    console.log('=== CORS MIDDLEWARE STARTED ===');
    console.log(`Request: ${req.method} ${req.url}`);
    console.log(`Origin: ${req.headers.origin}`);
    console.log(`User-Agent: ${req.headers['user-agent']}`);
    
    // Set CORS headers FIRST - before any other processing
    res.header('Access-Control-Allow-Origin', 'http://localhost:8060');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS requests with MAXIMUM permissiveness
    if (req.method === 'OPTIONS') {
      console.log('=== PREFLIGHT REQUEST DETECTED ===');
      console.log('All request headers:', JSON.stringify(req.headers, null, 2));
      
      const requestedHeaders = req.headers['access-control-request-headers'];
      console.log('Requested headers:', requestedHeaders);
      
      if (requestedHeaders) {
        // Allow EXACTLY what was requested
        res.header('Access-Control-Allow-Headers', requestedHeaders);
        console.log('✅ ALLOWING REQUESTED HEADERS:', requestedHeaders);
      } else {
        // Allow everything
        res.header('Access-Control-Allow-Headers', '*');
        console.log('✅ ALLOWING ALL HEADERS (wildcard)');
      }
      
      console.log('=== SENDING PREFLIGHT RESPONSE ===');
      console.log('Response headers:', {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
        'Access-Control-Max-Age': res.getHeader('Access-Control-Max-Age')
      });
      
      res.status(204).end();
      return;
    }
    
    // For non-preflight requests, also allow all headers
    res.header('Access-Control-Allow-Headers', '*');
    console.log('=== CORS MIDDLEWARE COMPLETED ===');
    next();
  });

  // Configure API proxies FIRST (before body parsing to avoid interference)
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error('Proxy error for /api:', err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request to /api:', req.method, req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Received response from /api:', proxyRes.statusCode);
    },
  }));

  app.use('/assistant-api', createProxyMiddleware({
    target: 'https://assisvc/',
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 30000,
    proxyTimeout: 30000,
    secure: false,
    pathRewrite: {
      '^/assistant-api': '',
    },
    onError: (err, req, res) => {
      console.error('Proxy error for /assistant-api:', err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request to /assistant-api:', req.method, req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Received response from /assistant-api:', proxyRes.statusCode);
    },
  }));

  // Add body parsing middleware AFTER proxies (for non-proxied routes)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Create webpack compiler
  const compiler = webpack(webpackConfig[0]); // Use the first config (client config)

  // Configure webpack dev middleware
  const devMiddleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig[0].output.publicPath || '/',
    writeToDisk: false,
  });

  // Configure webpack hot middleware
  const hotMiddleware = webpackHotMiddleware(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  });

  // Use webpack middlewares AFTER API proxies
  app.use(devMiddleware);
  app.use(hotMiddleware);

  // History API fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or webpack HMR
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/assistant-api') || 
        req.path.startsWith('/__webpack_hmr') ||
        req.path.includes('.')) {
      return next();
    }
    
    // Use the webpack dev middleware to serve the HTML
    const filename = path.join(compiler.outputPath, 'index.html');
    compiler.outputFileSystem.readFile(filename, (err, result) => {
      if (err) {
        return next(err);
      }
      res.set('content-type', 'text/html');
      res.send(result);
      res.end();
    });
  });

  return app;
}

function startDevServer(webpackConfig, port = 8070) {
  const app = createDevServer(webpackConfig);
  
  app.listen(port, () => {
    console.log(`Development server running on http://localhost:${port}`);
    console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`Custom dev server: USE_CUSTOM_DEV_SERVER=${process.env.USE_CUSTOM_DEV_SERVER}`);
    console.log(`Hot Module Replacement: ENABLE_HMR=${process.env.ENABLE_HMR}`);
    
    // Open browser if BROWSER env var is set
    if (process.env.BROWSER) {
      const open = require('open');
      open(`http://localhost:${port}`, { app: { name: process.env.BROWSER } });
    }
  });
}

module.exports = {
  createDevServer,
  startDevServer
};
