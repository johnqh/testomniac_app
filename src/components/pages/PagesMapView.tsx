import { useMemo, useCallback, useEffect } from 'react';
import type { PageResponse, TestElementResponse } from '@sudobility/testomniac_types';
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
import { usePageMapData } from '@sudobility/testomniac_lib';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { ArrowTopRightOnSquareIcon, CursorArrowRaysIcon } from '@heroicons/react/20/solid';

// --- Constants ---

const PAGE_NODE_WIDTH = 200;
const PAGE_NODE_HEIGHT = 60;
const ACTION_NODE_SIZE = 40;

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

function ActionCircleNode({ data }: { data: { actionType: string } }) {
  const isNavigation = data.actionType === 'navigation';

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
      style={{ width: ACTION_NODE_SIZE, height: ACTION_NODE_SIZE }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      {isNavigation ? (
        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      ) : (
        <CursorArrowRaysIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      )}
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
  testElements: TestElementResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
}

export function PagesMapView({ pages, testElements, envId, entitySlug, runId }: PagesMapViewProps) {
  const { navigate } = useLocalizedNavigate();
  const { nodes: mapNodes, edges: mapEdges } = usePageMapData({ pages, testElements });
  const pageBasePath = runId
    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages`
    : `/dashboard/${entitySlug}/environments/${envId}/pages`;

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
        data: { actionType: edge.testType },
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
  );
}
