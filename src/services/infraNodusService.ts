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

  async analyzeText(text: string): Promise<InfraNodusResponse> {
    if (!this.apiKey) {
      throw new Error('InfraNodus API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: text,
          settings: {
            language: 'en',
            removeStopwords: true,
            minWordLength: 3,
            maxNodes: 100,
            generateQuestions: true,
            identifyGaps: true,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`InfraNodus API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformResponse(data);
    } catch (error) {
      console.error('Error calling InfraNodus API:', error);
      throw error;
    }
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
    try {
      const analysis = await this.analyzeText(text);
      return analysis.insights.questions;
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      // Fallback to simple question generation if InfraNodus fails
      return this.generateFallbackQuestions(text);
    }
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
}

export const infraNodusService = new InfraNodusService();