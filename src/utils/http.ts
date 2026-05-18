/* global AbortController, RequestInit, Response, URL, clearTimeout, fetch, process, setTimeout */
import jwt from "jsonwebtoken";
import { ApplicationError } from "../middlewares/errorHandler";
import { logger } from "./logger";

const VPC_AUDIENCE = "vpc-db-gateway";

function generateVpcToken(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return jwt.sign(
    { aud: VPC_AUDIENCE, iat: Math.floor(Date.now() / 1000) },
    secret,
    { expiresIn: 3600 },
  );
}

interface TimedFetchOptions {
  url: string;
  method: string;
  serviceName: string;
  errorCode: string;
  networkErrorMessage: string;
  timeoutErrorMessage: string;
  init?: RequestInit;
}

const externalRequestTimeoutMs = 10000;
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 min — tokens are valid 1h

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function isCloudRun(): boolean {
  return Boolean(process.env.K_SERVICE);
}

function extractAudience(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

async function fetchIdentityToken(audience: string): Promise<string> {
  const cached = tokenCache.get(audience);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`;

  const response = await fetch(metadataUrl, {
    headers: { "Metadata-Flavor": "Google" },
  });

  if (!response.ok) {
    throw new ApplicationError(
      502,
      "identity_token_error",
      `Failed to fetch identity token for audience ${audience}`,
    );
  }

  const token = await response.text();
  tokenCache.set(audience, { token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

async function timedFetch(options: TimedFetchOptions): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    externalRequestTimeoutMs,
  );

  try {
    let init: RequestInit = options.init ?? { method: options.method };

    if (isCloudRun()) {
      const audience = extractAudience(options.url);
      const idToken = await fetchIdentityToken(audience);
      const vpcToken = generateVpcToken();
      const existingHeaders =
        (init.headers as Record<string, string> | undefined) ?? {};
      const authHeaders: Record<string, string> = {
        Authorization: `Bearer ${idToken}`,
      };
      if (vpcToken) authHeaders["X-VPC-Token"] = vpcToken;
      init = {
        ...init,
        headers: { ...existingHeaders, ...authHeaders },
      };
    }

    return await fetch(options.url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      logger.error("External request timed out", {
        serviceName: options.serviceName,
        method: options.method,
        url: options.url,
        timeoutMs: externalRequestTimeoutMs,
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

export {
  timedFetch,
  fetchIdentityToken,
  extractAudience,
  generateVpcToken,
  tokenCache,
};
