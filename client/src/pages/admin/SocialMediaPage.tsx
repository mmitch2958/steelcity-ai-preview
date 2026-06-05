import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Share2, Bot, Sparkles, Search, Palette, Brain, PenTool,
  Calendar, CalendarDays, ChevronLeft, ChevronRight, Plus, Loader2, Trash2, Send, Clock, CheckCircle,
  AlertCircle, XCircle, FileText, Megaphone, UserCircle,
  MessageSquare, Star, Eye, Heart, Copy, ArrowRight, Upload, Link,
  Image as ImageIcon, Video, X as XIcon, Wand2, Download, Pencil,
  BarChart3, TrendingUp, Activity, LayoutTemplate, RotateCcw
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube } from "react-icons/si";
import { SocialPostPreview } from "@/components/SocialPostPreview";
import { RealTimePreview } from "@/components/social/RealTimePreview";
import { TemplatePicker } from "@/components/social/TemplatePicker";
import { DraftBanner, AutoSaveIndicator } from "@/components/social/DraftBanner";
import { useDraftAutosave, type DraftData } from "@/hooks/social/use-draft-autosave";
import {
  PostListSkeleton,
  CalendarGridSkeleton,
  AnalyticsFullSkeleton,
  CreatePostFormSkeleton,
  CampaignListSkeleton,
  AccountListSkeleton,
  BrandVoiceListSkeleton,
} from "@/components/social/Skeletons";

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return JSON.stringify(val);
}

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: SiFacebook, color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, color: "bg-pink-600" },
  { id: "twitter", label: "X / Twitter", icon: SiX, color: "bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-800" },
  { id: "linkedin", label: "LinkedIn", icon: SiLinkedin, color: "bg-blue-700" },
  { id: "youtube", label: "YouTube", icon: SiYoutube, color: "bg-red-600" },
];

const postStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "outline" },
  published: { label: "Published", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

const campaignStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
};

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  accountIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  hashtags: z.string().optional(),
  campaignId: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
});

const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  goals: z.string().optional(),
});

const createAccountSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  accountName: z.string().min(1, "Account name is required"),
  username: z.string().min(1, "Username is required"),
  clientId: z.string().optional(),
});

const createBrandVoiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tone: z.string().optional(),
  style: z.string().optional(),
  vocabulary: z.string().optional(),
  avoidWords: z.string().optional(),
  examplePosts: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type CreatePostForm = z.infer<typeof createPostSchema>;
type CreateCampaignForm = z.infer<typeof createCampaignSchema>;
type CreateAccountForm = z.infer<typeof createAccountSchema>;
type CreateBrandVoiceForm = z.infer<typeof createBrandVoiceSchema>;

function PlatformBadge({ platformId }: { platformId: string }) {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return null;
  const Icon = platform.icon;
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="w-3 h-3" />
      {platform.label}
    </Badge>
  );
}

function PostsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/posts"],
  });

  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/campaigns"],
  });

  const { data: clientsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const publishMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest("POST", `/api/admin/social/posts/${postId}/publish`).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      if (data.post?.status === "failed") {
        const errorMsg = data.errors?.join("; ") || "Publishing failed. Make sure you have a connected account with proper permissions.";
        toast({ title: "Publish failed", description: errorMsg, variant: "destructive" });
      } else if (data.errors && data.errors.length > 0) {
        const successPlatforms = data.results ? Object.entries(data.results).filter(([_, r]: [string, any]) => r.success).map(([p]) => p).join(", ") : "";
        toast({ title: "Partially published", description: `Published to: ${successPlatforms}. Errors: ${data.errors.join("; ")}`, variant: "destructive" });
      } else {
        const platforms = data.results ? Object.keys(data.results).join(", ") : "";
        toast({ title: "Published", description: `Your post has been published to ${platforms || "social media"}.` });
      }
    },
    onError: (error: any) => {
      toast({ title: "Publish failed", description: error.message || "Failed to publish post. Check your account connections.", variant: "destructive" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostForm) => {
      const payload: any = {
        content: data.content,
        platforms: data.platforms,
        accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
        campaignId: data.campaignId || undefined,
        mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
      };
      return apiRequest("POST", "/api/admin/social/posts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Post created", description: "Your post has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create post", variant: "destructive" });
    },
  });

  const [editingPost, setEditingPost] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/accounts"],
  });

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", platforms: [], accountIds: [], scheduledAt: "", hashtags: "", campaignId: "" },
  });

  const selectedPlatforms = form.watch("platforms") || [];
  const watchedContent = form.watch("content") || "";
  const watchedHashtags = form.watch("hashtags") || "";

  // Draft auto-save system (P2-B008)
  const getDraftState = useCallback(() => ({
    content: form.getValues("content") || "",
    selectedPlatforms: form.getValues("platforms") || [],
    hashtags: form.getValues("hashtags") || "",
    scheduledAt: form.getValues("scheduledAt") || "",
    mediaUrls: form.getValues("mediaUrls") || [],
    campaignId: form.getValues("campaignId") || "",
    mode: "manual" as const,
    briefing: "",
  }), [form]);

  const handleRestoreDraft = useCallback((draft: DraftData) => {
    form.setValue("content", draft.content || "");
    form.setValue("platforms", draft.selectedPlatforms || []);
    form.setValue("hashtags", draft.hashtags || "");
    form.setValue("scheduledAt", draft.scheduledAt || "");
    form.setValue("mediaUrls", draft.mediaUrls || []);
    form.setValue("campaignId", draft.campaignId || "");
    toast({ title: "Draft restored", description: "Your previous draft has been restored." });
  }, [form, toast]);

  const { hasDraft, lastSaved, saveNow, restoreDraft, deleteDraft } = useDraftAutosave({
    getState: getDraftState,
    onRestore: handleRestoreDraft,
    enabled: isCreateOpen,
  });

  // Template apply handler (P2-B007)
  const handleSelectTemplate = useCallback((template: { content: string; platforms: string[]; hashtags: string[] }) => {
    form.setValue("content", template.content || "");
    if (template.platforms?.length) form.setValue("platforms", template.platforms);
    if (template.hashtags?.length) form.setValue("hashtags", template.hashtags.join(", "));
    setShowTemplates(false);
    toast({ title: "Template applied", description: "Content has been filled from template." });
  }, [form, toast]);

  const editForm = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", platforms: [], accountIds: [], scheduledAt: "", hashtags: "", campaignId: "" },
  });

  const editSelectedPlatforms = editForm.watch("platforms") || [];

  const updateMutation = useMutation({
    mutationFn: (data: CreatePostForm) => {
      const payload: any = {
        content: data.content,
        platforms: data.platforms,
        accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
        campaignId: data.campaignId || undefined,
        mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
        status: editingPost?.status === "failed" ? "draft" : editingPost?.status,
      };
      return apiRequest("PUT", `/api/admin/social/posts/${editingPost?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      setIsEditOpen(false);
      setEditingPost(null);
      toast({ title: "Post updated", description: "Your changes have been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update post", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => apiRequest("DELETE", `/api/admin/social/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      toast({ title: "Post deleted", description: "The post has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete post", variant: "destructive" });
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/admin/social/posts/${postId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      setIsEditOpen(false);
      setEditingPost(null);
      toast({ title: "Post published", description: "Your post has been published successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Publish failed", description: error.message || "Failed to publish post", variant: "destructive" });
    },
  });

  const handlePostNow = () => {
    editForm.handleSubmit(async (data) => {
      try {
        const payload: any = {
          content: data.content,
          platforms: data.platforms,
          accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
          hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          scheduledAt: undefined,
          campaignId: data.campaignId || undefined,
          mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
          status: "draft",
        };
        await apiRequest("PUT", `/api/admin/social/posts/${editingPost?.id}`, payload);
        publishNowMutation.mutate(editingPost?.id);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to save and publish", variant: "destructive" });
      }
    })();
  };

  const handleSchedulePost = () => {
    editForm.handleSubmit(async (data) => {
      if (!data.scheduledAt) {
        toast({ title: "Schedule required", description: "Please set a date and time to schedule this post.", variant: "destructive" });
        return;
      }
      const payload: any = {
        content: data.content,
        platforms: data.platforms,
        accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        campaignId: data.campaignId || undefined,
        mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
        status: "scheduled",
      };
      try {
        await apiRequest("PUT", `/api/admin/social/posts/${editingPost?.id}`, payload);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
        setIsEditOpen(false);
        setEditingPost(null);
        toast({ title: "Post scheduled", description: "Your post has been scheduled for publishing." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to schedule post", variant: "destructive" });
      }
    })();
  };

  const openEditDialog = (post: any) => {
    setEditingPost(post);
    editForm.reset({
      content: post.content || "",
      platforms: post.platforms || [],
      accountIds: post.accountIds || [],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      hashtags: (post.hashtags || []).join(", "),
      campaignId: post.campaignId || "",
      mediaUrls: post.mediaUrls || [],
    });
    setIsEditOpen(true);
  };

  const filteredPosts = posts.filter((p: any) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesClient = clientFilter === "all"
      ? true
      : clientFilter === "none" ? !p.clientId : p.clientId === clientFilter;
    return matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Social Media Posts</h2>
          <p className="text-muted-foreground text-sm">Manage and schedule your social media content</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              <SelectItem value="none">No client (admin)</SelectItem>
              {Array.isArray(clientsData) && clientsData.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
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
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription className="flex items-center justify-between">
                  <span>Compose a new social media post</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={showTemplates ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowTemplates(!showTemplates)}
                    >
                      <LayoutTemplate className="h-3 w-3 mr-1" />
                      Templates
                    </Button>
                    <AutoSaveIndicator lastSaved={lastSaved} onSaveNow={saveNow} />
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Draft restore banner (P2-B008) */}
              {hasDraft && (
                <DraftBanner
                  lastSaved={lastSaved}
                  onRestore={restoreDraft}
                  onDelete={deleteDraft}
                  onSaveNow={saveNow}
                />
              )}

              {/* Template picker panel (P2-B007) */}
              {showTemplates && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <TemplatePicker onSelectTemplate={handleSelectTemplate} />
                </div>
              )}

              {/* Split-pane: form + live preview (P2-B006) */}
              <ResizablePanelGroup direction="horizontal" className="min-h-[400px] rounded-lg border">
                <ResizablePanel defaultSize={55} minSize={40}>
                  <div className="p-4 overflow-y-auto h-full">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea placeholder="What do you want to share?" className="min-h-[120px]" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="platforms"
                          render={() => (
                            <FormItem>
                              <FormLabel>Platforms</FormLabel>
                              <div className="flex flex-wrap gap-3">
                                {PLATFORMS.map((platform) => (
                                  <FormField
                                    key={platform.id}
                                    control={form.control}
                                    name="platforms"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(platform.id)}
                                            onCheckedChange={(checked) => {
                                              const current = field.value || [];
                                              field.onChange(
                                                checked
                                                  ? [...current, platform.id]
                                                  : current.filter((v: string) => v !== platform.id)
                                              );
                                            }}
                                          />
                                        </FormControl>
                                        <Label className="flex items-center gap-1 cursor-pointer">
                                          <platform.icon className="w-3 h-3" />
                                          {platform.label}
                                        </Label>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {selectedPlatforms.length > 0 && accounts.filter((a: any) => selectedPlatforms.includes(a.platform) && a.isConnected).length > 0 && (
                          <FormField
                            control={form.control}
                            name="accountIds"
                            render={() => (
                              <FormItem>
                                <FormLabel>Publish to Accounts</FormLabel>
                                <p className="text-xs text-muted-foreground">Select which connected accounts to publish to. If none selected, it will post to the first available account for each platform.</p>
                                <div className="flex flex-col gap-2">
                                  {accounts
                                    .filter((a: any) => selectedPlatforms.includes(a.platform) && a.isConnected)
                                    .map((account: any) => {
                                      const platform = PLATFORMS.find((p) => p.id === account.platform);
                                      const PIcon = platform?.icon;
                                      return (
                                        <FormField
                                          key={account.id}
                                          control={form.control}
                                          name="accountIds"
                                          render={({ field }) => (
                                            <FormItem className="flex items-center gap-2">
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(account.id)}
                                                  onCheckedChange={(checked) => {
                                                    const current = field.value || [];
                                                    field.onChange(
                                                      checked
                                                        ? [...current, account.id]
                                                        : current.filter((v: string) => v !== account.id)
                                                    );
                                                  }}
                                                />
                                              </FormControl>
                                              <Label className="flex items-center gap-1 cursor-pointer">
                                                {PIcon && <PIcon className="w-3 h-3" />}
                                                {account.accountName || account.name}
                                                {account.accountUsername && <span className="text-muted-foreground text-xs">(@{account.accountUsername})</span>}
                                              </Label>
                                            </FormItem>
                                          )}
                                        />
                                      );
                                    })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name="scheduledAt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Schedule (optional)</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hashtags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hashtags (comma-separated)</FormLabel>
                              <FormControl>
                                <Input placeholder="#ai, #socialmedia, #marketing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="campaignId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign (optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a campaign" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(campaigns) && campaigns.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter className="gap-2">
                          <Button type="submit" disabled={createPostMutation.isPending}>
                            {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Post
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={30}>
                  <div className="p-4 overflow-y-auto h-full bg-muted/20">
                    <RealTimePreview
                      content={watchedContent}
                      hashtags={watchedHashtags}
                      mediaUrls={form.getValues("mediaUrls") || []}
                      selectedPlatforms={selectedPlatforms}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingPost(null); }}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Update your social media post</DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What do you want to share?" className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="platforms"
                    render={() => (
                      <FormItem>
                        <FormLabel>Platforms</FormLabel>
                        <div className="flex flex-wrap gap-3">
                          {PLATFORMS.map((platform) => (
                            <FormField
                              key={platform.id}
                              control={editForm.control}
                              name="platforms"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(platform.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        field.onChange(
                                          checked
                                            ? [...current, platform.id]
                                            : current.filter((v: string) => v !== platform.id)
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <Label className="flex items-center gap-1 cursor-pointer">
                                    <platform.icon className="w-3 h-3" />
                                    {platform.label}
                                  </Label>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {editSelectedPlatforms.length > 0 && accounts.filter((a: any) => editSelectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId).length > 0 && (
                    <FormField
                      control={editForm.control}
                      name="accountIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>Publish to Accounts</FormLabel>
                          <p className="text-xs text-muted-foreground">Select which connected accounts to publish to.</p>
                          <div className="flex flex-col gap-2">
                            {accounts
                              .filter((a: any) => editSelectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId)
                              .map((account: any) => {
                                const platform = PLATFORMS.find((p) => p.id === account.platform);
                                const PIcon = platform?.icon;
                                return (
                                  <FormField
                                    key={account.id}
                                    control={editForm.control}
                                    name="accountIds"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(account.id)}
                                            onCheckedChange={(checked) => {
                                              const current = field.value || [];
                                              field.onChange(
                                                checked
                                                  ? [...current, account.id]
                                                  : current.filter((v: string) => v !== account.id)
                                              );
                                            }}
                                          />
                                        </FormControl>
                                        <Label className="flex items-center gap-1 cursor-pointer">
                                          {PIcon && <PIcon className="w-3 h-3" />}
                                          {account.accountName || account.name}
                                          {account.accountUsername && <span className="text-muted-foreground text-xs">(@{account.accountUsername})</span>}
                                        </Label>
                                      </FormItem>
                                    )}
                                  />
                                );
                              })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={editForm.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule (optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="hashtags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hashtags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="#ai, #socialmedia, #marketing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="campaignId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a campaign" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(campaigns) && campaigns.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="mediaUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Attachments</FormLabel>
                        <div className="space-y-2">
                          {field.value && field.value.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {field.value.map((url: string, i: number) => (
                                <div key={i} className="relative group rounded-md border overflow-hidden">
                                  {url.match(/\.(mp4|mov|webm|avi)$/i) ? (
                                    <video src={url} className="w-full h-20 object-cover" muted />
                                  ) : (
                                    <img src={url} alt={`Media ${i + 1}`} className="w-full h-20 object-cover" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(field.value!.filter((_: string, idx: number) => idx !== i))}
                                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Paste image or video URL..."
                              id="edit-media-url-input"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const val = input.value.trim();
                                  if (val) {
                                    field.onChange([...(field.value || []), val]);
                                    input.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              onClick={() => {
                                const input = document.getElementById("edit-media-url-input") as HTMLInputElement;
                                const val = input?.value.trim();
                                if (val) {
                                  field.onChange([...(field.value || []), val]);
                                  input.value = "";
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Paste a URL and press Enter or click Add. Hover a thumbnail to remove it.</p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex flex-wrap gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="secondary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSchedulePost}
                      disabled={updateMutation.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePostNow}
                      disabled={publishNowMutation.isPending || updateMutation.isPending}
                    >
                      {publishNowMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Post Now
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <PostListSkeleton count={3} />
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No posts found</h3>
            <p className="text-muted-foreground text-sm">Create your first social media post to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post: any) => {
            const statusCfg = postStatusConfig[post.status] || postStatusConfig.draft;
            const ownerClient = Array.isArray(clientsData) && post.clientId
              ? clientsData.find((c: any) => c.id === post.clientId)
              : null;
            return (
              <Card key={post.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      {ownerClient ? (
                        <Badge variant="outline" className="text-xs">{ownerClient.name}</Badge>
                      ) : post.clientId ? (
                        <Badge variant="outline" className="text-xs">Client</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    {post.scheduledAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <SocialPostPreview
                    content={post.content}
                    hashtags={post.hashtags}
                    mediaUrls={post.mediaUrls}
                    platform={post.platforms?.[0] || "facebook"}
                    accountName={(() => {
                      const firstId = post.accountIds?.[0];
                      const acc = firstId ? accounts.find((a: any) => a.id === firstId) : accounts.find((a: any) => post.platforms?.[0] && a.platform === post.platforms[0]);
                      return acc?.accountName || acc?.name || "Your Page";
                    })()}
                    accountImage={(() => {
                      const firstId = post.accountIds?.[0];
                      const acc = firstId ? accounts.find((a: any) => a.id === firstId) : accounts.find((a: any) => post.platforms?.[0] && a.platform === post.platforms[0]);
                      return acc?.accountImage || undefined;
                    })()}
                  />
                  {post.accountIds && post.accountIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.accountIds.map((aid: string) => {
                        const acc = accounts.find((a: any) => a.id === aid);
                        return acc ? (
                          <Badge key={aid} variant="outline" className="text-xs">
                            {acc.accountName || acc.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  {post.status !== "published" && (
                    <div className="pt-2 border-t flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(post)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {(post.status === "draft" || post.status === "failed") && (
                        <Button
                          size="sm"
                          onClick={() => publishMutation.mutate(post.id)}
                          disabled={publishMutation.isPending}
                        >
                          {publishMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3 mr-1" />
                          )}
                          Publish Now
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this post?")) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                  {post.status === "published" && post.publishedAt && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Published {new Date(post.publishedAt).toLocaleDateString()} at {new Date(post.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AIComposeTab() {
  const [briefing, setBriefing] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiResults, setAiResults] = useState<any>(null);
  const [vibeContent, setVibeContent] = useState("");
  const [vibeDirection, setVibeDirection] = useState("");
  const [vibeResult, setVibeResult] = useState<any>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [generatingImageIdx, setGeneratingImageIdx] = useState<number | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoSource, setVideoSource] = useState<"ai" | "stock">("stock");
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [autonomousProgress, setAutonomousProgress] = useState<string | null>(null);
  const [autonomousResult, setAutonomousResult] = useState<any>(null);
  const [autoPost, setAutoPost] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedBrandVoiceId, setSelectedBrandVoiceId] = useState<string>("none");
  const [scrapeUrlInput, setScrapeUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const { toast } = useToast();

  const { data: brandVoiceProfiles = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/brand-voice"],
  });

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/accounts"],
  });

  const orchestrateMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/orchestrate", {
        briefing,
        platforms: selectedPlatforms,
        brandVoiceId: selectedBrandVoiceId && selectedBrandVoiceId !== "none" ? selectedBrandVoiceId : undefined,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAiResults({
        ...data,
        generatedContent: data?.content || data?.generatedContent,
      });
      if (data?.content || data?.generatedContent) setVibeContent(data.content || data.generatedContent);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "AI workflow failed", variant: "destructive" });
    },
  });

  const generatePostMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/generate-post", {
        prompt: briefing,
        platforms: selectedPlatforms,
        brandVoiceId: selectedBrandVoiceId && selectedBrandVoiceId !== "none" ? selectedBrandVoiceId : undefined,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAiResults((prev: any) => ({ ...prev, generatedContent: data?.content || data?.generatedContent }));
      if (data?.content || data?.generatedContent) setVibeContent(data.content || data.generatedContent);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate post", variant: "destructive" });
    },
  });

  const researchMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/research", {
        topic: briefing,
        platforms: selectedPlatforms,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAiResults((prev: any) => ({ ...prev, research: data }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Research failed", variant: "destructive" });
    },
  });

  const designMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/design", {
        content: briefing,
        platforms: selectedPlatforms,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAiResults((prev: any) => ({ ...prev, design: data }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Design suggestions failed", variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/review", {
        content: vibeContent || briefing,
        platforms: selectedPlatforms,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAiResults((prev: any) => ({ ...prev, review: data }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Review failed", variant: "destructive" });
    },
  });

  const vibeEditMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/vibe-edit", {
        content: vibeContent,
        vibeDirection: vibeDirection,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setVibeResult(data);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Vibe edit failed", variant: "destructive" });
    },
  });

  const autonomousMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/social/ai/autonomous", {
        briefing,
        platforms: selectedPlatforms,
        brandVoiceId: selectedBrandVoiceId && selectedBrandVoiceId !== "none" ? selectedBrandVoiceId : undefined,
        autoPost,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setAutonomousResult(data);
      setAiResults({
        ...data.aiResults,
        generatedContent: data.aiResults?.content || data.aiResults?.generatedContent,
      });
      if (data.aiResults?.content) setVibeContent(data.aiResults.content);
      if (data.aiResults?.generatedImages) {
        setMediaUrls((prev) => [...prev, ...data.aiResults.generatedImages]);
      }
      setAutonomousProgress(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      const scheduledTime = data.aiResults?.schedule?.scheduledAt
        ? `${new Date(data.aiResults.schedule.scheduledAt).toLocaleDateString()} at ${new Date(data.aiResults.schedule.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : '';
      toast({
        title: "Autonomous creation complete",
        description: data.autoPost
          ? `Post scheduled for ${scheduledTime}`
          : `Draft saved — AI recommends posting ${scheduledTime}. Open the post to schedule or publish.`
      });
    },
    onError: (error: any) => {
      setAutonomousProgress(null);
      toast({ title: "Autonomous mode failed", description: error.message || "Could not complete autonomous creation", variant: "destructive" });
    },
  });

  const isAnyLoading =
    orchestrateMutation.isPending ||
    generatePostMutation.isPending ||
    researchMutation.isPending ||
    designMutation.isPending ||
    reviewMutation.isPending ||
    autonomousMutation.isPending;

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/admin/social/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.urls) setMediaUrls((prev) => [...prev, ...data.urls]);
      toast({ title: "Uploaded", description: `${data.urls.length} file(s) added.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleAddMediaUrl = async () => {
    if (!mediaUrlInput.trim()) return;
    setIsAddingUrl(true);
    try {
      const res = await apiRequest("POST", "/api/admin/social/media/from-url", { url: mediaUrlInput.trim() });
      const data = await res.json();
      if (data.url) {
        setMediaUrls((prev) => [...prev, data.url]);
        setMediaUrlInput("");
        toast({ title: "Added", description: "Media from URL saved." });
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Could not download from URL", variant: "destructive" });
    } finally {
      setIsAddingUrl(false);
    }
  };

  const handleGenerateVisual = async (description: string, index: number) => {
    setGeneratingImageIdx(index);
    try {
      const res = await apiRequest("POST", "/api/admin/social/ai/generate-image", { description });
      const data = await res.json();
      if (data.url) {
        setMediaUrls((prev) => [...prev, data.url]);
        toast({ title: "Image generated", description: "AI-created visual has been added to your media." });
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Could not generate image", variant: "destructive" });
    } finally {
      setGeneratingImageIdx(null);
    }
  };

  const handleGenerateVideo = async () => {
    const prompt = videoPrompt.trim() || briefing.trim();
    if (!prompt) {
      toast({ title: "Description required", description: "Enter a video description or briefing first.", variant: "destructive" });
      return;
    }
    setIsGeneratingVideo(true);
    try {
      const res = await apiRequest("POST", "/api/admin/social/video/generate", {
        topic: prompt,
        source: videoSource,
        description: prompt,
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const videoUrl = data.video?.url;
      if (videoUrl) {
        setMediaUrls((prev) => [...prev, videoUrl]);
        setVideoPrompt("");
        const sourceLabel = videoSource === "stock" ? "stock video from Pexels" : "AI-generated video";
        toast({ title: "Video added", description: `${data.message || sourceLabel} has been added to your media.` });
      }
    } catch (err: any) {
      toast({ title: "Video generation failed", description: err.message || "Could not generate video", variant: "destructive" });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSaveAsPost = async (status: "draft" | "scheduled", scheduledAt?: string) => {
    const content = aiResults?.generatedContent || vibeContent || briefing;
    if (!content) {
      toast({ title: "No content", description: "Generate content first before saving.", variant: "destructive" });
      return;
    }
    setIsSavingPost(true);
    try {
      const payload: any = {
        content,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ["facebook"],
        accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
        hashtags: aiResults?.hashtags || [],
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        status,
        scheduledAt: scheduledAt || undefined,
      };
      await apiRequest("POST", "/api/admin/social/posts", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      toast({ title: status === "draft" ? "Saved as draft" : "Post scheduled", description: status === "scheduled" && scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Your post has been saved to the Posts tab." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Could not save post", variant: "destructive" });
    } finally {
      setIsSavingPost(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrlInput.trim()) return;
    setIsScraping(true);
    setScrapedData(null);
    try {
      const res = await apiRequest("POST", "/api/admin/social/scrape", { url: scrapeUrlInput.trim() });
      const data = await res.json();
      setScrapedData(data);
      if (data.images && data.images.length > 0) {
        setMediaUrls((prev) => {
          const existing = new Set(prev);
          const newImages = data.images.filter((img: string) => !existing.has(img));
          return [...prev, ...newImages];
        });
      }
      if (data.title || data.description) {
        const context = [data.title, data.description].filter(Boolean).join(" — ");
        if (!briefing.trim()) {
          setBriefing(context);
        }
      }
      toast({
        title: "URL scraped",
        description: `Found ${data.images?.length || 0} images. ${data.title ? `"${data.title}"` : "Content extracted."}`,
      });
    } catch (err: any) {
      toast({ title: "Scrape failed", description: err.message || "Could not scrape URL", variant: "destructive" });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Compose</h2>
        <p className="text-muted-foreground text-sm">Use AI agents to create, research, and refine your social media content</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Briefing</CardTitle>
              <CardDescription>Describe what you want to post about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the post topic, key messages, and any specific angles..."
                className="min-h-[120px]"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
              />
              <div>
                <Label className="text-sm font-medium mb-2 block">Target Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`ai-platform-${platform.id}`}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <Label htmlFor={`ai-platform-${platform.id}`} className="flex items-center gap-1 cursor-pointer text-sm">
                        <platform.icon className="w-3 h-3" />
                        {platform.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Brand Voice</Label>
                <Select value={selectedBrandVoiceId} onValueChange={setSelectedBrandVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Default (no brand voice)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (no brand voice)</SelectItem>
                    {brandVoiceProfiles.map((profile: any) => (
                      <SelectItem key={profile.id} value={String(profile.id)}>
                        {profile.name}{profile.tone ? ` — ${profile.tone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlatforms.length > 0 && accounts.filter((a: any) => selectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId).length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Publish to Accounts</Label>
                  <p className="text-xs text-muted-foreground mb-2">Choose which connected accounts to post to. If none selected, posts to the first available.</p>
                  <div className="flex flex-col gap-2">
                    {accounts
                      .filter((a: any) => selectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId)
                      .map((account: any) => {
                        const platform = PLATFORMS.find((p) => p.id === account.platform);
                        const PIcon = platform?.icon;
                        return (
                          <div key={account.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`ai-account-${account.id}`}
                              checked={selectedAccountIds.includes(account.id)}
                              onCheckedChange={(checked) => {
                                setSelectedAccountIds((prev) =>
                                  checked
                                    ? [...prev, account.id]
                                    : prev.filter((id) => id !== account.id)
                                );
                              }}
                            />
                            <Label htmlFor={`ai-account-${account.id}`} className="flex items-center gap-1 cursor-pointer text-sm">
                              {PIcon && <PIcon className="w-3 h-3" />}
                              {account.accountName || account.name}
                              {account.accountUsername && <span className="text-muted-foreground text-xs">(@{account.accountUsername})</span>}
                            </Label>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Media Attachments
              </CardTitle>
              <CardDescription>Add photos or videos to your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden border">
                      {url.match(/\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)$/i) ? (
                        <div className="relative w-full aspect-square">
                          <video src={url} controls preload="metadata" className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-black/60 text-white rounded px-1 py-0.5 text-[10px] flex items-center gap-0.5 pointer-events-none">
                            <Video className="h-2.5 w-2.5" />
                            Video
                          </div>
                        </div>
                      ) : (
                        <img src={url} alt={`Media ${i + 1}`} className="w-full aspect-square object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("media-file-input")?.click()}
                  disabled={isUploadingMedia}
                >
                  {isUploadingMedia ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                  Upload Files
                </Button>
                <input
                  id="media-file-input"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image or video URL..."
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMediaUrl()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMediaUrl}
                  disabled={!mediaUrlInput.trim() || isAddingUrl}
                >
                  {isAddingUrl ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link className="h-3 w-3 mr-1" />}
                  Add
                </Button>
              </div>
              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Video Generator
                </Label>
                <p className="text-xs text-muted-foreground">Get a stock video from Pexels or generate one with AI.</p>
                <div className="flex items-center gap-2 mb-2">
                  <Select value={videoSource} onValueChange={(v: any) => setVideoSource(v)}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">📹 Stock (Pexels)</SelectItem>
                      <SelectItem value="ai">🤖 AI Generated</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {videoSource === "stock" ? "Quick, professional footage" : "Custom, slower to generate"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the video you want (or leave blank to use briefing)..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateVideo()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo}
                  >
                    {isGeneratingVideo ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Video className="h-3 w-3 mr-1" />}
                    {isGeneratingVideo ? "Getting..." : videoSource === "stock" ? "Find Video" : "Generate"}
                  </Button>
                </div>
                {isGeneratingVideo && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    {videoSource === "stock" 
                      ? "Searching Pexels for matching video..." 
                      : "Creating 4 AI scenes and composing video... This may take 1-2 minutes."}
                  </p>
                )}
              </div>
              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <SiYoutube className="h-3 w-3 text-red-600" />
                  YouTube Shorts
                </Label>
                <p className="text-xs text-muted-foreground">The Research agent will search YouTube for relevant Shorts and include their links in your generated content. Add search terms in parentheses in your briefing to control the search, e.g. <span className="font-medium">(bugs, philadelphia, pest control)</span></p>
              </div>
              <div className="border-t pt-3 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  URL Scraper
                </Label>
                <p className="text-xs text-muted-foreground">Scrape a webpage to extract content, images, and details for your post. Images are automatically attached.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/listing..."
                    value={scrapeUrlInput}
                    onChange={(e) => setScrapeUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScrapeUrl}
                    disabled={!scrapeUrlInput.trim() || isScraping}
                  >
                    {isScraping ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
                    {isScraping ? "Scraping..." : "Scrape"}
                  </Button>
                </div>
                {scrapedData && (
                  <div className="rounded-md bg-muted p-3 space-y-2">
                    {scrapedData.title && <p className="text-sm font-medium">{scrapedData.title}</p>}
                    {scrapedData.description && <p className="text-xs text-muted-foreground">{scrapedData.description}</p>}
                    {scrapedData.price && <Badge variant="secondary">{scrapedData.price}</Badge>}
                    {scrapedData.address && <p className="text-xs text-muted-foreground">{scrapedData.address}</p>}
                    <p className="text-xs text-muted-foreground">{scrapedData.images?.length || 0} images attached</p>
                    <p className="text-xs text-muted-foreground">Tip: Use <span className="font-mono text-[11px] bg-background px-1 rounded">(scrape {scrapeUrlInput})</span> in your briefing for AI to incorporate this content automatically.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Actions</CardTitle>
              <CardDescription>Choose an AI agent workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b">
                <div>
                  <Label htmlFor="autonomous-toggle" className="text-sm font-medium cursor-pointer">Fully Autonomous</Label>
                  <p className="text-xs text-muted-foreground">One click - AI creates everything</p>
                </div>
                <Switch
                  id="autonomous-toggle"
                  checked={autonomousMode}
                  onCheckedChange={setAutonomousMode}
                />
              </div>
              {autonomousMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/40">
                    <div>
                      <Label htmlFor="admin-auto-post-switch" className="text-sm font-medium cursor-pointer">Auto-post when done</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Off: saves as draft with AI schedule recommendation. On: schedules automatically.
                      </p>
                    </div>
                    <Switch
                      id="admin-auto-post-switch"
                      checked={autoPost}
                      onCheckedChange={setAutoPost}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setAutonomousProgress("Starting autonomous creation...");
                      autonomousMutation.mutate();
                    }}
                    disabled={!briefing || selectedPlatforms.length === 0 || isAnyLoading}
                    className="w-full"
                    size="lg"
                  >
                    {autonomousMutation.isPending ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-2" />
                    )}
                    Create Everything
                  </Button>
                  {autonomousMutation.isPending && (
                    <div className="space-y-2 p-3 rounded-md bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">AI is working...</span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { key: "research", label: "Researching trends & audience" },
                          { key: "content", label: "Writing optimized content" },
                          { key: "design", label: "Planning visual design" },
                          { key: "images", label: "Generating visual assets" },
                          { key: "schedule", label: "Setting optimal schedule" },
                          { key: "save", label: "Saving scheduled post" },
                        ].map((step) => (
                          <div key={step.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-muted-foreground/50" />
                            <span>{step.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">This may take 1-2 minutes. Images are being created by AI.</p>
                    </div>
                  )}
                  {autonomousResult && !autonomousMutation.isPending && (
                    <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {autonomousResult.autoPost ? 'Post Created & Scheduled' : 'Draft Saved with AI Recommendation'}
                        </span>
                      </div>
                      {autonomousResult.aiResults?.schedule?.scheduledAt && (
                        <p className="text-xs text-muted-foreground">
                          {autonomousResult.autoPost ? 'Scheduled for' : 'AI recommends posting'}: {new Date(autonomousResult.aiResults.schedule.scheduledAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {new Date(autonomousResult.aiResults.schedule.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {!autonomousResult.autoPost && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Go to the Posts tab to review, edit, schedule, or publish.
                        </p>
                      )}
                      {autonomousResult.aiResults?.generatedImages?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {autonomousResult.aiResults.generatedImages.length} AI-generated visual(s) attached
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Score: {autonomousResult.aiResults?.review?.score || "N/A"}/100
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Researches trends, writes content, creates visuals, reviews quality, and schedules for optimal posting time. Fully hands-off.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => orchestrateMutation.mutate()}
                    disabled={!briefing || isAnyLoading}
                    className="col-span-2"
                  >
                    {orchestrateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Full AI Workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generatePostMutation.mutate()}
                    disabled={!briefing || isAnyLoading}
                  >
                    {generatePostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PenTool className="h-4 w-4 mr-2" />
                    )}
                    Generate Post
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => researchMutation.mutate()}
                    disabled={!briefing || isAnyLoading}
                  >
                    {researchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Research Trends
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => designMutation.mutate()}
                    disabled={!briefing || isAnyLoading}
                  >
                    {designMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Palette className="h-4 w-4 mr-2" />
                    )}
                    Design Suggestions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => reviewMutation.mutate()}
                    disabled={(!vibeContent && !briefing) || isAnyLoading}
                  >
                    {reviewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Review Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vibe Edit</CardTitle>
              <CardDescription>Adjust the tone and style of your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Current content to edit..."
                className="min-h-[80px]"
                value={vibeContent}
                onChange={(e) => setVibeContent(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder='e.g., "make it more casual" or "add humor"'
                  value={vibeDirection}
                  onChange={(e) => setVibeDirection(e.target.value)}
                />
                <Button
                  onClick={() => vibeEditMutation.mutate()}
                  disabled={!vibeContent || !vibeDirection || vibeEditMutation.isPending}
                >
                  {vibeEditMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4 mr-2" />
                  )}
                  Apply
                </Button>
              </div>
              {vibeResult && (
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Edited Version</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const edited = vibeResult.editedContent || vibeResult.content || "";
                          setVibeContent(edited);
                          setAiResults((prev: any) => prev ? { ...prev, generatedContent: edited } : { generatedContent: edited });
                          toast({ title: "Applied", description: "Edited content applied and preview updated." });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use This
                      </Button>
                    </div>
                    <SocialPostPreview
                      content={vibeResult.editedContent || vibeResult.content || ""}
                      mediaUrls={mediaUrls.length > 0 ? mediaUrls : undefined}
                      platform={selectedPlatforms[0] || "facebook"}
                      accountName={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === (selectedPlatforms[0] || "facebook")) || accounts.find((a: any) => a.platform === (selectedPlatforms[0] || "facebook")); return acc?.accountName || acc?.name || "Your Page"; })()}
                      accountImage={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === (selectedPlatforms[0] || "facebook")) || accounts.find((a: any) => a.platform === (selectedPlatforms[0] || "facebook")); return acc?.accountImage || undefined; })()}
                    />
                    {vibeResult.changes && Array.isArray(vibeResult.changes) && vibeResult.changes.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Changes made:</p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                          {vibeResult.changes.map((c: any, i: number) => (
                            <li key={i}>{safeStr(c)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!aiResults ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post Preview</CardTitle>
                <CardDescription>See how your post will look on social media</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <Brain className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Run an AI action to see your post preview here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {aiResults.generatedContent && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-lg">Post Preview</CardTitle>
                        <CardDescription>{isEditingContent ? "Edit your content before saving" : "How your post will look on social media"}</CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={isEditingContent ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsEditingContent(!isEditingContent)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {isEditingContent ? "Done Editing" : "Edit Content"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(aiResults.generatedContent);
                            toast({ title: "Copied", description: "Content copied to clipboard." });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Text
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingContent ? (
                      <div className="space-y-3">
                        <Textarea
                          className="min-h-[160px]"
                          value={aiResults.generatedContent}
                          onChange={(e) => {
                            setAiResults((prev: any) => ({ ...prev, generatedContent: e.target.value }));
                            setVibeContent(e.target.value);
                          }}
                        />
                        {aiResults.hashtags && aiResults.hashtags.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Hashtags</Label>
                            <Input
                              value={(aiResults.hashtags || []).join(", ")}
                              onChange={(e) => {
                                const tags = e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean);
                                setAiResults((prev: any) => ({ ...prev, hashtags: tags }));
                              }}
                              placeholder="Edit hashtags (comma-separated)"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <SocialPostPreview
                        content={aiResults.generatedContent}
                        hashtags={aiResults.hashtags}
                        mediaUrls={mediaUrls.length > 0 ? mediaUrls : undefined}
                        platform={selectedPlatforms[0] || "facebook"}
                        accountName={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === (selectedPlatforms[0] || "facebook")) || accounts.find((a: any) => a.platform === (selectedPlatforms[0] || "facebook")); return acc?.accountName || acc?.name || "Your Page"; })()}
                        accountImage={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === (selectedPlatforms[0] || "facebook")) || accounts.find((a: any) => a.platform === (selectedPlatforms[0] || "facebook")); return acc?.accountImage || undefined; })()}
                      />
                    )}
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      <Button
                        onClick={() => handleSaveAsPost("draft")}
                        disabled={isSavingPost}
                        variant="outline"
                      >
                        {isSavingPost ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                        Save as Draft
                      </Button>
                      <Button
                        onClick={() => handleSaveAsPost("scheduled")}
                        disabled={isSavingPost}
                      >
                        {isSavingPost ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                        Create Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {aiResults.research && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Research Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof aiResults.research === "object" && !Array.isArray(aiResults.research) ? (
                      <div className="space-y-3">
                        {aiResults.research.trends && Array.isArray(aiResults.research.trends) && aiResults.research.trends.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Trending Topics</h4>
                            <div className="space-y-1.5">
                              {aiResults.research.trends.map((trend: any, i: number) => (
                                <div key={i} className="rounded-md bg-muted p-2.5">
                                  <p className="text-sm font-medium">{safeStr(trend.name || trend)}</p>
                                  {trend.description && <p className="text-xs text-muted-foreground mt-0.5">{safeStr(trend.description)}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {aiResults.research.suggestions && Array.isArray(aiResults.research.suggestions) && aiResults.research.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Suggestions</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                              {aiResults.research.suggestions.map((s: any, i: number) => (
                                <li key={i}>{safeStr(s)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiResults.research.optimalTimes && Object.keys(aiResults.research.optimalTimes).length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="text-sm font-medium flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Best Times to Post
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const bestTimes = aiResults.research.optimalTimes;
                                  const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : ["facebook"];
                                  const platformKey = platforms[0];
                                  const ptData = bestTimes[platformKey];
                                  if (!ptData) {
                                    toast({ title: "Schedule applied", description: "No specific time data found for selected platform." });
                                    return;
                                  }
                                  const ptStr = typeof ptData === "string" ? ptData : JSON.stringify(ptData);
                                  const dayMatch = ptStr.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
                                  const timeMatch = ptStr.match(/(\d{1,2})(?::00)?\s*(AM|PM)/i);
                                  const now = new Date();
                                  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                  let targetDay = dayMatch ? dayMatch[1] : "Wednesday";
                                  let targetHour = 11;
                                  if (timeMatch) {
                                    let hr = parseInt(timeMatch[1]);
                                    if (timeMatch[2].toUpperCase() === "PM" && hr !== 12) hr += 12;
                                    if (timeMatch[2].toUpperCase() === "AM" && hr === 12) hr = 0;
                                    targetHour = hr;
                                  }
                                  for (let offset = 1; offset <= 14; offset++) {
                                    const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
                                    if (dayNames[candidate.getDay()].toLowerCase() === targetDay.toLowerCase()) {
                                      candidate.setHours(targetHour, 0, 0, 0);
                                      if (candidate > now) {
                                        const content = aiResults?.generatedContent || vibeContent || briefing;
                                        if (content) {
                                          handleSaveAsPost("scheduled", candidate.toISOString());
                                        } else {
                                          toast({ title: "No content", description: "Generate content first before scheduling.", variant: "destructive" });
                                        }
                                        return;
                                      }
                                    }
                                  }
                                  toast({ title: "Schedule note", description: "Could not find an upcoming matching day." });
                                  handleSaveAsPost("scheduled", new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString());
                                }}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Apply Schedule
                              </Button>
                            </div>
                            <div className="space-y-1.5">
                              {Object.entries(aiResults.research.optimalTimes).map(([platform, time]: [string, any]) => {
                                const platformInfo = PLATFORMS.find(p => p.id === platform);
                                const PIcon = platformInfo?.icon;
                                const timeData = typeof time === "string" ? time : (typeof time === "object" && time !== null ? (() => {
                                  const parts: string[] = [];
                                  if (time.best_days && Array.isArray(time.best_days)) parts.push("Days: " + time.best_days.join(", "));
                                  if (time.best_times && Array.isArray(time.best_times)) parts.push("Times: " + time.best_times.join(", "));
                                  if (time.frequency) parts.push("Frequency: " + time.frequency);
                                  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(time);
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
                        {aiResults.research.youtubeShorts && Array.isArray(aiResults.research.youtubeShorts) && aiResults.research.youtubeShorts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-1.5">
                              <SiYoutube className="h-3.5 w-3.5 text-red-600" />
                              Relevant YouTube Shorts
                            </h4>
                            <div className="space-y-1.5">
                              {aiResults.research.youtubeShorts.map((short: any, i: number) => (
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
                                      if (vibeContent) {
                                        if (!vibeContent.includes(shortUrl)) {
                                          setVibeContent((prev) => prev + linkText);
                                        }
                                      } else {
                                        setVibeContent(`Check out: ${shortTitle} - ${shortUrl}`);
                                      }
                                      toast({ title: "Link added", description: "YouTube Short link added to your post content." });
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to Post
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {typeof aiResults.research === "string" ? aiResults.research : JSON.stringify(aiResults.research, null, 2)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {aiResults.design && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Design Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof aiResults.design === "object" && !Array.isArray(aiResults.design) ? (
                      <div className="space-y-3">
                        {(aiResults.design.style || aiResults.design.mood || aiResults.design.aspect_ratio) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {aiResults.design.style && <Badge variant="outline">{aiResults.design.style}</Badge>}
                            {aiResults.design.mood && <Badge variant="secondary">{aiResults.design.mood}</Badge>}
                            {aiResults.design.aspect_ratio && <Badge variant="outline">{aiResults.design.aspect_ratio}</Badge>}
                          </div>
                        )}
                        {aiResults.design.image_prompt && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">AI Image Brief</h4>
                            <div className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                              <p className="text-sm flex-1">{aiResults.design.image_prompt}</p>
                              <Button
                                variant="default"
                                size="sm"
                                disabled={generatingImageIdx === -1}
                                onClick={() => handleGenerateVisual(aiResults.design.image_prompt, -1)}
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
                        {aiResults.design.visualSuggestions && Array.isArray(aiResults.design.visualSuggestions) && aiResults.design.visualSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Visual Ideas</h4>
                            <div className="space-y-1.5">
                              {aiResults.design.visualSuggestions.map((s: any, i: number) => {
                                const isObj = typeof s === "object" && s !== null;
                                const type = isObj ? (s.type || "image") : "image";
                                const desc = isObj ? (s.description || safeStr(s)) : safeStr(s);
                                return (
                                  <div key={i} className="rounded-md bg-muted p-2.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {type === "video" ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
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
                        {aiResults.design.captions && Array.isArray(aiResults.design.captions) && aiResults.design.captions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Alternative Captions</h4>
                            {aiResults.design.captions.map((c: any, i: number) => (
                              <div key={i} className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                                <p className="text-sm">{safeStr(c)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setVibeContent(safeStr(c));
                                    toast({ title: "Applied", description: "Caption moved to Vibe Edit." });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {aiResults.design.colorSchemes && Object.keys(aiResults.design.colorSchemes).length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Color Palette</h4>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(aiResults.design.colorSchemes).map(([name, color]: [string, any]) => (
                                <div key={name} className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: typeof color === "string" ? color : "#ccc" }} />
                                  <span className="text-xs text-muted-foreground capitalize">{name}</span>
                                </div>
                              ))}
                              {aiResults.design.color_palette && Array.isArray(aiResults.design.color_palette) && aiResults.design.color_palette.map((hex: string, i: number) => (
                                <div key={`p${i}`} className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: hex }} />
                                  <span className="text-xs text-muted-foreground">{hex}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {typeof aiResults.design === "string" ? aiResults.design : JSON.stringify(aiResults.design, null, 2)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(aiResults.designSuggestions && !aiResults.design) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Design Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof aiResults.designSuggestions === "object" ? (
                      <div className="space-y-3">
                        {aiResults.designSuggestions.visualSuggestions && Array.isArray(aiResults.designSuggestions.visualSuggestions) && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Visual Ideas</h4>
                            {aiResults.designSuggestions.visualSuggestions.map((s: any, i: number) => {
                              const isObj = typeof s === "object" && s !== null;
                              const type = isObj ? (s.type || "image") : "image";
                              const desc = isObj ? (s.description || safeStr(s)) : safeStr(s);
                              return (
                                <div key={i} className="rounded-md bg-muted p-2.5 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {type === "video" ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
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
                        {aiResults.designSuggestions.captions && Array.isArray(aiResults.designSuggestions.captions) && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Alternative Captions</h4>
                            {aiResults.designSuggestions.captions.map((c: any, i: number) => (
                              <div key={i} className="rounded-md bg-muted p-2.5 flex items-start justify-between gap-2">
                                <p className="text-sm">{safeStr(c)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setVibeContent(safeStr(c));
                                    toast({ title: "Applied", description: "Caption moved to Vibe Edit." });
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
                        <p className="text-sm whitespace-pre-wrap">{JSON.stringify(aiResults.designSuggestions, null, 2)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {aiResults.review && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Post Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {aiResults.review.score !== undefined && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 10 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.round(aiResults.review.score) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{aiResults.review.score}/10</span>
                        </div>
                      )}
                      {aiResults.review.approved_for_publish !== undefined && (
                        <Badge variant={aiResults.review.approved_for_publish ? "default" : "destructive"}>
                          {aiResults.review.approved_for_publish ? "Approved" : "Needs Revision"}
                        </Badge>
                      )}
                    </div>
                    {aiResults.review.reviews && Object.keys(aiResults.review.reviews).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Per-Platform Scores</h4>
                        {Object.entries(aiResults.review.reviews).map(([platform, review]: [string, any]) => {
                          const pl = PLATFORMS.find((p) => p.id === platform);
                          const PIcon = pl?.icon;
                          return (
                            <div key={platform} className="rounded-md bg-muted p-2.5 space-y-1.5">
                              <div className="flex items-center gap-2">
                                {PIcon && <PIcon className="h-3 w-3" />}
                                <span className="text-sm font-medium capitalize">{pl?.label || platform}</span>
                                <span className="text-sm text-muted-foreground ml-auto">{review.overall}/10</span>
                              </div>
                              {review.scores && (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(review.scores).map(([dim, score]: [string, any]) => (
                                    <Badge key={dim} variant={Number(score) >= 7 ? "outline" : "destructive"} className="text-xs capitalize">
                                      {dim}: {score}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {review.issues && Array.isArray(review.issues) && review.issues.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                                  {review.issues.map((issue: string, j: number) => (
                                    <li key={j}>{issue}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!aiResults.review.reviews && aiResults.review.feedback && (
                      <p className="text-sm text-muted-foreground">{safeStr(aiResults.review.feedback)}</p>
                    )}
                    {!aiResults.review.reviews && aiResults.review.suggestions && Array.isArray(aiResults.review.suggestions) && aiResults.review.suggestions.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-medium">Improvement Suggestions</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                          {aiResults.review.suggestions.map((s: any, i: number) => (
                            <li key={i}>{safeStr(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiResults.review.revisedContent && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium">Improved Version</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVibeContent(aiResults.review.revisedContent);
                              toast({ title: "Applied", description: "Revised content moved to Vibe Edit." });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Use This
                          </Button>
                        </div>
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-sm whitespace-pre-wrap">{aiResults.review.revisedContent}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {aiResults.platformVersions && Object.keys(aiResults.platformVersions).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Platform-Specific Versions
                    </CardTitle>
                    <CardDescription>Tailored content for each platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(aiResults.platformVersions).map(([platform, text]: [string, any]) => (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <PlatformBadge platformId={platform} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(String(text));
                              toast({ title: "Copied", description: `${platform} version copied.` });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <SocialPostPreview
                          content={String(text)}
                          hashtags={aiResults.hashtags}
                          mediaUrls={mediaUrls.length > 0 ? mediaUrls : undefined}
                          platform={platform}
                          accountName={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === platform) || accounts.find((a: any) => a.platform === platform); return acc?.accountName || acc?.name || "Your Page"; })()}
                          accountImage={(() => { const acc = accounts.find((a: any) => selectedAccountIds.includes(a.id) && a.platform === platform) || accounts.find((a: any) => a.platform === platform); return acc?.accountImage || undefined; })()}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignsTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("all");
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/campaigns"],
  });

  const { data: posts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/posts"],
  });

  const { data: clientsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: CreateCampaignForm) => {
      const payload: any = {
        name: data.name,
        description: data.description || undefined,
        status: data.status,
        targetAudience: data.targetAudience || undefined,
        goals: data.goals ? data.goals.split(",").map((g) => g.trim()).filter(Boolean) : undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      return apiRequest("POST", "/api/admin/social/campaigns", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/campaigns"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Campaign created", description: "Your campaign has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create campaign", variant: "destructive" });
    },
  });

  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: { name: "", description: "", status: "draft", startDate: "", endDate: "", targetAudience: "", goals: "" },
  });

  const campaignPosts = selectedCampaignId
    ? posts.filter((p: any) => p.campaignId === selectedCampaignId)
    : [];

  const filteredCampaigns = campaigns.filter((c: any) => {
    if (clientFilter === "all") return true;
    if (clientFilter === "none") return !c.clientId;
    return c.clientId === clientFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground text-sm">Organize your posts into campaigns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              <SelectItem value="none">No client (admin)</SelectItem>
              {Array.isArray(clientsData) && clientsData.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
              <DialogDescription>Start a new social media campaign</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Campaign description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Small business owners" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Campaign goals and KPIs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-2">
                  <Button type="submit" disabled={createCampaignMutation.isPending}>
                    {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Campaign
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <CampaignListSkeleton count={3} />
      ) : !Array.isArray(campaigns) || campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
            <p className="text-muted-foreground text-sm">Create a campaign to organize your social media posts.</p>
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No campaigns found</h3>
            <p className="text-muted-foreground text-sm">{clientFilter === "all" ? "Create a campaign to organize your social media posts." : "No campaigns match the selected client filter."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign: any) => {
            const statusCfg = campaignStatusConfig[campaign.status] || campaignStatusConfig.draft;
            const postCount = posts.filter((p: any) => p.campaignId === campaign.id).length;
            const ownerClient = Array.isArray(clientsData) && campaign.clientId
              ? clientsData.find((c: any) => c.id === campaign.clientId)
              : null;
            return (
              <Card
                key={campaign.id}
                className={`cursor-pointer hover-elevate ${selectedCampaignId === campaign.id ? "ring-2 ring-ring" : ""}`}
                onClick={() => setSelectedCampaignId(selectedCampaignId === campaign.id ? null : campaign.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="flex items-center gap-1 flex-wrap">
                      {ownerClient ? (
                        <Badge variant="outline" className="text-xs">{ownerClient.name}</Badge>
                      ) : campaign.clientId ? (
                        <Badge variant="outline" className="text-xs">Client</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Admin</Badge>
                      )}
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </div>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {(campaign.startDate || campaign.endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {campaign.startDate && new Date(campaign.startDate).toLocaleDateString()}
                        {campaign.startDate && campaign.endDate && " - "}
                        {campaign.endDate && new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {postCount} post{postCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Posts</CardTitle>
            <CardDescription>
              Posts in{" "}
              {campaigns.find((c: any) => c.id === selectedCampaignId)?.name || "this campaign"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaignPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No posts in this campaign yet.</p>
            ) : (
              <div className="space-y-3">
                {campaignPosts.map((post: any) => {
                  const statusCfg = postStatusConfig[post.status] || postStatusConfig.draft;
                  return (
                    <div key={post.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{post.content}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(post.platforms || []).map((p: string) => (
                            <PlatformBadge key={p} platformId={p} />
                          ))}
                        </div>
                      </div>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AccountsTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/accounts"],
  });

  const { data: clientsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const filteredAccounts = clientFilter === "all"
    ? accounts
    : accounts.filter((a: any) =>
        clientFilter === "none" ? !a.clientId : a.clientId === clientFilter
      );

  const connectFacebookMutation = useMutation({
    mutationFn: () =>
      apiRequest("GET", "/api/admin/social/meta/connect").then((r) => r.json()),
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start Facebook connection", variant: "destructive" });
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountForm) =>
      apiRequest("POST", "/api/admin/social/accounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/accounts"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Account connected", description: "Social media account has been added." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to connect account", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) =>
      apiRequest("DELETE", `/api/admin/social/accounts/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/accounts"] });
      toast({ title: "Account removed", description: "Social media account has been disconnected." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove account", variant: "destructive" });
    },
  });

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { platform: "", accountName: "", username: "" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Connected Accounts</h2>
          <p className="text-muted-foreground text-sm">Manage social media account connections for all clients</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              <SelectItem value="none">No client (admin)</SelectItem>
              {Array.isArray(clientsData) && clientsData.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => connectFacebookMutation.mutate()}
            disabled={connectFacebookMutation.isPending}
            className="bg-blue-600 text-white border-blue-600"
          >
            {connectFacebookMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SiFacebook className="h-4 w-4 mr-2" />
            )}
            Connect Facebook / Instagram
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connect Account</DialogTitle>
                <DialogDescription>Add a social media account (placeholder connection)</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORMS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Display name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Client (optional)</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Admin (no client)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Admin (no client)</SelectItem>
                            {Array.isArray(clientsData) && clientsData.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="gap-2">
                    <Button type="submit" disabled={createAccountMutation.isPending}>
                      {createAccountMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Connect
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <AccountListSkeleton count={3} />
      ) : !Array.isArray(filteredAccounts) || filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No accounts found</h3>
            <p className="text-muted-foreground text-sm">
              {clientFilter === "all" ? "Connect a social media account to start managing your presence." : "No accounts match the selected client filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account: any) => {
            const platform = PLATFORMS.find((p) => p.id === account.platform);
            const PlatformIcon = platform?.icon || Share2;
            const ownerClient = Array.isArray(clientsData) && account.clientId
              ? clientsData.find((c: any) => c.id === account.clientId)
              : null;
            return (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {account.accountImage ? (
                        <img src={account.accountImage} alt={account.accountName} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className={`rounded-md p-2 text-white ${platform?.color || "bg-muted"}`}>
                          <PlatformIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{account.accountName || account.name}</h3>
                        {(account.accountUsername || account.username) && (
                          <p className="text-sm text-muted-foreground">@{account.accountUsername || account.username}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAccountMutation.mutate(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant={account.isConnected !== false ? "default" : "secondary"}>
                      {account.isConnected !== false ? "Connected" : "Disconnected"}
                    </Badge>
                    {ownerClient ? (
                      <Badge variant="outline">{ownerClient.name}</Badge>
                    ) : account.clientId ? (
                      <Badge variant="outline">Client</Badge>
                    ) : (
                      <Badge variant="outline">Admin</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BrandVoiceTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const { toast } = useToast();

  const { data: profiles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/brand-voice"],
  });

  const createBrandVoiceMutation = useMutation({
    mutationFn: (data: CreateBrandVoiceForm) =>
      apiRequest("POST", "/api/admin/social/brand-voice", {
        name: data.name,
        tone: data.tone || undefined,
        style: data.style || undefined,
        isDefault: data.isDefault,
        vocabulary: data.vocabulary ? data.vocabulary.split(",").map((w) => w.trim()).filter(Boolean) : [],
        avoidWords: data.avoidWords ? data.avoidWords.split(",").map((w) => w.trim()).filter(Boolean) : [],
        examplePosts: data.examplePosts ? data.examplePosts.split("\n").filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/brand-voice"] });
      setIsCreateOpen(false);
      setEditingProfile(null);
      form.reset();
      toast({ title: "Brand voice saved", description: "Your brand voice profile has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save brand voice", variant: "destructive" });
    },
  });

  const form = useForm<CreateBrandVoiceForm>({
    resolver: zodResolver(createBrandVoiceSchema),
    defaultValues: { name: "", tone: "", style: "", vocabulary: "", avoidWords: "", examplePosts: "", isDefault: false },
  });

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    form.reset({
      name: profile.name || "",
      tone: profile.tone || "",
      style: profile.style || "",
      vocabulary: Array.isArray(profile.vocabulary) ? profile.vocabulary.join(", ") : profile.vocabulary || "",
      avoidWords: Array.isArray(profile.avoidWords) ? profile.avoidWords.join(", ") : profile.avoidWords || "",
      examplePosts: Array.isArray(profile.examplePosts) ? profile.examplePosts.join("\n") : profile.examplePosts || "",
      isDefault: profile.isDefault || false,
    });
    setIsCreateOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setEditingProfile(null);
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Brand Voice</h2>
          <p className="text-muted-foreground text-sm">Define how your brand sounds across social media</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProfile ? "Edit Brand Voice" : "Create Brand Voice"}</DialogTitle>
              <DialogDescription>Define the tone and style for your brand</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createBrandVoiceMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Professional, Casual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Friendly, Authoritative, Playful" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Concise, Storytelling, Data-driven" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vocabulary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Vocabulary (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="innovation, empower, transform" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avoidWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Words to Avoid (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="cheap, basic, simple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="examplePosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Example Posts (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste example posts that represent your brand voice..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                      <div>
                        <FormLabel className="mb-0">Default Profile</FormLabel>
                        <p className="text-sm text-muted-foreground">Use this as the default brand voice</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-2">
                  <Button type="submit" disabled={createBrandVoiceMutation.isPending}>
                    {createBrandVoiceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingProfile ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <BrandVoiceListSkeleton count={2} />
      ) : !Array.isArray(profiles) || profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No brand voice profiles</h3>
            <p className="text-muted-foreground text-sm">Create a brand voice profile to guide your AI-generated content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile: any) => (
            <Card key={profile.id} className="cursor-pointer hover-elevate" onClick={() => handleEdit(profile)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{profile.name}</h3>
                  <div className="flex items-center gap-1">
                    {profile.isDefault && <Badge variant="default">Default</Badge>}
                  </div>
                </div>
                {profile.tone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tone:</span> {profile.tone}
                  </div>
                )}
                {profile.style && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Style:</span> {profile.style}
                  </div>
                )}
                {profile.vocabulary && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(profile.vocabulary) ? profile.vocabulary : []).slice(0, 5).map((word: string, i: number) => (
                      <Badge key={i} variant="outline">{word}</Badge>
                    ))}
                    {Array.isArray(profile.vocabulary) && profile.vocabulary.length > 5 && (
                      <Badge variant="outline">+{profile.vocabulary.length - 5}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [calEditingPost, setCalEditingPost] = useState<any>(null);
  const [calEditOpen, setCalEditOpen] = useState(false);
  const { toast } = useToast();

  const { data: posts = [], isLoading: isCalendarLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/posts"],
  });

  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/campaigns"],
  });

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/accounts"],
  });

  const calEditForm = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", platforms: [], accountIds: [], scheduledAt: "", hashtags: "", campaignId: "" },
  });

  const calEditSelectedPlatforms = calEditForm.watch("platforms") || [];

  const calUpdateMutation = useMutation({
    mutationFn: (data: CreatePostForm) => {
      const payload: any = {
        content: data.content,
        platforms: data.platforms,
        accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
        campaignId: data.campaignId || undefined,
        mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
        status: calEditingPost?.status === "failed" ? "draft" : calEditingPost?.status,
      };
      return apiRequest("PUT", `/api/admin/social/posts/${calEditingPost?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      setCalEditOpen(false);
      setCalEditingPost(null);
      toast({ title: "Post updated", description: "Your changes have been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update post", variant: "destructive" });
    },
  });

  const calDeleteMutation = useMutation({
    mutationFn: (postId: string) => apiRequest("DELETE", `/api/admin/social/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      toast({ title: "Post deleted", description: "The post has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete post", variant: "destructive" });
    },
  });

  const calPublishMutation = useMutation({
    mutationFn: (postId: string) =>
      apiRequest("POST", `/api/admin/social/posts/${postId}/publish`).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      setCalEditOpen(false);
      setCalEditingPost(null);
      if (data.post?.status === "failed") {
        const errorMsg = data.errors?.join("; ") || "Publishing failed. Make sure you have a connected account with proper permissions.";
        toast({ title: "Publish failed", description: errorMsg, variant: "destructive" });
      } else if (data.errors && data.errors.length > 0) {
        const successPlatforms = data.results ? Object.entries(data.results).filter(([_, r]: [string, any]) => r.success).map(([p]) => p).join(", ") : "";
        toast({ title: "Partially published", description: `Published to: ${successPlatforms}. Errors: ${data.errors.join("; ")}`, variant: "destructive" });
      } else {
        const platforms = data.results ? Object.keys(data.results).join(", ") : "";
        toast({ title: "Published", description: `Your post has been published to ${platforms || "social media"}.` });
      }
    },
    onError: (error: any) => {
      toast({ title: "Publish failed", description: error.message || "Failed to publish post. Check your account connections.", variant: "destructive" });
    },
  });

  const handleCalPostNow = () => {
    calEditForm.handleSubmit(async (data) => {
      try {
        const payload: any = {
          content: data.content,
          platforms: data.platforms,
          accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
          hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          scheduledAt: undefined,
          campaignId: data.campaignId || undefined,
          mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
          status: "draft",
        };
        await apiRequest("PUT", `/api/admin/social/posts/${calEditingPost?.id}`, payload);
        calPublishMutation.mutate(calEditingPost?.id);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to save and publish", variant: "destructive" });
      }
    })();
  };

  const handleCalSchedulePost = () => {
    calEditForm.handleSubmit(async (data) => {
      if (!data.scheduledAt) {
        toast({ title: "Schedule required", description: "Please set a date and time to schedule this post.", variant: "destructive" });
        return;
      }
      const payload: any = {
        content: data.content,
        platforms: data.platforms,
        accountIds: data.accountIds && data.accountIds.length > 0 ? data.accountIds : undefined,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        campaignId: data.campaignId || undefined,
        mediaUrls: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls : undefined,
        status: "scheduled",
      };
      try {
        await apiRequest("PUT", `/api/admin/social/posts/${calEditingPost?.id}`, payload);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
        setCalEditOpen(false);
        setCalEditingPost(null);
        toast({ title: "Post scheduled", description: "Your post has been scheduled for publishing." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to schedule post", variant: "destructive" });
      }
    })();
  };

  const openCalEditDialog = (post: any) => {
    setCalEditingPost(post);
    calEditForm.reset({
      content: post.content || "",
      platforms: post.platforms || [],
      accountIds: post.accountIds || [],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      hashtags: (post.hashtags || []).join(", "),
      campaignId: post.campaignId || "",
      mediaUrls: post.mediaUrls || [],
    });
    setCalEditOpen(true);
  };

  const VIDEO_EXTS = /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)$/i;
  const isVideo = (url: string) => VIDEO_EXTS.test(url);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const postsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    posts.forEach((post: any) => {
      const d = post.scheduledAt || post.createdAt;
      if (!d) return;
      const date = new Date(d);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = date.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(post);
      }
    });
    return map;
  }, [posts, year, month]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const dayPosts = selectedDay ? (postsByDay[selectedDay.getDate().toString()] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Content Calendar</h2>
          <p className="text-muted-foreground text-sm">View your scheduled and published posts on a calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1 text-sm font-medium min-w-[140px] text-center">{monthLabel}</div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isCalendarLoading ? (
        <CalendarGridSkeleton />
      ) : (
      <Card>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((b) => <div key={`blank-${b}`} />)}
            {days.map((day) => {
              const count = postsByDay[day.toString()]?.length || 0;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(new Date(year, month, day))}
                  className={`p-2 rounded text-sm relative hover-elevate transition-all ${isToday ? "ring-2 ring-primary font-bold" : ""
                    } ${selectedDay?.getDate() === day && selectedDay?.getMonth() === month ? "bg-accent shadow-sm" : ""}`}
                >
                  {day}
                  {count > 0 && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <span key={i} className="w-1 h-1 rounded-full bg-primary" />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDay.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
            </CardTitle>
            <CardDescription>{dayPosts.length} post(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dayPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No posts on this day.</p>
            ) : (
              dayPosts.map((post: any) => {
                const statusCfg = postStatusConfig[post.status] || postStatusConfig.draft;
                const mediaList: string[] = post.mediaUrls || [];
                const imageCount = mediaList.filter((u: string) => !isVideo(u)).length;
                const videoCount = mediaList.filter((u: string) => isVideo(u)).length;
                return (
                  <Card key={post.id} className="overflow-visible">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          {(post.platforms || []).map((p: string) => {
                            const pl = PLATFORMS.find((x) => x.id === p);
                            return pl ? (
                              <pl.icon key={p} className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : null;
                          })}
                        </div>
                        {post.scheduledAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      <p className="text-sm line-clamp-3">{post.content}</p>

                      {mediaList.length > 0 && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {imageCount > 0 && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {imageCount} image{imageCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {videoCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Video className="h-3.5 w-3.5" />
                              {videoCount} video{videoCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}

                      {mediaList.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {mediaList.slice(0, 4).map((url: string, idx: number) => (
                            <div key={idx} className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border">
                              {isVideo(url) ? (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Video className="h-5 w-5 text-muted-foreground" />
                                </div>
                              ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                          {mediaList.length > 4 && (
                            <div className="w-16 h-16 rounded border flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                              +{mediaList.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 5).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </Badge>
                          ))}
                          {post.hashtags.length > 5 && (
                            <Badge variant="secondary" className="text-xs">+{post.hashtags.length - 5}</Badge>
                          )}
                        </div>
                      )}

                      {post.status === "published" && post.publishedAt && (
                        <div className="pt-2 border-t">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Published {new Date(post.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCalEditDialog(post)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {post.status !== "published" && (post.status === "draft" || post.status === "failed") && (
                          <Button
                            size="sm"
                            onClick={() => calPublishMutation.mutate(post.id)}
                            disabled={calPublishMutation.isPending}
                          >
                            {calPublishMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            Publish Now
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this post?")) {
                              calDeleteMutation.mutate(post.id);
                            }
                          }}
                          disabled={calDeleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={calEditOpen} onOpenChange={(open) => { setCalEditOpen(open); if (!open) setCalEditingPost(null); }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your social media post</DialogDescription>
          </DialogHeader>
          <Form {...calEditForm}>
            <form onSubmit={calEditForm.handleSubmit((data) => calUpdateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={calEditForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What do you want to share?" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calEditForm.control}
                name="platforms"
                render={() => (
                  <FormItem>
                    <FormLabel>Platforms</FormLabel>
                    <div className="flex flex-wrap gap-3">
                      {PLATFORMS.map((platform) => (
                        <FormField
                          key={platform.id}
                          control={calEditForm.control}
                          name="platforms"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    field.onChange(
                                      checked
                                        ? [...current, platform.id]
                                        : current.filter((v: string) => v !== platform.id)
                                    );
                                  }}
                                />
                              </FormControl>
                              <Label className="flex items-center gap-1 cursor-pointer">
                                <platform.icon className="w-3 h-3" />
                                {platform.label}
                              </Label>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {calEditSelectedPlatforms.length > 0 && accounts.filter((a: any) => calEditSelectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId).length > 0 && (
                <FormField
                  control={calEditForm.control}
                  name="accountIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Publish to Accounts</FormLabel>
                      <p className="text-xs text-muted-foreground">Select which connected accounts to publish to.</p>
                      <div className="flex flex-col gap-2">
                        {accounts
                          .filter((a: any) => calEditSelectedPlatforms.includes(a.platform) && a.isConnected && a.platformAccountId)
                          .map((account: any) => {
                            const platform = PLATFORMS.find((p) => p.id === account.platform);
                            const PIcon = platform?.icon;
                            return (
                              <FormField
                                key={account.id}
                                control={calEditForm.control}
                                name="accountIds"
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(account.id)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          field.onChange(
                                            checked
                                              ? [...current, account.id]
                                              : current.filter((v: string) => v !== account.id)
                                          );
                                        }}
                                      />
                                    </FormControl>
                                    <Label className="flex items-center gap-1 cursor-pointer">
                                      {PIcon && <PIcon className="w-3 h-3" />}
                                      {account.accountName || account.name}
                                      {account.accountUsername && <span className="text-muted-foreground text-xs">(@{account.accountUsername})</span>}
                                    </Label>
                                  </FormItem>
                                )}
                              />
                            );
                          })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={calEditForm.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calEditForm.control}
                name="hashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hashtags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="#ai, #socialmedia, #marketing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calEditForm.control}
                name="campaignId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a campaign" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(campaigns) && campaigns.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setCalEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="secondary" disabled={calUpdateMutation.isPending}>
                  {calUpdateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCalSchedulePost}
                  disabled={calUpdateMutation.isPending}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  type="button"
                  onClick={handleCalPostNow}
                  disabled={calPublishMutation.isPending || calUpdateMutation.isPending}
                >
                  {calPublishMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Post Now
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsTab() {
  const { data: posts = [], isLoading: isAnalyticsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/social/posts"],
  });
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/social/campaigns"],
  });

  const metrics = useMemo(() => {
    let likes = 0, shares = 0, comments = 0, reach = 0;
    let publishedCount = 0;
    const platformMap: Record<string, { likes: number; shares: number; comments: number; reach: number; count: number }> = {};

    posts.forEach((post: any) => {
      const eng = post.engagement || {};
      likes += eng.likes || 0;
      shares += eng.shares || 0;
      comments += eng.comments || 0;
      reach += eng.reach || 0;
      if (post.status === "published") publishedCount++;

      (post.platforms || []).forEach((p: string) => {
        if (!platformMap[p]) platformMap[p] = { likes: 0, shares: 0, comments: 0, reach: 0, count: 0 };
        platformMap[p].likes += eng.likes || 0;
        platformMap[p].shares += eng.shares || 0;
        platformMap[p].comments += eng.comments || 0;
        platformMap[p].reach += eng.reach || 0;
        platformMap[p].count++;
      });
    });

    return { likes, shares, comments, reach, publishedCount, totalPosts: posts.length, platformMap };
  }, [posts]);

  const bestPosts = useMemo(() => {
    return [...posts]
      .filter((p: any) => p.engagement)
      .sort((a: any, b: any) => {
        const scoreA = (a.engagement?.likes || 0) + (a.engagement?.shares || 0) * 2 + (a.engagement?.comments || 0);
        const scoreB = (b.engagement?.likes || 0) + (b.engagement?.shares || 0) * 2 + (b.engagement?.comments || 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [posts]);

  if (isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground text-sm">Overview of your social media performance</p>
        </div>
        <AnalyticsFullSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of your social media performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Star className="h-4 w-4" /> Total Likes
            </div>
            <p className="text-3xl font-bold mt-1">{metrics.likes.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Share2 className="h-4 w-4" /> Total Shares
            </div>
            <p className="text-3xl font-bold mt-1">{metrics.shares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MessageSquare className="h-4 w-4" /> Comments
            </div>
            <p className="text-3xl font-bold mt-1">{metrics.comments.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Eye className="h-4 w-4" /> Total Reach
            </div>
            <p className="text-3xl font-bold mt-1">{metrics.reach.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.platformMap).length === 0 ? (
              <p className="text-muted-foreground text-sm">No platform data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(metrics.platformMap).map(([platform, data]) => {
                  const pl = PLATFORMS.find((p) => p.id === platform);
                  return (
                    <div key={platform} className="flex items-center gap-3 border-b pb-2 last:border-0">
                      {pl && <pl.icon className="w-4 h-4" />}
                      <span className="font-medium flex-1">{pl?.label || platform}</span>
                      <span className="text-sm text-muted-foreground">{data.count} posts</span>
                      <span className="text-sm flex items-center gap-1"><Heart className="h-3 w-3" /> {data.likes}</span>
                      <span className="text-sm flex items-center gap-1"><Share2 className="h-3 w-3" /> {data.shares}</span>
                      <span className="text-sm flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {data.comments}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {bestPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No engagement data yet. Posts with likes, shares, and comments will appear here.</p>
            ) : (
              <div className="space-y-3">
                {bestPosts.map((post: any) => (
                  <div key={post.id} className="border rounded p-3 space-y-1">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.engagement?.likes || 0}</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {post.engagement?.shares || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.engagement?.comments || 0}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.engagement?.reach || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Post Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics.totalPosts}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-sm text-muted-foreground">Campaigns</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const connected = params.get("connected");
    const error = params.get("error");
    if (tab) {
      setActiveTab(tab);
    }
    if (connected) {
      toast({ title: "Account Connected", description: `Your ${connected} account has been connected successfully.` });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_pages: 'No Facebook Pages found. Make sure your Facebook account is an admin of at least one Facebook Page. Personal profiles cannot be connected — only Pages.',
        pages_declined: 'You declined the required Facebook Pages permissions. Please try again and click "Edit previous settings" to grant access to your Pages.',
        pages_not_granted: 'The "pages_show_list" permission was not granted. Please try again, click "Edit previous settings" on the Facebook dialog, and make sure all permissions are checked.',
      };
      toast({ title: "Connection Failed", description: errorMessages[error] || decodeURIComponent(error), variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="h-6 w-6" />
        <div>
          <h1 className="text-3xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">Manage campaigns, posts, and AI-powered content creation</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-1">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="ai-compose" className="gap-1">
            <Bot className="h-4 w-4" />
            AI Compose
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1">
            <UserCircle className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="brand-voice" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            Brand Voice
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostsTab />
        </TabsContent>
        <TabsContent value="ai-compose">
          <AIComposeTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsTab />
        </TabsContent>
        <TabsContent value="brand-voice">
          <BrandVoiceTab />
        </TabsContent>
        <TabsContent value="calendar">
          <ContentCalendarTab />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
