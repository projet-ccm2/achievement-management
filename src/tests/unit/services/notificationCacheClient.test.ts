/* global afterEach, beforeEach, describe, expect, global, it, jest */
import { ApplicationError } from "../../../middlewares/errorHandler";
import { HttpNotificationCacheClient } from "../../../services/notificationCacheClient";

jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("notificationCacheClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("should invalidate a channel cache", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const client = new HttpNotificationCacheClient();

    await client.invalidateChannelCache("channel 1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://notification-handler.test/cache/channel/channel%201",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("should map notification handler failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const client = new HttpNotificationCacheClient();

    await expect(client.invalidateChannelCache("channel-1")).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed",
      ),
    );
  });

  it("should map notification handler network failures", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("socket hang up"));

    const client = new HttpNotificationCacheClient();

    await expect(client.invalidateChannelCache("channel-1")).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed",
      ),
    );
  });
});
