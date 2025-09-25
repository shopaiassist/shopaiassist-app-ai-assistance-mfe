import express from 'express';

/**
 * An interface for the Express request used by our Route implementations.
 */
export interface AppRequest extends express.Request {
  /** The request's IP address (via "request-ip" middleware) */
  clientIp?: string;
  /** Unique ID for a request (via "setRequestId" middleware) */
  requestId?: string;
  /** The user info attached to this request by the security middleware. */
  user?: Record<string, string>; // TODO: add user info to request
}
