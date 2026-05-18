import { ApplicationError } from "../middlewares/errorHandler";
import {
  Achievement,
  AchievementLeaderboardEntry,
  AchievementSuggestion,
  Badge,
  UserAchievement,
} from "../models/achievement";

const supportedTriggerLabels = [
  "countMessage",
  "contentMessage",
  "countCostChannelPoint",
  "countRedeemChannelPoint",
  "apicaller",
] as const;

type SupportedTriggerLabel = (typeof supportedTriggerLabels)[number];

const triggerLabelAliases = new Map<string, SupportedTriggerLabel>([
  ["countmessage", "countMessage"],
  ["count_message", "countMessage"],
  ["message", "countMessage"],
  ["contentmessage", "contentMessage"],
  ["content_message", "contentMessage"],
  ["messagecontent", "contentMessage"],
  ["message_content", "contentMessage"],
  ["countcostchannelpoint", "countCostChannelPoint"],
  ["count_cost_channel_point", "countCostChannelPoint"],
  ["channelpointcost", "countCostChannelPoint"],
  ["channel_point_cost", "countCostChannelPoint"],
  ["countredeemchannelpoint", "countRedeemChannelPoint"],
  ["count_redeem_channel_point", "countRedeemChannelPoint"],
  ["redeemchannelpoint", "countRedeemChannelPoint"],
  ["redeem_channel_point", "countRedeemChannelPoint"],
  ["apicaller", "apicaller"],
  ["api_caller", "apicaller"],
]);

interface CreateAchievementRequest {
  title: string;
  description: string;
  goal: number;
  reward: number;
  label: string;
  public: boolean;
  active: boolean;
  secret: boolean;
  image: string | null;
  imageUpload?: AchievementImageUpload | null;
  channelId: string;
  type: {
    label: SupportedTriggerLabel;
    data: string | null;
  };
}

interface UpdateAchievementRequest {
  title: string;
  description: string;
  goal: number;
  reward: number;
  label: string;
  public: boolean;
  active: boolean;
  secret: boolean;
  image: string | null;
  imageUpload?: AchievementImageUpload | null;
  type: {
    label: SupportedTriggerLabel;
    data: string | null;
  };
}

interface AchievementImageUpload {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

interface AiSuggestionRequest {
  prompt: string;
}

interface AchievementLeaderboardQuery {
  limit?: number;
  sort?: "xp" | "completed";
}

interface CreateBadgeRequest {
  title: string;
  image: string | null;
  imageUpload?: AchievementImageUpload | null;
}

interface UpdateBadgeRequest {
  title?: string;
  image?: string | null;
  imageUpload?: AchievementImageUpload | null;
}

type CreateAchievementResponse = Achievement;
type UpdateAchievementResponse = Achievement;
type AiSuggestionResponse = AchievementSuggestion;
type BadgeResponse = Badge;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(
  value: unknown,
  fieldName: string,
  allowEmpty = false,
): string {
  if (typeof value !== "string") {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a string`,
    );
  }

  const normalizedValue = value.trim();

  if (!allowEmpty && normalizedValue.length === 0) {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} is required`,
    );
  }

  return normalizedValue;
}

function readOptionalImage(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return readRequiredString(value, "image");
}

function readImageUpload(value: unknown): AchievementImageUpload | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "imageUpload must be an object",
    );
  }

  return {
    fileName: readRequiredString(value.fileName, "imageUpload.fileName"),
    mimeType: readRequiredString(value.mimeType, "imageUpload.mimeType"),
    contentBase64: readRequiredString(
      value.contentBase64,
      "imageUpload.contentBase64",
    ),
  };
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a boolean`,
    );
  }

  return value;
}

function readPositiveInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a positive integer`,
    );
  }

  return Number(value);
}

function readNonNegativeInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a non-negative integer`,
    );
  }

  return Number(value);
}

function normalizeTriggerLabel(value: string): SupportedTriggerLabel {
  const trimmedValue = value.trim();

  if (supportedTriggerLabels.includes(trimmedValue as SupportedTriggerLabel)) {
    return trimmedValue as SupportedTriggerLabel;
  }

  const normalizedValue = trimmedValue
    .toLowerCase()
    .split(/[\s-]+/)
    .join("_");
  const aliasedValue = triggerLabelAliases.get(normalizedValue);

  if (!aliasedValue) {
    throw new ApplicationError(
      400,
      "validation_error",
      "type.label is not supported",
    );
  }

  return aliasedValue;
}

function normalizeTypeData(
  label: SupportedTriggerLabel,
  value: unknown,
): string | null {
  if (label === "countMessage") {
    if (value === undefined || value === null) {
      return null;
    }

    return readRequiredString(value, "type.data");
  }

  if (label === "countCostChannelPoint") {
    if (
      (!Number.isInteger(value) || Number(value) <= 0) &&
      typeof value !== "string"
    ) {
      throw new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for countCostChannelPoint",
      );
    }

    const normalizedValue = String(value).trim();

    if (!/^\d+$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
      throw new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for countCostChannelPoint",
      );
    }

    return normalizedValue;
  }

  return readRequiredString(value, "type.data");
}

function parseCreateAchievementRequest(
  body: unknown,
): CreateAchievementRequest {
  const parsedPayload = parseAchievementDefinitionPayload(body);

  return {
    ...parsedPayload,
    label: " ",
    channelId: readRequiredString(
      (body as Record<string, unknown>).channelId,
      "channelId",
    ),
  };
}

function parseUpdateAchievementRequest(
  body: unknown,
): UpdateAchievementRequest {
  return parseAchievementDefinitionPayload(body);
}

function parseAiSuggestionRequest(body: unknown): AiSuggestionRequest {
  if (!isRecord(body)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "Request body must be an object",
    );
  }

  return {
    prompt: readRequiredString(body.prompt, "prompt"),
  };
}

function parseCreateBadgeRequest(body: unknown): CreateBadgeRequest {
  if (!isRecord(body)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "Request body must be an object",
    );
  }

  const imageUpload = readImageUpload(body.imageUpload);
  const image = readOptionalImage(body.image);

  if (!image && !imageUpload) {
    throw new ApplicationError(
      400,
      "validation_error",
      "image or imageUpload is required",
    );
  }

  return {
    title: readRequiredString(body.title, "title"),
    image,
    imageUpload,
  };
}

function parseUpdateBadgeRequest(body: unknown): UpdateBadgeRequest {
  if (!isRecord(body)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "Request body must be an object",
    );
  }

  const imageUpload = readImageUpload(body.imageUpload);
  const hasTitle = body.title !== undefined;
  const hasImage = body.image !== undefined;

  if (!hasTitle && !hasImage && !imageUpload) {
    throw new ApplicationError(
      400,
      "validation_error",
      "At least one of title, image or imageUpload is required",
    );
  }

  return {
    title: hasTitle ? readRequiredString(body.title, "title") : undefined,
    image: hasImage ? readOptionalImage(body.image) : undefined,
    imageUpload,
  };
}

function parseAchievementDefinitionPayload(
  body: unknown,
): Omit<CreateAchievementRequest, "channelId"> {
  if (!isRecord(body)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "Request body must be an object",
    );
  }

  if (!isRecord(body.type)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "type must be an object",
    );
  }

  const triggerLabel = normalizeTriggerLabel(
    readRequiredString(body.type.label, "type.label"),
  );

  const imageUpload = readImageUpload(body.imageUpload);

  return {
    title: readRequiredString(body.title, "title"),
    description: readRequiredString(body.description, "description"),
    goal: readPositiveInteger(body.goal, "goal"),
    reward: readNonNegativeInteger(body.reward, "reward"),
    label:
      body.label === undefined
        ? ""
        : readRequiredString(body.label, "label", true),
    public: readBoolean(body.public, "public"),
    active: readBoolean(body.active, "active"),
    secret: readBoolean(body.secret, "secret"),
    image: readOptionalImage(body.image),
    imageUpload,
    type: {
      label: triggerLabel,
      data: normalizeTypeData(triggerLabel, body.type.data),
    },
  };
}

function parseDbType(body: Record<string, unknown>): {
  label: SupportedTriggerLabel;
  data: string | null;
} {
  let nestedType: Record<string, unknown> | undefined;

  if (isRecord(body["typeAchievement"])) {
    nestedType = body["typeAchievement"];
  } else if (isRecord(body["Type"])) {
    nestedType = body["Type"];
  }
  const labelSource =
    nestedType?.["label"] ?? nestedType?.["Type_Label"] ?? body["Type_Label"];
  const dataSource =
    nestedType?.["data"] ??
    nestedType?.["Type_Data"] ??
    body["Type_Data"] ??
    null;
  const label = normalizeTriggerLabel(
    readRequiredString(labelSource, "Type_Label"),
  );
  const mappedData =
    label === "countMessage" &&
    (dataSource === undefined ||
      dataSource === null ||
      (typeof dataSource === "string" && dataSource.trim().length === 0) ||
      dataSource === "countMessage")
      ? null
      : normalizeTypeData(label, dataSource);

  return {
    label,
    data: mappedData,
  };
}

function readOptionalNumber(value: unknown, fieldName: string): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new ApplicationError(
      502,
      "db_service_error",
      `${fieldName} must be a non-negative integer`,
    );
  }

  return Number(value);
}

function mapDbAchievementToResponse(body: unknown): Achievement {
  if (!isRecord(body)) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid achievement payload",
    );
  }

  return {
    id: readRequiredString(body["id"] ?? body["Achievement_ID"], "id"),
    title: readRequiredString(
      body["title"] ?? body["Achievement_Title"],
      "title",
    ),
    description: readRequiredString(
      body["description"] ?? body["Achievement_Description"],
      "description",
    ),
    goal: readPositiveInteger(body["goal"] ?? body["Achievement_Goal"], "goal"),
    reward: readNonNegativeInteger(
      body["reward"] ?? body["Achievement_Reward"],
      "reward",
    ),
    label:
      (body["label"] ?? body["Achievement_Label"]) === undefined
        ? ""
        : readRequiredString(
            body["label"] ?? body["Achievement_Label"],
            "label",
            true,
          ),
    public: readBoolean(body["public"] ?? body["Achievement_Public"], "public"),
    downloads: readOptionalNumber(
      body["downloads"] ?? body["Achievement_Downloads"],
      "downloads",
    ),
    visits: readOptionalNumber(
      body["visits"] ?? body["Achievement_Visits"],
      "visits",
    ),
    active: readBoolean(body["active"] ?? body["Achievement_Active"], "active"),
    secret: readBoolean(body["secret"] ?? body["Achievement_Secret"], "secret"),
    image:
      (body["image"] ?? body["Achievement_Image"]) === undefined ||
      (body["image"] ?? body["Achievement_Image"]) === null
        ? null
        : readRequiredString(
            body["image"] ?? body["Achievement_Image"],
            "image",
          ),
    channelId:
      (body["channelId"] ?? body["Chanel_ID"]) === undefined ||
      (body["channelId"] ?? body["Chanel_ID"]) === null
        ? null
        : readRequiredString(
            body["channelId"] ?? body["Chanel_ID"],
            "channelId",
          ),
    type: parseDbType(body),
  };
}

function mapDbAchievementsToResponse(body: unknown): Achievement[] {
  if (!Array.isArray(body)) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid achievement list payload",
    );
  }

  return body.map((achievement) => mapDbAchievementToResponse(achievement));
}

function mapAiSuggestionToResponse(body: unknown): AchievementSuggestion {
  const parsedSuggestion = parseAchievementDefinitionPayload(body);

  return {
    title: parsedSuggestion.title,
    description: parsedSuggestion.description,
    goal: parsedSuggestion.goal,
    reward: parsedSuggestion.reward,
    public: parsedSuggestion.public,
    active: parsedSuggestion.active,
    secret: parsedSuggestion.secret,
    type: parsedSuggestion.type,
  };
}

function readOptionalBoolean(
  value: unknown,
  fieldName: string,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  return readBoolean(value, fieldName);
}

function readOptionalNullableString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return readRequiredString(value, fieldName);
}

function readOptionalPositiveIntegerQuery(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a positive integer`,
    );
  }

  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue) || Number(trimmedValue) <= 0) {
    throw new ApplicationError(
      400,
      "validation_error",
      `${fieldName} must be a positive integer`,
    );
  }

  return Number(trimmedValue);
}

function parseAchievementLeaderboardQuery(
  query: unknown,
): AchievementLeaderboardQuery {
  const limit = readOptionalPositiveIntegerQuery(
    (query as Record<string, unknown> | undefined)?.limit,
    "limit",
  );
  const rawSort = (query as Record<string, unknown> | undefined)?.sort;

  if (rawSort === undefined) {
    return { limit };
  }

  if (typeof rawSort !== "string") {
    throw new ApplicationError(
      400,
      "validation_error",
      "sort must be either xp or completed",
    );
  }

  const normalizedSort = rawSort.trim();

  if (normalizedSort !== "xp" && normalizedSort !== "completed") {
    throw new ApplicationError(
      400,
      "validation_error",
      "sort must be either xp or completed",
    );
  }

  return {
    limit,
    sort: normalizedSort,
  };
}

function mapDbUserState(
  body: Record<string, unknown>,
): UserAchievement["userState"] {
  const nestedAchieved = isRecord(body["achieved"]) ? body["achieved"] : {};
  const nestedUserState = isRecord(body["UserState"]) ? body["UserState"] : {};
  const progressCountSource =
    nestedAchieved["count"] ??
    nestedUserState["Progress_Count"] ??
    nestedUserState["Count"] ??
    body["count"] ??
    body["Progress_Count"] ??
    body["Count"];
  const finishedSource =
    nestedAchieved["finished"] ??
    nestedUserState["Finished"] ??
    body["Finished"];
  const acquiredDateSource =
    nestedAchieved["acquiredDate"] ??
    nestedUserState["Acquired_Date"] ??
    nestedUserState["Aquired_Date"] ??
    body["acquiredDate"] ??
    body["Acquired_Date"] ??
    body["Aquired_Date"];

  return {
    progressCount: readOptionalNumber(progressCountSource, "Progress_Count"),
    finished: readOptionalBoolean(finishedSource, "Finished", false),
    acquiredDate: readOptionalNullableString(
      acquiredDateSource,
      "Acquired_Date",
    ),
  };
}

function mapDbUserAchievementToResponse(body: unknown): UserAchievement {
  const achievement = mapDbAchievementToResponse(body);

  return {
    ...achievement,
    userState: mapDbUserState(body as Record<string, unknown>),
  };
}

function mapDbUserAchievementsToResponse(body: unknown): UserAchievement[] {
  let achievementList: unknown[] | null = null;

  if (Array.isArray(body)) {
    achievementList = body;
  } else if (isRecord(body) && Array.isArray(body["achievements"])) {
    achievementList = body["achievements"];
  }

  if (!achievementList) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid user achievement list payload",
    );
  }

  return achievementList.map((achievement) =>
    mapDbUserAchievementToResponse(achievement),
  );
}

function mapDbAchievementLeaderboardResponse(
  body: unknown,
): AchievementLeaderboardEntry[] {
  if (!Array.isArray(body)) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid achievement leaderboard payload",
    );
  }

  return body.map((entry) => {
    if (!isRecord(entry)) {
      throw new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement leaderboard payload",
      );
    }

    return {
      userId: readRequiredString(entry.userId, "userId"),
      username: readRequiredString(entry.username, "username"),
      xp: readNonNegativeInteger(entry.xp, "xp"),
      completed: readNonNegativeInteger(entry.completed, "completed"),
    };
  });
}

function mapDbBadgeToResponse(body: unknown): Badge {
  if (!isRecord(body)) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid badge payload",
    );
  }

  return {
    id: readRequiredString(body.id, "id"),
    title: readRequiredString(body.title, "title"),
    image: readRequiredString(body.img, "img"),
  };
}

function mapDbBadgesToResponse(body: unknown): Badge[] {
  if (!Array.isArray(body)) {
    throw new ApplicationError(
      502,
      "db_service_error",
      "DB service returned an invalid badge list payload",
    );
  }

  return body.map((badge) => mapDbBadgeToResponse(badge));
}

export {
  mapDbAchievementLeaderboardResponse,
  mapDbAchievementToResponse,
  mapDbAchievementsToResponse,
  mapDbBadgeToResponse,
  mapDbBadgesToResponse,
  mapDbUserAchievementToResponse,
  mapDbUserAchievementsToResponse,
  mapAiSuggestionToResponse,
  parseAchievementLeaderboardQuery,
  parseAiSuggestionRequest,
  parseCreateBadgeRequest,
  parseCreateAchievementRequest,
  parseUpdateBadgeRequest,
  parseUpdateAchievementRequest,
  supportedTriggerLabels,
};
export type {
  AchievementLeaderboardQuery,
  AiSuggestionRequest,
  AiSuggestionResponse,
  BadgeResponse,
  CreateAchievementRequest,
  CreateBadgeRequest,
  AchievementImageUpload,
  CreateAchievementResponse,
  UpdateBadgeRequest,
  UpdateAchievementRequest,
  UpdateAchievementResponse,
};
