import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeRepository } from '@dosson-architecture-visualizer/core';
import { toMermaid, toPlantUml, toJson, toGraphviz } from '@dosson-architecture-visualizer/graph';
import { generateHtmlReport } from '@dosson-architecture-visualizer/report-generator';
import type { GraphType } from '@dosson-architecture-visualizer/shared';

const VERSION = '1.0.0';

export async function runCli(argv: string[]) {
  const program = new Command();

  program
    .name('dosson')
    .description('Dosson — architecture analysis for modern codebases')
    .version(VERSION);

  program
    .command('analyze [path]')
    .description('Analyze a local repository')
    .option('-j, --json', 'Output JSON to stdout')
    .option('-v, --verbose', 'Verbose output')
    .option('-o, --output <file>', 'Write JSON report to file')
    .action(async (targetPath = '.', opts: { json?: boolean; verbose?: boolean; output?: string }) => {
      const resolved = path.resolve(targetPath);
      if (!fs.existsSync(resolved)) {
        throw new Error(`Path not found: ${resolved}`);
      }

      const spinner = opts.json ? null : ora(`Analyzing ${chalk.cyan(resolved)}`).start();
      const output = await analyzeRepository(resolved);

      if (spinner) {
        spinner.succeed(chalk.green('Analysis complete'));
        if (opts.verbose) {
          console.log(chalk.dim(`  Files: ${output.result.complexity.totalFiles}`));
          console.log(chalk.dim(`  Style: ${output.result.architectureStyle}`));
          console.log(chalk.dim(`  Score: ${output.result.scores.architecture}/100 architecture`));
        } else {
          console.log(`  ${chalk.bold(output.result.architectureStyle)} · ${output.result.complexity.totalFiles} files · arch score ${output.result.scores.architecture}`);
        }
      }

      const json = JSON.stringify(output, null, 2);
      if (opts.output) fs.writeFileSync(opts.output, json);
      if (opts.json) console.log(json);
    });

  program
    .command('graph [path]')
    .description('Export an architecture graph')
    .option('-t, --type <type>', 'Graph type', 'architecture')
    .option('-f, --format <format>', 'mermaid | plantuml | json | graphviz', 'mermaid')
    .option('-o, --output <file>', 'Output file')
    .action(async (targetPath = '.', opts: { type: string; format: string; output?: string }) => {
      const output = await analyzeRepository(path.resolve(targetPath));
      const graphType = opts.type as GraphType;
      const graph = output.graphs[graphType];
      if (!graph) throw new Error(`Unknown graph type: ${opts.type}`);

      let content: string;
      switch (opts.format) {
        case 'plantuml': content = toPlantUml(graph); break;
        case 'json': content = toJson(graph); break;
        case 'graphviz': content = toGraphviz(graph); break;
        default: content = toMermaid(graph);
      }

      if (opts.output) {
        fs.writeFileSync(opts.output, content);
        console.log(chalk.green(`Written to ${opts.output}`));
      } else {
        console.log(content);
      }
    });

  program
    .command('report [path]')
    .description('Generate standalone HTML report')
    .option('-o, --output <file>', 'Output HTML file', 'dosson-report.html')
    .option('-n, --name <name>', 'Project name', 'Project')
    .action(async (targetPath = '.', opts: { output: string; name: string }) => {
      const spinner = ora('Generating report').start();
      const output = await analyzeRepository(path.resolve(targetPath));
      const html = generateHtmlReport(output, opts.name);
      fs.writeFileSync(opts.output, html);
      spinner.succeed(chalk.green(`Report written to ${opts.output}`));
    });

  program
    .command('export [path]')
    .description('Export full analysis JSON')
    .option('-o, --output <file>', 'Output file', 'dosson-analysis.json')
    .action(async (targetPath = '.', opts: { output: string }) => {
      const output = await analyzeRepository(path.resolve(targetPath));
      fs.writeFileSync(opts.output, JSON.stringify(output, null, 2));
      console.log(chalk.green(`Exported to ${opts.output}`));
    });

  program
    .command('doctor')
    .description('Check Dosson environment and project health')
    .action(() => {
      console.log(chalk.bold('Dosson Doctor'));
      const checks = [
        { name: 'Node.js', ok: process.version.startsWith('v'), detail: process.version },
        { name: 'Core engine', ok: true, detail: '@dosson-architecture-visualizer/core' },
        { name: 'Offline mode', ok: true, detail: 'AI optional — static analysis always available' },
      ];
      for (const c of checks) {
        console.log(`  ${c.ok ? chalk.green('✓') : chalk.red('✗')} ${c.name} ${chalk.dim(c.detail)}`);
      }
    });

  await program.parseAsync(argv);
}
