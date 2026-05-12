import { useMemo, useCallback, useEffect } from 'react';
import type { PageResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { ArrowTopRightOnSquareIcon, CursorArrowRaysIcon } from '@heroicons/react/20/solid';

// --- Constants ---

const PAGE_NODE_WIDTH = 200;
const PAGE_NODE_HEIGHT = 60;
const ACTION_NODE_SIZE = 40;
const MAP_TEST_TYPES = new Set(['navigation', 'interaction']);

// --- Custom Nodes ---

function PageNode({ data }: { data: { label: string; isExternal: boolean } }) {
  const borderColor = data.isExternal ? '#f97316' : '#374151';

  return (
    <div
      className="rounded-lg bg-white px-4 py-3 text-xs dark:bg-gray-900"
      style={{
        border: `2px solid ${borderColor}`,
        width: PAGE_NODE_WIDTH,
        minHeight: PAGE_NODE_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <span className="truncate block max-w-[170px] text-center text-gray-900 dark:text-gray-100">
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

function ActionCircleNode({ data }: { data: { actionType: string; count: number } }) {
  const isNavigation = data.actionType === 'navigation';

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
      style={{ width: ACTION_NODE_SIZE, height: ACTION_NODE_SIZE }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="relative flex items-center justify-center">
        {isNavigation ? (
          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <CursorArrowRaysIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
        {data.count > 1 && (
          <span className="absolute -right-3 -top-3 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {data.count}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  pageNode: PageNode,
  actionCircle: ActionCircleNode,
};

// --- Layout ---

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

  nodes.forEach(node => {
    const isAction = node.type === 'actionCircle';
    g.setNode(node.id, {
      width: isAction ? ACTION_NODE_SIZE : PAGE_NODE_WIDTH,
      height: isAction ? ACTION_NODE_SIZE : PAGE_NODE_HEIGHT,
    });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    const isAction = node.type === 'actionCircle';
    const w = isAction ? ACTION_NODE_SIZE : PAGE_NODE_WIDTH;
    const h = isAction ? ACTION_NODE_SIZE : PAGE_NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

// --- Component ---

interface PagesMapViewProps {
  pages: PageResponse[];
  testInteractions: TestInteractionResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
}

function normalizePath(path: string | null | undefined): string | null {
  if (!path) return null;

  const normalizeValue = (value: string) => {
    if (value.length > 1 && value.endsWith('/')) {
      return value.replace(/\/+$/, '');
    }
    return value || '/';
  };

  try {
    const parsed = new URL(path);
    return normalizeValue(parsed.pathname || '/');
  } catch {
    const [pathname] = path.split(/[?#]/, 1);
    if (!pathname) return null;
    if (pathname.startsWith('/')) return normalizeValue(pathname);
    return normalizeValue(`/${pathname}`);
  }
}

export function PagesMapView({
  pages,
  testInteractions,
  envId,
  entitySlug,
  runId,
}: PagesMapViewProps) {
  const { navigate } = useLocalizedNavigate();
  const pageBasePath = runId
    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages`
    : `/dashboard/${entitySlug}/environments/${envId}/pages`;
  const { mapNodes, mapEdges, hiddenInteractionCount } = useMemo(() => {
    const pageIdByPath = new Map<string, number>();

    for (const page of pages) {
      const relativePath = normalizePath(page.relativePath);
      const routeKey = normalizePath(page.routeKey);
      if (relativePath) pageIdByPath.set(relativePath, page.id);
      if (routeKey) pageIdByPath.set(routeKey, page.id);
    }

    const rawEdges = testInteractions
      .filter(element => MAP_TEST_TYPES.has(element.testType))
      .map(element => {
        const normalizedStartingPath = normalizePath(element.startingPath);
        const inferredPathPageId = normalizedStartingPath
          ? (pageIdByPath.get(normalizedStartingPath) ?? null)
          : null;
        const sourcePageId =
          element.testType === 'navigation' ? null : (element.pageId ?? inferredPathPageId);
        const targetPageId =
          element.targetPageId ??
          (element.testType === 'navigation' ? (element.pageId ?? inferredPathPageId) : null);

        return {
          id: String(element.id),
          sourcePageId,
          targetPageId,
          testInteractionId: element.id,
          testType: element.testType,
          title: element.title,
        };
      })
      .filter(edge => {
        if (edge.testType === 'navigation') {
          return edge.targetPageId != null;
        }

        if (edge.sourcePageId == null || edge.targetPageId == null) {
          return false;
        }

        if (edge.sourcePageId === edge.targetPageId) {
          return false;
        }

        return true;
      });

    const hiddenInteractionCount = testInteractions.filter(
      element =>
        element.testType === 'interaction' &&
        !rawEdges.some(edge => edge.testInteractionId === element.id)
    ).length;

    const edgeMap = new Map<
      string,
      {
        id: string;
        sourcePageId: number | null;
        targetPageId: number | null;
        testType: string;
        title: string;
        count: number;
      }
    >();

    for (const edge of rawEdges) {
      const key = `${edge.testType}:${edge.sourcePageId ?? 'root'}:${edge.targetPageId ?? 'none'}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      edgeMap.set(key, {
        id: key,
        sourcePageId: edge.sourcePageId,
        targetPageId: edge.targetPageId,
        testType: edge.testType,
        title: edge.title,
        count: 1,
      });
    }

    const edges = Array.from(edgeMap.values());

    const countMap = new Map<number, number>();
    for (const edge of edges) {
      if (edge.sourcePageId != null) {
        countMap.set(edge.sourcePageId, (countMap.get(edge.sourcePageId) ?? 0) + 1);
      }
      if (edge.targetPageId != null) {
        countMap.set(edge.targetPageId, (countMap.get(edge.targetPageId) ?? 0) + 1);
      }
    }

    const nodes = pages.map(page => ({
      id: String(page.id),
      relativePath: page.relativePath,
      routeKey: page.routeKey,
      isExternal: page.relativePath.startsWith('http'),
      testInteractionCount: countMap.get(page.id) ?? 0,
    }));

    return { mapNodes: nodes, mapEdges: edges, hiddenInteractionCount };
  }, [pages, testInteractions]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (mapNodes.length === 0) return { initialNodes: [], initialEdges: [] };

    const rfNodes: Node[] = [];
    const rfEdges: Edge[] = [];

    // Create page nodes
    for (const pn of mapNodes) {
      rfNodes.push({
        id: `page-${pn.id}`,
        type: 'pageNode',
        data: {
          label: pn.routeKey || pn.relativePath,
          isExternal: pn.isExternal,
          pageId: pn.id,
        },
        position: { x: 0, y: 0 },
      });
    }

    // Create action circle nodes and edges from map edges
    for (const edge of mapEdges) {
      const actionNodeId = `action-${edge.id}`;

      rfNodes.push({
        id: actionNodeId,
        type: 'actionCircle',
        data: { actionType: edge.testType, count: edge.count },
        position: { x: 0, y: 0 },
      });

      if (edge.sourcePageId == null) {
        // Navigation (direct URL entry): circle -> target page
        if (edge.targetPageId != null) {
          rfEdges.push({
            id: `e-${edge.id}-to-target`,
            source: actionNodeId,
            target: `page-${edge.targetPageId}`,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#94a3b8' },
          });
        }
      } else {
        // Interaction: source page -> circle -> target page
        rfEdges.push({
          id: `e-${edge.id}-from-source`,
          source: `page-${edge.sourcePageId}`,
          target: actionNodeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#94a3b8' },
        });

        if (edge.targetPageId != null) {
          rfEdges.push({
            id: `e-${edge.id}-to-target`,
            source: actionNodeId,
            target: `page-${edge.targetPageId}`,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#94a3b8' },
          });
        }
      }
    }

    const layoutNodes = layoutGraph(rfNodes, rfEdges);
    return { initialNodes: layoutNodes, initialEdges: rfEdges };
  }, [mapNodes, mapEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'pageNode' && node.data.pageId) {
        navigate(`${pageBasePath}/${node.data.pageId}`);
      }
    },
    [navigate, pageBasePath]
  );

  if (mapNodes.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          No page connections to display. Run a scan to discover navigation flows.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hiddenInteractionCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hiddenInteractionCount} interaction case
          {hiddenInteractionCount === 1 ? '' : 's'} omitted because no destination page was
          recorded.
        </p>
      )}
      <div className="h-[600px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={handleNodeDoubleClick}
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
