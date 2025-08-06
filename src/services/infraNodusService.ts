interface InfraNodusResponse {
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      size: number;
      color: string;
      cluster: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      weight: number;
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
  metrics: {
    diversity: number;
    connectivity: number;
    influence: Record<string, number>;
  };
}

class InfraNodusService {
  private apiKey: string;
  private baseUrl: string = 'https://infranodus.com/api';

  constructor() {
    this.apiKey = import.meta.env.VITE_INFRANODUS_API_KEY || '';
  }

  // Note: InfraNodus API calls are now handled by n8n workflow to avoid CORS issues
  // The n8n workflow should include InfraNodus analysis and return the results
  async analyzeText(text: string): Promise<InfraNodusResponse> {
    // This method now generates fallback analysis since the real analysis
    // should be done in the n8n workflow
    console.log('InfraNodus analysis moved to n8n workflow to avoid CORS issues');
    return this.generateFallbackAnalysis(text);
  }

  private transformResponse(data: any): InfraNodusResponse {
    // Transform the actual InfraNodus API response to our interface
    // This will depend on the actual API response format
    return {
      graph: {
        nodes: data.nodes || [],
        edges: data.edges || [],
      },
      insights: {
        gaps: data.gaps || [],
        questions: data.questions || [],
        clusters: data.clusters || [],
      },
      metrics: {
        diversity: data.diversity || 0,
        connectivity: data.connectivity || 0,
        influence: data.influence || {},
      },
    };
  }

  // Generate follow-up questions based on knowledge gaps
  async generateFollowUpQuestions(text: string): Promise<string[]> {
    // Generate fallback questions since InfraNodus is now handled by n8n
    return this.generateFallbackQuestions(text);
  }

  private generateFallbackQuestions(text: string): string[] {
    // Simple fallback question generation based on text analysis
    const questions = [];
    
    if (text.includes('conclusion') || text.includes('summary')) {
      questions.push('What are the key implications of these findings?');
    }
    
    if (text.includes('data') || text.includes('results')) {
      questions.push('What additional data would strengthen this analysis?');
    }
    
    if (text.includes('recommend') || text.includes('suggest')) {
      questions.push('What are the potential risks of implementing these recommendations?');
    }
    
    questions.push('How does this relate to other parts of the document?');
    questions.push('What questions does this raise for further investigation?');
    
    return questions.slice(0, 3); // Return max 3 fallback questions
  }

  // Generate a fallback analysis structure for frontend display
  private generateFallbackAnalysis(text: string): InfraNodusResponse {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const uniqueWords = [...new Set(words)].slice(0, 20);
    
    // Create simple nodes and edges for visualization
    const nodes = uniqueWords.map((word, index) => ({
      id: word,
      label: word,
      size: Math.random() * 10 + 5,
      color: `hsl(${index * 137.5 % 360}, 70%, 60%)`,
      cluster: Math.floor(index / 5)
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() > 0.7) {
        edges.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          weight: Math.random()
        });
      }
    }

    return {
      graph: { nodes, edges },
      insights: {
        gaps: [
          'Consider exploring the connections between key concepts',
          'Additional context might reveal deeper relationships'
        ],
        questions: this.generateFallbackQuestions(text),
        clusters: [
          {
            id: 0,
            label: 'Main Concepts',
            concepts: uniqueWords.slice(0, 5)
          },
          {
            id: 1,
            label: 'Supporting Ideas',
            concepts: uniqueWords.slice(5, 10)
          }
        ]
      },
      metrics: {
        diversity: 0.7,
        connectivity: 0.5,
        influence: uniqueWords.reduce((acc, word) => {
          acc[word] = Math.random();
          return acc;
        }, {} as Record<string, number>)
      }
    };
  }
}

export const infraNodusService = new InfraNodusService();