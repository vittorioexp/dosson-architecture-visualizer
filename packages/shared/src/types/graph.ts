export type NodeType =
  | 'folder'
  | 'module'
  | 'class'
  | 'service'
  | 'controller'
  | 'route'
  | 'entity'
  | 'repository'
  | 'external_api'
  | 'database'
  | 'queue'
  | 'cache'
  | 'event';

export type EdgeType =
  | 'imports'
  | 'calls'
  | 'inherits'
  | 'implements'
  | 'depends_on'
  | 'publishes'
  | 'subscribes'
  | 'reads'
  | 'writes';

export type GraphType =
  | 'architecture'
  | 'module_dependency'
  | 'service_map'
  | 'api'
  | 'folder_structure'
  | 'database'
  | 'sequence';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  path?: string;
  language?: string;
  framework?: string;
  metadata?: Record<string, unknown>;
  parentId?: string;
  expandable?: boolean;
  collapsed?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: Record<string, unknown>;
}
