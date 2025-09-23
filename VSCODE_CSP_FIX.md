# VS Code CSP Fix for MCP Registry

## Problem

When VS Code tries to connect to your local MCP registry at `http://localhost:3000`, it fails with:

```
Refused to connect to 'http://localhost:3000/api/v0/servers?limit=50' because it violates the following Content Security Policy directive: "connect-src 'self' https: ws:"
```

This happens because VS Code's Content Security Policy only allows HTTPS connections, not HTTP.

## Solution Options

### Option 1: Use HTTPS (Recommended)

1. **Generate self-signed certificates:**
   ```bash
   npm run generate-certs
   ```

2. **Start the server with HTTPS:**
   ```bash
   npm run start:https
   ```

3. **Configure VS Code to use HTTPS endpoint:**
   Use `https://localhost:3443` instead of `http://localhost:3000`

### Option 2: Use a different port that VS Code allows

Some users report that VS Code allows HTTP connections to certain ports. Try:

```bash
PORT=8080 npm start
```

Then use `http://localhost:8080` in your VS Code MCP configuration.

### Option 3: Deploy to a public HTTPS endpoint

Deploy your registry to a service like:
- Vercel
- Netlify
- Azure App Service
- Heroku

And use the HTTPS URL in VS Code.

## VS Code MCP Configuration

In your VS Code settings or MCP configuration, use:

```json
{
  "mcpRegistries": [
    {
      "url": "https://localhost:3443/api/v0/servers",
      "name": "Local Development Registry"
    }
  ]
}
```

## Notes

- The self-signed certificate will show a browser warning - this is expected
- For production, use proper SSL certificates from a CA
- VS Code may cache the registry URL, so restart VS Code after changing endpoints