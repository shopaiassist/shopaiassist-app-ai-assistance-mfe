import { config } from 'dotenv';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';
import { Configuration as WebpackConfiguration } from 'webpack';
import { PUBLIC_ENV_VARS } from './tool/public-env-vars';

config({ path: '../.env' });
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const deps = require('./package.json').dependencies;

// From https://github.com/DefinitelyTyped/DefinitelyTyped/issues/27570#issuecomment-474628163.
interface Configuration extends WebpackConfiguration {}
const configFactoryFn = (env: object, argv: { mode: 'production' | 'development' | undefined }): Configuration[] => {
  const definePublicVarsPlugin = new DefinePlugin(
    // Define the environment variables that will be available in the client code, as listed in `PUBLIC_ENV_VARS`.
    // Exclude NODE_ENV since webpack handles it automatically via the 'mode' property
    PUBLIC_ENV_VARS.filter(envVar => envVar !== 'NODE_ENV').reduce(
      (acc, curr) => {
        acc[`process.env.${curr}`] = JSON.stringify(process.env[curr] || '');
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const config: Configuration = {
    mode: argv.mode || 'development',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: argv.mode === 'production' ? 'auto' : 'http://localhost:8070/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.m?js/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.s(a|c)ss$/,
          use: [
            'style-loader',
            'css-loader',
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          include: /node_modules\/@\/core-components.*/,
          test: /\.m?js/,
          resolve: {
            fullySpecified: false, // fix:issue: https://github.com/webpack/webpack/issues/11467
          },
        },
      ],
    },
    optimization: {
      minimize: argv.mode === 'production',
      minimizer: [
        new TerserPlugin({
          extractComments: /@extract/i,
        }),
      ],
      // This was once set to 'single' when `argv.mode !== 'production'`, but that caused errors loading the
      // remoteEntry.js from the app shell that were very hard to debug. (The scope would be defined but its container
      // would be undefined, with no error message available in the console.)
      runtimeChunk: false,
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'ai_assistant_mfe',
        filename: 'remoteEntry.js',
        remotes: {},
        exposes: {
          './AiAssistant': './src/AiAssistant.tsx',
          './AiChatInput': './src/AiChatInput.tsx',
        },
        shared: {
          react: {
            singleton: true,
            strictVersion: false,
          },
          'react-dom': {
            singleton: true,
            strictVersion: false,
          },
          'react-router-dom': {
            singleton: true,
            strictVersion: false,
          },
          zustand: {
            singleton: true,
            strictVersion: false,
          },
        },
      }),
      new HtmlWebPackPlugin({
        template: './public/index.html',
        templateParameters: {
          PUBLIC_URL: '.',
        },
      }),
      definePublicVarsPlugin,
    ],
  };


  const nodeConfig: Configuration = {
    mode: argv.mode || 'development',
    entry: {
      'client-data': './client-data.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      library: {
        type: 'commonjs-static',
      },
    },
    target: 'node',
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    plugins: [definePublicVarsPlugin],
  };

  return [config, nodeConfig];
};

export default configFactoryFn;
