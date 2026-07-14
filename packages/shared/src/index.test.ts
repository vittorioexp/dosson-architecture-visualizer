import { describe, it, expect } from 'vitest';
import { NODE_TYPE_COLORS, SUPPORTED_LANGUAGES } from '@dosson-architecture-visualizer/shared';

describe('shared package', () => {
  it('should have node type colors for all types', () => {
    expect(NODE_TYPE_COLORS.folder).toBeDefined();
    expect(NODE_TYPE_COLORS.module).toBeDefined();
    expect(NODE_TYPE_COLORS.service).toBeDefined();
  });

  it('should list supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('typescript');
    expect(SUPPORTED_LANGUAGES).toContain('python');
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(5);
  });
});
