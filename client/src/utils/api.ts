import { isEmpty, isFunction } from 'lodash';

type PathParam<Path, NextPart> = Path extends `{${infer Param}}` ? Record<Param, string> & NextPart : NextPart;
type PathParams<Path> = Path extends `${infer Segment}/${infer Rest}`
  ? PathParam<Segment, PathParams<Rest>>
  : PathParam<Path, object>;

type ApiCall = ApiRequest & ApiRequestOptions;

interface ApiRequest {
  body?: BodyInit | null;
  method?: ApiRequestMethod;
  url: string;
}

type ApiRequestMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

/** Request options for the sendApiRequest function */
interface ApiRequestOptions {
  headers?: HeadersInit;
}

interface CreateProxyRequest {
  body: BodyInit | null;
  url: string;
}

export const AI_ASSISTANT_PROXY = 'api/ai-assistance/proxy';

/**
 * Send an API request using fetch. This is a wrapper around fetch that handles errors and setting the base URL.
 * In production, the base URL would be set to the domain of this app. Since this is a microfrontend architecture,
 * if we used relative paths, the request would be sent to the domain of the container microfrontend that is making the request.
 * @param path
 * @param method
 * @param headers
 * @param body
 */
export const apiCall = async ({ body = null, headers, method = 'GET', url }: ApiCall): Promise<Response> => {
  const baseUrl = process.env.APP_DOMAIN;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const token = sessionStorage.getItem('token');

    if (token) {
      headers = {
        ...headers,
        authorization: token
      };
    }
    
    return await fetch(`${baseUrl}${url}`, { body, headers, method, credentials: 'include', signal: controller.signal });
  } catch (error) {
    // Handle or throw the error as needed
    console.error('Error making API request:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId)
  }
};

export const apiFunction =
  <Path extends string>(endpoint: Path, method: ApiRequestMethod = 'GET') =>
  <R = void, P = object, PP = PathParams<Path>>(
    optionsOrOptionsFunction: (() => ApiRequestOptions) | ApiRequestOptions = {}
  ) =>
  async (opts?: P extends object ? PP & P : PP extends object ? PP : undefined): Promise<R> => {
    const options = isFunction(optionsOrOptionsFunction) ? optionsOrOptionsFunction() : optionsOrOptionsFunction;
    try {
      const { body, url } = createProxyRequest(endpoint, method, opts);
      const res = await apiCall({ body, method, url, ...options });
      return res.ok ? (res.json() as R) : Promise.reject(res.json());
    } catch (err) {
      const { stack } = new Error();
      console.warn(stack?.split('\n'));
      return Promise.reject(err);
    }
  };

export const createProxyRequest = (path: string, method: ApiRequestMethod, allParams?: object): CreateProxyRequest => {
  const params: Record<string, unknown> = {};
  let url: string = `${AI_ASSISTANT_PROXY}${path}`;
  if (isEmpty(allParams)) return { body: null, url };
  const exclude = path.match(/{(.+?)}/g)?.map((p) => p.replace(/[{}]/g, ''));
  Object.entries(allParams).forEach(([key, value]) => {
    if (exclude?.includes(key)) {
      url = url.replace(`{${key}}`, `${value}`);
    } else {
      params[key] = value;
    }
  });
  return { body: method === 'GET' || isEmpty(params) ? null : JSON.stringify(params), url };
};
