import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { analyzeRepository } from './index';

function createTestProject(dir: string) {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'test-app',
    dependencies: { express: '^4.18.0', react: '^18.0.0' },
  }));
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), `
    import express from 'express';
    const app = express();
    app.get('/api/health', (req, res) => res.json({ ok: true }));
    app.listen(3000);
  `);
  fs.writeFileSync(path.join(dir, 'Dockerfile'), 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "src/index.js"]');
  fs.writeFileSync(path.join(dir, 'docker-compose.yml'), 'services:\n  app:\n    build: .\n  postgres:\n    image: postgres:16');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test App\n\n## Installation\n\nnpm install\n\n## Usage\n\nnpm start');
}

describe('analyzeRepository', () => {
  it('should analyze a TypeScript Express project', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archviz-test-'));
    createTestProject(tmpDir);

    const output = await analyzeRepository(tmpDir);

    expect(output.result.languages.length).toBeGreaterThan(0);
    expect(output.result.frameworks.some((f) => f.name === 'Express')).toBe(true);
    expect(output.result.apis.length).toBeGreaterThan(0);
    expect(output.result.docker.length).toBeGreaterThan(0);
    expect(output.result.scores.architecture).toBeGreaterThan(0);
    expect(output.graphs.architecture.nodes.length).toBeGreaterThan(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
