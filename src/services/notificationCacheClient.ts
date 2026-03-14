/* global fetch */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";

interface NotificationCacheClient {
  // eslint-disable-next-line no-unused-vars
  invalidateChannelCache(channelId: string): Promise<void>;
}

class HttpNotificationCacheClient implements NotificationCacheClient {
  public async invalidateChannelCache(channelId: string): Promise<void> {
    const response = await fetch(
      `${config.notificationHandlerUrl}/cache/channel/${encodeURIComponent(channelId)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed",
      );
    }
  }
}

const notificationCacheClient: NotificationCacheClient =
  new HttpNotificationCacheClient();

export { HttpNotificationCacheClient, notificationCacheClient };
export type { NotificationCacheClient };
