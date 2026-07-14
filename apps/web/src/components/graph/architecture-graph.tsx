'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_TYPE_COLORS, EDGE_TYPE_COLORS, type GraphNode, type GraphEdge, type NodeType, type EdgeType } from '@dosson-architecture-visualizer/shared';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArchitectureGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  className?: string;
}

function CustomNode({ data }: { data: { label: string; type: NodeType; metadata?: Record<string, unknown> } }) {
  const color = NODE_TYPE_COLORS[data.type] || '#64748b';
  return (
    <div
      className="rounded-lg border-2 bg-card px-3 py-2 shadow-md transition-shadow hover:shadow-lg"
      style={{ borderColor: color, minWidth: 120 }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color }}>
        {data.type.replace('_', ' ')}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{data.label}</div>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export function ArchitectureGraph({ nodes: graphNodes, edges: graphEdges, className }: ArchitectureGraphProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const filteredNodes = graphNodes.filter((n) => {
      const matchesSearch = !search || n.label.toLowerCase().includes(search.toLowerCase()) || n.path?.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || n.type === filterType;
      return matchesSearch && matchesType;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const flowNodes: Node[] = filteredNodes.map((n, i) => ({
      id: n.id,
      type: 'custom',
      position: { x: (i % 5) * 220, y: Math.floor(i / 5) * 120 },
      data: { label: n.label, type: n.type, metadata: n.metadata },
      style: highlightedNode === n.id ? { boxShadow: '0 0 0 3px rgba(59,130,246,0.5)' } : undefined,
    }));

    const flowEdges: Edge[] = graphEdges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || e.type,
        type: 'smoothstep',
        animated: e.type === 'calls' || e.type === 'publishes',
        style: { stroke: EDGE_TYPE_COLORS[e.type as EdgeType] || '#94a3b8' },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_TYPE_COLORS[e.type as EdgeType] || '#94a3b8' },
        labelStyle: { fontSize: 10, fill: '#94a3b8' },
      }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [graphNodes, graphEdges, search, filterType, highlightedNode]);

  const [rfNodes, , onNodesChange] = useNodesState(nodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(edges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setHighlightedNode((prev) => (prev === node.id ? null : node.id));
  }, []);

  const nodeTypesList = useMemo(() => {
    const types = new Set(graphNodes.map((n) => n.type));
    return Array.from(types);
  }, [graphNodes]);

  return (
    <div className={cn('h-full w-full rounded-xl border bg-card', className)}>
      <ReactFlow
        nodes={rfNodes.length ? rfNodes : nodes}
        edges={rfEdges.length ? rfEdges : edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => NODE_TYPE_COLORS[(n.data as { type: NodeType }).type] || '#64748b'}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-card"
        />
        <Panel position="top-left" className="flex gap-2 rounded-lg border bg-card/95 p-2 shadow-lg backdrop-blur">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NodeType | 'all')}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="all">All types</option>
              {nodeTypesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {highlightedNode && (
            <Button variant="ghost" size="sm" onClick={() => setHighlightedNode(null)} className="h-8 text-xs">
              Clear highlight
            </Button>
          )}
        </Panel>
        <Panel position="bottom-right" className="rounded-lg border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          {nodes.length} nodes · {edges.length} edges
        </Panel>
      </ReactFlow>
    </div>
  );
}
