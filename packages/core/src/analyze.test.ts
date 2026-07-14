import { describe, it, expect } from 'vitest';
import { analyzeRepository } from './analyze';

describe('core engine', () => {
  it('exports analyzeRepository function', () => {
    expect(typeof analyzeRepository).toBe('function');
  });
});
