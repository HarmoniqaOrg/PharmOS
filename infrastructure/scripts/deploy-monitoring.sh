#!/bin/bash

# PharmOS Monitoring Stack Deployment Script
# This script deploys the monitoring infrastructure for PharmOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/.."
ROOT_DIR="${INFRA_DIR}/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying monitoring stack with Docker Compose..."
    
    cd "${ROOT_DIR}"
    
    # Build and start services
    log_info "Building Docker images..."
    docker-compose -f docker-compose.dev.yml build
    
    log_info "Starting services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health() {
        local service=$1
        local port=$2
        local endpoint=$3
        
        log_info "Checking health of $service..."
        if curl -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            log_success "$service is healthy"
        else
            log_warning "$service health check failed"
        fi
    }
    
    check_service_health "Backend API" "3000" "/health"
    check_service_health "ML Service" "8000" "/health"
    check_service_health "Prometheus" "9090" "/-/healthy"
    check_service_health "Grafana" "3001" "/api/health"
    
    log_success "Monitoring stack deployed successfully with Docker Compose"
    
    # Display access information
    echo ""
    echo "=== Service Access Information ==="
    echo "Backend API:       http://localhost:3000"
    echo "ML Service:        http://localhost:8000"
    echo "Prometheus:        http://localhost:9090"
    echo "Grafana:          http://localhost:3001 (admin/admin)"
    echo "PostgreSQL:        localhost:5432"
    echo "MongoDB:           localhost:27017"
    echo "Redis:             localhost:6379"
    echo "Elasticsearch:     http://localhost:9200"
    echo ""
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying monitoring stack to Kubernetes..."
    
    # Check if kubectl is available
    if ! command -v kubectl > /dev/null 2>&1; then
        log_error "kubectl is not installed. Please install kubectl and try again."
        exit 1
    fi
    
    # Check if we can connect to a cluster
    if ! kubectl cluster-info > /dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubectl configuration."
        exit 1
    fi
    
    cd "${INFRA_DIR}/k8s"
    
    # Apply Kubernetes manifests in order
    log_info "Creating namespace..."
    kubectl apply -f namespace.yaml
    
    log_info "Creating ConfigMaps and Secrets..."
    kubectl apply -f configmap.yaml
    kubectl apply -f secrets.yaml
    
    log_info "Deploying PostgreSQL..."
    kubectl apply -f postgres.yaml
    
    log_info "Deploying Redis..."
    kubectl apply -f redis.yaml
    
    log_info "Deploying backend service..."
    kubectl apply -f backend.yaml
    
    log_info "Deploying ML service..."
    kubectl apply -f ml-service.yaml
    
    log_info "Deploying monitoring stack..."
    kubectl apply -f monitoring.yaml
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n pharmos
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n pharmos
    kubectl wait --for=condition=available --timeout=300s deployment/pharmos-backend -n pharmos
    kubectl wait --for=condition=available --timeout=300s deployment/pharmos-ml-service -n pharmos
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n pharmos
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n pharmos
    
    log_success "Monitoring stack deployed successfully to Kubernetes"
    
    # Display access information
    echo ""
    echo "=== Kubernetes Service Information ==="
    kubectl get services -n pharmos
    echo ""
    echo "=== Ingress Information ==="
    kubectl get ingress -n pharmos
    echo ""
    echo "To access services locally, use port-forward:"
    echo "kubectl port-forward svc/pharmos-backend 3000:3000 -n pharmos"
    echo "kubectl port-forward svc/pharmos-ml-service 8000:8000 -n pharmos"
    echo "kubectl port-forward svc/prometheus 9090:9090 -n pharmos"
    echo "kubectl port-forward svc/grafana 3001:3000 -n pharmos"
    echo ""
}

# Main deployment function
main() {
    echo "PharmOS Monitoring Stack Deployment"
    echo "===================================="
    echo ""
    
    # Parse command line arguments
    MODE="docker"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --kubernetes|--k8s)
                MODE="kubernetes"
                shift
                ;;
            --docker)
                MODE="docker"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--docker|--kubernetes] [--help]"
                echo ""
                echo "Options:"
                echo "  --docker        Deploy using Docker Compose (default)"
                echo "  --kubernetes    Deploy to Kubernetes cluster"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    
    case $MODE in
        docker)
            deploy_docker_compose
            ;;
        kubernetes)
            deploy_kubernetes
            ;;
        *)
            log_error "Invalid deployment mode: $MODE"
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"