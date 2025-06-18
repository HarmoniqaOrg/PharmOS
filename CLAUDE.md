# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Setup and Installation
```bash
# Initial setup
./setup-dev-environment.sh
./setup-pharmos.sh

# Install dependencies
npm install
pip install -r requirements.txt

# Database setup
docker-compose up -d postgres mongodb redis
npm run db:migrate
python scripts/init_db.py
```

### Development
```bash
# Start all services
docker-compose up -d
npm run dev
python src/api/main.py

# Run specific services
npm run api:dev     # Node.js API only
npm run ml:dev      # ML service only
npm run frontend:dev # Frontend only

# Code quality
npm run lint
npm run format
python -m black src/
python -m flake8 src/
```

### Testing
```bash
# Run all tests
npm test
pytest

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
pytest tests/unit
pytest tests/integration

# Run with coverage
npm run test:coverage
pytest --cov=src --cov-report=html
```

### Build and Deployment
```bash
# Build for production
npm run build
docker-compose build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## High-Level Architecture

### System Overview
PharmOS is a microservices-based platform with:
- **API Gateway**: Routes requests to appropriate services
- **Service Mesh**: Inter-service communication
- **Event Bus**: Async message passing
- **Data Pipeline**: ETL for research data

### Core Services
1. **Authentication Service** (src/services/auth/)
   - JWT-based authentication
   - OAuth2 integration
   - Role-based access control

2. **Research Service** (src/services/research/)
   - Literature mining
   - Knowledge graph operations
   - Citation analysis

3. **Molecule Service** (src/services/molecule/)
   - Chemical structure analysis
   - Property prediction
   - Similarity searching

4. **Clinical Service** (src/services/clinical/)
   - Trial management
   - Patient matching
   - Protocol optimization

5. **ML Pipeline** (ml/)
   - Model training workflows
   - Feature engineering
   - Model serving

### Data Architecture
- **PostgreSQL**: Transactional data, user management
- **MongoDB**: Document storage, research papers
- **Redis**: Caching, session management, job queues
- **Elasticsearch**: Full-text search, analytics

### API Design Patterns
- RESTful endpoints for CRUD operations
- GraphQL for complex queries
- WebSockets for real-time features
- gRPC for internal service communication

### Security Architecture
- API key management
- Rate limiting per endpoint
- Request validation middleware
- Audit logging system

### Frontend Architecture
- Component-based React structure
- Redux for state management
- React Query for API calls
- Tailwind CSS for styling

## Key Design Decisions

1. **Hybrid Node.js/Python Backend**: Leverages JavaScript for web APIs and Python for scientific computing
2. **Microservices**: Enables independent scaling and development
3. **Event-Driven**: Supports real-time features and async processing
4. **Multi-Database**: Optimizes for different data access patterns
5. **Container-First**: Ensures consistent deployment across environments

## MCP Server Configuration

The platform uses Model Context Protocol servers for:
- Database access (PostgreSQL, MongoDB)
- External API integrations
- File system operations
- Monitoring and logging

Configuration files are in config/mcp/

## Agent System

Specialized agents handle domain-specific tasks:
- Research Agent: Literature analysis
- Design Agent: Molecule optimization
- Safety Agent: Adverse event monitoring
- Regulatory Agent: Compliance checking

See AGENTS.md for detailed specifications.