import { LOG } from 'react';

/** Fallback region if no region is set */
export const DEFAULT_REGION = process.env.DEFAULT_REGION || 'us';

/** AI Assistance service */
export class AIAssistantService {
  /**
   * Get  backend url from config based on the user's region info
   */
  public static getBackendUrl(region = DEFAULT_REGION): string {
    const BackendConfig = JSON.parse(process.env._BACKEND_SERVICE_URL_REGIONS || '{}');
    const backendUrl = BackendConfig[region];
    LOG.debug(`AIAssistantService->getBackendUrl for region "${region}":`, backendUrl);
    return backendUrl;
  }
}
