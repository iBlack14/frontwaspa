/**
 * API Client con manejo de errores consistente
 * Wrapper alrededor de fetch para estandarizar requests y manejo de errores
 */

import { toast } from 'sonner';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface FetchOptions extends RequestInit {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

/**
 * Wrapper de fetch con manejo de errores automático
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    ...fetchOptions
  } = options;

  try {
    console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    // Intentar parsear JSON
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Manejar errores HTTP
    if (!response.ok) {
      const errorMessage = 
        data?.error || 
        data?.message || 
        `Error ${response.status}: ${response.statusText}`;

      console.error(`[API Error] ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data,
      });

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      throw new APIError(errorMessage, response.status, data);
    }

    // Mostrar toast de éxito si se solicita
    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }

    console.log(`[API Success] ${url}`);
    return data as T;

  } catch (error) {
    // Manejar errores de red
    if (error instanceof APIError) {
      throw error;
    }

    const networkError = error as Error;
    console.error(`[Network Error] ${url}:`, networkError);

    if (showErrorToast) {
      toast.error('Error de conexión. Verifica tu internet.');
    }

    throw new APIError(
      'Error de conexión. Verifica tu internet.',
      0,
      networkError
    );
  }
}

/**
 * Métodos helper para diferentes tipos de requests
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(url: string, body?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

/**
 * Hook para manejar estados de loading y error
 */
export function useApiState() {
  return {
    handleAsync: async <T>(
      promise: Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: APIError) => void;
        successMessage?: string;
      }
    ): Promise<T | null> => {
      try {
        const data = await promise;
        
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
        
        return data;
      } catch (error) {
        if (error instanceof APIError) {
          if (options?.onError) {
            options.onError(error);
          }
        }
        return null;
      }
    },
  };
}

/**
 * Retry automático para requests fallidos
 */
export async function apiWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`[Retry] Intento ${attempt}/${maxRetries} falló, reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
}
