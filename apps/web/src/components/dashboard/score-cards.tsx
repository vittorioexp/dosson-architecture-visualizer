'use client';

import { motion } from 'framer-motion';
import { cn, getScoreColor, formatScore } from '@/lib/utils';

interface ScoreCardProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
  delay?: number;
}

export function ScoreCard({ label, score, icon, delay = 0 }: ScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn('text-3xl font-bold', getScoreColor(score))}>{score}</span>
        <span className="text-xs text-muted-foreground">{formatScore(score)}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500')}
        />
      </div>
    </motion.div>
  );
}

interface DashboardScoresProps {
  scores: Record<string, number>;
}

const SCORE_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  complexity: 'Complexity',
  maintainability: 'Maintainability',
  security: 'Security',
  testCoverage: 'Test Coverage',
  documentation: 'Documentation',
  dependencyHealth: 'Dependency Health',
};

export function DashboardScores({ scores }: DashboardScoresProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Object.entries(SCORE_LABELS).map(([key, label], i) => (
        <ScoreCard key={key} label={label} score={scores[key] || 0} delay={i * 0.05} />
      ))}
    </div>
  );
}
