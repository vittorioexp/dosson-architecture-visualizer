export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 2rem' }}>
      <p style={{ color: '#3b82f6', fontWeight: 600, fontSize: 14 }}>Open Source</p>
      <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0 1rem' }}>Dosson Architecture Visualizer</h1>
      <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1.125rem' }}>
        Analyze any repository. Generate architecture graphs, quality scores, and HTML reports — offline, from the CLI or dashboard.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <a
          href="http://localhost:3000"
          style={{ background: '#3b82f6', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
        >
          Open Dashboard
        </a>
        <a
          href="https://github.com/vittorioexp/dosson-architecture-visualizer"
          style={{ border: '1px solid #334155', color: '#e2e8f0', padding: '0.75rem 1.5rem', borderRadius: 8, textDecoration: 'none' }}
        >
          GitHub
        </a>
      </div>
      <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, marginTop: '2rem', fontSize: 14 }}>
        {`pnpm install\npnpm build\nnpx dosson analyze .`}
      </pre>
    </main>
  );
}
