import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import simpleGit from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import type { EnvConfig } from '../../config/env.validation';
import { createChildLogger } from '../../infrastructure/logging/logger';

export interface IngestResult {
  sandboxPath: string;
  fileCount: number;
}

@Injectable()
export class RepositoryIngestService {
  private readonly log = createChildLogger('RepositoryIngest');
  private readonly sandboxBase: string;
  private readonly maxZipEntries: number;
  private readonly maxUncompressedMb: number;

  constructor(private config: ConfigService<EnvConfig>) {
    this.sandboxBase = path.resolve(this.config.get('ANALYSIS_SANDBOX_PATH', { infer: true })!);
    this.maxZipEntries = this.config.get('MAX_ZIP_ENTRIES', { infer: true })!;
    this.maxUncompressedMb = this.config.get('MAX_ZIP_UNCOMPRESSED_MB', { infer: true })!;
    fs.mkdirSync(this.sandboxBase, { recursive: true });
  }

  async ingestFromGitHub(owner: string, repo: string, branch = 'main'): Promise<IngestResult> {
    const sandboxPath = this.createSandbox();
    const git = simpleGit();
    const token = this.config.get('GITHUB_TOKEN', { infer: true });
    const url = token
      ? `https://${token}@github.com/${owner}/${repo}.git`
      : `https://github.com/${owner}/${repo}.git`;

    this.log.info({ owner, repo, branch }, 'Cloning repository');
    await git.clone(url, sandboxPath, ['--depth', '1', '--branch', branch, '--single-branch']);
    return { sandboxPath, fileCount: this.countFiles(sandboxPath) };
  }

  async ingestFromZip(buffer: Buffer): Promise<IngestResult> {
    const sandboxPath = this.createSandbox();
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    if (entries.length > this.maxZipEntries) {
      throw new Error(`Zip contains too many entries: ${entries.length} (max: ${this.maxZipEntries})`);
    }

    let totalUncompressed = 0;
    for (const entry of entries) {
      totalUncompressed += entry.header.size;
      if (totalUncompressed > this.maxUncompressedMb * 1024 * 1024) {
        throw new Error('Zip bomb protection: uncompressed size exceeds limit');
      }
      if (entry.entryName.includes('..') || path.isAbsolute(entry.entryName)) {
        throw new Error('Path traversal detected in zip entry');
      }
    }

    zip.extractAllTo(sandboxPath, true);
    this.log.info({ entries: entries.length }, 'Extracted zip archive');
    return { sandboxPath, fileCount: this.countFiles(sandboxPath) };
  }

  async ingestFromLocal(localPath: string): Promise<IngestResult> {
    const resolved = path.resolve(localPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Local path does not exist: ${resolved}`);
    }

    const sandboxPath = this.createSandbox();
    this.copyDirectory(resolved, sandboxPath);
    return { sandboxPath, fileCount: this.countFiles(sandboxPath) };
  }

  cleanup(sandboxPath: string): void {
    if (sandboxPath.startsWith(this.sandboxBase) && fs.existsSync(sandboxPath)) {
      fs.rmSync(sandboxPath, { recursive: true, force: true });
      this.log.info({ sandboxPath }, 'Cleaned up sandbox');
    }
  }

  private createSandbox(): string {
    const id = uuidv4();
    const sandboxPath = path.join(this.sandboxBase, id);
    fs.mkdirSync(sandboxPath, { recursive: true });
    return sandboxPath;
  }

  private countFiles(dir: string): number {
    let count = 0;
    const walk = (d: string) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else count++;
      }
    };
    walk(dir);
    return count;
  }

  private copyDirectory(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
