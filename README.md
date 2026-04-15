# achievement-management

Backend Express/TypeScript responsible for achievement definition management.

## Scope

The service exposes achievement definition CRUD, public/channel/user reads, AI suggestion generation, and image upload orchestration for achievements.

Main downstream dependencies:

- DB gateway
- notification-handler
- AI service
- bucket-manager

## Main responsibilities

- validate achievement payloads
- normalize trigger labels
- orchestrate DB persistence
- invalidate notification-handler cache after write operations
- generate AI-based achievement suggestions without persisting them
- upload achievement images to bucket-manager before persistence
- expose a stable achievement response contract to the front

## Trigger labels

Canonical trigger labels exposed by the service:

- `countMessage`
- `contentMessage`
- `countCostChannelPoint`
- `countRedeemChannelPoint`
- `apicaller`

The backend still accepts some legacy aliases for compatibility, but new clients must use the canonical labels above.

## Image handling

The service now supports frontend-driven image upload through JSON.

Accepted write payload fields:

- `image: string | null`
- `imageUpload?: { fileName: string; mimeType: string; contentBase64: string } | null`

Behavior:

- if `imageUpload` is provided, the service uploads the file to `bucket-manager`
- the returned bucket key is then stored through the DB flow
- if `imageUpload` is omitted or null, the existing `image` value is used as-is

The response `image` field is the stored bucket key/reference, not necessarily a public URL.

Front handover document:

- [front-achievement-image-upload-handover.md](/C:/Users/maxim/OneDrive/Bureau/achievement-management/docs/front-achievement-image-upload-handover.md)

## CORS

The service supports:

- configured browser origins from `FRONT_URL` and `ALLOWED_ORIGINS`
- dynamic Twitch extension panel origins matching:
  - `https://{extension_id}.ext-twitch.tv`

For a valid origin, the service returns:

- `Access-Control-Allow-Origin: <validated origin>`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

The service does not use `Access-Control-Allow-Origin: *`.

## Environment variables

Required:

- `DB_SERVICE_URL`
- `IA_SERVICE_URL`
- `BUCKET_MANAGER_URL`
- `NOTIFICATION_HANDLER_URL`

Optional:

- `PORT`
- `NODE_ENV`
- `FRONT_URL`
- `ALLOWED_ORIGINS`

Example:

- [.env.example](/C:/Users/maxim/OneDrive/Bureau/achievement-management/.env.example)

## Endpoints

Health:

- `GET /health`

Write:

- `POST /achievements`
- `PUT /achievements/:achievementId`
- `DELETE /achievements/:achievementId`
- `PATCH /achievements/:achievementId/deactivate`
- `PATCH /achievements/:achievementId/activate`
- `POST /achievements/ai-suggestion`

Read:

- `GET /achievements/:achievementId`
- `GET /achievements/channel/:channelId`
- `GET /achievements/public`
- `GET /achievements/user/:userId`
- `GET /achievements/user/:userId/channel/:channelId`

Detailed contract:

- [achievement-management-api.md](/C:/Users/maxim/OneDrive/Bureau/achievement-management/docs/achievement-management-api.md)

## Stable response shape

Achievement responses are normalized to:

```json
{
  "id": "achievement-1",
  "title": "First 100 messages",
  "description": "Unlock after 100 messages",
  "goal": 100,
  "reward": 250,
  "label": "",
  "public": false,
  "downloads": 0,
  "visits": 0,
  "active": true,
  "secret": false,
  "image": "assets/image/achievement/achievement-1.png",
  "channelId": "channel-1",
  "type": {
    "label": "countMessage",
    "data": null
  }
}
```

User achievement reads add:

```json
{
  "userState": {
    "progressCount": 0,
    "finished": false,
    "acquiredDate": null
  }
}
```

## Error model

Standard error shape:

```json
{
  "code": "validation_error",
  "message": "goal must be a positive integer"
}
```

Common codes:

- `validation_error`
- `not_found`
- `db_service_error`
- `db_service_validation_error`
- `notification_handler_error`
- `ai_service_error`
- `bucket_manager_error`
- `internal_server_error`

## Local quality commands

Required after each change:

- `npm.cmd run prettier`
- `npm.cmd run lint`
- `npm.cmd run test:coverage -- --runInBand`

Build:

- `npm.cmd run build`


