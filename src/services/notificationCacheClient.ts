import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";
import { timedFetch } from "../utils/http";

interface NotificationCacheClient {
  // eslint-disable-next-line no-unused-vars
  invalidateChannelCache(channelId: string): Promise<void>;
}

class HttpNotificationCacheClient implements NotificationCacheClient {
  public async invalidateChannelCache(channelId: string): Promise<void> {
    const url = `${config.notificationHandlerUrl}/cache/channel/${encodeURIComponent(channelId)}`;
    const response = await timedFetch({
      url,
      method: "DELETE",
      serviceName: "notification-handler",
      errorCode: "notification_handler_error",
      networkErrorMessage: "Notification handler cache invalidation failed",
      timeoutErrorMessage: "Notification handler cache invalidation timed out",
      init: {
        method: "DELETE",
      },
    });

    if (!response.ok) {
      logger.error("Notification handler returned an error response", {
        operation: "invalidateChannelCache",
        method: "DELETE",
        url,
        status: response.status,
      });
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
