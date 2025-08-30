export class NetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitedError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitedError';
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface WooConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  timeoutMs?: number;
  retries?: number;
}

export interface ConnectionTestResult {
  reachable: boolean;
  auth: boolean;
  details: {
    wpOk: boolean;
    wcOk: boolean;
    productsOk: boolean | null;
    httpStatus: number | null;
    elapsedMs: number;
    error: string | null;
  };
}

export class WooCommerceClient {
  private config: Required<WooConfig>;

  constructor(config: WooConfig) {
    this.config = {
      timeoutMs: 10000,
      retries: 3,
      ...config,
    };
  }

  private getAuthHeader(): string {
    const credentials = `${this.config.consumerKey}:${this.config.consumerSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private getMaskedUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '[invalid-url]';
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on network errors, 5xx, or 429
      if (
        attempt < this.config.retries &&
        (response.status >= 500 || response.status === 429)
      ) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 1000;
        await this.sleep(delay + jitter);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.config.timeoutMs}ms`);
      }

      if (attempt < this.config.retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 1000;
        await this.sleep(delay + jitter);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw new NetworkError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private handleResponse(response: Response): void {
    if (response.status === 401 || response.status === 403) {
      throw new AuthError('Authentication failed', response.status);
    }

    if (response.status === 404) {
      throw new NotFoundError('Resource not found');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new RateLimitedError(
        'Rate limit exceeded',
        retryAfter ? parseInt(retryAfter, 10) : undefined
      );
    }

    if (response.status >= 400) {
      throw new ApiError(`API error: ${response.status}`, response.status);
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const result: ConnectionTestResult = {
      reachable: false,
      auth: false,
      details: {
        wpOk: false,
        wcOk: false,
        productsOk: null,
        httpStatus: null,
        elapsedMs: 0,
        error: null,
      },
    };

    try {
      console.log(`Testing connection to ${this.getMaskedUrl(this.config.baseUrl)}`);

      // Step 1: Test WordPress reachability
      const wpUrl = `${this.config.baseUrl}/wp-json/`;
      const wpResponse = await this.fetchWithRetry(wpUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'WooCommerce-Manager/1.0',
        },
      });

      result.details.httpStatus = wpResponse.status;
      result.reachable = wpResponse.ok;
      result.details.wpOk = wpResponse.ok;

      if (!wpResponse.ok) {
        this.handleResponse(wpResponse);
        return result;
      }

      // Step 2: Test WooCommerce API with auth
      const wcUrl = `${this.config.baseUrl}/wp-json/wc/v3`;
      const wcResponse = await this.fetchWithRetry(wcUrl, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          'User-Agent': 'WooCommerce-Manager/1.0',
        },
      });

      result.details.wcOk = wcResponse.ok;
      result.auth = wcResponse.ok;

      if (!wcResponse.ok) {
        this.handleResponse(wcResponse);
        return result;
      }

      // Step 3: Test products endpoint (optional)
      try {
        const productsUrl = `${this.config.baseUrl}/wp-json/wc/v3/products?per_page=1&_fields=id`;
        const productsResponse = await this.fetchWithRetry(productsUrl, {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            'User-Agent': 'WooCommerce-Manager/1.0',
          },
        });

        result.details.productsOk = productsResponse.ok;
      } catch (error) {
        console.warn(
          `Products test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        result.details.productsOk = false;
      }

      return result;
    } catch (error) {
      result.details.error = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof AuthError) {
        result.reachable = true;
        result.auth = false;
      } else if (error instanceof NetworkError) {
        result.reachable = false;
      }

      return result;
    } finally {
      result.details.elapsedMs = Date.now() - startTime;
    }
  }

  async get(endpoint: string): Promise<unknown> {
    const url = `${this.config.baseUrl}/wp-json/wc/v3${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        'User-Agent': 'WooCommerce-Manager/1.0',
        'Content-Type': 'application/json',
      },
    });

    this.handleResponse(response);
    return response.json();
  }

  async post(endpoint: string, data: unknown): Promise<unknown> {
    const url = `${this.config.baseUrl}/wp-json/wc/v3${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'User-Agent': 'WooCommerce-Manager/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    this.handleResponse(response);
    return response.json();
  }

  async put(endpoint: string, data: unknown): Promise<unknown> {
    const url = `${this.config.baseUrl}/wp-json/wc/v3${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      headers: {
        Authorization: this.getAuthHeader(),
        'User-Agent': 'WooCommerce-Manager/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    this.handleResponse(response);
    return response.json();
  }

  async delete(endpoint: string): Promise<unknown> {
    const url = `${this.config.baseUrl}/wp-json/wc/v3${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      method: 'DELETE',
      headers: {
        Authorization: this.getAuthHeader(),
        'User-Agent': 'WooCommerce-Manager/1.0',
      },
    });

    this.handleResponse(response);
    return response.json();
  }
}
