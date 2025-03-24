# Caching Proxy Server

A lightweight, configurable proxy server which forwards requests to a target API (by default, `https://jsonplaceholder.typicode.com`), caches GET responses locally, and serves cached responses when available to reduce redundant external API calls.

## Usage

```typescript
npm run dev -- --port 4000 --origin https://example.com --clear-cache
```

## Available Flags

| Flag           | Description                                              | Example                                |
|----------------|----------------------------------------------------------|----------------------------------------|
| `--port`       | Port for the proxy server to listen on (default: 3000)   | `--port 4000`                          |
| `--origin`     | The base URL to which requests will be forwarded         | `--origin https://example.com`         |
| `--clear-cache`| Clears the local response cache at startup               | `--clear-cache`                        |

## Cache

Cached responses are stored as .json files in the cache/ directory. Responses are hashed by URL for uniqueness.

## Example

### Cached (GET)

```bash 
curl http://localhost:3000/posts/1
```

- First request fetches from origin and caches response before serving.
- Subsequent identical requests are served from the cache.

### Not Cached (POST)

```bash 
curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -d '{"title": "hey guys"}'
```
- Request is forwarded to the origin API but not cached.
- Only GET responses are stored in the local cache.
