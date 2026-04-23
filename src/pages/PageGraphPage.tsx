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
import {
  usePageStates,
  usePageActions,
  useAppActionExecutions,
} from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 });

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

export default function PageGraphPage() {
  const { pageId, appId, entitySlug } = useParams<{
    pageId: string;
    appId: string;
    entitySlug: string;
  }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const numericPageId = Number(pageId);
  const numericAppId = Number(appId);

  const { pageStates, isLoading: statesLoading } = usePageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: numericPageId,
    token: token ?? '',
    enabled: !!pageId && !!token,
  });

  const { actions, isLoading: actionsLoading } = usePageActions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    pageId: numericPageId,
    token: token ?? '',
    enabled: !!pageId && !!token,
  });

  const { actionExecutions, isLoading: executionsLoading } = useAppActionExecutions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: numericAppId,
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const isLoading = statesLoading || actionsLoading || executionsLoading;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (pageStates.length === 0) return { initialNodes: [], initialEdges: [] };

    // Set of page state IDs belonging to this page
    const pageStateIds = new Set(pageStates.map(ps => ps.id));

    // Build actionId -> action lookup
    const actionById = new Map<number, (typeof actions)[number]>();
    for (const action of actions) {
      actionById.set(action.id, action);
    }

    // Create nodes - one per page state
    const rawNodes: Node[] = pageStates.map(ps => ({
      id: String(ps.id),
      data: { label: `${ps.sizeClass} (#${ps.id})` },
      position: { x: 0, y: 0 },
      style: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        width: NODE_WIDTH,
      },
    }));

    // Derive edges from actions + executions
    const edgeSet = new Set<string>();
    const rawEdges: Edge[] = [];

    for (const execution of actionExecutions) {
      const action = actionById.get(execution.actionId);
      if (!action?.startingPageStateId || !execution.targetPageStateId) continue;

      // Only include edges where the starting state belongs to this page
      if (!pageStateIds.has(action.startingPageStateId)) continue;

      const sourceId = String(action.startingPageStateId);
      const targetId = String(execution.targetPageStateId);

      const edgeKey = `${sourceId}-${targetId}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      rawEdges.push({
        id: edgeKey,
        source: sourceId,
        target: targetId,
        animated: true,
        style: { stroke: '#6b7280' },
      });
    }

    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pageStates, actions, actionExecutions]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      navigate(`/dashboard/${entitySlug}/apps/${appId}/pages/${pageId}/states/${node.id}`);
    },
    [navigate, entitySlug, appId, pageId]
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading graph...</div>
      </div>
    );
  }

  if (pageStates.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Page Graph</h1>
        <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Page Graph</h1>
      <div className="w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-gray-50 dark:bg-gray-900"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
