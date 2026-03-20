/* global AbortController, RequestInit, Response, clearTimeout, fetch, setTimeout */
import { ApplicationError } from "../middlewares/errorHandler";
import { logger } from "./logger";

interface TimedFetchOptions {
  url: string;
  method: string;
  serviceName: string;
  timeoutMs: number;
  errorCode: string;
  networkErrorMessage: string;
  timeoutErrorMessage: string;
  init?: RequestInit;
}

async function timedFetch(options: TimedFetchOptions): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    return await fetch(options.url, {
      ...options.init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("External request timed out", {
        serviceName: options.serviceName,
        method: options.method,
        url: options.url,
        timeoutMs: options.timeoutMs,
      });

      throw new ApplicationError(
        502,
        options.errorCode,
        options.timeoutErrorMessage,
      );
    }

    logger.error("External request failed", {
      serviceName: options.serviceName,
      method: options.method,
      url: options.url,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new ApplicationError(
      502,
      options.errorCode,
      options.networkErrorMessage,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export { timedFetch };
