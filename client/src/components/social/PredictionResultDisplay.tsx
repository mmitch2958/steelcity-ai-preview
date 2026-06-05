/**
 * PredictionResultDisplay — Gauge + confidence indicator + factor breakdown
 * 
 * Shows:
 * - Circular gauge with score 0-10 (red/yellow/green gradient)
 * - Confidence indicator
 * - Factor breakdown with positive/negative indicators
 * - Actionable suggestion cards
 * 
 * P3-B007
 */

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Image,
  Clock,
  Hash,
  MessageSquare,
  Smile,
  Type,
  Target,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PredictionResult, PredictionFactor, PredictionSuggestion } from '@/hooks/social/use-post-prediction';

// ─── Types ──────────────────────────────────────────────────────────

interface PredictionResultDisplayProps {
  prediction: PredictionResult | null;
  isLoading?: boolean;
  error?: Error | null;
  onSuggestionAction?: (suggestion: PredictionSuggestion) => void;
  compact?: boolean;
}

// ─── Score Gauge ────────────────────────────────────────────────────

function ScoreGauge({ score, confidence }: { score: number; confidence: number }) {
  // Color based on score
  const getColor = (s: number) => {
    if (s >= 7) return { main: '#22c55e', bg: '#dcfce7', label: 'Great' };
    if (s >= 4) return { main: '#f59e0b', bg: '#fef3c7', label: 'Good' };
    return { main: '#ef4444', bg: '#fee2e2', label: 'Needs Work' };
  };

  const { main, bg, label } = getColor(score);

  // SVG gauge arc
  const radius = 45;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[120px] h-[70px]">
        <svg
          viewBox="0 0 120 70"
          className="w-full h-full"
          role="img"
          aria-label={`Performance score: ${score.toFixed(1)} out of 10, rated as ${label}`}
        >
          <title>Performance prediction gauge: {score.toFixed(1)}/10 — {label}</title>
          {/* Background arc */}
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke={main}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-end justify-center pb-0" aria-hidden="true">
          <span className="text-2xl font-bold" style={{ color: main }}>
            {score.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground ml-0.5 mb-0.5">/10</span>
        </div>
      </div>

      {/* Label + confidence */}
      <Badge
        variant="secondary"
        className="mt-1 text-xs"
        style={{ backgroundColor: bg, color: main }}
        aria-label={`Rating: ${label}`}
      >
        {label}
      </Badge>
      <div className="flex items-center gap-1 mt-1">
        <div
          className="h-1.5 rounded-full bg-muted w-16 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(confidence * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Prediction confidence: ${Math.round(confidence * 100)}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${confidence * 100}%`,
              backgroundColor: confidence > 0.7 ? '#22c55e' : confidence > 0.5 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(confidence * 100)}% confidence
        </span>
      </div>

      {/* Low confidence warning */}
      {confidence < 0.5 && (
        <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          <span className="text-[10px]">Limited data — prediction may vary</span>
        </div>
      )}
    </div>
  );
}

// ─── Factor Item ────────────────────────────────────────────────────

const FACTOR_ICONS: Record<string, React.ElementType> = {
  'Posting Time': Clock,
  'Content Length': Type,
  'Call-to-Action': Target,
  'Question': MessageSquare,
  'Emoji': Smile,
  'Sentiment': Sparkles,
  'Hashtag Strategy': Hash,
  'Media': Image,
  'Platform Strategy': Target,
};

function FactorItem({ factor }: { factor: PredictionFactor }) {
  const Icon = FACTOR_ICONS[factor.name] || Sparkles;
  const impactColor = factor.impact === 'positive'
    ? 'text-green-600 dark:text-green-400'
    : factor.impact === 'negative'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  const ImpactIcon = factor.impact === 'positive'
    ? TrendingUp
    : factor.impact === 'negative'
    ? TrendingDown
    : Minus;

  const impactLabel = factor.impact === 'positive' ? 'positive' : factor.impact === 'negative' ? 'negative' : 'neutral';

  return (
    <div
      className="flex items-center gap-2 py-1.5"
      role="listitem"
      aria-label={`${factor.name}: ${factor.value > 0 ? '+' : ''}${factor.value.toFixed(1)} impact (${impactLabel})`}
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
      <span className="text-sm flex-1 min-w-0 truncate">{factor.name}</span>
      <div className={cn('flex items-center gap-0.5', impactColor)} aria-hidden="true">
        <ImpactIcon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {factor.value > 0 ? '+' : ''}{factor.value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ─── Suggestion Card ────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: PredictionSuggestion;
  onAction?: (s: PredictionSuggestion) => void;
}) {
  const actionIcons: Record<string, React.ElementType> = {
    add_media: Image,
    change_time: Clock,
    add_hashtags: Hash,
    remove_hashtags: Hash,
    add_cta: Target,
    adjust_length: Type,
    add_emoji: Smile,
  };
  const Icon = actionIcons[suggestion.actionType] || Sparkles;

  return (
    <div
      className="flex items-start gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
      role="article"
      aria-label={`Suggestion: ${suggestion.title}. Potential impact: +${suggestion.potentialImpact.toFixed(1)} points. ${suggestion.description}`}
    >
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{suggestion.title}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0" aria-label={`+${suggestion.potentialImpact.toFixed(1)} point impact`}>
            +{suggestion.potentialImpact.toFixed(1)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" aria-hidden="true">
          {suggestion.description}
        </p>
      </div>
      {onAction && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs flex-shrink-0"
          onClick={() => onAction(suggestion)}
          aria-label={`Apply suggestion: ${suggestion.title}`}
        >
          Apply
          <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function PredictionResultDisplay({
  prediction,
  isLoading,
  error,
  onSuggestionAction,
  compact = false,
}: PredictionResultDisplayProps) {
  // Separate positive and negative factors
  const { positiveFactors, negativeFactors } = useMemo(() => {
    if (!prediction) return { positiveFactors: [], negativeFactors: [] };
    return {
      positiveFactors: prediction.factors.filter(f => f.impact === 'positive'),
      negativeFactors: prediction.factors.filter(f => f.impact === 'negative' || f.impact === 'neutral'),
    };
  }, [prediction]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing post...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-[70px] w-[120px] mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="pt-5 text-center text-sm text-muted-foreground">
          <AlertTriangle className="mx-auto h-6 w-6 text-destructive mb-2" />
          Unable to generate prediction
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card>
        <CardContent className="pt-5 text-center text-sm text-muted-foreground">
          <Sparkles className="mx-auto h-6 w-6 mb-2 opacity-50" />
          <p>Start typing to see engagement predictions</p>
          <p className="text-xs mt-1">AI will analyze your content and suggest improvements</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Performance Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? 'max-h-[400px]' : ''}>
          <div className="space-y-4">
            {/* Score Gauge */}
            <ScoreGauge score={prediction.score} confidence={prediction.confidence} />

            {/* Factor Breakdown */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2" id="factors-label">
                Scoring Factors
              </p>
              <div className="divide-y" role="list" aria-labelledby="factors-label">
                {positiveFactors.map((f) => (
                  <FactorItem key={f.name} factor={f} />
                ))}
                {negativeFactors.map((f) => (
                  <FactorItem key={f.name} factor={f} />
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {prediction.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Suggestions to Improve
                </p>
                <div className="space-y-2">
                  {prediction.suggestions.slice(0, compact ? 3 : 5).map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      onAction={onSuggestionAction}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default PredictionResultDisplay;
