import { useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function MapPage() {
  // const { runId } = useParams<{ runId: string }>();

  // TODO: Replace with useRunPages + useRunActions hooks when API is live
  // For now, show empty state
  const hasData = false;

  // Example of how nodes/edges would be constructed from page data:
  const initialNodes: Node[] = useMemo(() => {
    if (!hasData) return [];
    // Would build from pages:
    // return pages.map((page, i) => ({
    //   id: String(page.id),
    //   data: { label: page.routeKey || new URL(page.url).pathname },
    //   position: { x: (i % 4) * 250, y: Math.floor(i / 4) * 150 },
    //   style: {
    //     background: 'white',
    //     border: '1px solid #e5e7eb',
    //     borderRadius: '8px',
    //     padding: '12px',
    //     fontSize: '12px',
    //   },
    // }));
    return [];
  }, [hasData]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!hasData) return [];
    // Would build from navigation actions:
    // return actions
    //   .filter(a => a.type === 'click' && a.targetPageId && a.targetPageId !== startPageId)
    //   .map(a => ({
    //     id: `e-${a.id}`,
    //     source: String(sourcePageId),
    //     target: String(a.targetPageId),
    //     animated: true,
    //     style: { stroke: '#94a3b8' },
    //   }));
    return [];
  }, [hasData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (!hasData) {
    return (
      <div className="p-6">
        <SEOHead title="Site Map" description="" noIndex />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Site Map</h1>
        <div className="h-[500px] rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Site map will appear here after a scan discovers pages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <SEOHead title="Site Map" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Site Map</h1>
      <div className="h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
