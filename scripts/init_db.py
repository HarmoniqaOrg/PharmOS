#!/usr/bin/env python3
"""
Database initialization script for PharmOS platform
Creates necessary tables, indexes, and seed data
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import psycopg2
from pymongo import MongoClient
import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection strings
POSTGRES_URL = os.getenv('POSTGRES_URL', 'postgresql://pharmos_user:pharmos_pass@localhost:5432/pharmos_db')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/pharmos')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

def init_postgres():
    """Initialize PostgreSQL database schema"""
    logger.info("Initializing PostgreSQL database...")
    
    try:
        engine = create_engine(POSTGRES_URL)
        
        # Create tables
        with engine.connect() as conn:
            # Users table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Organizations table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS organizations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(100),
                    license_type VARCHAR(50),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Projects table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    organization_id INTEGER REFERENCES organizations(id),
                    owner_id INTEGER REFERENCES users(id),
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Molecules table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS molecules (
                    id SERIAL PRIMARY KEY,
                    smiles VARCHAR(1000) NOT NULL,
                    inchi VARCHAR(2000),
                    name VARCHAR(255),
                    molecular_weight FLOAT,
                    logp FLOAT,
                    project_id INTEGER REFERENCES projects(id),
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Clinical trials table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS clinical_trials (
                    id SERIAL PRIMARY KEY,
                    trial_id VARCHAR(100) UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    phase VARCHAR(20),
                    status VARCHAR(50),
                    condition TEXT,
                    intervention TEXT,
                    sponsor VARCHAR(255),
                    start_date DATE,
                    completion_date DATE,
                    project_id INTEGER REFERENCES projects(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Safety events table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS safety_events (
                    id SERIAL PRIMARY KEY,
                    event_id VARCHAR(100) UNIQUE NOT NULL,
                    drug_name VARCHAR(255),
                    event_type VARCHAR(100),
                    severity VARCHAR(50),
                    description TEXT,
                    reported_by INTEGER REFERENCES users(id),
                    project_id INTEGER REFERENCES projects(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # API keys table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS api_keys (
                    id SERIAL PRIMARY KEY,
                    key_hash VARCHAR(255) UNIQUE NOT NULL,
                    user_id INTEGER REFERENCES users(id),
                    name VARCHAR(100),
                    permissions JSONB,
                    last_used TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Create indexes
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_molecules_smiles ON molecules(smiles);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_molecules_project ON molecules(project_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_trials_status ON clinical_trials(status);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_safety_events_drug ON safety_events(drug_name);"))
            
            conn.commit()
            
        logger.info("PostgreSQL initialization completed successfully")
        
    except Exception as e:
        logger.error(f"PostgreSQL initialization failed: {e}")
        raise

def init_mongodb():
    """Initialize MongoDB collections and indexes"""
    logger.info("Initializing MongoDB...")
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client.pharmos
        
        # Create collections
        collections = [
            'research_papers',
            'molecule_designs',
            'experiment_results',
            'ml_models',
            'agent_tasks',
            'knowledge_graphs'
        ]
        
        for collection_name in collections:
            if collection_name not in db.list_collection_names():
                db.create_collection(collection_name)
                logger.info(f"Created collection: {collection_name}")
        
        # Create indexes
        db.research_papers.create_index([('title', 'text'), ('abstract', 'text')])
        db.research_papers.create_index('pmid', unique=True, sparse=True)
        db.molecule_designs.create_index('project_id')
        db.ml_models.create_index([('name', 1), ('version', 1)], unique=True)
        
        logger.info("MongoDB initialization completed successfully")
        
    except Exception as e:
        logger.error(f"MongoDB initialization failed: {e}")
        raise

def init_redis():
    """Initialize Redis and set default configurations"""
    logger.info("Initializing Redis...")
    
    try:
        r = redis.from_url(REDIS_URL)
        
        # Test connection
        r.ping()
        
        # Set default configurations
        default_configs = {
            'rate_limit:api': '1000',  # requests per hour
            'cache_ttl:default': '3600',  # 1 hour
            'cache_ttl:ml_predictions': '86400',  # 24 hours
            'queue:priority:research': '10',
            'queue:priority:safety': '20'
        }
        
        for key, value in default_configs.items():
            r.set(f'config:{key}', value)
            
        logger.info("Redis initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Redis initialization failed: {e}")
        raise

def create_seed_data():
    """Create initial seed data for development"""
    logger.info("Creating seed data...")
    
    try:
        engine = create_engine(POSTGRES_URL)
        
        with engine.connect() as conn:
            # Create default organization
            result = conn.execute(text("""
                INSERT INTO organizations (name, type, license_type)
                VALUES ('PharmOS Demo', 'research', 'enterprise')
                ON CONFLICT DO NOTHING
                RETURNING id;
            """))
            
            # Create demo user (password: demo123)
            conn.execute(text("""
                INSERT INTO users (email, username, password_hash, full_name, role)
                VALUES (
                    'demo@pharmos.ai',
                    'demo_user',
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewvfma7XkwVpBVYa',
                    'Demo User',
                    'admin'
                )
                ON CONFLICT (email) DO NOTHING;
            """))
            
            conn.commit()
            
        logger.info("Seed data created successfully")
        
    except Exception as e:
        logger.error(f"Seed data creation failed: {e}")

def main():
    """Main initialization function"""
    logger.info("Starting PharmOS database initialization...")
    
    try:
        # Initialize databases
        init_postgres()
        init_mongodb()
        init_redis()
        
        # Create seed data
        if os.getenv('CREATE_SEED_DATA', 'true').lower() == 'true':
            create_seed_data()
        
        logger.info("Database initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()