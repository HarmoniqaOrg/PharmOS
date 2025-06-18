# PharmOS DevOps Guide - Phase 1 Monitoring Implementation

## Overview

This document describes the Phase 1 implementation of monitoring and observability for the PharmOS platform. This implementation includes Prometheus metrics collection, Grafana dashboards, health check endpoints, optimized Docker Compose for development, and basic Kubernetes manifests.

## Architecture

### Monitoring Stack Components

1. **Prometheus** - Metrics collection and alerting
2. **Grafana** - Visualization and dashboards
3. **Exporters** - Database and system metrics collection
4. **Health Endpoints** - Service health monitoring
5. **Logs** - Centralized logging with Loki

### Services Monitored

- **Backend API** (Node.js) - HTTP metrics, health status
- **ML Service** (Python/FastAPI) - Prediction metrics, model performance
- **PostgreSQL** - Database performance and connections
- **MongoDB** - Document database metrics
- **Redis** - Cache performance and memory usage
- **Elasticsearch** - Search engine metrics
- **System** - Node and container metrics

## Quick Start

### Development Environment (Docker Compose)

```bash
# Deploy the complete monitoring stack
./infrastructure/scripts/deploy-monitoring.sh --docker

# Or manually with Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

### Production Environment (Kubernetes)

```bash
# Deploy to Kubernetes cluster
./infrastructure/scripts/deploy-monitoring.sh --kubernetes

# Or manually apply manifests
kubectl apply -f infrastructure/k8s/
```

## Service Endpoints

### Development (Docker Compose)

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3000 | Main API endpoints |
| ML Service | http://localhost:8000 | Machine learning predictions |
| Prometheus | http://localhost:9090 | Metrics and alerts |
| Grafana | http://localhost:3001 | Dashboards (admin/admin) |
| PostgreSQL | localhost:5432 | Database |
| MongoDB | localhost:27017 | Document storage |
| Redis | localhost:6379 | Cache |
| Elasticsearch | http://localhost:9200 | Search engine |

### Health Endpoints

- Backend: `GET /health`
- ML Service: `GET /health`
- Detailed health: `GET /health/detailed`

### Metrics Endpoints

- Backend: `GET /metrics` (Prometheus format)
- ML Service: `GET /metrics` (Prometheus format)

## Dashboards

### Available Grafana Dashboards

1. **PharmOS Overview** - High-level system health
   - Service status gauges
   - Request rates
   - Response times
   - CPU usage

2. **API Metrics** - Detailed API performance
   - Request rate by endpoint
   - Error rates
   - Response time percentiles

3. **ML Service** - Machine learning specific metrics
   - Prediction rates
   - Model latency
   - Memory usage
   - Model accuracy

### Dashboard Import

Dashboards are automatically provisioned from:
- `infrastructure/grafana/dashboards/pharmos-overview.json`
- `infrastructure/grafana/dashboards/api-metrics.json`
- `infrastructure/grafana/dashboards/ml-service.json`

## Metrics Reference

### Backend API Metrics

```prometheus
# Request metrics
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}
http_active_connections

# Application metrics
node_js_heap_used_bytes
node_js_heap_total_bytes
```

### ML Service Metrics

```prometheus
# Prediction metrics
ml_predictions_total{prediction_type}
ml_prediction_duration_seconds{prediction_type}
ml_model_accuracy{model_name}
ml_active_connections

# System metrics
process_cpu_seconds_total
process_memory_bytes
```

## Alerting Rules

### Critical Alerts

- **ServiceDown** - Service unavailable for >1 minute
- **HighErrorRate** - Error rate >10% for >2 minutes
- **DiskSpaceLow** - Disk space <10%

### Warning Alerts

- **HighResponseTime** - 95th percentile >1s for >5 minutes
- **HighMemoryUsage** - Memory usage >80% for >10 minutes
- **HighCPUUsage** - CPU usage >80% for >10 minutes

## Docker Configuration

### Multi-stage Dockerfiles

Both services use optimized multi-stage builds:

**Backend (Node.js)**
- `development` - Hot reload, dev dependencies
- `production` - Minimal production image

**ML Service (Python)**
- `development` - With reload capabilities
- `production` - Optimized Python environment

### Docker Compose Features

- Health checks for all services
- Dependency management with `depends_on`
- Named volumes for data persistence
- Custom network for service isolation
- Resource limits and monitoring

## Kubernetes Deployment

### Manifests Structure

```
infrastructure/k8s/
├── namespace.yaml      # PharmOS namespace
├── configmap.yaml      # Configuration and Prometheus config
├── secrets.yaml        # Sensitive configuration
├── postgres.yaml       # PostgreSQL deployment
├── redis.yaml          # Redis deployment
├── backend.yaml        # Backend API deployment
├── ml-service.yaml     # ML service deployment
└── monitoring.yaml     # Prometheus and Grafana
```

### Key Features

- **RBAC** - Service accounts with minimal permissions
- **Health Checks** - Liveness and readiness probes
- **Resource Limits** - CPU and memory constraints
- **Persistent Storage** - PVCs for data persistence
- **Service Discovery** - Kubernetes-native service discovery
- **Ingress** - External access configuration

### Deployment Order

1. Namespace and RBAC
2. ConfigMaps and Secrets
3. Persistent storage (PostgreSQL, Redis)
4. Application services (Backend, ML)
5. Monitoring stack (Prometheus, Grafana)

## Security Considerations

### Secrets Management

- Database passwords stored in Kubernetes secrets
- JWT secrets properly encoded
- Grafana admin password configurable

### Network Security

- Services communicate within cluster network
- Ingress controllers handle external access
- TLS termination at ingress level

### RBAC

- Prometheus service account with minimal cluster permissions
- Separate service accounts for each component

## Performance Tuning

### Resource Allocation

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Backend | 250m | 500m | 256Mi | 512Mi |
| ML Service | 500m | 1000m | 512Mi | 1Gi |
| Prometheus | 500m | 1000m | 512Mi | 1Gi |
| Grafana | 250m | 500m | 256Mi | 512Mi |
| PostgreSQL | 250m | 500m | 256Mi | 512Mi |
| Redis | 100m | 200m | 128Mi | 256Mi |

### Storage Configuration

- **Prometheus**: 10Gi retention for 15 days
- **Grafana**: 5Gi for dashboards and plugins
- **PostgreSQL**: 10Gi for application data
- **Redis**: 5Gi for cache persistence

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose logs [service-name]
   kubectl logs deployment/[service-name] -n pharmos
   ```

2. **Health Check Failures**
   ```bash
   # Test health endpoints
   curl http://localhost:3000/health
   curl http://localhost:8000/health
   ```

3. **Metrics Not Appearing**
   ```bash
   # Check Prometheus targets
   curl http://localhost:9090/api/v1/targets
   ```

4. **Dashboard Not Loading**
   ```bash
   # Check Grafana datasource
   curl http://localhost:3001/api/datasources
   ```

### Log Collection

```bash
# Docker Compose logs
docker-compose -f docker-compose.dev.yml logs -f

# Kubernetes logs
kubectl logs -f deployment/pharmos-backend -n pharmos
kubectl logs -f deployment/prometheus -n pharmos
```

## Maintenance

### Backup Procedures

1. **Prometheus Data**
   ```bash
   # Create snapshot
   curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
   ```

2. **Grafana Dashboards**
   ```bash
   # Export dashboards via API
   curl -H "Authorization: Bearer $API_KEY" \
        http://localhost:3001/api/dashboards/uid/$DASHBOARD_UID
   ```

### Updates and Scaling

1. **Update Docker Images**
   ```bash
   docker-compose -f docker-compose.dev.yml pull
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Scale Kubernetes Deployments**
   ```bash
   kubectl scale deployment pharmos-backend --replicas=3 -n pharmos
   kubectl scale deployment pharmos-ml-service --replicas=3 -n pharmos
   ```

## Next Steps (Phase 2)

1. **Advanced Alerting**
   - Alertmanager integration
   - Slack/email notifications
   - Escalation policies

2. **Distributed Tracing**
   - Jaeger integration
   - Request tracing across services

3. **Log Analytics**
   - ELK stack enhancement
   - Log parsing and analysis

4. **Security Monitoring**
   - Vulnerability scanning
   - Security event monitoring

5. **CI/CD Integration**
   - Pipeline monitoring
   - Deployment tracking

## Support

For issues and questions:
- Check the troubleshooting section above
- Review logs from affected services
- Verify network connectivity between services
- Ensure all prerequisites are met

---

**Implemented by**: DevOps Agent  
**Version**: Phase 1  
**Last Updated**: December 2024