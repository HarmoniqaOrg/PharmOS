# PharmOS Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Docker & Docker Compose
- Git

### Initial Setup

1. **Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

2. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings (optional)
```

3. **Start Services**
```bash
# Start database services
docker-compose up -d postgres mongodb redis

# Initialize databases
python scripts/init_db.py

# Start backend server
npm run dev

# In a new terminal, start ML service
python src/api/main.py

# In another terminal, start frontend
cd frontend
npm run dev
```

4. **Access the Platform**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- ML Service: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Demo Credentials
- Email: demo@pharmos.ai
- Password: demo123

## 📁 Project Structure

```
PharmOS/
├── src/               # Backend source code
│   ├── api/          # API endpoints
│   ├── services/     # Business logic
│   └── models/       # Data models
├── frontend/         # React frontend
├── ml/               # Machine learning
├── config/           # Configuration files
├── scripts/          # Utility scripts
└── docs/            # Documentation
```

## 🔧 Development Commands

### Backend Development
```bash
npm run dev          # Start with hot reload
npm run lint         # Run linter
npm test            # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start dev server
npm run build       # Build for production
npm test           # Run tests
```

### Python/ML Development
```bash
python src/api/main.py    # Start FastAPI server
pytest                    # Run tests
black src/               # Format code
flake8 src/             # Lint code
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change ports in `.env` file
   - Or stop conflicting services

2. **Database Connection Failed**
   - Ensure Docker is running
   - Check database credentials in `.env`

3. **Module Not Found**
   - Run `npm install` or `pip install -r requirements.txt`
   - Activate Python virtual environment

### Getting Help
- Check logs: `npm run logs`
- API health: http://localhost:3000/health
- Report issues: https://github.com/pharmos/pharmos-platform/issues

## 🎯 Next Steps

1. Explore the dashboard at http://localhost:3001
2. Try adding a molecule in the Molecules section
3. Search for research papers in the Research Hub
4. Check the API documentation at http://localhost:8000/docs
5. Read the full documentation in `/docs`

Happy coding! 🧬💊