import { useMemo, useCallback, useEffect } from 'react';
import type { PageResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BezierEdge,
  type Node,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
  type EdgeProps,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { normalizePath, patternizePath } from '@sudobility/testomniac_lib';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';

// --- Constants ---

const PAGE_NODE_WIDTH = 220;
const PAGE_NODE_HEIGHT = 180;
const ROW_GAP = 120;
const COL_GAP = 250;
const MAP_TEST_TYPES = new Set(['navigation', 'interaction']);

// --- Custom Nodes ---

function PageNode({
  data,
}: {
  data: {
    label: string;
    isExternal: boolean;
    count: number;
    screenshotUrl?: string | null;
  };
}) {
  const borderColor = data.isExternal ? '#f97316' : '#374151';

  return (
    <div
      className="rounded-lg bg-white text-xs dark:bg-gray-900 overflow-hidden shadow-sm"
      style={{
        border: `2px solid ${borderColor}`,
        width: PAGE_NODE_WIDTH,
        minHeight: PAGE_NODE_HEIGHT,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Screenshot thumbnail */}
      <div
        className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        style={{ height: 130 }}
      >
        {data.screenshotUrl ? (
          <img
            src={data.screenshotUrl}
            alt={data.label}
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
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        )}
      </div>

      {/* Path label */}
      <div className="px-2 py-1.5 text-center border-t border-gray-100 dark:border-gray-700/50">
        <span className="block max-w-[190px] truncate text-gray-900 dark:text-gray-100 font-medium">
          {data.label}
        </span>
        {data.count > 1 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{data.count} URLs</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  pageNode: PageNode,
};

function CurvedEdge(props: EdgeProps) {
  return <BezierEdge {...props} pathOptions={{ curvature: 0.8 }} />;
}

const edgeTypes: EdgeTypes = {
  curved: CurvedEdge,
};

// --- Helpers ---

function getConsolidationKey(page: PageResponse): string {
  // Always normalize: strip query params / hash, trailing slashes,
  // then collapse dynamic segments so parameterised URLs merge.
  const raw = page.routeKey || page.relativePath;
  const isExternal = page.relativePath.startsWith('http');

  if (isExternal) {
    try {
      const url = new URL(page.relativePath);
      const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
      return `${url.host}${patternizePath(pathname)}`;
    } catch {
      return page.relativePath;
    }
  }

  const normalized = normalizePath(raw);
  if (normalized) return patternizePath(normalized);
  return raw;
}

function getPathDepth(path: string): number {
  if (path === '/') return 0;
  return path.split('/').filter(Boolean).length;
}

// --- Component ---

interface PagesMapViewProps {
  pages: PageResponse[];
  testInteractions: TestInteractionResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
  /** Map of pageId → screenshot artifact path (from page states) */
  screenshotsByPageId?: Map<number, string>;
  apiUrl?: string;
}

export function PagesMapView({
  pages,
  testInteractions,
  envId,
  entitySlug,
  runId,
  screenshotsByPageId,
  apiUrl,
}: PagesMapViewProps) {
  const { navigate } = useLocalizedNavigate();
  const pageBasePath = runId
    ? `/dashboard/${entitySlug}/environments/${envId}/runs/${runId}/pages`
    : `/dashboard/${entitySlug}/environments/${envId}/pages`;

  const { initialNodes, initialEdges, hiddenInteractionCount } = useMemo(() => {
    if (pages.length === 0)
      return { initialNodes: [], initialEdges: [], hiddenInteractionCount: 0 };

    // --- 1. Consolidate pages by routeKey / normalized path ---
    const consolidated = new Map<string, { pageIds: number[]; isExternal: boolean }>();

    for (const page of pages) {
      const key = getConsolidationKey(page);
      const existing = consolidated.get(key);
      if (existing) {
        existing.pageIds.push(page.id);
      } else {
        consolidated.set(key, {
          pageIds: [page.id],
          isExternal: page.relativePath.startsWith('http'),
        });
      }
    }

    const nodeEntries = Array.from(consolidated.entries()).map(([path, data]) => ({
      path,
      ...data,
      depth: getPathDepth(path),
    }));

    // --- 2. Map original page IDs → consolidated path ---
    const pageIdToPath = new Map<number, string>();
    for (const entry of nodeEntries) {
      for (const pid of entry.pageIds) {
        pageIdToPath.set(pid, entry.path);
      }
    }

    // --- 3. Position nodes by depth (rows) ---
    const depthGroups = new Map<number, typeof nodeEntries>();
    for (const entry of nodeEntries) {
      const arr = depthGroups.get(entry.depth) || [];
      arr.push(entry);
      depthGroups.set(entry.depth, arr);
    }

    const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
    const rfNodes: Node[] = [];

    for (let rowIdx = 0; rowIdx < sortedDepths.length; rowIdx++) {
      const group = depthGroups.get(sortedDepths[rowIdx])!;
      group.sort((a, b) => a.path.localeCompare(b.path));
      const totalWidth = group.length * COL_GAP;
      const startX = -totalWidth / 2 + COL_GAP / 2;

      for (let i = 0; i < group.length; i++) {
        const entry = group[i];
        // Find screenshot for first page ID in this group
        let screenshotUrl: string | null = null;
        if (screenshotsByPageId && apiUrl) {
          for (const pid of entry.pageIds) {
            const path = screenshotsByPageId.get(pid);
            if (path) {
              screenshotUrl = `${apiUrl}/api/v1/artifacts/${path}?thumbnail=true`;
              break;
            }
          }
        }

        rfNodes.push({
          id: entry.path,
          type: 'pageNode',
          data: {
            label: entry.path,
            isExternal: entry.isExternal,
            count: entry.pageIds.length,
            pageIds: entry.pageIds,
            screenshotUrl,
          },
          position: {
            x: startX + i * COL_GAP,
            y: rowIdx * ROW_GAP,
          },
        });
      }
    }

    // --- 4. URL hierarchy edges (parent → child) ---
    const pathSet = new Set(nodeEntries.map(n => n.path));
    const rfEdges: Edge[] = [];
    const edgeKeySet = new Set<string>();

    for (const entry of nodeEntries) {
      if (entry.path === '/' || entry.isExternal) continue;
      const segments = entry.path.split('/').filter(Boolean);
      for (let i = segments.length - 1; i >= 0; i--) {
        const parentPath = i === 0 ? '/' : '/' + segments.slice(0, i).join('/');
        if (pathSet.has(parentPath)) {
          const key = `${parentPath}\0${entry.path}`;
          edgeKeySet.add(key);
          rfEdges.push({
            id: `h-${rfEdges.length}`,
            source: parentPath,
            target: entry.path,
            type: 'curved',
            style: { stroke: '#94a3b8' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#94a3b8',
            },
          });
          break;
        }
      }
    }

    // --- 5. Test interaction edges (cross-page) ---
    let hiddenInteractionCount = 0;
    const interactionCounts = new Map<string, { source: string; target: string; count: number }>();

    for (const ti of testInteractions) {
      if (!MAP_TEST_TYPES.has(ti.testType)) continue;

      const sourcePath = ti.pageId != null ? (pageIdToPath.get(ti.pageId) ?? null) : null;
      const targetPath =
        ti.targetPageId != null ? (pageIdToPath.get(ti.targetPageId) ?? null) : null;

      const src = ti.testType === 'navigation' ? null : sourcePath;
      const tgt = targetPath ?? (ti.testType === 'navigation' ? sourcePath : null);

      if (src && tgt && src !== tgt) {
        const key = `${src}\0${tgt}`;
        const existing = interactionCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          interactionCounts.set(key, { source: src, target: tgt, count: 1 });
        }
      } else {
        hiddenInteractionCount++;
      }
    }

    for (const [key, edge] of interactionCounts) {
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        rfEdges.push({
          id: `ti-${rfEdges.length}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#60a5fa' },
          label: edge.count > 1 ? String(edge.count) : undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#60a5fa',
          },
        });
      }
    }

    return {
      initialNodes: rfNodes,
      initialEdges: rfEdges,
      hiddenInteractionCount,
    };
  }, [pages, testInteractions, screenshotsByPageId, apiUrl]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const pageIds = node.data.pageIds as number[] | undefined;
      if (pageIds && pageIds.length > 0) {
        navigate(`${pageBasePath}/${pageIds[0]}`);
      }
    },
    [navigate, pageBasePath]
  );

  if (pages.length === 0) {
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
          {hiddenInteractionCount} interaction
          {hiddenInteractionCount === 1 ? '' : 's'} omitted (no cross-page connection).
        </p>
      )}
      <div className="h-[600px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
