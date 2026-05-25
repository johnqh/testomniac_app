import { useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import dagre from 'dagre';
import { useApi } from '@sudobility/building_blocks/firebase';
import { usePageStates } from '@sudobility/testomniac_client';
import SEOHead from '@/components/SEOHead';
import BackLink from '../components/navigation/BackLink';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 160;

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach(node => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function PageStateNode({ data }: { data: { label: string; screenshotUrl?: string } }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <div className="w-full h-[120px] bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {data.screenshotUrl ? (
          <img
            src={data.screenshotUrl}
            alt=""
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <svg
            className="w-8 h-8 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
          </svg>
        )}
      </div>
      <div className="px-2 py-1.5 text-center">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
          {data.label}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = { pageState: PageStateNode };

export default function PageGraphPage() {
  const { pageId, envId, entitySlug } = useParams<{
    pageId: string;
    envId: string;
    entitySlug: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const numericPageId = Number(pageId);
  const { pageStates, isLoading: statesLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: numericPageId,
    token: token ?? '',
    enabled: !!pageId && !!token,
  });

  const isLoading = statesLoading;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (pageStates.length === 0) return { initialNodes: [], initialEdges: [] };

    const rawNodes: Node[] = pageStates.map(ps => {
      const screenshotUrl = ps.screenshotPath
        ? `${CONSTANTS.API_URL}/api/v1/artifacts/${ps.screenshotPath}?thumbnail=true`
        : undefined;
      return {
        id: String(ps.id),
        type: 'pageState',
        data: {
          label: `${ps.sizeClass} (#${ps.id})`,
          screenshotUrl,
        },
        position: { x: 0, y: 0 },
      };
    });

    const rawEdges: Edge[] = [];
    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pageStates]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      navigate(`/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}/states/${node.id}`);
    },
    [navigate, entitySlug, envId, pageId]
  );

  const pagesBasePath = `/dashboard/${entitySlug}/environments/${envId}/pages/${pageId}`;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Page Graph" description="" noIndex />
      <BackLink label="Page Detail" onClick={() => navigate(pagesBasePath)} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Page Graph</h1>

      {pageStates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      ) : (
        <div className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
