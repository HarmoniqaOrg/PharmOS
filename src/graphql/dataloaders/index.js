const DataLoader = require('dataloader');
const fs = require('fs').promises;
const path = require('path');

// Mock data paths
const DATA_DIR = path.join(__dirname, '../../../data/mock');

// Cache for loaded data
let cachedData = {};

// Load mock data
async function loadMockData(filename) {
  if (!cachedData[filename]) {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf8');
      cachedData[filename] = JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      cachedData[filename] = [];
    }
  }
  return cachedData[filename];
}

// Helper function to group data by key
function groupByKey(data, keyField) {
  return data.reduce((acc, item) => {
    const key = item[keyField];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// DataLoaders factory
function createDataLoaders() {
  // User loaders
  const userLoader = new DataLoader(async (userIds) => {
    // For now, return mock users
    const users = userIds.map(id => ({
      id,
      email: `user${id}@pharmos.com`,
      username: `user${id}`,
      firstName: `First${id}`,
      lastName: `Last${id}`,
      role: 'researcher',
      department: 'Research',
      permissions: ['read', 'write'],
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return users;
  });

  // Molecule loaders
  const moleculeLoader = new DataLoader(async (moleculeIds) => {
    const molecules = await loadMockData('molecules.json');
    const moleculesWithIds = molecules.map((mol, index) => ({
      id: `mol_${index + 1}`,
      name: mol.name,
      smiles: mol.smiles,
      molecularWeight: null,
      logP: null,
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    return moleculeIds.map(id => 
      moleculesWithIds.find(mol => mol.id === id) || null
    );
  });

  const moleculesByProjectLoader = new DataLoader(async (projectIds) => {
    const molecules = await loadMockData('molecules.json');
    const moleculesWithIds = molecules.map((mol, index) => ({
      id: `mol_${index + 1}`,
      name: mol.name,
      smiles: mol.smiles,
      molecularWeight: null,
      logP: null,
      properties: {},
      projectId: `proj_${(index % 3) + 1}`, // Mock project assignment
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return projectIds.map(projectId =>
      moleculesWithIds.filter(mol => mol.projectId === projectId)
    );
  });

  // Project loaders
  const projectLoader = new DataLoader(async (projectIds) => {
    const projects = projectIds.map((id, index) => ({
      id,
      name: `Project ${id}`,
      description: `Description for project ${id}`,
      status: ['PLANNING', 'ACTIVE', 'COMPLETED'][index % 3],
      type: ['DRUG_DISCOVERY', 'CLINICAL_DEVELOPMENT', 'RESEARCH'][index % 3],
      startDate: new Date(),
      endDate: null,
      budget: 1000000 + (index * 500000),
      progress: Math.random() * 100,
      milestones: [`Milestone 1 for ${id}`, `Milestone 2 for ${id}`],
      tags: ['cardiovascular', 'ml-predicted'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return projects;
  });

  const projectsByUserLoader = new DataLoader(async (userIds) => {
    return userIds.map(userId => [
      {
        id: `proj_${userId}_1`,
        name: `Project for User ${userId}`,
        status: 'ACTIVE',
        type: 'DRUG_DISCOVERY',
      }
    ]);
  });

  // Clinical Trial loaders
  const clinicalTrialLoader = new DataLoader(async (trialIds) => {
    const trials = await loadMockData('clinical_trials.json');
    const trialsWithIds = trials.map((trial, index) => ({
      id: `trial_${index + 1}`,
      trialId: trial.trial_id,
      title: trial.title,
      phase: trial.phase.replace(' ', '_').toUpperCase(),
      status: trial.status.toUpperCase(),
      condition: trial.condition,
      intervention: trial.intervention,
      sponsor: trial.sponsor,
      enrollment: trial.enrollment,
      startDate: new Date(trial.start_date),
      completionDate: trial.completion_date ? new Date(trial.completion_date) : null,
      description: null,
      primaryEndpoint: null,
      secondaryEndpoints: [],
      eligibilityCriteria: null,
      locations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return trialIds.map(id =>
      trialsWithIds.find(trial => trial.id === id) || null
    );
  });

  const clinicalTrialsByProjectLoader = new DataLoader(async (projectIds) => {
    const trials = await loadMockData('clinical_trials.json');
    const trialsWithIds = trials.map((trial, index) => ({
      id: `trial_${index + 1}`,
      trialId: trial.trial_id,
      title: trial.title,
      phase: trial.phase.replace(' ', '_').toUpperCase(),
      status: trial.status.toUpperCase(),
      projectId: `proj_${(index % 3) + 1}`, // Mock project assignment
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return projectIds.map(projectId =>
      trialsWithIds.filter(trial => trial.projectId === projectId)
    );
  });

  // Research Paper loaders
  const researchPaperLoader = new DataLoader(async (paperIds) => {
    const papers = await loadMockData('research_papers.json');
    const papersWithIds = papers.map((paper, index) => ({
      id: `paper_${index + 1}`,
      pmid: paper.pmid,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors,
      journal: paper.journal,
      year: paper.year,
      doi: null,
      keywords: [],
      fullText: null,
      citationCount: Math.floor(Math.random() * 100),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return paperIds.map(id =>
      papersWithIds.find(paper => paper.id === id) || null
    );
  });

  // Safety Event loaders
  const safetyEventLoader = new DataLoader(async (eventIds) => {
    const events = await loadMockData('safety_events.json');
    const eventsWithIds = events.map((event, index) => ({
      id: `event_${index + 1}`,
      eventId: event.event_id,
      drugName: event.drug_name,
      eventType: event.event_type,
      severity: event.severity.toUpperCase(),
      patientAge: event.patient_age,
      gender: event.gender,
      outcome: event.outcome.toUpperCase().replace(/ /g, '_'),
      reportedDate: new Date(event.reported_date),
      description: event.description,
      daysToOnset: null,
      doseAtOnset: null,
      concomitantMeds: [],
      medicalHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return eventIds.map(id =>
      eventsWithIds.find(event => event.id === id) || null
    );
  });

  const safetyEventsByMoleculeLoader = new DataLoader(async (moleculeIds) => {
    const events = await loadMockData('safety_events.json');
    const molecules = await loadMockData('molecules.json');
    
    // Map drug names to molecule IDs
    const drugToMoleculeMap = {};
    molecules.forEach((mol, index) => {
      drugToMoleculeMap[mol.name] = `mol_${index + 1}`;
    });

    const eventsWithMolecules = events.map((event, index) => ({
      id: `event_${index + 1}`,
      eventId: event.event_id,
      drugName: event.drug_name,
      eventType: event.event_type,
      severity: event.severity.toUpperCase(),
      moleculeId: drugToMoleculeMap[event.drug_name] || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return moleculeIds.map(moleculeId =>
      eventsWithMolecules.filter(event => event.moleculeId === moleculeId)
    );
  });

  // ML Prediction loaders
  const mlPredictionLoader = new DataLoader(async (predictionIds) => {
    const predictions = await loadMockData('ml_predictions.json');
    const predictionsWithIds = predictions.map((pred, index) => ({
      id: `pred_${index + 1}`,
      moleculeId: pred.molecule_id,
      modelType: 'TOXICITY',
      modelVersion: '1.0.0',
      predictions: pred.predictions,
      confidence: pred.confidence,
      timestamp: new Date(pred.timestamp),
      toxicityScore: pred.predictions.toxicity_score,
      bioavailability: pred.predictions.bioavailability,
      halfLifeHours: pred.predictions.half_life_hours,
      logP: pred.predictions.logP,
      solubilityMgMl: pred.predictions.solubility_mg_ml,
      bindingAffinityNm: pred.predictions.binding_affinity_nm,
    }));

    return predictionIds.map(id =>
      predictionsWithIds.find(pred => pred.id === id) || null
    );
  });

  const mlPredictionsByMoleculeLoader = new DataLoader(async (moleculeIds) => {
    const predictions = await loadMockData('ml_predictions.json');
    const molecules = await loadMockData('molecules.json');
    
    // Map molecule names to IDs
    const nameToIdMap = {};
    molecules.forEach((mol, index) => {
      nameToIdMap[mol.name] = `mol_${index + 1}`;
    });

    const predictionsWithIds = predictions.map((pred, index) => ({
      id: `pred_${index + 1}`,
      moleculeId: nameToIdMap[pred.name] || pred.molecule_id,
      modelType: 'TOXICITY',
      modelVersion: '1.0.0',
      predictions: pred.predictions,
      confidence: pred.confidence,
      timestamp: new Date(pred.timestamp),
      toxicityScore: pred.predictions.toxicity_score,
      bioavailability: pred.predictions.bioavailability,
      halfLifeHours: pred.predictions.half_life_hours,
    }));

    return moleculeIds.map(moleculeId =>
      predictionsWithIds.filter(pred => pred.moleculeId === moleculeId)
    );
  });

  // Research Insight loaders
  const researchInsightLoader = new DataLoader(async (insightIds) => {
    const insights = await loadMockData('research_insights.json');
    const insightsWithIds = insights.map((insight, index) => ({
      id: `insight_${index + 1}`,
      insightId: insight.insight_id,
      topic: insight.topic.toUpperCase(),
      summary: insight.summary,
      keyFindings: insight.key_findings,
      papersAnalyzed: insight.papers_analyzed,
      confidenceScore: insight.confidence_score,
      generatedDate: new Date(insight.generated_date),
      recommendations: [],
      therapeuticTargets: [],
      drugCandidates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return insightIds.map(id =>
      insightsWithIds.find(insight => insight.id === id) || null
    );
  });

  return {
    // User loaders
    userLoader,
    
    // Molecule loaders
    moleculeLoader,
    moleculesByProjectLoader,
    
    // Project loaders
    projectLoader,
    projectsByUserLoader,
    
    // Clinical trial loaders
    clinicalTrialLoader,
    clinicalTrialsByProjectLoader,
    
    // Research paper loaders
    researchPaperLoader,
    
    // Safety event loaders
    safetyEventLoader,
    safetyEventsByMoleculeLoader,
    
    // ML prediction loaders
    mlPredictionLoader,
    mlPredictionsByMoleculeLoader,
    
    // Research insight loaders
    researchInsightLoader,
  };
}

module.exports = { createDataLoaders };