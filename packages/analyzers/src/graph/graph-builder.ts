import type { AnalysisResult, GraphData, GraphType } from '@dosson-architecture-visualizer/shared';
import type { GraphNode, GraphEdge } from '@dosson-architecture-visualizer/shared';

export class GraphBuilder {
  buildAll(result: AnalysisResult): Record<GraphType, GraphData> {
    return {
      architecture: this.buildArchitectureGraph(result),
      module_dependency: this.buildModuleDependencyGraph(result),
      service_map: this.buildServiceMap(result),
      api: this.buildApiGraph(result),
      folder_structure: this.buildFolderStructureGraph(result),
      database: this.buildDatabaseGraph(result),
      sequence: this.buildSequenceDiagram(result),
    };
  }

  buildArchitectureGraph(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    // Add framework nodes
    for (const fw of result.frameworks.slice(0, 5)) {
      nodes.push({
        id: `fw-${fw.name}`,
        type: 'module',
        label: fw.name,
        framework: fw.name,
        metadata: { confidence: fw.confidence },
      });
    }

    // Add service nodes
    for (const svc of result.services) {
      nodes.push({
        id: `svc-${svc.name}`,
        type: 'service',
        label: svc.name,
        path: svc.path,
        metadata: { type: svc.type, port: svc.port },
      });
    }

    // Add database nodes
    for (const db of result.databases) {
      const id = `db-${db.type}`;
      nodes.push({
        id,
        type: 'database',
        label: db.type,
        metadata: { orm: db.orm, tables: db.tables },
      });
    }

    // Add queue/cache nodes
    for (const q of result.queues) {
      nodes.push({ id: `queue-${q.name}`, type: 'queue', label: q.name });
    }
    for (const c of result.caches) {
      nodes.push({ id: `cache-${c.name}`, type: 'cache', label: c.name });
    }

    // Add external service nodes
    for (const ext of result.externalServices) {
      nodes.push({ id: `ext-${ext.name}`, type: 'external_api', label: ext.name });
    }

    // Connect services to databases
    for (const svc of result.services) {
      for (const db of result.databases) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: `svc-${svc.name}`,
          target: `db-${db.type}`,
          type: 'reads',
        });
        edges.push({
          id: `edge-${edgeId++}`,
          source: `svc-${svc.name}`,
          target: `db-${db.type}`,
          type: 'writes',
        });
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        style: result.architectureStyle,
        languages: result.languages.map((l) => l.name),
      },
    };
  }

  buildModuleDependencyGraph(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = result.modules.map((m) => ({
      id: m.name,
      type: 'module' as const,
      label: m.name,
      path: m.path,
      metadata: { files: m.files, lines: m.lines, complexity: m.complexity, coupling: m.coupling },
      expandable: true,
    }));

    const edges: GraphEdge[] = [];
    let edgeId = 0;

    for (const mod of result.modules) {
      for (const imp of mod.imports) {
        const targetModule = result.modules.find((m) => imp.includes(m.name));
        if (targetModule && targetModule.name !== mod.name) {
          edges.push({
            id: `edge-${edgeId++}`,
            source: mod.name,
            target: targetModule.name,
            type: 'imports',
          });
        }
      }
    }

    return { nodes, edges, metadata: { totalModules: result.modules.length } };
  }

  buildServiceMap(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    const gateway = { id: 'gateway', type: 'service' as const, label: 'API Gateway' };
    nodes.push(gateway);

    for (const svc of result.services) {
      nodes.push({
        id: `svc-${svc.name}`,
        type: 'service',
        label: svc.name,
        path: svc.path,
        metadata: { type: svc.type },
      });
      edges.push({
        id: `edge-${edgeId++}`,
        source: 'gateway',
        target: `svc-${svc.name}`,
        type: 'calls',
      });
    }

    for (const db of result.databases) {
      nodes.push({ id: `db-${db.type}`, type: 'database', label: db.type });
      for (const svc of result.services) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: `svc-${svc.name}`,
          target: `db-${db.type}`,
          type: 'depends_on',
        });
      }
    }

    return { nodes, edges };
  }

  buildApiGraph(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    const controllers = new Map<string, string>();

    for (const api of result.apis) {
      const controllerName = api.file?.split('/').slice(-2, -1)[0] || 'default';
      if (!controllers.has(controllerName)) {
        const ctrlId = `ctrl-${controllerName}`;
        controllers.set(controllerName, ctrlId);
        nodes.push({
          id: ctrlId,
          type: 'controller',
          label: controllerName,
          framework: api.framework,
        });
      }

      const routeId = `route-${api.method}-${api.path}`.replace(/[^a-zA-Z0-9-]/g, '-');
      nodes.push({
        id: routeId,
        type: 'route',
        label: `${api.method} ${api.path}`,
        path: api.file,
        metadata: { method: api.method, path: api.path },
      });

      edges.push({
        id: `edge-${edgeId++}`,
        source: controllers.get(controllerName)!,
        target: routeId,
        type: 'calls',
      });
    }

    return { nodes, edges, metadata: { totalEndpoints: result.apis.length } };
  }

  buildFolderStructureGraph(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    nodes.push({ id: 'root', type: 'folder', label: 'Project Root', expandable: true });

    for (const folder of result.folderStructure) {
      nodes.push({
        id: `folder-${folder.path}`,
        type: 'folder',
        label: folder.path,
        metadata: { children: folder.children },
        parentId: 'root',
        expandable: (folder.children || 0) > 0,
      });
      edges.push({
        id: `edge-${edgeId++}`,
        source: 'root',
        target: `folder-${folder.path}`,
        type: 'depends_on',
      });
    }

    return { nodes, edges };
  }

  buildDatabaseGraph(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    for (const db of result.databases) {
      const dbId = `db-${db.type}`;
      nodes.push({
        id: dbId,
        type: 'database',
        label: db.type,
        metadata: { orm: db.orm },
      });

      for (const table of db.tables || []) {
        const tableId = `entity-${table}`;
        nodes.push({
          id: tableId,
          type: 'entity',
          label: table,
        });
        edges.push({
          id: `edge-${edgeId++}`,
          source: dbId,
          target: tableId,
          type: 'depends_on',
          label: 'contains',
        });
      }
    }

    return { nodes, edges };
  }

  buildSequenceDiagram(result: AnalysisResult): GraphData {
    const nodes: GraphNode[] = [
      { id: 'client', type: 'external_api', label: 'Client' },
    ];
    const edges: GraphEdge[] = [];
    let edgeId = 0;

    if (result.services.length > 0) {
      const apiService = result.services[0];
      nodes.push({ id: 'api', type: 'service', label: apiService.name });

      edges.push({ id: `edge-${edgeId++}`, source: 'client', target: 'api', type: 'calls', label: 'HTTP Request' });

      if (result.databases.length > 0) {
        nodes.push({ id: 'db', type: 'database', label: result.databases[0].type });
        edges.push({ id: `edge-${edgeId++}`, source: 'api', target: 'db', type: 'reads', label: 'Query' });
        edges.push({ id: `edge-${edgeId++}`, source: 'api', target: 'db', type: 'writes', label: 'Persist' });
      }

      if (result.queues.length > 0) {
        nodes.push({ id: 'queue', type: 'queue', label: result.queues[0].name });
        edges.push({ id: `edge-${edgeId++}`, source: 'api', target: 'queue', type: 'publishes', label: 'Enqueue' });
      }

      edges.push({ id: `edge-${edgeId++}`, source: 'api', target: 'client', type: 'calls', label: 'Response' });
    }

    return { nodes, edges, metadata: { type: 'sequence' } };
  }
}
