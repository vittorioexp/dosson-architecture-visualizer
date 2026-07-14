import type { GraphData } from '@dosson-architecture-visualizer/shared';
import { NODE_TYPE_LABELS } from '@dosson-architecture-visualizer/shared';

export function toMermaid(graph: GraphData, direction: 'TB' | 'LR' = 'TB'): string {
  const lines: string[] = [`graph ${direction}`];

  for (const node of graph.nodes) {
    const shape = getMermaidShape(node.type);
    const label = node.label.replace(/"/g, "'");
    lines.push(`  ${sanitizeId(node.id)}${shape[0]}"${label}"${shape[1]}`);
  }

  for (const edge of graph.edges) {
    const arrow = getMermaidArrow(edge.type);
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`  ${sanitizeId(edge.source)} ${arrow}${label} ${sanitizeId(edge.target)}`);
  }

  return lines.join('\n');
}

export function toPlantUml(graph: GraphData): string {
  const lines: string[] = ['@startuml', 'skinparam componentStyle rectangle'];

  for (const node of graph.nodes) {
    const typeLabel = NODE_TYPE_LABELS[node.type] || node.type;
    lines.push(`component "${node.label}" as ${sanitizeId(node.id)} <<${typeLabel}>>`);
  }

  lines.push('');
  for (const edge of graph.edges) {
    const label = edge.label || edge.type;
    lines.push(`${sanitizeId(edge.source)} --> ${sanitizeId(edge.target)} : ${label}`);
  }

  lines.push('@enduml');
  return lines.join('\n');
}

export function toJson(graph: GraphData): string {
  return JSON.stringify(graph, null, 2);
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function getMermaidShape(type: string): [string, string] {
  switch (type) {
    case 'database': return ['[(', ')]'];
    case 'external_api': return ['{{', '}}'];
    case 'queue':
    case 'cache': return ['>', ']'];
    default: return ['[', ']'];
  }
}

function getMermaidArrow(type: string): string {
  switch (type) {
    case 'inherits': return '--|>';
    case 'implements': return '..|>';
    case 'depends_on': return '-.->';
    default: return '-->';
  }
}
