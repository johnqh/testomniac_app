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
  useAppPages,
  useAppActions,
  useAppActionExecutions,
  useAppPageStates,
} from '@sudobility/testomniac_client';
import { CONSTANTS } from '../config/constants';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

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

export default function AppGraphPage() {
  const { appId, entitySlug } = useParams<{ appId: string; entitySlug: string }>();
  const { networkClient, token } = useApi();
  const { navigate } = useLocalizedNavigate();

  const numericAppId = Number(appId);

  const { pages, isLoading: pagesLoading } = useAppPages({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: numericAppId,
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const { actions, isLoading: actionsLoading } = useAppActions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: numericAppId,
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const { actionExecutions, isLoading: executionsLoading } = useAppActionExecutions({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: numericAppId,
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const { pageStates, isLoading: pageStatesLoading } = useAppPageStates({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    appId: numericAppId,
    token: token ?? '',
    enabled: !!appId && !!token,
  });

  const isLoading = pagesLoading || actionsLoading || executionsLoading || pageStatesLoading;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (pages.length === 0) return { initialNodes: [], initialEdges: [] };

    // Build pageStateId -> pageId lookup
    const stateToPage = new Map<number, number>();
    for (const ps of pageStates) {
      stateToPage.set(ps.id, ps.pageId);
    }

    // Build actionId -> action lookup
    const actionById = new Map<number, (typeof actions)[number]>();
    for (const action of actions) {
      actionById.set(action.id, action);
    }

    // Create nodes - one per page
    const rawNodes: Node[] = pages.map(page => {
      let label: string;
      try {
        label = page.routeKey || page.relativePath;
      } catch {
        label = page.routeKey || page.relativePath;
      }
      return {
        id: String(page.id),
        data: { label },
        position: { x: 0, y: 0 },
        style: {
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          width: NODE_WIDTH,
        },
      };
    });

    // Derive edges from actions + executions
    const edgeSet = new Set<string>();
    const rawEdges: Edge[] = [];

    for (const execution of actionExecutions) {
      const action = actionById.get(execution.actionId);
      if (!action?.startingPageStateId || !execution.targetPageStateId) continue;

      const sourcePageId = stateToPage.get(action.startingPageStateId);
      const targetPageId = stateToPage.get(execution.targetPageStateId);

      if (!sourcePageId || !targetPageId) continue;
      if (sourcePageId === targetPageId) continue;

      const edgeKey = `${sourcePageId}-${targetPageId}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      rawEdges.push({
        id: edgeKey,
        source: String(sourcePageId),
        target: String(targetPageId),
        animated: true,
        style: { stroke: '#6b7280' },
      });
    }

    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pages, actions, actionExecutions, pageStates]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      navigate(`/dashboard/${entitySlug}/apps/${appId}/pages/${node.id}`);
    },
    [navigate, entitySlug, appId]
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading graph...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">App Graph</h1>
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">App Graph</h1>
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
