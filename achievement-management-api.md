# Achievement Management API

## Health

### `GET /health`

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-04-15T12:00:00.000Z",
  "environment": "development"
}
```

## Write endpoints

### `POST /achievements`

Creates a new achievement definition.

Request body:

```json
{
  "title": "First hello",
  "description": "Say hello once",
  "goal": 1,
  "reward": 100,
  "label": "",
  "public": true,
  "active": true,
  "secret": false,
  "image": null,
  "imageUpload": {
    "fileName": "achievement.png",
    "mimeType": "image/png",
    "contentBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "channelId": "141512329",
  "type": {
    "label": "contentMessage",
    "data": "hello"
  }
}
```

Notes:

- `label` is forced to `""` by the service on create
- `imageUpload` is optional
- if `imageUpload` is provided, the service uploads the image to `bucket-manager` first

Success:

- `201 Created`

### `PUT /achievements/:achievementId`

Updates an existing achievement definition.

Request body:

```json
{
  "title": "Updated achievement",
  "description": "Updated description",
  "goal": 10,
  "reward": 200,
  "label": "",
  "public": false,
  "active": true,
  "secret": false,
  "image": null,
  "imageUpload": null,
  "type": {
    "label": "countMessage",
    "data": null
  }
}
```

Success:

- `200 OK`

### `DELETE /achievements/:achievementId`

Deletes an achievement definition.

Success:

- `200 OK`

### `PATCH /achievements/:achievementId/deactivate`

Marks an achievement as inactive.

Success:

- `200 OK`

### `PATCH /achievements/:achievementId/activate`

Marks an achievement as active.

Success:

- `200 OK`

### `POST /achievements/ai-suggestion`

Generates a suggestion payload for the front without persisting anything.

Request body:

```json
{
  "prompt": "Create an achievement for saying hello in chat"
}
```

Success:

- `200 OK`

Response:

```json
{
  "title": "Say hello",
  "description": "Send hello in chat",
  "goal": 1,
  "reward": 100,
  "public": false,
  "active": true,
  "secret": false,
  "type": {
    "label": "contentMessage",
    "data": "hello"
  }
}
```

## Read endpoints

### `GET /achievements/:achievementId`

Returns one achievement definition.

### `GET /achievements/channel/:channelId`

Returns all achievements for one channel.

### `GET /achievements/public`

Returns public achievements.

### `GET /achievements/user/:userId`

Returns user achievements with user progression state.

### `GET /achievements/user/:userId/channel/:channelId`

Returns user achievements for one specific channel.

## Stable achievement response

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

User achievement response adds:

```json
{
  "userState": {
    "progressCount": 4,
    "finished": false,
    "acquiredDate": null
  }
}
```

## Validation rules

- `title`: required non-empty string
- `description`: required non-empty string
- `goal`: positive integer
- `reward`: non-negative integer
- `public`, `active`, `secret`: booleans
- `channelId`: required on create
- `type.label`: must be one of:
  - `countMessage`
  - `contentMessage`
  - `countCostChannelPoint`
  - `countRedeemChannelPoint`
  - `apicaller`

`type.data` rules:

- `countMessage` => `null`
- `contentMessage` => required string
- `countCostChannelPoint` => positive numeric string or integer
- `countRedeemChannelPoint` => required string
- `apicaller` => required string

## Error responses

Shape:

```json
{
  "code": "validation_error",
  "message": "type.data is required"
}
```

Examples:

- `400 validation_error`
- `404 not_found`
- `502 db_service_error`
- `502 notification_handler_error`
- `502 ai_service_error`
- `502 bucket_manager_error`
- `500 internal_server_error`

## CORS behavior

Accepted origins:

- configured origins from environment
- Twitch extension origins matching `https://{extension_id}.ext-twitch.tv`

Returned headers for valid origins:

- `Access-Control-Allow-Origin: <origin>`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
