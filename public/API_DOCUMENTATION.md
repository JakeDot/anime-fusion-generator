# Anime Fusion Generator Public API Documentation

The Anime Fusion Generator provides a public JSON API for programmatic image generation. You can blend multiple anime series, specify custom prompts, use reference images, and more.

## Base URL
`https://[your-app-url]/api`

## Authentication
The API requires a Gemini API key. You can provide it in two ways:
1.  **Environment Variable**: Set `GEMINI_API_KEY` on the server hosting the app.
2.  **Request Body**: Include the `apiKey` field in your JSON request.

---

## Endpoints

### 1. Health Check
`GET /api/health`

Checks the status of the API server.

**Response:**
```json
{
  "status": "ok",
  "version": "0.7.0"
}
```

---

### 2. Generate Fusion Image
`POST /api/generate`

Generates an anime style fusion image.

**Request Body (JSON):**

| Field | Type | Description | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `series` | `string[]` | Array of series IDs to fuse (see series list below) | No | `[]` |
| `prompt` | `string` | Custom prompt text to guide the generation | No | `""` |
| `negativePrompt` | `string` | Elements to strictly exclude from the image | No | `""` |
| `promptPrefix` | `string` | Text prepended to every prompt (e.g. "Masterpiece, 8k") | No | `""` |
| `transparentBackground`| `boolean`| If true, requests the subject on a plain white background | No | `false` |
| `model` | `string` | The model to use for final generation | No | `"gemini-2.0-flash-exp"` |
| `apiKey` | `string` | Custom Gemini API Key (if not set via environment) | No | `""` |
| `referenceImages` | `array` | Array of objects with image data | No | `[]` |

**Reference Image Object:**
```json
{
  "data": "base64_encoded_image_data_without_prefix",
  "mimeType": "image/png"
}
```

**Example Request:**
```json
{
  "series": ["attack-on-titan", "naruto"],
  "prompt": "A ninja wearing a survey corps cloak standing on a titan's shoulder",
  "transparentBackground": true,
  "model": "gemini-2.0-flash-exp"
}
```

**Response:**
```json
{
  "id": "1612345678901",
  "url": "data:image/png;base64,...",
  "prompt": "Anime style fusion of Attack on Titan, Naruto. A ninja wearing a survey corps cloak standing on a titan's shoulder. The subject should be on a plain white background for easy transparency removal. High quality, detailed anime art.",
  "metadata": "Detailed description of the generated image provided by the AI.",
  "timestamp": 1612345678901
}
```

---

## Supported Series IDs
You can use these IDs in the `series` array:
- `attack-on-titan`
- `naruto`
- `one-piece`
- `demon-slayer`
- `dragon-ball`
- `my-hero-academia`
- `jujutsu-kaisen`
- `fullmetal-alchemist`
- `death-note`
- `bleach`
- `tokyo-ghoul`
- `hunter-x-hunter`
- `sword-art-online`
- `neon-genesis-evangelion`
- `one-punch-man`
- `cowboy-bebop`
- `sailor-moon`
- `pokemon`
- `digimon`
- `yu-gi-oh`

For custom series names, use the format `custom-[name]`.

## Rate Limiting and Quotas
The API is subject to the same quotas as the standard Gemini API implementation in AI Studio. For shared builds, usage is limited by the shared credit pool. If you provide your own `apiKey`, your own project's quotas apply.

## Error Handling
The API returns standard HTTP status codes:
- `200`: Success
- `401`: Unauthorized (Missing API Key)
- `500`: Internal Server Error (Generation failed)

Error responses include a message:
```json
{
  "error": "Failed to generate final image."
}
```
