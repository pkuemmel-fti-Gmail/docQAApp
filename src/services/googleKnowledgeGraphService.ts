interface GoogleKGEntity {
  '@id': string;
  '@type': string[];
  name: string;
  description?: string;
  detailedDescription?: {
    articleBody: string;
    url: string;
  };
  image?: {
    contentUrl: string;
  };
  resultScore: number;
}

interface GoogleKGResponse {
  itemListElement: GoogleKGEntity[];
}

interface KnowledgeGraphData {
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      size: number;
      color: string;
      cluster: number;
      type: string;
      description?: string;
      score: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      weight: number;
      relationship: string;
    }>;
  };
  insights: {
    gaps: string[];
    questions: string[];
    clusters: Array<{
      id: number;
      label: string;
      concepts: string[];
    }>;
  };
  summary?: string;
  metadata: {
    entityCount: number;
    timestamp: string;
    source: 'google-kg';
  };
}

class GoogleKnowledgeGraphService {
  private apiKey: string;
  private baseUrl: string = 'https://kgsearch.googleapis.com/v1/entities:search';

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  // Extract entities from text and create knowledge graph
  async analyzeText(text: string): Promise<KnowledgeGraphData> {
    if (!this.apiKey) {
      console.warn('Google API key not found, using fallback analysis');
      return this.generateFallbackAnalysis(text);
    }

    try {
      // Extract potential entities from text using simple NLP
      const entities = this.extractEntities(text);
      
      // Query Google Knowledge Graph for each entity
      const knowledgeEntities = await Promise.all(
        entities.slice(0, 10).map(entity => this.searchEntity(entity))
      );

      // Filter out null results and flatten
      const validEntities = knowledgeEntities
        .filter(result => result !== null)
        .flat()
        .slice(0, 15); // Limit to 15 entities

      if (validEntities.length === 0) {
        return this.generateFallbackAnalysis(text);
      }

      return this.buildKnowledgeGraph(validEntities, text);
    } catch (error) {
      console.error('Google Knowledge Graph API error:', error);
      return this.generateFallbackAnalysis(text);
    }
  }

  // Extract potential entities from text
  private extractEntities(text: string): string[] {
    // Simple entity extraction - look for capitalized words, proper nouns
    const words = text.split(/\s+/);
    const entities = new Set<string>();

    // Find capitalized words (potential proper nouns)
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 2 && /^[A-Z][a-z]+/.test(cleaned)) {
        entities.add(cleaned);
      }
    });

    // Find multi-word entities (capitalized phrases)
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const matches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
      if (matches) {
        matches.forEach(match => {
          if (match.length > 3) {
            entities.add(match.trim());
          }
        });
      }
    });

    return Array.from(entities);
  }

  // Search Google Knowledge Graph for an entity
  private async searchEntity(query: string): Promise<GoogleKGEntity[] | null> {
    try {
      const url = `${this.baseUrl}?query=${encodeURIComponent(query)}&key=${this.apiKey}&limit=3&indent=True`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to search for entity: ${query}`);
        return null;
      }

      const data: GoogleKGResponse = await response.json();
      return data.itemListElement || [];
    } catch (error) {
      console.warn(`Error searching for entity ${query}:`, error);
      return null;
    }
  }

  // Build knowledge graph from Google KG entities
  private buildKnowledgeGraph(entities: GoogleKGEntity[], originalText: string): KnowledgeGraphData {
    // Create nodes from entities
    const nodes = entities.map((entity, index) => {
      const types = entity['@type'] || [];
      const primaryType = types[0] || 'Thing';
      
      return {
        id: entity['@id'] || `entity-${index}`,
        label: entity.name,
        size: Math.min(entity.resultScore * 2, 20) + 5,
        color: this.getColorForType(primaryType),
        cluster: this.getClusterForType(primaryType),
        type: primaryType,
        description: entity.description || entity.detailedDescription?.articleBody?.substring(0, 200),
        score: entity.resultScore
      };
    });

    // Create edges based on entity relationships and co-occurrence
    const edges: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Check if entities co-occur in text or share types
        const coOccurs = this.checkCoOccurrence(node1.label, node2.label, originalText);
        const sharedType = node1.cluster === node2.cluster;
        
        if (coOccurs || (sharedType && Math.random() > 0.7)) {
          edges.push({
            source: node1.id,
            target: node2.id,
            weight: coOccurs ? 0.8 : 0.4,
            relationship: sharedType ? 'related' : 'co-occurs'
          });
        }
      }
    }

    // Generate insights
    const insights = this.generateInsights(nodes, originalText);

    return {
      graph: { nodes, edges },
      insights,
      summary: `Identified ${nodes.length} entities from Google Knowledge Graph, including ${this.getTopTypes(nodes).join(', ')}.`,
      metadata: {
        entityCount: nodes.length,
        timestamp: Date.now().toString(),
        source: 'google-kg'
      }
    };
  }

  // Check if two entities co-occur in text
  private checkCoOccurrence(entity1: string, entity2: string, text: string): boolean {
    const sentences = text.split(/[.!?]+/);
    return sentences.some(sentence => 
      sentence.toLowerCase().includes(entity1.toLowerCase()) && 
      sentence.toLowerCase().includes(entity2.toLowerCase())
    );
  }

  // Get color for entity type
  private getColorForType(type: string): string {
    const colorMap: Record<string, string> = {
      'Person': '#3B82F6',
      'Organization': '#10B981',
      'Place': '#F59E0B',
      'Thing': '#8B5CF6',
      'Event': '#EF4444',
      'CreativeWork': '#EC4899',
      'Product': '#06B6D4'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (type.includes(key)) return color;
    }
    return '#6B7280';
  }

  // Get cluster ID for entity type
  private getClusterForType(type: string): number {
    if (type.includes('Person')) return 0;
    if (type.includes('Organization')) return 1;
    if (type.includes('Place')) return 2;
    if (type.includes('Event')) return 3;
    if (type.includes('CreativeWork')) return 4;
    return 5;
  }

  // Get top entity types
  private getTopTypes(nodes: any[]): string[] {
    const typeCounts: Record<string, number> = {};
    nodes.forEach(node => {
      const baseType = node.type.split('/').pop() || 'Thing';
      typeCounts[baseType] = (typeCounts[baseType] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  // Generate insights from entities
  private generateInsights(nodes: any[], originalText: string): any {
    const questions = [
      `What is the relationship between ${nodes[0]?.label} and ${nodes[1]?.label}?`,
      `How do these entities connect to the main topic?`,
      `What additional context would help understand these relationships?`
    ].filter(q => !q.includes('undefined'));

    const gaps = [
      'Consider exploring the historical context of these entities',
      'Additional relationships between entities could be investigated',
      'The temporal aspects of these connections might provide insights'
    ];

    const clusters = [
      {
        id: 0,
        label: 'People & Organizations',
        concepts: nodes.filter(n => n.cluster <= 1).map(n => n.label).slice(0, 5)
      },
      {
        id: 1,
        label: 'Places & Events',
        concepts: nodes.filter(n => n.cluster >= 2 && n.cluster <= 3).map(n => n.label).slice(0, 5)
      },
      {
        id: 2,
        label: 'Concepts & Things',
        concepts: nodes.filter(n => n.cluster >= 4).map(n => n.label).slice(0, 5)
      }
    ].filter(cluster => cluster.concepts.length > 0);

    return { questions, gaps, clusters };
  }

  // Generate follow-up questions based on entities
  async generateFollowUpQuestions(text: string): Promise<string[]> {
    const analysis = await this.analyzeText(text);
    return analysis.insights.questions;
  }

  // Fallback analysis when Google KG is not available
  private generateFallbackAnalysis(text: string): KnowledgeGraphData {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const uniqueWords = [...new Set(words)].slice(0, 15);
    
    const nodes = uniqueWords.map((word, index) => ({
      id: word,
      label: word,
      size: Math.random() * 10 + 5,
      color: `hsl(${index * 137.5 % 360}, 70%, 60%)`,
      cluster: Math.floor(index / 5),
      type: 'Concept',
      score: Math.random()
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() > 0.7) {
        edges.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          weight: Math.random(),
          relationship: 'related'
        });
      }
    }

    return {
      graph: { nodes, edges },
      insights: {
        gaps: ['Consider exploring connections between key concepts'],
        questions: [
          'How do these concepts relate to each other?',
          'What additional context would be helpful?',
          'What are the implications of these relationships?'
        ],
        clusters: [
          {
            id: 0,
            label: 'Main Concepts',
            concepts: uniqueWords.slice(0, 5)
          }
        ]
      },
      summary: 'Using fallback text analysis (Google Knowledge Graph unavailable)',
      metadata: {
        entityCount: nodes.length,
        timestamp: Date.now().toString(),
        source: 'fallback'
      }
    };
  }
}

export const googleKnowledgeGraphService = new GoogleKnowledgeGraphService();