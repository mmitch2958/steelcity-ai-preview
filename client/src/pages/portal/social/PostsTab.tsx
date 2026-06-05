import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarPlus,
  Clock,
  Copy,
  Edit,
  Eye,
  Heart,
  Link,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SocialPostPreview } from '@/components/SocialPostPreview';
import { PostListSkeleton } from '@/components/social/Skeletons';
import { useSocialPosts, usePublishPost, useDeletePost } from '@/hooks/social/use-social-posts';
import { useSocialAccounts } from '@/hooks/social/use-social-accounts';
import { useSocialCampaigns } from '@/hooks/social/use-social-campaigns';
import { useMediaUpload } from '@/hooks/social/use-media-upload';
import { PLATFORMS, STATUS_VARIANTS } from '@/components/social/constants';
import { getStatusLabel } from '@/components/social/utils';
import type { SocialPost } from '@shared/schema';

type EngagementMetrics = {
  likes?: number;
  shares?: number;
  comments?: number;
  reach?: number;
};

export default function PostsTab() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkScheduleDate, setBulkScheduleDate] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState<'delete' | 'archive' | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [additionalDates, setAdditionalDates] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newPlatforms, setNewPlatforms] = useState<string[]>([]);
  const [newAccountIds, setNewAccountIds] = useState<string[]>([]);
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newHashtags, setNewHashtags] = useState('');
  const [newCampaignId, setNewCampaignId] = useState('');
  const [newMediaUrls, setNewMediaUrls] = useState<string[]>([]);
  const [newMediaUrlInput, setNewMediaUrlInput] = useState('');
  const { toast } = useToast();

  const { posts, isLoading } = useSocialPosts('portal');
  const { accounts } = useSocialAccounts('portal');
  const { campaigns } = useSocialCampaigns('portal');
  const publishPost = usePublishPost('portal');
  const deletePost = useDeletePost('portal');
  const mediaUpload = useMediaUpload('portal');

  const filteredPosts = Array.isArray(posts)
    ? statusFilter === 'all'
      ? posts
      : posts.filter((p) => p.status === statusFilter)
    : [];

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const payload: {
        content: string;
        platforms: string[];
        hashtags?: string[];
        mediaUrls?: string[];
        status: string;
        scheduledAt?: string;
        campaignId?: string;
        accountIds?: string[];
      } = {
        content: newContent,
        platforms: newPlatforms,
        hashtags: newHashtags ? newHashtags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        mediaUrls: newMediaUrls,
        status: newScheduledAt ? 'scheduled' : 'draft',
      };
      if (newScheduledAt) payload.scheduledAt = new Date(newScheduledAt).toISOString();
      if (newCampaignId && newCampaignId !== 'none') payload.campaignId = newCampaignId;
      if (newAccountIds.length > 0) payload.accountIds = newAccountIds;
      const res = await apiRequest('POST', '/api/portal/social/posts', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Post created', description: 'Your post has been saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      setIsCreateOpen(false);
      setNewContent('');
      setNewPlatforms([]);
      setNewAccountIds([]);
      setNewScheduledAt('');
      setNewHashtags('');
      setNewCampaignId('');
      setNewMediaUrls([]);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create post', description: error.message, variant: 'destructive' });
    },
  });

  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await mediaUpload.uploadFiles(files, (urls) => {
      setNewMediaUrls((prev) => [...prev, ...urls]);
    });
  };

  const handleAddNewMediaUrl = async () => {
    if (!newMediaUrlInput.trim()) return;
    await mediaUpload.addFromUrl(newMediaUrlInput.trim(), (url) => {
      setNewMediaUrls((prev) => [...prev, url]);
      setNewMediaUrlInput('');
    });
  };

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditScheduledAt(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '');
    setEditHashtags((post.hashtags || []).join(', '));
  };

  const closeEditDialog = () => {
    setEditingPost(null);
    setEditContent('');
    setEditScheduledAt('');
    setEditHashtags('');
    setAdditionalDates([]);
  };

  const buildPayload = (overrides: Record<string, unknown> = {}) => ({
    content: editContent,
    hashtags: editHashtags ? editHashtags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    ...overrides,
  });

  const updatePostMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!editingPost) throw new Error('No post selected for editing');
      const res = await apiRequest('PUT', `/api/portal/social/posts/${editingPost.id}`, payload);
      return res.json();
    },
    onError: (error: Error) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleSaveDraft = async () => {
    try {
      await updatePostMutation.mutateAsync(buildPayload({ status: 'draft' }));
      toast({ title: 'Draft saved', description: 'Your post has been saved as a draft.' });
      closeEditDialog();
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
    } catch {
      // Error already handled by mutation
    }
  };

  const handleSchedule = async () => {
    if (!editScheduledAt) {
      toast({ title: 'Schedule required', description: 'Please set a date and time to schedule this post.', variant: 'destructive' });
      return;
    }
    try {
      await updatePostMutation.mutateAsync(buildPayload({ scheduledAt: new Date(editScheduledAt).toISOString(), status: 'scheduled' }));
      toast({ title: 'Post scheduled', description: 'Your post has been scheduled.' });
      closeEditDialog();
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
    } catch {
      // Error already handled by mutation
    }
  };

  const handlePostNow = async () => {
    if (!editingPost) return;
    try {
      await updatePostMutation.mutateAsync(buildPayload({ status: 'draft', scheduledAt: null }));
      publishPost.mutate(editingPost.id, {
        onSuccess: (data) => {
          if (data.post?.status === 'failed') {
            const errorMsg = data.errors?.join('; ') || 'Publishing failed. Make sure you have a connected account with proper permissions.';
            toast({ title: 'Publishing issue', description: errorMsg, variant: 'destructive' });
          } else {
            toast({ title: 'Post published!', description: 'Your post has been published to your connected accounts.' });
          }
          closeEditDialog();
          queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
        },
        onError: (error: Error) => {
          toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
        },
      });
    } catch {
      // Error already handled by mutation
    }
  };

  const repostMutation = useMutation({
    mutationFn: async (post: SocialPost) => {
      const res = await apiRequest('POST', '/api/portal/social/posts', {
        content: post.content,
        platforms: post.platforms,
        hashtags: post.hashtags,
        mediaUrls: post.mediaUrls,
        status: 'draft',
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Post duplicated', description: 'A new draft has been created.' });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Re-post failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleScheduleMultiple = async () => {
    if (!editScheduledAt) {
      toast({ title: 'Schedule required', description: 'Please set a date and time for the first posting.', variant: 'destructive' });
      return;
    }
    const allDates = [editScheduledAt, ...additionalDates.filter(Boolean)];
    try {
      await updatePostMutation.mutateAsync(buildPayload({ scheduledAt: new Date(allDates[0]).toISOString(), status: 'scheduled' }));
      if (!editingPost) return;
      for (const date of allDates.slice(1)) {
        await apiRequest('POST', '/api/portal/social/posts', {
          content: editContent,
          platforms: editingPost.platforms,
          hashtags: editHashtags ? editHashtags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          mediaUrls: editingPost.mediaUrls,
          scheduledAt: new Date(date).toISOString(),
          status: 'scheduled',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      toast({ title: `${allDates.length} post${allDates.length > 1 ? 's' : ''} scheduled`, description: allDates.length > 1 ? 'Your post will go out on multiple days.' : 'Your post has been scheduled.' });
      closeEditDialog();
    } catch {
      // Error already handled by mutation
    }
  };

  // ─── Bulk Actions ────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => String(p.id))));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setShowBulkConfirm(null);
    setBulkScheduleDate('');
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => apiRequest('DELETE', `/api/portal/social/posts/${id}`)));
    },
    onSuccess: () => {
      toast({ title: `${selectedIds.size} post(s) deleted` });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      clearSelection();
    },
    onError: (error: Error) => {
      toast({ title: 'Bulk delete failed', description: error.message, variant: 'destructive' });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => apiRequest('PUT', `/api/portal/social/posts/${id}`, { status: 'archived' })));
    },
    onSuccess: () => {
      toast({ title: `${selectedIds.size} post(s) archived` });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      clearSelection();
    },
    onError: (error: Error) => {
      toast({ title: 'Bulk archive failed', description: error.message, variant: 'destructive' });
    },
  });

  const bulkScheduleMutation = useMutation({
    mutationFn: async ({ ids, scheduledAt }: { ids: string[]; scheduledAt: string }) => {
      await Promise.all(ids.map((id) => apiRequest('PUT', `/api/portal/social/posts/${id}`, { scheduledAt, status: 'scheduled' })));
    },
    onSuccess: () => {
      toast({ title: `${selectedIds.size} post(s) rescheduled` });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
      clearSelection();
    },
    onError: (error: Error) => {
      toast({ title: 'Bulk reschedule failed', description: error.message, variant: 'destructive' });
    },
  });

  const isBulkBusy = bulkDeleteMutation.isPending || bulkArchiveMutation.isPending || bulkScheduleMutation.isPending;

  const isBusy = updatePostMutation.isPending || publishPost.isPending || repostMutation.isPending;

      <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {filteredPosts.length > 0 && (
            <Checkbox
              checked={selectedIds.size === filteredPosts.length && filteredPosts.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all posts"
            />
          )}
          <h2 className="text-xl font-semibold">Posts</h2>
          {selectedIds.size > 0 && (
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter posts by status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Compose a new social media post</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="What do you want to share?"
                    className="min-h-[120px]"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((platform) => {
                      const Icon = platform.icon;
                          <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>
                      return (
                        <div key={platform.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={newPlatforms.includes(platform.id)}
                            onCheckedChange={(checked) => {
                              setNewPlatforms((prev) =>
                                checked
                                  ? [...prev, platform.id]
                                  : prev.filter((p) => p !== platform.id)
                              );
                            }}
                          />
                          <Label className="flex items-center gap-1 cursor-pointer">
                            <Icon className="w-3 h-3" />
                            {platform.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {newPlatforms.length > 0 && accounts.filter((a) => newPlatforms.includes(a.platform || '') && a.isConnected).length > 0 && (
                  <div className="space-y-2">
                    <Label>Publish to Accounts</Label>
                    <p className="text-xs text-muted-foreground">Select which connected accounts to publish to.</p>
                    <div className="flex flex-col gap-2">
                      {accounts
                        .filter((a) => newPlatforms.includes(a.platform || '') && a.isConnected)
                        .map((account) => {
                          const platform = PLATFORMS.find((p) => p.id === account.platform);
                          const PIcon = platform?.icon;
                              <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>
                          return (
                            <div key={account.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={newAccountIds.includes(account.id)}
                                onCheckedChange={(checked) => {
                                  setNewAccountIds((prev) =>
                                    checked
                                      ? [...prev, account.id]
                                      : prev.filter((id) => id !== account.id)
                                  );
                                }}
                              />
                              <Label className="flex items-center gap-1 cursor-pointer">
                                {PIcon && <PIcon className="w-3 h-3" />}
                                {account.accountName || 'Connected account'}
                                {account.accountUsername && <span className="text-muted-foreground text-xs">(@{account.accountUsername})</span>}
                              </Label>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Media Attachments</Label>
                  {newMediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newMediaUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          {url.match(/\.(mp4|mov|webm|avi)$/i) ? (
                            <video src={url} className="h-16 w-16 rounded-md object-cover border" />
                          ) : (
                            <img src={url} alt={`Media ${i + 1}`} className="h-16 w-16 rounded-md object-cover border" />
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ visibility: 'visible' }}
                            onClick={() => setNewMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('portal-create-media-upload')?.click()} disabled={mediaUpload.isUploading}>
                      {mediaUpload.isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                      Upload Files
                    </Button>
                    <input id="portal-create-media-upload" type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleNewFileUpload} />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image or video URL..."
                      value={newMediaUrlInput}
                      onChange={(e) => setNewMediaUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNewMediaUrl()}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddNewMediaUrl} disabled={!newMediaUrlInput.trim() || mediaUpload.isAddingUrl}>
                      {mediaUpload.isAddingUrl ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link className="h-3 w-3 mr-1" />}
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Schedule (optional)</Label>
                  <Input type="datetime-local" value={newScheduledAt} onChange={(e) => setNewScheduledAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hashtags (comma-separated)</Label>
                  <Input placeholder="#ai, #socialmedia, #marketing" value={newHashtags} onChange={(e) => setNewHashtags(e.target.value)} />
                </div>
                {campaigns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Campaign (optional)</Label>
                    <Select value={newCampaignId} onValueChange={setNewCampaignId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button onClick={() => createPostMutation.mutate()} disabled={!newContent.trim() || newPlatforms.length === 0 || createPostMutation.isPending}>
                    {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Post
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <PostListSkeleton count={3} />
      ) : filteredPosts.length ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className={selectedIds.has(String(post.id)) ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-wrap items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(String(post.id))}
                      onCheckedChange={() => toggleSelect(String(post.id))}
                      aria-label={`Select post ${post.id}`}
                    />
                    {post.platforms &&
                      (Array.isArray(post.platforms) ? post.platforms : []).map((p: string) => {
                        const platform = PLATFORMS.find((pl) => pl.id === p);
                        if (!platform) return null;
                        const Icon = platform.icon;
                            <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>
                        return (
                          <Badge key={p} variant="outline">
                            <Icon className="h-3 w-3 mr-1" />
                            {platform.label}
                          </Badge>
                        );
                      })}
                    <Badge variant={STATUS_VARIANTS[post.status || 'draft'] || 'outline'}>
                      {getStatusLabel(post.status || 'draft')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.status !== 'published' && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(post)} title="Edit post">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => publishPost.mutate(post.id, {
                            onSuccess: (data) => {
                              if (data.post?.status === 'failed') {
                                const errorMsg = data.errors?.join('; ') || 'Publishing failed. Make sure you have a connected account with proper permissions.';
                                toast({ title: 'Publishing issue', description: errorMsg, variant: 'destructive' });
                              } else {
                                toast({ title: 'Post published!', description: 'Your post has been published to your connected accounts.' });
                              }
                              queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
                            },
                            onError: (error: Error) => {
                              toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
                            },
                          })}
                          disabled={publishPost.isPending}
                          title="Publish now"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => repostMutation.mutate(post)} disabled={repostMutation.isPending} title="Duplicate as new draft">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deletePost.mutate(post.id, {
                      onSuccess: () => {
                        toast({ title: 'Post deleted', description: 'The post has been removed.' });
                        queryClient.invalidateQueries({ queryKey: ['/api/portal/social/posts'] });
                      },
                      onError: (error: Error) => {
                        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
                      },
                    })} disabled={deletePost.isPending} title="Delete post">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {post.scheduledAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.scheduledAt).toLocaleDateString()}
                  </span>
                )}
                <SocialPostPreview
                  content={post.content}
                  hashtags={post.hashtags ?? undefined}
                  mediaUrls={post.mediaUrls ?? undefined}
                  platform={post.platforms?.[0] || 'facebook'}
                  accountName={(() => {
                    const firstId = post.accountIds?.[0];
                    const acc = firstId ? accounts.find((a) => a.id === firstId) : accounts.find((a) => post.platforms?.[0] && a.platform === post.platforms[0]);
                    return acc?.accountName || 'Your Page';
                  })()}
                  accountImage={(() => {
                    const firstId = post.accountIds?.[0];
                    const acc = firstId ? accounts.find((a) => a.id === firstId) : accounts.find((a) => post.platforms?.[0] && a.platform === post.platforms[0]);
                    return acc?.accountImage || undefined;
                  })()}
                />
                {(() => {
                  const engagement = post.engagement as EngagementMetrics | null;
                  if (!engagement) return null;
                      <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>
                  return (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {engagement.likes !== undefined && <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {String(engagement.likes)}</span>}
                      {engagement.shares !== undefined && <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {String(engagement.shares)}</span>}
                      {engagement.comments !== undefined && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {String(engagement.comments)}</span>}
                      {engagement.reach !== undefined && <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {String(engagement.reach)}</span>}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              {statusFilter === 'all' ? 'No posts yet. Create your first post to get started.' : `No ${statusFilter} posts found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Floating Bulk Action Bar ──────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-xl"
          role="region"
          aria-label="Bulk actions toolbar"
          aria-live="polite"
        >
          <span className="text-sm font-medium mr-2" aria-atomic="true">{selectedIds.size} selected</span>

          {/* Bulk Reschedule */}
          <div className="flex items-center gap-1">
            <Input
              type="datetime-local"
              value={bulkScheduleDate}
              onChange={(e) => setBulkScheduleDate(e.target.value)}
              className="h-8 w-auto text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkScheduleDate || isBulkBusy}
              onClick={() =>
                bulkScheduleMutation.mutate({
                  ids: Array.from(selectedIds),
                  scheduledAt: new Date(bulkScheduleDate).toISOString(),
                })
              }
            >
              {bulkScheduleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3 mr-1" />}
              Reschedule
            </Button>
          </div>

          {/* Bulk Archive */}
          {showBulkConfirm === 'archive' ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Archive {selectedIds.size}?</span>
              <Button size="sm" variant="secondary" onClick={() => bulkArchiveMutation.mutate(Array.from(selectedIds))} disabled={isBulkBusy}>
                {bulkArchiveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBulkConfirm(null)}>No</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowBulkConfirm('archive')} disabled={isBulkBusy}>
              Archive
            </Button>
          )}

          {/* Bulk Delete */}
          {showBulkConfirm === 'delete' ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-destructive">Delete {selectedIds.size}?</span>
              <Button size="sm" variant="destructive" onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))} disabled={isBulkBusy}>
                {bulkDeleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBulkConfirm(null)}>No</Button>
            </div>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setShowBulkConfirm('delete')} disabled={isBulkBusy}>
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}

          {/* Clear selection */}
          <Button size="sm" variant="ghost" onClick={clearSelection} aria-label="Clear post selection">
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      )}

      <Dialog open={!!editingPost} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update content, schedule, or publish immediately</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[140px]"
                placeholder="Write your post content..."
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtags (comma-separated)</Label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="#realestate, #pittsburgh"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Schedule Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={editScheduledAt}
                onChange={(e) => setEditScheduledAt(e.target.value)}
              />
              {additionalDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => {
                      const updated = [...additionalDates];
                      updated[idx] = e.target.value;
                      setAdditionalDates(updated);
                    }}
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => setAdditionalDates((prev) => prev.filter((_, i) => i !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setAdditionalDates((prev) => [...prev, ''])} className="w-full">
                <CalendarPlus className="h-3 w-3 mr-2" />
                Add another day
              </Button>
              <p className="text-xs text-muted-foreground">
                {additionalDates.length > 0
                  ? `Will create ${1 + additionalDates.length} separate scheduled posts`
                  : 'Required when using "Schedule" below. Add more dates to post on multiple days.'}
              </p>
            </div>
            {editingPost && (editingPost.platforms ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(editingPost.platforms ?? []).map((p: string) => {
                  const platform = PLATFORMS.find((pl) => pl.id === p);
                  if (!platform) return null;
                  const Icon = platform.icon;
                      <Helmet>
      <title>Posts | Steel City AI</title>
      <meta name="description" content="Manage and view all your published and scheduled posts" />
    </Helmet>
                  return (
                    <Badge key={p} variant="outline">
                      <Icon className="h-3 w-3 mr-1" />
                      {platform.label}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={closeEditDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={isBusy}>
              {updatePostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Draft
            </Button>
            <Button variant="outline" onClick={handleScheduleMultiple} disabled={isBusy}>
              <Clock className="h-4 w-4 mr-2" />
              {additionalDates.length > 0 ? `Schedule All (${1 + additionalDates.length})` : 'Schedule'}
            </Button>
            <Button onClick={handlePostNow} disabled={isBusy}>
              {publishPost.isPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Send className="h-4 w-4 mr-2" />}
              Post Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
