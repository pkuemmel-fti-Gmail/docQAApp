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
  private useGoogleKG: boolean = false; // Disable Google KG by default due to API restrictions

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    // Enable Google KG if API key is available
    this.useGoogleKG = !!this.apiKey;
  }

  // Extract entities from text and create knowledge graph
  async analyzeText(text: string): Promise<KnowledgeGraphData> {
    if (!this.useGoogleKG) {
      console.log('Using enhanced text analysis (Google KG disabled)');
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
    // Enhanced entity extraction with better filtering
    const words = text.split(/\s+/);
    const entities = new Set<string>();

    // Skip common words that aren't entities
    const skipWords = new Set([
      'The', 'This', 'That', 'These', 'Those', 'A', 'An', 'And', 'Or', 'But',
      'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By', 'From', 'Up', 'About',
      'Into', 'Through', 'During', 'Before', 'After', 'Above', 'Below', 'Between',
      'Among', 'Under', 'Over', 'Since', 'Until', 'While', 'Because', 'Although',
      'If', 'When', 'Where', 'How', 'Why', 'What', 'Which', 'Who', 'Whom', 'Whose',
      'Can', 'Could', 'May', 'Might', 'Must', 'Should', 'Would', 'Will', 'Shall',
      'Do', 'Does', 'Did', 'Have', 'Has', 'Had', 'Be', 'Is', 'Are', 'Was', 'Were',
      'Been', 'Being', 'Get', 'Got', 'Getting', 'Make', 'Made', 'Making', 'Take',
      'Took', 'Taking', 'Come', 'Came', 'Coming', 'Go', 'Went', 'Going', 'See',
      'Saw', 'Seeing', 'Know', 'Knew', 'Knowing', 'Think', 'Thought', 'Thinking',
      'Say', 'Said', 'Saying', 'Tell', 'Told', 'Telling', 'Ask', 'Asked', 'Asking',
      'Work', 'Worked', 'Working', 'Play', 'Played', 'Playing', 'Run', 'Ran', 'Running'
    ]);

    // Find meaningful capitalized words (potential proper nouns)
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 2 && /^[A-Z][a-z]+/.test(cleaned) && !skipWords.has(cleaned)) {
        entities.add(cleaned);
      }
    });

    // Find multi-word entities (capitalized phrases) - improved
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
      // Look for 2-4 word capitalized phrases
      const matches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);
      if (matches) {
        matches.forEach(match => {
          const trimmed = match.trim();
          if (trimmed.length > 5 && !skipWords.has(trimmed.split(' ')[0])) {
            entities.add(match.trim());
          }
        });
      }
    });

    // Add domain-specific terms and acronyms
    const domainTerms = text.match(/\b[A-Z]{2,}\b/g); // Acronyms
    if (domainTerms) {
      domainTerms.forEach(term => {
        if (term.length >= 2 && term.length <= 6) {
          entities.add(term);
        }
      });
    }

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
    // Extract meaningful entities using our enhanced extraction
    const entities = this.extractEntities(text);
    
    // Also extract key concepts from the text
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !/^(the|this|that|with|from|they|have|been|were|will|would|could|should|might|must|shall|does|did|has|had|are|was|for|and|but|not|you|can|may|get|got|make|take|come|went|see|know|say|tell|ask|work|play|run)$/.test(word));
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Get top concepts by frequency
    const topConcepts = Array.from(wordFreq.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    // Combine entities and concepts
    const allNodes = [...entities.slice(0, 8), ...topConcepts.slice(0, 7)];
    const uniqueNodes = [...new Set(allNodes)].slice(0, 12);
    
    const nodes = uniqueNodes.map((item, index) => {
      const isEntity = entities.includes(item);
      const frequency = wordFreq.get(item.toLowerCase()) || 1;
      
      return {
        id: item.toLowerCase().replace(/\s+/g, '-'),
        label: item,
        size: Math.min(frequency * 3 + 5, 20),
        color: isEntity ? this.getColorForType('Entity') : this.getColorForType('Concept'),
        cluster: isEntity ? 0 : Math.floor(index / 4) + 1,
        type: isEntity ? 'Entity' : 'Concept',
        score: frequency / Math.max(...Array.from(wordFreq.values()))
      };
    });

    // Create more intelligent edges based on co-occurrence and semantic similarity
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Check co-occurrence in sentences
        const sentences = text.split(/[.!?]+/);
        const coOccurs = sentences.some(sentence => {
          const lowerSentence = sentence.toLowerCase();
          return lowerSentence.includes(node1.label.toLowerCase()) && 
                 lowerSentence.includes(node2.label.toLowerCase());
        });
        
        // Add edge if they co-occur or are in same cluster
        if (coOccurs || (node1.cluster === node2.cluster && Math.random() > 0.6)) {
          edges.push({
            source: node1.id,
            target: node2.id,
            weight: coOccurs ? 0.8 : 0.4,
            relationship: coOccurs ? 'co-occurs' : 'related'
          });
        }
      }
    }

    // Generate smarter insights
    const insights = this.generateEnhancedInsights(nodes, entities, topConcepts, text);

    return {
      graph: { nodes, edges },
      insights,
      summary: `Analyzed ${nodes.length} key concepts and entities using enhanced text analysis. Identified ${entities.length} entities and ${topConcepts.length} main concepts.`,
      metadata: {
        entityCount: nodes.length,
        timestamp: Date.now().toString(),
        source: 'enhanced-fallback'
      }
    };
  }

  // Generate enhanced insights for fallback analysis
  private generateEnhancedInsights(nodes: any[], entities: string[], concepts: string[], text: string): any {
    // Generate contextual questions based on the content
    const questions = [];
    
    if (entities.length > 0) {
      questions.push(`How do ${entities.slice(0, 2).join(' and ')} relate to the main topic?`);
    }
    
    if (concepts.length > 0) {
      questions.push(`What are the implications of ${concepts.slice(0, 2).join(' and ')}?`);
    }
    
    questions.push('What additional context would help understand these relationships?');
    
    // Identify potential gaps
    const gaps = [
      'Consider exploring the historical context of these concepts',
      'Additional relationships between key entities could provide insights',
      'The temporal aspects of these connections might reveal patterns'
    ];
    
    // Create meaningful clusters
    const clusters = [
      {
        id: 0,
        label: 'Key Entities',
        concepts: entities.slice(0, 5)
      },
      {
        id: 1,
        label: 'Main Concepts', 
        concepts: concepts.slice(0, 5)
      }
    ].filter(cluster => cluster.concepts.length > 0);

    return { questions, gaps, clusters };
  }

  // Get color for different node types
  private getColorForType(type: string): string {
    const colorMap: Record<string, string> = {
      'Entity': '#3B82F6',
      'Concept': '#10B981',
      'Person': '#3B82F6',
      'Organization': '#10B981',
      'Place': '#F59E0B',
      'Thing': '#8B5CF6',
      'Event': '#EF4444',
      'CreativeWork': '#EC4899',
      'Product': '#06B6D4'
    };
    
    return colorMap[type] || '#6B7280';
  }
}

export const googleKnowledgeGraphService = new GoogleKnowledgeGraphService();