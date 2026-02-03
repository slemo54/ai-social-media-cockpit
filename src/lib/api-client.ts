'use client';

/**
 * API Client robusto con timeout, retry, rate limiting e gestione errori
 */

interface ApiClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  priority: number;
  retryCount: number;
}

class ApiClient {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 secondo tra le richieste
  private activeRequests = new Map<string, AbortController>();

  private defaultOptions: ApiClientOptions = {
    timeout: 60000, // 60 secondi default
    retries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  /**
   * Esegue una fetch con timeout automatico
   */
  async fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const { timeout = this.defaultOptions.timeout, ...fetchOptions } = options;
    const requestId = Math.random().toString(36).substring(7);

    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    // Merge segnali se già presente
    if (fetchOptions.signal) {
      const originalSignal = fetchOptions.signal;
      originalSignal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
    }, timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Attende il tempo necessario per rispettare il rate limiting
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.minRequestInterval - timeSinceLastRequest);
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Processa la coda delle richieste
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Ordina per priorità
      this.queue.sort((a, b) => b.priority - a.priority);
      const request = this.queue.shift();
      
      if (!request) continue;

      await this.respectRateLimit();

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }

  /**
   * Aggiunge una richiesta alla coda
   */
  enqueue<T>(
    execute: () => Promise<T>,
    options: { priority?: number; id?: string } = {}
  ): Promise<T> {
    const { priority = 0, id = Math.random().toString(36).substring(7) } = options;

    return new Promise((resolve, reject) => {
      // Cancella richiesta precedente con lo stesso ID
      const existingIndex = this.queue.findIndex(r => r.id === id);
      if (existingIndex >= 0) {
        const existing = this.queue[existingIndex];
        existing.reject(new Error('Request superseded by newer request'));
        this.queue.splice(existingIndex, 1);
      }

      this.queue.push({
        id,
        execute,
        resolve,
        reject,
        priority,
        retryCount: 0,
      });

      this.processQueue();
    });
  }

  /**
   * Esegue una richiesta con retry automatico
   */
  async requestWithRetry<T>(
    operation: () => Promise<T>,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= (opts.retries || 0); attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Non fare retry per errori 4xx (client error)
        if (lastError.message.includes('401') || 
            lastError.message.includes('403') || 
            lastError.message.includes('404')) {
          throw lastError;
        }

        if (attempt < (opts.retries || 0)) {
          const delay = (opts.retryDelay || 1000) * Math.pow(opts.backoffMultiplier || 2, attempt);
          console.log(`[ApiClient] Retry ${attempt + 1}/${opts.retries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Cancella tutte le richieste attive
   */
  cancelAll(): void {
    this.activeRequests.forEach(controller => {
      try {
        controller.abort();
      } catch {
        // Ignora errori
      }
    });
    this.activeRequests.clear();
    this.queue = [];
  }

  /**
   * Verifica se una risposta è OK, altrimenti lancia errore
   */
  async checkResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response;
  }
}

// Singleton instance
export const apiClient = new ApiClient();

/**
 * Utility per convertire file in base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Rimuovi il prefisso data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility per comprimere immagine prima dell'upload
 */
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calcola nuove dimensioni mantenendo aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    
    img.src = url;
  });
}
