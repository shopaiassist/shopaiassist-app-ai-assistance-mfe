import 'dotenv/config';
import express from 'express';

import App from './app';
import { LOG } from '@osia/hades_core';

const port = process.env.PORT || 5002;
const app = new App();

const expressApp: express.Application = app.getApplication();

const server = expressApp.listen(port, () => {
  LOG.log(`Server listening on ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  LOG.error('There was an uncaught error', err);
  process.exit(1); // Exit code 1 indicates a general error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  LOG.error('Unhandled rejection', err);
  server.close(() => {
    process.exit(1); // Exit code 1 indicates a general error
  });
});
