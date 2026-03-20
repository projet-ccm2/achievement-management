import { ApplicationError } from "../middlewares/errorHandler";
import { Achievement } from "../models/achievement";

const supportedTriggerLabels = [
  "message",
  "message_content",
  "channel_point_cost",
  "redeem_channel_point",
  "api_caller",
] as const;

type SupportedTriggerLabel = (typeof supportedTriggerLabels)[number];

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
  type: {
    label: SupportedTriggerLabel;
    data: string | null;
  };
}

type CreateAchievementResponse = Achievement;
type UpdateAchievementResponse = Achievement;

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
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .split(/[\s-]+/g)
    .join("_");

  if (
    !supportedTriggerLabels.includes(normalizedValue as SupportedTriggerLabel)
  ) {
    throw new ApplicationError(
      400,
      "validation_error",
      "type.label is not supported",
    );
  }

  return normalizedValue as SupportedTriggerLabel;
}

function normalizeTypeData(
  label: SupportedTriggerLabel,
  value: unknown,
): string | null {
  if (label === "message") {
    return null;
  }

  if (label === "channel_point_cost") {
    if (
      (!Number.isInteger(value) || Number(value) <= 0) &&
      typeof value !== "string"
    ) {
      throw new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for channel_point_cost",
      );
    }

    const normalizedValue = String(value).trim();

    if (!/^\d+$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
      throw new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for channel_point_cost",
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
  const nestedType = isRecord(body["Type"]) ? body["Type"] : undefined;
  const labelSource = nestedType?.["Type_Label"] ?? body["Type_Label"];
  const dataSource = nestedType?.["Type_Data"] ?? body["Type_Data"] ?? null;
  const label = normalizeTriggerLabel(
    readRequiredString(labelSource, "Type_Label"),
  );

  return {
    label,
    data: normalizeTypeData(label, dataSource),
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
    id: readRequiredString(body["Achievement_ID"], "Achievement_ID"),
    title: readRequiredString(body["Achievement_Title"], "Achievement_Title"),
    description: readRequiredString(
      body["Achievement_Description"],
      "Achievement_Description",
    ),
    goal: readPositiveInteger(body["Achievement_Goal"], "Achievement_Goal"),
    reward: readNonNegativeInteger(
      body["Achievement_Reward"],
      "Achievement_Reward",
    ),
    label:
      body["Achievement_Label"] === undefined
        ? ""
        : readRequiredString(
            body["Achievement_Label"],
            "Achievement_Label",
            true,
          ),
    public: readBoolean(body["Achievement_Public"], "Achievement_Public"),
    downloads: readOptionalNumber(
      body["Achievement_Downloads"],
      "Achievement_Downloads",
    ),
    visits: readOptionalNumber(
      body["Achievement_Visits"],
      "Achievement_Visits",
    ),
    active: readBoolean(body["Achievement_Active"], "Achievement_Active"),
    secret: readBoolean(body["Achievement_Secret"], "Achievement_Secret"),
    image:
      body["Achievement_Image"] === undefined ||
      body["Achievement_Image"] === null
        ? null
        : readRequiredString(body["Achievement_Image"], "Achievement_Image"),
    channelId: readRequiredString(body["Chanel_ID"], "Chanel_ID"),
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

export {
  mapDbAchievementToResponse,
  mapDbAchievementsToResponse,
  parseCreateAchievementRequest,
  parseUpdateAchievementRequest,
  supportedTriggerLabels,
};
export type {
  CreateAchievementRequest,
  CreateAchievementResponse,
  UpdateAchievementRequest,
  UpdateAchievementResponse,
};
