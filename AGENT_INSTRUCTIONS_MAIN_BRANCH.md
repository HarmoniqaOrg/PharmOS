# 🤖 Simplified Agent Instructions - Main Branch Workflow

## 🚀 New Workflow Rules

ALL AGENTS: Work directly on the main branch. No PRs, no separate branches.

## 🧬 ML Enhancement Agent

Work directly on main branch. Your tasks:

1. **Create** `ml/models/advanced_predictor.py` with enhanced molecular property predictions
2. **Create** `ml/models/qsar_model.py` with QSAR modeling capabilities  
3. **Enhance** `ml/services/ml_service.py` to use the new models
4. Add comments with `# ML-Agent:` to mark your changes
5. Save files frequently

Start with advanced_predictor.py - implement better property predictions using ensemble methods.

## 🎨 Frontend UI Agent

Work directly on main branch. Your tasks:

1. **Create** `frontend/src/components/MoleculeViewer3D.tsx` using Three.js
2. **Create** `frontend/src/components/LoadingSkeleton.tsx` for all pages
3. **Create** `frontend/src/hooks/useTheme.ts` for dark mode support
4. Add comments with `{/* Frontend-Agent: */}` to mark your changes
5. Save files frequently

Start with MoleculeViewer3D.tsx - make it interactive and beautiful.

## 🧪 Testing Guardian  

Work directly on main branch. Your tasks:

1. **Create** `jest.config.js` for backend testing setup
2. **Create** `tests/unit/authService.test.js` with comprehensive auth tests
3. **Create** `tests/integration/api.test.js` for API endpoint testing
4. Add comments with `// Testing-Agent:` to mark your changes
5. Save files frequently

Start with jest.config.js to establish the testing foundation.

## 🔌 API Architect

Work directly on main branch. Your tasks:

1. **Create** `src/graphql/schema.graphql` with complete type definitions
2. **Create** `src/graphql/resolvers/index.js` with query/mutation resolvers  
3. **Create** `src/api/graphql-server.js` to set up Apollo Server
4. Add comments with `// API-Agent:` to mark your changes
5. Save files frequently

Start with schema.graphql - define types for User, Molecule, Project, ClinicalTrial.

## 🔧 DevOps Engineer

Work directly on main branch. Your tasks:

1. **Create** `infrastructure/prometheus/prometheus.yml` with monitoring config
2. **Create** `docker-compose.monitoring.yml` for monitoring stack
3. **Create** `infrastructure/grafana/dashboards/api-metrics.json`
4. Add comments with `# DevOps-Agent:` to mark your changes
5. Save files frequently

Start with prometheus.yml to begin collecting metrics.

## 📋 Important Notes

- Do NOT create branches or PRs
- Work directly on files in main branch
- Save your work frequently  
- The coordinator will commit your changes
- Focus on one file at a time
- Make your code production-ready