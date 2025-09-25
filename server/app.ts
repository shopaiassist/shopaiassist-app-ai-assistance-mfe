import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import nocache from 'nocache';
import { mw as requestIpMiddleware } from 'request-ip';
import { HadesCore, LOG } from '@osia/hades_core';

import { name as PACKAGE_NAME, version as PACKAGE_VERSION } from '../package.json';
import { AIAssistantRoutes } from './src/api/ai-assistance/routes';
import { ClientRoutes } from './src/api/client/routes';
import clientData from '../client/client-data';

/**
 * Don't let the client cache anything unless it starts with:
 * - `/static`
 * - `/manifest.json`
 * - `/favicon.ico`
 */
const NO_CACHE_URL_PATTERN = /^(?!\/static|\/manifest\.json|\/favicon\.ico).*$/;

export default class App {
  public app: express.Express;

  private static API_BASE_PATHS = {
    AI_ASSISTANT: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/ai-assistance` : '/api/ai-assistance',
    HEALTH: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/health` : '/api/health',
  };

  private static UI_BASE_PATHS = {
    BACKEND: '/assistant',
    NGINX_ROUTE: `/${process.env.PLATFORM_ENV}/oia/ui`,
  };

  constructor() {
    // TODO: initialize things like DB's, etc.

    this.app = express();
    this.configMiddlewares();

    this.configureClientRoutes();
  }

  /**
   * Function to configure middleware for both express apps
   */
  private configMiddlewares(): void {
    if (process.env.NODE_ENV === 'production') {
      // TODO: do we need session handling?
      if (!process.env.SESSION_SECRET) {
        LOG.warn('SESSION_SECRET is NOT set, please set a secret');
      }
    }

    if (!process.env.CORS_ORIGINS) {
      LOG.warn('CORS_ORIGINS is NOT set, CORS is disabled');
    }

    if (!process.env.CSP_SRC) {
      LOG.error('CSP_SRC is NOT set, please set a CSP script source environment variable');
      throw new Error('CSP_SRC not set');
    }

    this.app.enable('trust proxy');
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );

    const cspSrc = process.env.CSP_SRC.split(',');

    // Adds "clientIp" to request data
    this.app.use(requestIpMiddleware());
    this.app.use(HadesCore.HttpContextUtilities.HttpContext.MIDDLEWARE.init);
    this.app.use(HadesCore.HttpContextUtilities.HttpContext.MIDDLEWARE.setRequestId);

    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            'default-src': cspSrc,
            'script-src': cspSrc,
            'script-src-elem': cspSrc,
          },
        },
        crossOriginResourcePolicy: {
          policy: 'cross-origin',
        },
      })
    );

    this.app.use(express.json({ limit: '120mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '120mb', parameterLimit: 100000 }));
    this.app.use(cookieParser());
    this.app.use(compression());
    // Match anything but /static/* resources.
    this.app.use(NO_CACHE_URL_PATTERN, nocache());
  }

  /**
   * Function to configure routes for main app
   */
  private configureClientRoutes(): void {
    if (process.env.NODE_ENV === 'development') {
      this.app.use(App.API_BASE_PATHS.AI_ASSISTANT, AIAssistantRoutes.routes()); // For local development
      this.app.use(
        App.API_BASE_PATHS.HEALTH,
        new HadesCore.Express.HealthRoutes(
          PACKAGE_NAME,
          PACKAGE_VERSION,
          'Chats'
          //this.getClientHealthData()
        ).createRoutes()
      );

      this.app.use(ClientRoutes.routes());
    } else {
      this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.AI_ASSISTANT}`, AIAssistantRoutes.routes()); // For AWS backend URL
      this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.AI_ASSISTANT}`, AIAssistantRoutes.routes()); // For shopaiassisttax.com NGINX route
      this.app.use(
        App.API_BASE_PATHS.HEALTH,
        new HadesCore.Express.HealthRoutes(
          PACKAGE_NAME,
          PACKAGE_VERSION,
          'Chats'
          //this.getClientHealthData()
        ).createRoutes()
      );
      // this must be defined last since it has a 'catch all' route
      this.app.use(App.UI_BASE_PATHS.BACKEND, ClientRoutes.routes());
      this.app.use(App.UI_BASE_PATHS.NGINX_ROUTE, ClientRoutes.routes());
    }
  }

  /**
   * Utility for getting the express application.
   * @return The Express app.
   */
  public getApplication() {
    return this.app;
  }

  /**
   * * @return Object containing client name, version
   */
  private getClientHealthData() {
    return {
      name: clientData?.mfeName || '',
      remoteEntryVersion: clientData?.mfeVersion || '',
    };
  }
}
