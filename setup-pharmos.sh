#!/bin/bash
# PharmOS Platform Initialization Script

set -e

echo "🚀 PharmOS Platform Initialization"
echo "==================================="

# Create directory structure
echo "Creating project structure..."
mkdir -p {src/{api,frontend,services,models,utils,agents},config,scripts,docs,tests/{unit,integration,e2e},data/{raw,processed},ml/{models,training},infrastructure/{docker,kubernetes,terraform},agents/{research,analysis,safety}}

# Initialize package.json for Node.js backend
cat > package.json <<EOF
{
  "name": "pharmos-platform",
  "version": "0.1.0",
  "description": "Revolutionary AI-powered pharmaceutical innovation platform",
  "main": "src/api/server.js",
  "scripts": {
    "start": "node src/api/server.js",
    "dev": "nodemon src/api/server.js",
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "build": "webpack --mode production",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "keywords": ["pharmaceutical", "AI", "drug-discovery", "healthcare"],
  "author": "PharmOS Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.3",
    "redis": "^4.6.11",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "axios": "^1.6.2",
    "node-cron": "^3.0.3",
    "socket.io": "^4.6.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4"
  }
}
EOF

# Initialize Python requirements
cat > requirements.txt <<EOF
# Core dependencies
fastapi==0.109.0
uvicorn==0.25.0
pydantic==2.5.3
sqlalchemy==2.0.25
alembic==1.13.1
redis==5.0.1
celery==5.3.4

# ML and Data Science
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.3.2
tensorflow==2.15.0
torch==2.1.2
transformers==4.36.2
rdkit==2023.9.4

# Bioinformatics
biopython==1.82
pymol==2.5.0

# API and Web
httpx==0.26.0
beautifulsoup4==4.12.2
selenium==4.16.0

# Database
psycopg2-binary==2.9.9
motor==3.3.2

# Testing
pytest==7.4.4
pytest-cov==4.1.0
pytest-asyncio==0.21.1

# Monitoring and Logging
prometheus-client==0.19.0
sentry-sdk==1.39.1

# Development
black==23.12.1
flake8==7.0.0
mypy==1.8.0
pre-commit==3.6.0
EOF

# Create .env.example
cat > .env.example <<EOF
# Server Configuration
NODE_ENV=development
PORT=3000
API_PORT=8000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pharmos
POSTGRES_DB=pharmos_db
POSTGRES_USER=pharmos_user
POSTGRES_PASSWORD=secure_password_here
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# API Keys (obtain when needed)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
FDA_API_KEY=
PUBMED_API_KEY=

# External Services
ELASTICSEARCH_URL=http://localhost:9200
GRAFANA_URL=http://localhost:3001
PROMETHEUS_URL=http://localhost:9090

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Feature Flags
ENABLE_ML_PREDICTIONS=true
ENABLE_REAL_TIME_SYNC=true
ENABLE_ADVANCED_ANALYTICS=true
EOF

# Create .gitignore
cat > .gitignore <<EOF
# Dependencies
node_modules/
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Testing
coverage/
.coverage
.pytest_cache/
htmlcov/

# Build outputs
dist/
build/
*.egg-info/
.eggs/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
.docker/

# ML Models
ml/models/*.h5
ml/models/*.pkl
ml/models/*.pt

# Data
data/raw/*
data/processed/*
!data/raw/.gitkeep
!data/processed/.gitkeep

# Temporary files
tmp/
temp/
*.tmp
EOF

# Create README.md
cat > README.md <<EOF
# PharmOS Platform

## Revolutionary AI-Powered Pharmaceutical Innovation Platform

PharmOS is building the future of drug discovery - a comprehensive platform that combines cutting-edge AI, real-time collaboration, and pharmaceutical expertise to accelerate the development of life-saving medications.

### 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/pharmos/pharmos-platform.git
cd pharmos-platform

# Run setup script
./setup-dev-environment.sh

# Initialize the platform
./setup-pharmos.sh

# Start development servers
npm run dev  # Backend
python src/api/main.py  # Python services
\`\`\`

### 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + FastAPI
- **Database**: PostgreSQL + MongoDB + Redis
- **ML/AI**: TensorFlow + PyTorch + Custom Models
- **Infrastructure**: Docker + Kubernetes + AWS/GCP

### 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
EOF

# Create PHARMOS_MASTER.md
cat > PHARMOS_MASTER.md <<EOF
# PharmOS Master Control Document

## Project Vision
Build a revolutionary AI-powered pharmaceutical innovation platform that will become the GitHub of drug discovery, starting with cardiovascular therapeutics and scaling to a billion-dollar ecosystem.

## Core Architecture

### 1. Platform Components
- **Research Hub**: AI-powered literature analysis and drug discovery
- **Collaboration Network**: Real-time team collaboration tools
- **Safety Analytics**: Predictive adverse event detection
- **Clinical Trials Management**: End-to-end trial optimization
- **Regulatory Compliance**: Automated FDA submission preparation

### 2. Technology Stack
- **Frontend**: React, TypeScript, TailwindCSS, WebGL for 3D molecular visualization
- **Backend**: Node.js/Express + Python/FastAPI hybrid architecture
- **Databases**: PostgreSQL (primary), MongoDB (documents), Redis (cache)
- **ML/AI**: TensorFlow, PyTorch, Transformers, RDKit for chemistry
- **Infrastructure**: Docker, Kubernetes, AWS/GCP multi-cloud

### 3. Key Features
- Real-time collaborative drug design
- AI-powered literature mining
- Predictive toxicity modeling
- Clinical trial matching
- Regulatory document generation
- Patent landscape analysis

### 4. Development Workflow
1. Feature branches from main
2. Automated testing on all PRs
3. Code review required
4. Staging deployment for validation
5. Production deployment with monitoring

### 5. Success Metrics
- 10,000 GitHub stars in 6 months
- 100,000 weekly active users
- \$10M ARR potential
- 99.99% uptime capability
- <100ms API response time

### 6. Security & Compliance
- HIPAA compliant infrastructure
- End-to-end encryption
- Role-based access control
- Audit logging
- Data anonymization

### 7. Monetization Strategy
- Freemium model for researchers
- Enterprise licenses for pharma companies
- API access tiers
- Premium AI features
- Consulting services
EOF

# Create AGENTS.md
cat > AGENTS.md <<EOF
# PharmOS Agent System

## Overview
The PharmOS platform employs specialized AI agents to handle different aspects of pharmaceutical research and development.

## Agent Types

### 1. Research Agent
- **Purpose**: Literature mining and knowledge synthesis
- **Capabilities**:
  - PubMed/NCBI database searching
  - Paper summarization and extraction
  - Knowledge graph construction
  - Citation network analysis

### 2. Molecule Design Agent
- **Purpose**: AI-driven drug design and optimization
- **Capabilities**:
  - SMILES generation and validation
  - Property prediction
  - Lead optimization
  - Toxicity screening

### 3. Clinical Trial Agent
- **Purpose**: Clinical trial design and patient matching
- **Capabilities**:
  - Protocol optimization
  - Site selection
  - Patient recruitment prediction
  - Adverse event monitoring

### 4. Regulatory Agent
- **Purpose**: Regulatory compliance and documentation
- **Capabilities**:
  - FDA guideline compliance checking
  - Document generation
  - Submission preparation
  - Change management

### 5. Safety Monitoring Agent
- **Purpose**: Real-time safety surveillance
- **Capabilities**:
  - Adverse event detection
  - Signal detection algorithms
  - Risk assessment
  - Safety report generation

## Agent Communication Protocol
- RESTful API endpoints
- WebSocket for real-time updates
- Message queue for async processing
- Standardized JSON response format

## Deployment Strategy
- Containerized microservices
- Auto-scaling based on load
- Health monitoring
- Graceful degradation
EOF

# Create .cursorrules
cat > .cursorrules <<EOF
# PharmOS Development Rules

## Code Style
- Use ESLint and Prettier for JavaScript/TypeScript
- Use Black and Flake8 for Python
- Maintain consistent naming conventions
- Write self-documenting code

## Architecture Guidelines
- Follow microservices patterns
- Implement proper error handling
- Use dependency injection
- Write comprehensive tests

## Security Best Practices
- Never commit secrets or API keys
- Validate all inputs
- Use parameterized queries
- Implement rate limiting

## Performance Requirements
- API responses < 100ms
- Database queries optimized
- Implement caching strategies
- Monitor memory usage

## Documentation Standards
- Update README for new features
- Document all API endpoints
- Include code examples
- Maintain changelog
EOF

# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pharmos_db
      POSTGRES_USER: pharmos_user
      POSTGRES_PASSWORD: pharmos_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: elasticsearch:8.11.3
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - mongodb
      - redis
    volumes:
      - ./src:/app/src
      - ./config:/app/config

  ml-service:
    build:
      context: .
      dockerfile: Dockerfile.ml
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    depends_on:
      - postgres
      - redis
    volumes:
      - ./ml:/app/ml
      - ./src/api:/app/src/api

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  es_data:
EOF

# Create Dockerfile.backend
cat > Dockerfile.backend <<EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Create Dockerfile.ml
cat > Dockerfile.ml <<EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# Update CLAUDE.md with comprehensive information
cat > CLAUDE.md <<EOF
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Setup and Installation
\`\`\`bash
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
\`\`\`

### Development
\`\`\`bash
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
\`\`\`

### Testing
\`\`\`bash
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
\`\`\`

### Build and Deployment
\`\`\`bash
# Build for production
npm run build
docker-compose build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
\`\`\`

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
EOF

echo "✅ PharmOS platform structure initialized!"
echo ""
echo "Directory structure created:"
tree -d -L 2 2>/dev/null || find . -type d -maxdepth 2 | sort

echo ""
echo "Next steps:"
echo "1. Install Node.js dependencies: npm install"
echo "2. Set up Python environment: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "3. Configure environment variables: cp .env.example .env"
echo "4. Start services: docker-compose up -d"