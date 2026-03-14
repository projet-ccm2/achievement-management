import { ApplicationError } from "../../../middlewares/errorHandler";
import { HttpNotificationCacheClient } from "../../../services/notificationCacheClient";

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
      {
        method: "DELETE",
      },
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
});
