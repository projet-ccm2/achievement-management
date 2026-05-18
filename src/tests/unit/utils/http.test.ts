/* global RequestInit, Response, afterEach, beforeEach, describe, expect, global, it, jest */
import { ApplicationError } from "../../../middlewares/errorHandler";
import {
  extractAudience,
  fetchIdentityToken,
  timedFetch,
  tokenCache,
} from "../../../utils/http";
import { logger } from "../../../utils/logger";

jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("timedFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
    delete process.env.K_SERVICE;
    tokenCache.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.clearAllMocks();
    delete process.env.K_SERVICE;
  });

  it("should return the fetch response on success", async () => {
    const mockResponse = { ok: true } as Response;
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(
      timedFetch({
        url: "http://service.test/resource",
        method: "GET",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      }),
    ).resolves.toBe(mockResponse);
  });

  it("should map aborted requests to timeout application errors", async () => {
    const timeoutError = new Error("timeout");
    timeoutError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(timeoutError);

    await expect(
      timedFetch({
        url: "http://service.test/resource",
        method: "GET",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      }),
    ).rejects.toEqual(
      new ApplicationError(502, "service_error", "request timed out"),
    );

    expect(logger.error).toHaveBeenCalledWith("External request timed out", {
      serviceName: "service-test",
      method: "GET",
      url: "http://service.test/resource",
      timeoutMs: 10000,
    });
  });

  it("should map generic network failures to application errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("socket hang up"));

    await expect(
      timedFetch({
        url: "http://service.test/resource",
        method: "POST",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      }),
    ).rejects.toEqual(
      new ApplicationError(502, "service_error", "network failed"),
    );

    expect(logger.error).toHaveBeenCalledWith("External request failed", {
      serviceName: "service-test",
      method: "POST",
      url: "http://service.test/resource",
      error: "socket hang up",
    });
  });

  it("should log non-error network failures safely", async () => {
    (global.fetch as jest.Mock).mockRejectedValue("socket hang up");

    await expect(
      timedFetch({
        url: "http://service.test/resource",
        method: "POST",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      }),
    ).rejects.toEqual(
      new ApplicationError(502, "service_error", "network failed"),
    );

    expect(logger.error).toHaveBeenCalledWith("External request failed", {
      serviceName: "service-test",
      method: "POST",
      url: "http://service.test/resource",
      error: "socket hang up",
    });
  });

  it("should abort the request after the internal timeout", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const timeoutError = new Error("timeout");
            timeoutError.name = "AbortError";
            reject(timeoutError);
          });
        }),
    );

    const requestPromise = timedFetch({
      url: "http://service.test/resource",
      method: "GET",
      serviceName: "service-test",
      errorCode: "service_error",
      networkErrorMessage: "network failed",
      timeoutErrorMessage: "request timed out",
    });
    const assertion = expect(requestPromise).rejects.toEqual(
      new ApplicationError(502, "service_error", "request timed out"),
    );

    await jest.advanceTimersByTimeAsync(10000);

    await assertion;
  });

  describe("Cloud Run identity token injection", () => {
    beforeEach(() => {
      process.env.K_SERVICE = "achievement-management-int";
    });

    it("should inject Authorization header when running on Cloud Run", async () => {
      const mockResponse = { ok: true } as Response;
      const tokenResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue("fake-token"),
      } as unknown as Response;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(tokenResponse)
        .mockResolvedValueOnce(mockResponse);

      await timedFetch({
        url: "http://service.test/resource",
        method: "GET",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      });

      const serviceCall = (global.fetch as jest.Mock).mock.calls[1];
      expect(serviceCall[1]?.headers).toMatchObject({
        Authorization: "Bearer fake-token",
      });
    });

    it("should preserve existing headers when injecting Authorization", async () => {
      const mockResponse = { ok: true } as Response;
      const tokenResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue("fake-token"),
      } as unknown as Response;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(tokenResponse)
        .mockResolvedValueOnce(mockResponse);

      await timedFetch({
        url: "http://service.test/resource",
        method: "POST",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
        init: {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      });

      const serviceCall = (global.fetch as jest.Mock).mock.calls[1];
      expect(serviceCall[1]?.headers).toMatchObject({
        "content-type": "application/json",
        Authorization: "Bearer fake-token",
      });
    });

    it("should throw a 502 ApplicationError when identity token fetch fails", async () => {
      const failedTokenResponse = { ok: false, status: 500 } as Response;
      (global.fetch as jest.Mock).mockResolvedValueOnce(failedTokenResponse);

      await expect(
        timedFetch({
          url: "http://service.test/resource",
          method: "GET",
          serviceName: "service-test",
          errorCode: "service_error",
          networkErrorMessage: "network failed",
          timeoutErrorMessage: "request timed out",
        }),
      ).rejects.toEqual(
        new ApplicationError(
          502,
          "identity_token_error",
          "Failed to fetch identity token for audience http://service.test",
        ),
      );
    });

    it("should reuse a cached token on subsequent requests", async () => {
      const mockResponse = { ok: true } as Response;
      const tokenResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue("cached-token"),
      } as unknown as Response;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(tokenResponse)
        .mockResolvedValue(mockResponse);

      await timedFetch({
        url: "http://service.test/resource",
        method: "GET",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      });

      await timedFetch({
        url: "http://service.test/resource",
        method: "GET",
        serviceName: "service-test",
        errorCode: "service_error",
        networkErrorMessage: "network failed",
        timeoutErrorMessage: "request timed out",
      });

      // metadata server called only once
      const metadataCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) => url.includes("metadata.google.internal"),
      );
      expect(metadataCalls).toHaveLength(1);
    });
  });
});

describe("extractAudience", () => {
  it("should extract protocol and host from a URL", () => {
    expect(
      extractAudience(
        "https://db-gateway-int-123.europe-west1.run.app/achievements/channel/42",
      ),
    ).toBe("https://db-gateway-int-123.europe-west1.run.app");
  });

  it("should work with http URLs", () => {
    expect(extractAudience("http://service.test/resource")).toBe(
      "http://service.test",
    );
  });
});

describe("fetchIdentityToken", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    tokenCache.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("should return the token from the metadata server", async () => {
    const tokenResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue("my-token"),
    } as unknown as Response;
    (global.fetch as jest.Mock).mockResolvedValue(tokenResponse);

    const token = await fetchIdentityToken("https://service.example.com");
    expect(token).toBe("my-token");
  });

  it("should cache the token for subsequent calls", async () => {
    const tokenResponse = {
      ok: true,
      text: jest.fn().mockResolvedValue("my-token"),
    } as unknown as Response;
    (global.fetch as jest.Mock).mockResolvedValue(tokenResponse);

    await fetchIdentityToken("https://service.example.com");
    await fetchIdentityToken("https://service.example.com");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should throw ApplicationError when metadata server fails", async () => {
    const failedResponse = { ok: false, status: 404 } as Response;
    (global.fetch as jest.Mock).mockResolvedValue(failedResponse);

    await expect(
      fetchIdentityToken("https://service.example.com"),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "identity_token_error",
        "Failed to fetch identity token for audience https://service.example.com",
      ),
    );
  });
});
