import type { EdgeType } from '../types/graph';

export const EDGE_TYPE_COLORS: Record<EdgeType, string> = {
  imports: '#3b82f6',
  calls: '#10b981',
  inherits: '#8b5cf6',
  implements: '#6366f1',
  depends_on: '#f59e0b',
  publishes: '#ec4899',
  subscribes: '#06b6d4',
  reads: '#14b8a6',
  writes: '#ef4444',
};

export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  imports: 'Imports',
  calls: 'Calls',
  inherits: 'Inherits',
  implements: 'Implements',
  depends_on: 'Depends On',
  publishes: 'Publishes',
  subscribes: 'Subscribes',
  reads: 'Reads',
  writes: 'Writes',
};
