# Azure API Center Deployment Guide

This guide explains how to deploy the Dynamic MCP Registry API to Azure API Center.

## Prerequisites

- Azure subscription
- Azure CLI installed and configured
- Docker installed (for containerized deployment)
- Azure Container Registry (ACR) access

## Deployment Options

### Option 1: Azure Container Instances (ACI)

1. **Build and push Docker image to ACR:**

```bash
# Login to Azure
az login

# Create resource group
az group create --name mcp-registry-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group mcp-registry-rg --name mcpregistryacr --sku Basic

# Login to ACR
az acr login --name mcpregistryacr

# Build and push image
docker build -t mcpregistryacr.azurecr.io/mcp-registry:latest .
docker push mcpregistryacr.azurecr.io/mcp-registry:latest
```

2. **Deploy to Azure Container Instances:**

```bash
az container create \
  --resource-group mcp-registry-rg \
  --name mcp-registry-api \
  --image mcpregistryacr.azurecr.io/mcp-registry:latest \
  --registry-username <acr-username> \
  --registry-password <acr-password> \
  --dns-name-label mcp-registry-unique \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000
```

### Option 2: Azure App Service (Recommended)

1. **Create App Service Plan:**

```bash
az appservice plan create \
  --name mcp-registry-plan \
  --resource-group mcp-registry-rg \
  --sku B1 \
  --is-linux
```

2. **Create Web App:**

```bash
az webapp create \
  --resource-group mcp-registry-rg \
  --plan mcp-registry-plan \
  --name mcp-registry-api-unique \
  --deployment-container-image-name mcpregistryacr.azurecr.io/mcp-registry:latest
```

3. **Configure App Settings:**

```bash
az webapp config appsettings set \
  --resource-group mcp-registry-rg \
  --name mcp-registry-api-unique \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    WEBSITES_PORT=3000
```

### Option 3: Azure Kubernetes Service (AKS)

1. **Create AKS cluster:**

```bash
az aks create \
  --resource-group mcp-registry-rg \
  --name mcp-registry-aks \
  --node-count 1 \
  --enable-addons monitoring \
  --generate-ssh-keys
```

2. **Apply Kubernetes manifests:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-registry-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-registry-api
  template:
    metadata:
      labels:
        app: mcp-registry-api
    spec:
      containers:
      - name: mcp-registry-api
        image: mcpregistryacr.azurecr.io/mcp-registry:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-registry-service
spec:
  selector:
    app: mcp-registry-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## API Center Integration

### 1. Import API Definition

After deploying the service, import the OpenAPI specification into Azure API Center:

```bash
# Get the OpenAPI spec
curl https://your-app-url.azurewebsites.net/api/docs > openapi.json

# Import to API Center (via Azure Portal or CLI)
az apic api create \
  --resource-group mcp-registry-rg \
  --service-name your-api-center \
  --api-id mcp-registry \
  --title "Dynamic MCP Registry API" \
  --type "rest"
```

### 2. Configure API Management (Optional)

For production use, consider adding Azure API Management:

```bash
az apim create \
  --name mcp-registry-apim \
  --resource-group mcp-registry-rg \
  --publisher-name "Your Organization" \
  --publisher-email "admin@yourorg.com" \
  --sku-name Developer
```

## Environment Configuration

### Required Environment Variables

- `NODE_ENV`: Set to "production"
- `PORT`: Set to 3000 (or your preferred port)

### Optional Environment Variables

- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `LOG_LEVEL`: Logging level (info, debug, warn, error)

## Monitoring and Logging

### Application Insights

Enable Application Insights for monitoring:

```bash
az monitor app-insights component create \
  --app mcp-registry-insights \
  --location eastus \
  --resource-group mcp-registry-rg
```

### Health Checks

The API includes a health check endpoint at `/health` that can be used for:

- Azure Load Balancer health probes
- Container health checks
- Monitoring alerts

## Security Considerations

1. **HTTPS Only**: Ensure HTTPS is enforced in production
2. **CORS Configuration**: Set `ALLOWED_ORIGINS` to restrict cross-origin requests
3. **Rate Limiting**: Consider adding rate limiting for production use
4. **Authentication**: Add authentication if needed for private use

## Scaling

The API is stateless and can be horizontally scaled:

- **App Service**: Configure auto-scaling rules
- **AKS**: Use Horizontal Pod Autoscaler (HPA)
- **ACI**: Scale by creating multiple container instances

## Cost Optimization

- Use Azure App Service Basic tier for development
- Consider Azure Container Instances for sporadic workloads
- Use AKS for high-availability production deployments

## Troubleshooting

### Common Issues

1. **Container fails to start**: Check environment variables and port configuration
2. **API not accessible**: Verify security group rules and DNS configuration
3. **Health check fails**: Ensure the `/health` endpoint is reachable

### Logs Access

```bash
# App Service logs
az webapp log tail --name mcp-registry-api-unique --resource-group mcp-registry-rg

# ACI logs
az container logs --name mcp-registry-api --resource-group mcp-registry-rg

# AKS logs
kubectl logs deployment/mcp-registry-api
```

## Cleanup

To remove all resources:

```bash
az group delete --name mcp-registry-rg --yes
```