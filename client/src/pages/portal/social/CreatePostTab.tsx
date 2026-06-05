// CreatePostTab — Extracted from PortalSocialMedia.tsx
// Part of SMP-Updates refactor (B006) — see docs/ADR-001-social-media-component-architecture.md
// Uses useReducer pattern with private sub-components (ModeSelector, AutonomousSection, AiStudioSection, ComposeSection)

import { Helmet } from 'react-helmet-async';

import React, { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPostReducer, initialState, type CreatePostState, type CreatePostAction } from './create-post-state';
import { useCreatePost } from '../../../hooks/social/use-social-posts';
import {
  useAiOrchestrate,
  useAiGeneratePost,
  useAiVibeEdit,
  useAiReview,
  useAiResearch,
  useAiDesign,
  useAiAutonomous,
  useAiGenerateImage,
  useAiGenerateVideo,
} from '../../../hooks/social/use-social-ai';
import { useMediaUpload } from '../../../hooks/social/use-media-upload';
import { useBrandVoices } from '../../../hooks/social/use-brand-voice';
import { useSocialCampaigns } from '../../../hooks/social/use-social-campaigns';
import { useSocialAccounts } from '../../../hooks/social/use-social-accounts';
import { useDraftAutosave, type DraftData } from '../../../hooks/social/use-draft-autosave';
import { usePredictPostPerformance, type PredictionSuggestion } from '../../../hooks/social/use-post-prediction';
import { useHashtagSuggestions } from '../../../hooks/social/use-hashtag-analytics';
import { PLATFORMS } from '../../../components/social/constants';
import { SortableMediaGrid } from '../../../components/social/SortableMediaGrid';
import { SocialPostPreview } from '../../../components/SocialPostPreview';
import { RealTimePreview } from '../../../components/social/RealTimePreview';
import { TemplatePicker } from '../../../components/social/TemplatePicker';
import { PredictionResultDisplay } from '../../../components/social/PredictionResultDisplay';
import { DraftBanner, AutoSaveIndicator } from '../../../components/social/DraftBanner';
import type { PostTemplate } from '../../../hooks/social/use-social-templates';
import { apiRequest, queryClient } from '../../../lib/queryClient';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import {
  PenLine,
  Sparkles,
  Zap,
  RefreshCw,
  Loader2,
  CheckCircle,
  Hash,
  Target,
  Search,
  PenTool,
  Palette,
  Eye,
  Copy,
  Plus,
  Send,
  FileText,
  Wand2,
  Upload,
  X as XIcon,
  TrendingUp,
  Lightbulb,
  Clock,
  Calendar,
  Star,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { SiYoutube } from 'react-icons/si';

type SectionProps = {
  state: CreatePostState;
  dispatch: React.Dispatch<CreatePostAction>;
};

function safeStr(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}

//
// Private Sub-Components (within CreatePostTab.tsx — NOT separate files)
//

/** Mode toggle: Manual / AI-Assisted / Create Everything */
function ModeSelector({ state, dispatch }: SectionProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={state.mode === 'manual' ? 'default' : 'outline'}
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'manual' })}
      >
        <PenLine className="h-4 w-4 mr-2" />
        Manual
      </Button>
      <Button
        variant={state.mode === 'ai' ? 'default' : 'outline'}
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'ai' })}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        AI-Assisted
      </Button>
      <Button
        variant={state.mode === 'autonomous' ? 'default' : 'outline'}
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'autonomous' })}
      >
        <Zap className="h-4 w-4 mr-2" />
        Create Everything
      </Button>
    </div>
  );
}

/** Platform checkboxes (shared across all modes) */
function PlatformSelector({ state, dispatch }: SectionProps) {
  return (
    <div className="space-y-2">
      <Label>Platforms</Label>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
                  return (
            <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.selectedPlatforms.includes(platform.id)}
                onCheckedChange={() => dispatch({ type: 'TOGGLE_PLATFORM', platformId: platform.id })}
              />
              <Icon className="h-4 w-4" />
              <span className="text-sm">{platform.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Autonomous mode: briefing → AI does everything */
function AutonomousSection({ state, dispatch }: SectionProps) {
  const { toast } = useToast();
  const { brandVoices } = useBrandVoices('portal');
  const autonomousMutation = useAiAutonomous('portal');


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Fully Autonomous Creation
        </CardTitle>
        <CardDescription>
          AI researches trends, writes optimized content, generates visuals, and schedules your post — all automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>What should this post be about?</Label>
          <Textarea
            value={state.briefing}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'briefing', value: e.target.value })}
            placeholder="e.g., New listing in Pittsburgh, PA — 3BR/2BA, move-in ready. Target first-time buyers."
            className="min-h-[100px]"
          />
        </div>

        <PlatformSelector state={state} dispatch={dispatch} />

        {brandVoices.length > 0 && (
          <div className="space-y-2">
            <Label>Brand Voice (optional)</Label>
            <Select
              value={state.selectedBrandVoiceId}
              onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'selectedBrandVoiceId', value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Default brand voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {brandVoices.map((bv) => (
                  <SelectItem key={bv.id} value={bv.id}>
                    {bv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/40">
          <div>
            <Label htmlFor="auto-post-switch" className="text-sm font-medium cursor-pointer">
              Auto-post when done
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Off: saves as draft with AI schedule recommendation. On: automatically schedules the post.
            </p>
          </div>
          <Switch
            id="auto-post-switch"
            checked={state.autoPost}
            onCheckedChange={(value) => dispatch({ type: 'SET_FIELD', field: 'autoPost', value })}
          />
        </div>

        <Button
          onClick={() =>
            autonomousMutation.mutate(
              {
                briefing: state.briefing,
                platforms: state.selectedPlatforms,
                brandVoiceId: state.selectedBrandVoiceId === 'none' ? undefined : state.selectedBrandVoiceId,
                autoPost: state.autoPost,
              },
              {
                onSuccess: (data) => {
                  dispatch({ type: 'SET_FIELD', field: 'autonomousResult', value: data });
                  const desc = data.autoPost
                    ? `Post scheduled for ${new Date(data.aiResults?.schedule?.scheduledAt).toLocaleString()}.`
                    : 'Draft saved — review and schedule or post it from My Posts.';
                  toast({ title: 'AI creation complete', description: desc });
                  queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
                },
                onError: (error: Error) => {
                  toast({ title: 'Autonomous creation failed', description: error.message, variant: 'destructive' });
                },
              },
            )
          }
          disabled={!state.briefing.trim() || state.selectedPlatforms.length === 0 || autonomousMutation.isPending}
          className="w-full"
          size="lg"
        >
          {autonomousMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              AI is working...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Create Everything
            </>
          )}
        </Button>

        {autonomousMutation.isPending && (
          <div className="space-y-2 p-3 rounded-md bg-muted" role="status" aria-live="polite" aria-busy="true">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">AI is working...</span>
            </div>
            <div className="space-y-1.5" role="list" aria-label="AI creation progress steps">
              {['Researching trends & audience', 'Writing optimized content', 'Planning visual design', 'Generating visual assets', 'Setting optimal schedule', 'Saving post'].map((label) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground" role="listitem">
                  <CheckCircle className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">This may take 1–2 minutes. Images are being created by AI.</p>
          </div>
        )}

        {state.autonomousResult && !autonomousMutation.isPending && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {state.autonomousResult.autoPost ? 'Post Created & Scheduled' : 'Draft Saved with AI Recommendation'}
              </span>
            </div>
            {state.autonomousResult.aiResults?.schedule?.scheduledAt && (
              <p className="text-xs text-muted-foreground">
                {state.autonomousResult.autoPost ? 'Scheduled for' : 'AI recommends posting'}:{' '}
                {new Date(state.autonomousResult.aiResults.schedule.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{' '}
                at {new Date(state.autonomousResult.aiResults.schedule.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {!state.autonomousResult.autoPost && (
              <p className="text-xs text-muted-foreground">Go to the Posts tab to review, edit, schedule, or publish.</p>
            )}
            {(state.autonomousResult.aiResults?.content || state.autonomousResult.post?.content) && (
              <div className="p-3 rounded-md bg-white/60 dark:bg-black/20 border border-green-100 dark:border-green-900/30">
                <p className="whitespace-pre-wrap text-sm">{state.autonomousResult.aiResults?.content || state.autonomousResult.post?.content}</p>
              </div>
            )}
            {state.autonomousResult.aiResults?.generatedImages?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{state.autonomousResult.aiResults.generatedImages.length} AI-generated visual(s) attached</p>
                <div className="flex flex-wrap gap-2">
                  {state.autonomousResult.aiResults.generatedImages.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`Generated visual ${i + 1}`} className="h-20 w-20 rounded-md object-cover border border-green-200 dark:border-green-800" />
                  ))}
                </div>
              </div>
            )}
            {state.autonomousResult.aiResults?.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {state.autonomousResult.aiResults.hashtags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag.replace(/^#/, '')}
                  </Badge>
                ))}
              </div>
            )}
            {state.autonomousResult.aiResults?.review?.score !== undefined && (
              <p className="text-xs text-muted-foreground">Score: {state.autonomousResult.aiResults.review.score}/100</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** AI Studio: research, orchestrate, generate, design, review, vibe edit */
function AiStudioSection({ state, dispatch }: SectionProps) {
  const { toast } = useToast();
  const { brandVoices } = useBrandVoices('portal');
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [generatingImageIdx, setGeneratingImageIdx] = useState<number | null>(null);

  const researchMutation = useAiResearch('portal');
  const orchestrateMutation = useAiOrchestrate('portal');
  const generatePostMutation = useAiGeneratePost('portal');
  const designMutation = useAiDesign('portal');
  const reviewMutation = useAiReview('portal');

  const handleGenerateVisual = async (description: string, index: number) => {
    setGeneratingImageIdx(index);
    try {
      const res = await apiRequest('POST', '/api/portal/social/ai/generate-image', { description });
      const data = await res.json();
      if (data.url) {
        dispatch({ type: 'ADD_MEDIA', urls: [data.url] });
        toast({ title: 'Image generated', description: 'AI-created visual has been added to your media.' });
      } else {
        toast({ title: 'Generation issue', description: 'No image was returned. Try again or adjust the prompt.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message || 'Could not generate image', variant: 'destructive' });
    } finally {
      setGeneratingImageIdx(null);
    }
  };

  const handleSaveAsPost = async (status: 'draft' | 'scheduled', scheduledAt?: string) => {
    const content = state.aiResult?.content || state.aiResult?.generatedContent || state.content;
    if (!content) {
      toast({ title: 'No content', description: 'Generate content first before saving.', variant: 'destructive' });
      return;
    }
    setIsSavingPost(true);
    try {
      const payload: any = {
        content,
        platforms: state.selectedPlatforms.length > 0 ? state.selectedPlatforms : ['facebook'],
        hashtags: Array.isArray(state.aiResult?.hashtags) ? state.aiResult.hashtags : [],
        mediaUrls: state.mediaUrls.length > 0 ? state.mediaUrls : undefined,
        status,
        scheduledAt: scheduledAt || undefined,
      };
      await apiRequest('POST', '/api/portal/social/posts', payload);
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      toast({
        title: status === 'draft' ? 'Saved as draft' : 'Post scheduled',
        description: status === 'scheduled' && scheduledAt
          ? `Scheduled for ${new Date(scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Your post has been saved to the Posts tab.',
      });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Could not save post', variant: 'destructive' });
    } finally {
      setIsSavingPost(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Content Studio
        </CardTitle>
        <CardDescription>Research trends, generate content with brand voice, then refine before posting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PlatformSelector state={state} dispatch={dispatch} />

        {brandVoices.length > 0 && (
          <div className="space-y-2">
            <Label>Brand Voice (optional)</Label>
            <Select
              value={state.selectedBrandVoiceId}
              onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'selectedBrandVoiceId', value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Default brand voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                {brandVoices.map((bv) => (
                  <SelectItem key={bv.id} value={bv.id}>
                    {bv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Brief / Topic</Label>
          <Textarea
            value={state.briefing}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'briefing', value: e.target.value })}
            placeholder="Describe what you want to post about..."
            className="min-h-[90px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() =>
              orchestrateMutation.mutate(
                {
                  briefing: state.briefing,
                  platforms: state.selectedPlatforms,
                  brandVoiceId: state.selectedBrandVoiceId === 'none' ? undefined : state.selectedBrandVoiceId,
                },
                {
                  onSuccess: (data) => {
                    dispatch({ type: 'SET_FIELD', field: 'aiResult', value: data });
                    toast({ title: 'AI content generated', description: 'Review the generated content below.' });
                  },
                  onError: (error: Error) => {
                    toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
                  },
                },
              )
            }
            disabled={!state.briefing.trim() || state.selectedPlatforms.length === 0 || orchestrateMutation.isPending || generatePostMutation.isPending}
            className="col-span-2"
          >
            {orchestrateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Full AI Workflow
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              generatePostMutation.mutate(
                {
                  prompt: state.briefing,
                  platforms: state.selectedPlatforms,
                  brandVoiceId: state.selectedBrandVoiceId === 'none' ? undefined : state.selectedBrandVoiceId,
                },
                {
                  onSuccess: (data) => {
                    const generated = data?.content || data?.generatedContent || '';
                    if (generated) dispatch({ type: 'SET_FIELD', field: 'content', value: generated });
                    dispatch({ type: 'SET_FIELD', field: 'aiResult', value: data });
                    toast({ title: 'Post generated', description: 'Content is ready for editing.' });
                  },
                  onError: (error: Error) => {
                    toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
                  },
                },
              )
            }
            disabled={!state.briefing.trim() || state.selectedPlatforms.length === 0 || orchestrateMutation.isPending || generatePostMutation.isPending}
          >
            {generatePostMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
            Generate Post
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              researchMutation.mutate(
                { topic: state.briefing, platforms: state.selectedPlatforms },
                {
                  onSuccess: (data) => {
                    dispatch({ type: 'SET_FIELD', field: 'researchResult', value: data });
                    toast({ title: 'Research complete', description: 'Trend insights are ready.' });
                  },
                  onError: (error: Error) => {
                    toast({ title: 'Research failed', description: error.message, variant: 'destructive' });
                  },
                },
              )
            }
            disabled={!state.briefing.trim() || state.selectedPlatforms.length === 0 || researchMutation.isPending}
          >
            {researchMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Research Trends
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              designMutation.mutate(
                { content: state.content || state.aiResult?.content || '', platforms: state.selectedPlatforms },
                {
                  onSuccess: (data) => {
                    dispatch({ type: 'SET_FIELD', field: 'designResult', value: data });
                    toast({ title: 'Design suggestions ready', description: 'See visual recommendations below.' });
                  },
                  onError: (error: Error) => {
                    toast({ title: 'Design suggestions failed', description: error.message, variant: 'destructive' });
                  },
                },
              )
            }
            disabled={!state.briefing.trim() || state.selectedPlatforms.length === 0 || designMutation.isPending}
          >
            {designMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Palette className="h-4 w-4 mr-2" />}
            Design Suggestions
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              reviewMutation.mutate(
                { content: state.content || state.aiResult?.content, platforms: state.selectedPlatforms },
                {
                  onSuccess: (data) => {
                    dispatch({ type: 'SET_FIELD', field: 'reviewResult', value: data });
                    toast({ title: 'Review complete', description: 'See your score and suggestions.' });
                  },
                  onError: (error: Error) => {
                    toast({ title: 'Review failed', description: error.message, variant: 'destructive' });
                  },
                },
              )
            }
            disabled={(!state.content && !state.briefing.trim()) || state.selectedPlatforms.length === 0 || reviewMutation.isPending}
          >
            {reviewMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Review Post
          </Button>
        </div>

        {/* Generated Content */}
        {state.aiResult && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generated Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-md bg-muted border">
                <p className="whitespace-pre-wrap text-sm">{state.aiResult?.content || state.aiResult?.generatedContent}</p>
              </div>
              {Array.isArray(state.aiResult?.hashtags) && state.aiResult.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {state.aiResult.hashtags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      {String(tag).replace(/^#/, '')}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1 border-t flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'APPLY_AI_CONTENT', aiResult: state.aiResult });
                    toast({ title: 'Content applied', description: 'AI content has been loaded into the editor.' });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Use This Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveAsPost('draft')}
                  disabled={isSavingPost}
                >
                  {isSavingPost ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                  Save as Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveAsPost('scheduled')}
                  disabled={isSavingPost}
                >
                  {isSavingPost ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Research Findings */}
        {(state.researchResult || state.aiResult?.research) && (() => {
          const research = state.researchResult || state.aiResult?.research;
          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Research Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typeof research === 'object' && !Array.isArray(research) ? (
                  <div className="space-y-3">
                    {Array.isArray(research.trends) && research.trends.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Trending Topics</h4>
                        <div className="space-y-1.5">
                          {research.trends.map((trend: any, i: number) => (
                            <div key={i} className="rounded-md bg-muted p-2.5">
                              <p className="text-sm font-medium">{safeStr(trend.name || trend)}</p>
                              {trend.description && <p className="text-xs text-muted-foreground mt-0.5">{safeStr(trend.description)}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(research.suggestions) && research.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Suggestions</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                          {research.suggestions.map((s: any, i: number) => (
                            <li key={i}>{safeStr(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {research.optimalTimes && Object.keys(research.optimalTimes).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-sm font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Best Times to Post
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSavingPost}
                            onClick={() => {
                              const bestTimes = research.optimalTimes;
                              const platforms = state.selectedPlatforms.length > 0 ? state.selectedPlatforms : ['facebook'];
                              const platformKey = platforms[0];
                              const ptData = bestTimes[platformKey];
                              if (!ptData) {
                                toast({ title: 'Schedule applied', description: 'No specific time data found for selected platform.' });
                                return;
                              }
                              const ptStr = typeof ptData === 'string' ? ptData : JSON.stringify(ptData);
                              const dayMatch = ptStr.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
                              const timeMatch = ptStr.match(/(\d{1,2})(?::00)?\s*(AM|PM)/i);
                              const now = new Date();
                              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const targetDay = dayMatch ? dayMatch[1] : 'Wednesday';
                              let targetHour = 11;
                              if (timeMatch) {
                                let hr = parseInt(timeMatch[1]);
                                if (timeMatch[2].toUpperCase() === 'PM' && hr !== 12) hr += 12;
                                if (timeMatch[2].toUpperCase() === 'AM' && hr === 12) hr = 0;
                                targetHour = hr;
                              }
                              let candidate: Date | null = null;
                              for (let offset = 1; offset <= 14; offset++) {
                                const d = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
                                if (dayNames[d.getDay()].toLowerCase() === targetDay.toLowerCase()) {
                                  d.setHours(targetHour, 0, 0, 0);
                                  candidate = d;
                                  break;
                                }
                              }
                              if (!candidate) {
                                candidate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
                                candidate.setHours(targetHour, 0, 0, 0);
                              }
                              handleSaveAsPost('scheduled', candidate.toISOString());
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Apply Schedule
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          {Object.entries(research.optimalTimes).map(([platform, time]: [string, any]) => {
                            const platformInfo = PLATFORMS.find((p) => p.id === platform);
                            const PIcon = platformInfo?.icon;
                            const timeData = typeof time === 'string' ? time : (typeof time === 'object' && time !== null ? (() => {
                              const parts: string[] = [];
                              if (time.best_days && Array.isArray(time.best_days)) parts.push('Days: ' + time.best_days.join(', '));
                              if (time.best_times && Array.isArray(time.best_times)) parts.push('Times: ' + time.best_times.join(', '));
                              if (time.frequency) parts.push('Frequency: ' + time.frequency);
                              return parts.length > 0 ? parts.join(' | ') : JSON.stringify(time);
                            })() : JSON.stringify(time));
                            return (
                              <div key={platform} className="rounded-md bg-muted p-2.5 flex items-start gap-2">
                                <div className="flex items-center gap-1.5 min-w-[90px]">
                                  {PIcon && <PIcon className="w-3 h-3" />}
                                  <span className="text-sm font-medium capitalize">{platform}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{timeData}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {Array.isArray(research.youtubeShorts) && research.youtubeShorts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-1.5">
                          <SiYoutube className="h-3.5 w-3.5 text-red-600" />
                          Relevant YouTube Shorts
                        </h4>
                        <div className="space-y-1.5">
                          {research.youtubeShorts.map((short: any, i: number) => (
                            <div key={i} className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={safeStr(short.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary underline underline-offset-2 break-all"
                                >
                                  {safeStr(short.title || short.url)}
                                </a>
                                {short.relevance && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{safeStr(short.relevance)}</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const shortUrl = safeStr(short.url);
                                  const shortTitle = safeStr(short.title);
                                  const linkText = `\n\nCheck out: ${shortTitle} - ${shortUrl}`;
                                  const currentContent = state.content || '';
                                  if (currentContent.includes(shortUrl)) {
                                    toast({ title: 'Link already added', description: 'This YouTube Short is already in your post.' });
                                    return;
                                  }
                                  const newContent = currentContent
                                    ? currentContent + linkText
                                    : `Check out: ${shortTitle} - ${shortUrl}`;
                                  dispatch({ type: 'SET_FIELD', field: 'content', value: newContent });
                                  toast({ title: 'Link added', description: 'YouTube Short link added to your post content.' });
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add to post
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{safeStr(research)}</p>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Design Suggestions */}
        {(state.designResult || state.aiResult?.design) && (() => {
          const design = state.designResult || state.aiResult?.design;
          if (!design || (typeof design === 'object' && Object.keys(design).length === 0)) return null;
          const isRich = typeof design === 'object' && !Array.isArray(design);
          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isRich ? (
                  <div className="space-y-3">
                    {design.image_prompt && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Image Prompt</h4>
                        <div className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                          <p className="text-sm flex-1">{design.image_prompt}</p>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={generatingImageIdx === -1}
                            onClick={() => handleGenerateVisual(design.image_prompt, -1)}
                          >
                            {generatingImageIdx === -1 ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3 mr-1" />
                            )}
                            Generate
                          </Button>
                        </div>
                      </div>
                    )}
                    {Array.isArray(design.visualSuggestions) && design.visualSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Visual Ideas</h4>
                        <div className="space-y-1.5">
                          {design.visualSuggestions.map((s: any, i: number) => {
                            const isObj = typeof s === 'object' && s !== null;
                            const type = isObj ? (s.type || 'image') : 'image';
                            const desc = isObj ? (s.description || safeStr(s)) : safeStr(s);
                            return (
                              <div key={i} className="rounded-md bg-muted p-2.5 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                                        {type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm">{desc}</p>
                                  </div>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={generatingImageIdx === i}
                                    onClick={() => handleGenerateVisual(desc, i)}
                                  >
                                    {generatingImageIdx === i ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Wand2 className="h-3 w-3 mr-1" />
                                    )}
                                    Generate
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {Array.isArray(design.captions) && design.captions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Alternative Captions</h4>
                        {design.captions.map((c: any, i: number) => (
                          <div key={i} className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                            <p className="text-sm">{safeStr(c)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                dispatch({ type: 'SET_FIELD', field: 'content', value: safeStr(c) });
                                toast({ title: 'Applied', description: 'Caption loaded into editor.' });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {((design.colorSchemes && Object.keys(design.colorSchemes).length > 0) || (Array.isArray(design.color_palette) && design.color_palette.length > 0)) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Color Palette</h4>
                        <div className="flex gap-2 flex-wrap">
                          {design.colorSchemes && Object.entries(design.colorSchemes).map(([name, color]: [string, any]) => (
                            <div key={name} className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: typeof color === 'string' ? color : '#ccc' }} />
                              <span className="text-xs text-muted-foreground capitalize">{name}</span>
                            </div>
                          ))}
                          {Array.isArray(design.color_palette) && design.color_palette.map((hex: string, i: number) => (
                            <div key={`p${i}`} className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: hex }} />
                              <span className="text-xs text-muted-foreground">{hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(design.suggestions) && design.suggestions.length > 0 && (
                      <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                        {design.suggestions.map((s: any, i: number) => (
                          <li key={i}>{safeStr(s)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-wrap">
                      {typeof design === 'string' ? design : JSON.stringify(design, null, 2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Fallback Design Suggestions (separate field from orchestrate) */}
        {(state.aiResult?.designSuggestions && !state.designResult && !state.aiResult?.design) && (() => {
          const ds = state.aiResult.designSuggestions;
          if (Array.isArray(ds)) {
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Design Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    {ds.map((s: any, i: number) => (
                      <li key={i}>{safeStr(s)}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeof ds === 'object' ? (
                  <div className="space-y-3">
                    {ds.visualSuggestions && Array.isArray(ds.visualSuggestions) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Visual Ideas</h4>
                        {ds.visualSuggestions.map((s: any, i: number) => {
                          const isObj = typeof s === 'object' && s !== null;
                          const type = isObj ? (s.type || 'image') : 'image';
                          const desc = isObj ? (s.description || safeStr(s)) : safeStr(s);
                          return (
                            <div key={i} className="rounded-md bg-muted p-2.5 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                                      {type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">{desc}</p>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={generatingImageIdx === (100 + i)}
                                  onClick={() => handleGenerateVisual(desc, 100 + i)}
                                >
                                  {generatingImageIdx === (100 + i) ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Wand2 className="h-3 w-3 mr-1" />
                                  )}
                                  Generate
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {ds.captions && Array.isArray(ds.captions) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Alternative Captions</h4>
                        {ds.captions.map((c: any, i: number) => (
                          <div key={i} className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                            <p className="text-sm">{safeStr(c)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                dispatch({ type: 'SET_FIELD', field: 'content', value: safeStr(c) });
                                toast({ title: 'Applied', description: 'Caption loaded into editor.' });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-wrap">{JSON.stringify(ds, null, 2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Review Results */}
        {(state.reviewResult || state.aiResult?.review) && (() => {
          const review = state.reviewResult || state.aiResult?.review;
          const score = review?.score;
          return (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Content Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {score !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.round(score / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{score}/100</span>
                    </div>
                  )}
                  {review?.approved_for_publish !== undefined && (
                    <Badge variant={review.approved_for_publish ? 'default' : 'destructive'}>
                      {review.approved_for_publish ? 'Approved' : 'Needs Revision'}
                    </Badge>
                  )}
                </div>
                {review?.summary && <p className="text-sm text-muted-foreground">{safeStr(review.summary)}</p>}
                {review?.reviews && Object.keys(review.reviews).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Per-Platform Scores</h4>
                    {Object.entries(review.reviews).map(([platform, pReview]: [string, any]) => {
                      const pl = PLATFORMS.find((p) => p.id === platform);
                      const PIcon = pl?.icon;
                      return (
                        <div key={platform} className="rounded-md bg-muted p-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {PIcon && <PIcon className="h-3 w-3" />}
                            <span className="text-sm font-medium capitalize">{pl?.label || platform}</span>
                            {pReview.overall !== undefined && (
                              <span className="text-sm text-muted-foreground ml-auto">{pReview.overall}/10</span>
                            )}
                          </div>
                          {pReview.scores && (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(pReview.scores).map(([dim, dimScore]: [string, any]) => (
                                <Badge key={dim} variant={Number(dimScore) >= 7 ? 'outline' : 'destructive'} className="text-xs capitalize">
                                  {dim}: {dimScore}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {pReview.issues && Array.isArray(pReview.issues) && pReview.issues.length > 0 && (
                            <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                              {pReview.issues.map((issue: string, j: number) => (
                                <li key={j}>{issue}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!review?.reviews && review?.feedback && (
                  <p className="text-sm text-muted-foreground">{safeStr(review.feedback)}</p>
                )}
                {Array.isArray(review?.suggestions) && review.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Improvement Suggestions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {review.suggestions.map((s: any, i: number) => (
                        <li key={i}>{safeStr(s)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {review?.strengths && Array.isArray(review.strengths) && review.strengths.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Strengths</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {review.strengths.map((s: any, i: number) => (
                        <li key={i}>{safeStr(s)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {review?.revisedContent && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">Improved Version</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          dispatch({ type: 'SET_FIELD', field: 'content', value: review.revisedContent });
                          toast({ title: 'Applied', description: 'Revised content loaded into editor.' });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use This
                      </Button>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm whitespace-pre-wrap">{review.revisedContent}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}
      </CardContent>
    </Card>
  );
}

/** Manual compose + final editor (content, platforms, media, hashtags, schedule, save) */
function ComposeSection({ state, dispatch }: SectionProps) {
  const { toast } = useToast();
  const createPost = useCreatePost('portal');
  const { campaigns } = useSocialCampaigns('portal');
  const { uploadFiles, addFromUrl, isUploading, isAddingUrl } = useMediaUpload('portal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFiles(files, (urls) => {
      dispatch({ type: 'ADD_MEDIA', urls });
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddMediaUrl = async () => {
    if (!state.mediaUrlInput.trim()) return;
    addFromUrl(state.mediaUrlInput, (url) => {
      dispatch({ type: 'ADD_MEDIA', urls: [url] });
      dispatch({ type: 'SET_FIELD', field: 'mediaUrlInput', value: '' });
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Your Post</CardTitle>
        <CardDescription>Write your content manually or use AI-generated content above</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlatformSelector state={state} dispatch={dispatch} />

        {campaigns.length > 0 && (
          <div className="space-y-2">
            <Label>Campaign (optional)</Label>
            <Select
              value={state.campaignId || 'none'}
              onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'campaignId', value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={state.content}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'content', value: e.target.value })}
            placeholder="Write your post content..."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Hashtags (comma-separated)</Label>
          <Input
            value={state.hashtags}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'hashtags', value: e.target.value })}
            placeholder="#marketing, #socialmedia"
          />
          {/* AI Hashtag Suggestions (P3-B010) */}
          <HashtagSuggestionBar
            content={state.content}
            platforms={state.selectedPlatforms}
            currentHashtags={state.hashtags}
            onAdd={(hashtag) => {
              const current = state.hashtags.trim();
              const sep = current && !current.endsWith(',') ? ', ' : '';
              dispatch({ type: 'SET_FIELD', field: 'hashtags', value: `${current}${sep}#${hashtag}` });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Media</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Files
            </Button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
          </div>
          <div className="flex gap-2">
            <Input
              value={state.mediaUrlInput}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'mediaUrlInput', value: e.target.value })}
              placeholder="Or paste media URL"
              aria-label="Media URL"
              aria-describedby="media-url-hint"
            />
            <Button variant="outline" onClick={handleAddMediaUrl} disabled={isAddingUrl} aria-label="Add media from URL">
              {isAddingUrl ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </div>
          <p id="media-url-hint" className="sr-only">Paste a URL to an image or video to add it as media</p>

          {state.mediaUrls.length > 0 && (
            <SortableMediaGrid
              mediaUrls={state.mediaUrls}
              onReorder={(from, to) => dispatch({ type: 'REORDER_MEDIA', fromIndex: from, toIndex: to })}
              onRemove={(index) => dispatch({ type: 'REMOVE_MEDIA', index })}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Schedule (optional)</Label>
          <Input
            type="datetime-local"
            value={state.scheduledAt}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'scheduledAt', value: e.target.value })}
          />
        </div>

        <Button
          onClick={() =>
            createPost.mutate(
              {
                content: state.content,
                platforms: state.selectedPlatforms,
                scheduledAt: state.scheduledAt ? new Date(state.scheduledAt).toISOString() : undefined,
                hashtags: state.hashtags.split(',').map((h) => h.trim()).filter(Boolean),
                mediaUrls: state.mediaUrls.length > 0 ? state.mediaUrls : undefined,
                aiGenerated: !!state.aiResult,
              },
              {
                onSuccess: () => {
                  toast({ title: 'Post created', description: 'Your post has been saved.' });
                  dispatch({ type: 'RESET_FORM' });
                },
                onError: (error: Error) => {
                  toast({ title: 'Failed to create post', description: error.message, variant: 'destructive' });
                },
              },
            )
          }
          disabled={!state.content || state.selectedPlatforms.length === 0 || createPost.isPending}
          className="w-full"
        >
          {createPost.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          {state.scheduledAt ? 'Schedule Post' : 'Create Post'}
        </Button>
      </CardContent>
    </Card>
  );
}

//
// Main Component
//

/** Hashtag Suggestion chips — shown below the hashtag input (P3-B010) */
function HashtagSuggestionBar({
  content,
  platforms,
  currentHashtags,
  onAdd,
}: {
  content: string;
  platforms: string[];
  currentHashtags: string;
  onAdd: (hashtag: string) => void;
}) {
  const { suggestions, isLoading } = useHashtagSuggestions(content, platforms, 'portal');

  // Filter out hashtags the user already has
  const currentSet = new Set(
    currentHashtags
      .split(',')
      .map((h) => h.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean),
  );
  const filtered = suggestions.filter((s) => !currentSet.has(s.hashtag.toLowerCase()));

  if (isLoading || filtered.length === 0) return null;


  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5" role="group" aria-label="AI hashtag suggestions">
      <Lightbulb className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
      {filtered.slice(0, 6).map((s) => (
        <button
          key={s.hashtag}
          type="button"
          onClick={() => onAdd(s.hashtag)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted/60 hover:bg-primary/10 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          title={s.reason}
          aria-label={`Add hashtag ${s.hashtag}${s.reason ? `: ${s.reason}` : ''}${s.source === 'trending' ? ' (trending)' : ''}`}
        >
          <Hash className="h-3 w-3" aria-hidden="true" />
          {s.hashtag}
          {s.source === 'trending' && <TrendingUp className="h-3 w-3 text-green-500" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

export default function CreatePostTab() {
  const [state, dispatch] = useReducer(createPostReducer, initialState);
  const { toast } = useToast();

  // ─── AI Prediction (P3-B012/B013) ──────────────────────────────
  const predictionInput = useMemo(() => ({
    content: state.content || state.aiResult?.content || '',
    platforms: state.selectedPlatforms,
    hashtags: (
      state.hashtags
        ? state.hashtags.split(',').map((h: string) => h.trim()).filter(Boolean)
        : (Array.isArray(state.aiResult?.hashtags) ? state.aiResult.hashtags : [])
    ),
    mediaUrls: state.mediaUrls,
    scheduledAt: state.scheduledAt || null,
  }), [state.content, state.aiResult, state.selectedPlatforms, state.hashtags, state.mediaUrls, state.scheduledAt]);

  const {
    prediction,
    isLoading: predictionLoading,
    error: predictionError,
  } = usePredictPostPerformance(predictionInput, 'portal', {
    enabled: state.mode !== 'autonomous' && predictionInput.content.length >= 5,
  });

  const handleSuggestionAction = useCallback((suggestion: PredictionSuggestion) => {
    switch (suggestion.actionType) {
      case 'add_media':
        // Scroll to media upload section
        toast({ title: 'Add media', description: suggestion.description });
        break;
      case 'change_time':
        toast({ title: 'Scheduling tip', description: suggestion.description });
        break;
      case 'add_hashtags':
        toast({ title: 'Hashtag tip', description: suggestion.description });
        break;
      case 'add_cta':
      case 'adjust_length':
      case 'add_emoji':
        toast({ title: suggestion.title, description: suggestion.description });
        break;
      default:
        toast({ title: suggestion.title, description: suggestion.description });
    }
  }, [toast]);

  // ─── Draft Auto-Save (P2-B008) ─────────────────────────────────
  const getState = useCallback(() => ({
    content: state.content,
    selectedPlatforms: state.selectedPlatforms,
    hashtags: state.hashtags,
    scheduledAt: state.scheduledAt,
    mediaUrls: state.mediaUrls,
    campaignId: state.campaignId,
    mode: state.mode,
    briefing: state.briefing,
  }), [state.content, state.selectedPlatforms, state.hashtags, state.scheduledAt, state.mediaUrls, state.campaignId, state.mode, state.briefing]);

  const handleRestore = useCallback((draft: DraftData) => {
    dispatch({ type: 'SET_MODE', mode: draft.mode });
    dispatch({ type: 'SET_FIELD', field: 'content', value: draft.content });
    dispatch({ type: 'SET_FIELD', field: 'hashtags', value: draft.hashtags });
    dispatch({ type: 'SET_FIELD', field: 'scheduledAt', value: draft.scheduledAt });
    dispatch({ type: 'SET_FIELD', field: 'campaignId', value: draft.campaignId });
    dispatch({ type: 'SET_FIELD', field: 'briefing', value: draft.briefing });
    // Restore platforms
    draft.selectedPlatforms.forEach((pid) => {
      if (!state.selectedPlatforms.includes(pid)) {
        dispatch({ type: 'TOGGLE_PLATFORM', platformId: pid });
      }
    });
    // Restore media
    if (draft.mediaUrls.length > 0) {
      dispatch({ type: 'ADD_MEDIA', urls: draft.mediaUrls });
    }
    toast({ title: 'Draft restored', description: 'Your saved draft has been loaded.' });
  }, [state.selectedPlatforms, toast]);

  const { hasDraft, lastSaved, saveNow, restoreDraft, deleteDraft } = useDraftAutosave({
    getState,
    onRestore: handleRestore,
  });

  // ─── Template Selection (P2-B007) ──────────────────────────────
  const handleSelectTemplate = useCallback((template: PostTemplate) => {
    dispatch({ type: 'SET_FIELD', field: 'content', value: template.content });
    dispatch({ type: 'SET_FIELD', field: 'hashtags', value: template.hashtags.join(', ') });
    // Set platforms from template
    template.platforms.forEach((pid) => {
      if (!state.selectedPlatforms.includes(pid)) {
        dispatch({ type: 'TOGGLE_PLATFORM', platformId: pid });
      }
    });
    if (template.mediaUrls.length > 0) {
      dispatch({ type: 'ADD_MEDIA', urls: template.mediaUrls });
    }
    toast({ title: 'Template applied', description: `"${template.name}" loaded into editor.` });
  }, [state.selectedPlatforms, toast]);


  return (
    <div className="space-y-6">
      <Helmet>
        <title>AI Compose | Steel City AI</title>
        <meta name="description" content="Draft, schedule, and publish your social media content with AI assistance" />
      </Helmet>
      {/* Draft restore banner (P2-B008) */}
      {hasDraft && (
        <DraftBanner
          lastSaved={lastSaved}
          onRestore={restoreDraft}
          onDelete={deleteDraft}
          onSaveNow={saveNow}
        />
      )}

      <ModeSelector state={state} dispatch={dispatch} />

      {state.mode === 'autonomous' && <AutonomousSection state={state} dispatch={dispatch} />}

      {state.mode === 'ai' && <AiStudioSection state={state} dispatch={dispatch} />}

      {state.mode !== 'autonomous' && (
        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Left: compose + templates */}
          <div className="space-y-6">
            <ComposeSection state={state} dispatch={dispatch} />
            {/* Auto-save indicator */}
            <AutoSaveIndicator lastSaved={lastSaved} onSaveNow={saveNow} />
          </div>

          {/* Right sidebar: prediction + preview + templates */}
          <div className="space-y-6">
            {/* AI Performance Prediction (P3-B012/B013) */}
            <PredictionResultDisplay
              prediction={prediction}
              isLoading={predictionLoading}
              error={predictionError}
              onSuggestionAction={handleSuggestionAction}
              compact
            />

            {/* Real-time preview (P2-B006) */}
            <RealTimePreview
              content={state.content}
              hashtags={state.hashtags}
              mediaUrls={state.mediaUrls}
              selectedPlatforms={state.selectedPlatforms}
            />

            {/* Template picker (P2-B007) */}
            <TemplatePicker onSelectTemplate={handleSelectTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
