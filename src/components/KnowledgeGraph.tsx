import React, { useEffect, useRef } from 'react';
import { Network, Eye, Brain, HelpCircle } from 'lucide-react';

interface KnowledgeGraphProps {
  graphData?: {
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
  insights?: {
    gaps: string[];
    questions: string[];
    clusters: Array<{
      id: number;
      label: string;
      concepts: string[];
    }>;
  };
  onQuestionClick: (question: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  graphData,
  insights,
  onQuestionClick,
  isVisible,
  onToggle,
}) => {
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && graphData && graphRef.current) {
      // Here you would integrate with a graph visualization library like D3.js, vis.js, or sigma.js
      // For now, we'll show a placeholder
      renderGraph();
    }
  }, [isVisible, graphData]);

  const renderGraph = () => {
    if (!graphRef.current || !graphData) return;

    // Placeholder for actual graph rendering
    // You would use a library like D3.js or vis.js here
    graphRef.current.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <Network class="w-12 h-12 mx-auto mb-4" />
          <p>Knowledge Graph Visualization</p>
          <p class="text-sm mt-2">${graphData.nodes.length} concepts, ${graphData.edges.length} connections</p>
        </div>
      </div>
    `;
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Show Knowledge Graph"
      >
        <Brain className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Knowledge Graph Analysis</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Graph Visualization */}
          <div className="flex-1 p-6">
            <div
              ref={graphRef}
              className="w-full h-full bg-gray-900 rounded-lg border border-gray-600"
            />
          </div>

          {/* Insights Panel */}
          <div className="w-80 border-l border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Suggested Questions */}
              {insights?.questions && insights.questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    <span>Suggested Questions</span>
                  </h3>
                  <div className="space-y-2">
                    {insights.questions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => onQuestionClick(question)}
                        className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Gaps */}
              {insights?.gaps && insights.gaps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Knowledge Gaps</h3>
                  <div className="space-y-2">
                    {insights.gaps.map((gap, index) => (
                      <div
                        key={index}
                        className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg"
                      >
                        <p className="text-amber-200 text-sm">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concept Clusters */}
              {insights?.clusters && insights.clusters.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Concept Clusters</h3>
                  <div className="space-y-3">
                    {insights.clusters.map((cluster) => (
                      <div key={cluster.id} className="p-3 bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-white mb-2">{cluster.label}</h4>
                        <div className="flex flex-wrap gap-1">
                          {cluster.concepts.map((concept, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};