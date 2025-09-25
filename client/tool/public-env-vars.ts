/**
 * The set of environment variables available client-side.
 * These are not from the runtime environment, but hardcoded at build-time from the build environment (or `.env` file)
 * into the client code.
 *
 * THE VALUES OF THESE VARIABLES SHOULD NOT CONTAIN ANY SECRETS!
 */
export const PUBLIC_ENV_VARS = [
  'APP_DOMAIN',
  'AUTH_TOKEN',
  'PUBLIC_URL',
  'SUPPRESS_LOGGING',
  'WIJMO_LICENSE_KEY',
  'PLATFORM_ENV',
  'NODE_ENV',
  'ASSISTANT_API_SERVICE_URL',
  'ASSISTANT_API_SERVICE_URL_DEV_ONLY',
];
