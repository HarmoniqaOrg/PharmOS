const fs = require('fs').promises;
const path = require('path');

class MockDataService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/mock');
  }

  async loadJSON(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return [];
    }
  }

  async getMolecules() {
    return this.loadJSON('molecules.json');
  }

  async getResearchPapers(query = '') {
    const papers = await this.loadJSON('research_papers.json');
    if (!query) return papers;
    
    const lowerQuery = query.toLowerCase();
    return papers.filter(paper => 
      paper.title.toLowerCase().includes(lowerQuery) ||
      paper.abstract.toLowerCase().includes(lowerQuery) ||
      paper.authors.some(author => author.toLowerCase().includes(lowerQuery))
    );
  }

  async getClinicalTrials(filters = {}) {
    const trials = await this.loadJSON('clinical_trials.json');
    
    return trials.filter(trial => {
      if (filters.phase && trial.phase !== filters.phase) return false;
      if (filters.status && trial.status !== filters.status) return false;
      if (filters.condition && !trial.condition.toLowerCase().includes(filters.condition.toLowerCase())) return false;
      return true;
    });
  }

  async getSafetyEvents(drugName = '') {
    const events = await this.loadJSON('safety_events.json');
    if (!drugName) return events;
    
    return events.filter(event => 
      event.drug_name.toLowerCase().includes(drugName.toLowerCase())
    );
  }

  async getMLPredictions(moleculeId) {
    const predictions = await this.loadJSON('ml_predictions.json');
    if (!moleculeId) return predictions;
    
    return predictions.find(pred => pred.molecule_id === moleculeId);
  }

  async getResearchInsights(topic = '') {
    const insights = await this.loadJSON('research_insights.json');
    if (!topic) return insights;
    
    return insights.filter(insight => 
      insight.topic.toLowerCase().includes(topic.toLowerCase())
    );
  }

  async getDashboardStats() {
    const [molecules, papers, trials, events] = await Promise.all([
      this.getMolecules(),
      this.getResearchPapers(),
      this.getClinicalTrials(),
      this.getSafetyEvents()
    ]);

    return {
      activeResearch: papers.length,
      moleculesAnalyzed: molecules.length,
      clinicalTrials: trials.length,
      safetyEvents: events.length,
      teamMembers: 15, // Mock number
      recentActivity: [
        {
          type: 'molecule_analysis',
          description: 'New molecule analysis completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'paper_added',
          description: 'Research paper added to library',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'trial_update',
          description: 'Clinical trial update received',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  }

  // Generate a simple molecular property prediction
  calculateMolecularProperties(smiles) {
    // Simple mock calculations based on SMILES length and complexity
    const atomCount = (smiles.match(/[CNOSPFClBrI]/g) || []).length;
    const ringCount = (smiles.match(/[0-9]/g) || []).length / 2;
    const doubleBonds = (smiles.match(/=/g) || []).length;
    
    return {
      molecularWeight: atomCount * 12 + ringCount * 50 + Math.random() * 50,
      logP: Math.min(5, Math.max(-2, ringCount * 0.5 + doubleBonds * 0.3 + Math.random() * 2)),
      hbondDonors: (smiles.match(/[NOH]/g) || []).length,
      hbondAcceptors: (smiles.match(/[NOF]/g) || []).length,
      rotableBonds: Math.floor(atomCount / 3),
      polarSurfaceArea: atomCount * 2.5 + Math.random() * 20,
      complexity: atomCount + ringCount * 10 + doubleBonds * 5
    };
  }
}

module.exports = new MockDataService();