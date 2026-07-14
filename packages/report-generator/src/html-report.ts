import type { AnalysisOutput } from '@dosson-architecture-visualizer/shared';
import { toMermaid } from '@dosson-architecture-visualizer/graph';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateHtmlReport(output: AnalysisOutput, projectName = 'Project'): string {
  const { result, graphs } = output;
  const archGraph = graphs.architecture ? toMermaid(graphs.architecture) : '';
  const scores = result.scores;

  const scoreRows = Object.entries(scores)
    .map(([k, v]) => `<div class="score"><span>${escapeHtml(k)}</span><strong>${v}</strong></div>`)
    .join('');

  const techList = [...result.languages, ...result.frameworks]
    .slice(0, 12)
    .map((t) => `<li>${escapeHtml(t.name)} <small>(${(t.confidence * 100).toFixed(0)}%)</small></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dosson Report — ${escapeHtml(projectName)}</title>
  <style>
    :root { --bg: #0f172a; --card: #1e293b; --text: #e2e8f0; --muted: #94a3b8; --accent: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .subtitle { color: var(--muted); margin-bottom: 2rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); margin: 1.5rem 0; }
    .score { background: var(--card); padding: 1rem; border-radius: 8px; }
    .score span { display: block; font-size: 0.75rem; color: var(--muted); text-transform: capitalize; }
    .score strong { font-size: 1.5rem; color: var(--accent); }
    section { background: var(--card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    pre { background: #0b1220; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.8rem; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.25rem 0; }
    .search { width: 100%; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #334155; background: #0b1220; color: var(--text); margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Dosson</h1>
  <p class="subtitle">Architecture report for <strong>${escapeHtml(projectName)}</strong> — ${escapeHtml(result.architectureStyle)}</p>

  <section>
    <h2>Quality Scores</h2>
    <div class="grid">${scoreRows}</div>
  </section>

  <section>
    <h2>Technologies</h2>
    <input type="search" class="search" placeholder="Filter technologies..." oninput="filterList(this.value)" />
    <ul id="tech-list">${techList}</ul>
  </section>

  <section>
    <h2>Architecture Graph (Mermaid)</h2>
    <pre>${escapeHtml(archGraph)}</pre>
  </section>

  <section>
    <h2>Summary</h2>
    <p>Files: ${result.complexity.totalFiles} · Lines: ${result.complexity.totalLines} · Modules: ${result.modules.length}</p>
    <p>APIs: ${result.apis.length} · Security findings: ${result.securityFindings.length} · Circular deps: ${result.circularDependencies.length}</p>
  </section>

  <script>
    function filterList(q) {
      const items = document.querySelectorAll('#tech-list li');
      q = q.toLowerCase();
      items.forEach(li => { li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    }
  </script>
</body>
</html>`;
}
