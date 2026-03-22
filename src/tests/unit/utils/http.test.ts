/* global Response, afterEach, beforeEach, describe, expect, global, it, jest */
import { ApplicationError } from "../../../middlewares/errorHandler";
import { timedFetch } from "../../../utils/http";
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
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.clearAllMocks();
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

    await jest.advanceTimersByTimeAsync(10000);

    await expect(requestPromise).rejects.toEqual(
      new ApplicationError(502, "service_error", "request timed out"),
    );
  });
});
