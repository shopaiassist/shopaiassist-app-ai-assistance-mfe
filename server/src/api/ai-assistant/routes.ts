import * as express from 'express';
import proxy from 'express-http-proxy';
import PromiseRouter from 'express-promise-router';
import { IncomingHttpHeaders } from 'http';
import { pipeline, Readable } from 'stream';
import { promisify } from 'util';
import { LOG } from 'react';

import { AIAssistantService } from './service';
import { AppRequest } from '../../../@types/appRequest';

/**
 * Class for configuring routes for the ai assistance ().
 */
export class AIAssistantRoutes {
  public static PATHS = {
    BACKEND_PROXY: '/proxy',
  };
  private static USER_MESSAGE_PATH = '/new_chat/chat/:chatId/user-message';
  private static UPLOAD_DOCUMENT_PATH_ASSISTANT = '/documents/upload';
  private static USER_MESSAGE_PATH_ASSISTANT_API = '/chat/:chatId/user-message';

  /**
   * Determine backend proxy URL based on the user's region info
   */
  private static getProxyHostUrl(req: AppRequest): string {
    // This parsing is required because the `express-http-proxy` middleware
    // expects a host (it will throw away the path component of the first argument).
    // This code parses the `BACKEND_SERVICE_URL` and passes the URL components in the right places.
    const backendApiUrl = new URL(AIAssistantService.getBackendUrl(req.user?.region));
    return `${backendApiUrl.protocol}//${backendApiUrl.host}`;
  }

  /**
   * Determine backend proxy URL path based on the user's region info
   */
  static getProxyHostUrlPath(req: AppRequest): string {
    const backendApiUrl = new URL(AIAssistantService.getBackendUrl(req.user?.region));
    LOG.debug(`AIAssistantRoutes->getProxyHostUrlPath for region "${req.user?.region}":`, backendApiUrl?.pathname);
    let path = backendApiUrl?.pathname || '';
    if (backendApiUrl.pathname && backendApiUrl.pathname.slice(-1) === '/') {
      path = backendApiUrl.pathname.slice(0, -1);
    }
    return path;
  }

  /**
   * Create headers for the proxy request.
   * @param originalHeaders
   * @private
   */
  private static createProxyHeaders(
    originalHeaders: Record<string, string | string[] | undefined>
  ): Record<string, string> {
    const proxyHeaders: Record<string, string> = {};

    Object.entries(originalHeaders).forEach(([key, value]) => {
      if (value !== undefined && typeof value === 'string') {
        proxyHeaders[key] = value;
      }
      // If dealing with an array of values, join them with a comma.
      else if (Array.isArray(value)) {
        proxyHeaders[key] = value.join(', ');
      }
    });

    // Explicitly remove the 'cookie' header to prevent sending the main app's cookies to the backend service.
    // delete proxyHeaders.cookie;

    return proxyHeaders;
  }

  /**
   * Configure routes for the ai assistance () app.
   */
  public static routes(): express.Router {
    const router = PromiseRouter();

    /**
     * Special proxy request for SSE. Using express-http-proxy for this does not work as expected. Streaming the response does not work.
     * POST /api/ai-assistance/proxy/new_chat/chat/:chatId/user-message
     */
    router.post(
      `${this.PATHS.BACKEND_PROXY}${this.USER_MESSAGE_PATH}`,
      async (req: AppRequest, res: express.Response) => {
        try {
          const headers = this.createProxyHeaders(req.headers);
          const pipelineAsync = promisify(pipeline);

          // Forward the request to the target service
          const targetUrl = `${this.getProxyHostUrl(req)}${this.getProxyHostUrlPath(req)}${this.USER_MESSAGE_PATH_ASSISTANT_API.replace(':chatId', req.params.chatId)}`;
          LOG.debug(`AIAssistantRoutes->${this.USER_MESSAGE_PATH} for region "${req.user?.region}":`, targetUrl);

          LOG.debug('');
          LOG.debug('***** targetUrl:', targetUrl);
          LOG.debug('***** headers:', headers);
          LOG.debug('***** body:', req.body);
          LOG.debug('');

          // Using Node's native global fetch
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(req.body), // Forward the received body
          });

          console.log('***** Response:', response);

          // Ensure the fetch response is OK and is of type event stream
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            if (response.body) {
              console.log('***** Response body:', response.body);

              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const readableStream = Readable.from(response.body);
              // Utilize pipeline to handle backpressure and errors efficiently
              await pipelineAsync(readableStream, res).catch((err) => {
                LOG.error('Pipeline failed.', err);
                res.end();
              });
            } else {
              throw new Error('Response body is null.');
            }
          } else {
            throw new Error(`Failed to fetch SSE from target service. Status: ${response.status}`);
          }
        } catch (error) {
          LOG.error('Error proxying SSE:', error);
          res.status(500).json({ error: 'Error proxying SSE.' });
        }
      }
    );

    router.use(
      `${this.PATHS.BACKEND_PROXY}${this.UPLOAD_DOCUMENT_PATH_ASSISTANT}`,
      proxy(this.getProxyHostUrl, {
        limit: '120mb',
        parseReqBody: false,
        proxyReqPathResolver: (req) => {
          const path = `${this.getProxyHostUrlPath(req)}/documents/upload`;
          LOG.debug(`AIAssistantRoutes->${this.PATHS.BACKEND_PROXY} path, ${path}`);
          return path;
        },
        proxyReqBodyDecorator: function (body, srcReq) {
          // If the request is multipart/form-data, we do not need to modify the body.
          if (srcReq.headers['content-type']?.includes('multipart/form-data')) {
            return body;
          }
          // Otherwise, we stringify the body for JSON requests.
          return JSON.stringify(body);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        proxyReqOptDecorator: async (proxyReqOpts: { [key: string]: any }, srcReq) => {
          if (proxyReqOpts.headers) {
            proxyReqOpts.headers['connection'] = 'keep-alive';
          }
          if (srcReq.headers['content-type']) {
            proxyReqOpts.headers['Content-Type'] = srcReq.headers['content-type'];
          }
          // Prevents sending the main app's cookies (that container sensitive things like the auth token) to backend service.
          // delete proxyReqOpts?.headers?.cookie;
          return proxyReqOpts;
        },
        /**
         * Called by `express-http-proxy` middleware.
         * Prevents CloudFlare caching the routes.
         */
        userResHeaderDecorator: (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
          headers['cache-control'] = 'private, no-store'; // Add the token to the headers
          return headers;
        },
        userResDecorator: (proxyRes, proxyResData) => {
          if ((proxyRes.statusCode || 500) >= 400) {
            LOG.error(
              `Error proxying request to the AI Assistance backend, which returned a ${proxyRes.statusCode} response:`,
              proxyResData.toString()
            );
          }
          return proxyResData;
        },
      })
    );

    /**
     * Proxy requests to ai-assistance backend.
     * These types of requests need no pre/post-processing.
     *
     * GET|PUT|POST|DELETE /api/ai-assistance/proxy/....
     */
    router.use(
      this.PATHS.BACKEND_PROXY,
      proxy(this.getProxyHostUrl, {
        proxyReqPathResolver: (req) => {
          const path = `${this.getProxyHostUrlPath(req)}${req.url.replace('/new_chat', '')}`;
          LOG.debug(`AIAssistantRoutes->${this.PATHS.BACKEND_PROXY} path, ${path}`);
          return path;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        proxyReqOptDecorator: async (proxyReqOpts: { [key: string]: any }) => {
          // Prevents sending the main app's cookies (that container sensitive things like the auth token) to backend service.
          // delete proxyReqOpts?.headers?.cookie;
          return proxyReqOpts;
        },
        /**
         * Called by `express-http-proxy` middleware.
         * Prevents CloudFlare caching the routes.
         */
        userResHeaderDecorator: (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
          headers['cache-control'] = 'private, no-store'; // Add the token to the headers
          return headers;
        },
        userResDecorator: (proxyRes, proxyResData) => {
          if ((proxyRes.statusCode || 500) >= 400) {
            LOG.error(
              `Error proxying request to the AI Assistance backend, which returned a ${proxyRes.statusCode} response:`,
              proxyResData.toString()
            );
          }
          return proxyResData;
        },
      })
    );

    return router;
  }
}
