import type { NodeType } from '../types/graph';

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  folder: '#64748b',
  module: '#3b82f6',
  class: '#8b5cf6',
  service: '#06b6d4',
  controller: '#f59e0b',
  route: '#10b981',
  entity: '#ec4899',
  repository: '#6366f1',
  external_api: '#ef4444',
  database: '#14b8a6',
  queue: '#f97316',
  cache: '#a855f7',
  event: '#84cc16',
};

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  folder: 'folder',
  module: 'package',
  class: 'box',
  service: 'server',
  controller: 'cpu',
  route: 'route',
  entity: 'database',
  repository: 'hard-drive',
  external_api: 'globe',
  database: 'database',
  queue: 'list-ordered',
  cache: 'zap',
  event: 'radio',
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  folder: 'Folder',
  module: 'Module',
  class: 'Class',
  service: 'Service',
  controller: 'Controller',
  route: 'Route',
  entity: 'Entity',
  repository: 'Repository',
  external_api: 'External API',
  database: 'Database',
  queue: 'Queue',
  cache: 'Cache',
  event: 'Event',
};
