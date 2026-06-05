import { Helmet } from 'react-helmet-async';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Edit, Loader2, Megaphone, Plus, Trash2 } from 'lucide-react';
import type { SocialCampaign, SocialPost } from '@shared/schema';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { campaignStatusConfig, STATUS_VARIANTS } from '@/components/social/constants';
import { createCampaignSchema, type CreateCampaignForm } from '@/components/social/schemas';
import { formatDate, getStatusLabel } from '@/components/social/utils';
import {
  useCreateCampaign,
  useDeleteCampaign,
  useSocialCampaigns,
  useUpdateCampaign,
} from '@/hooks/social/use-social-campaigns';
import { useSocialPosts } from '@/hooks/social/use-social-posts';
import { useToast } from '@/hooks/use-toast';

function getDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

function campaignGoalsToString(goals: SocialCampaign['goals']): string {
  if (typeof goals === 'string') return goals;
  if (!goals) return '';
  return JSON.stringify(goals);
}

function postTextPreview(content: SocialPost['content']): string {
  if (!content) return '';
  return content.substring(0, 120);
}

export default function CampaignsTab() {
  const [selectedCampaign, setSelectedCampaign] = useState<SocialCampaign | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaign | null>(null);

  const { toast } = useToast();

  const { campaigns, isLoading } = useSocialCampaigns('portal');
  const { posts } = useSocialPosts('portal');

  const createCampaignMutation = useCreateCampaign('portal');
  const updateCampaignMutation = useUpdateCampaign('portal');
  const deleteCampaignMutation = useDeleteCampaign('portal');

  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      startDate: '',
      endDate: '',
      targetAudience: '',
      goals: '',
    },
  });

  const campaignPosts = useMemo(
    () =>
      selectedCampaign
        ? posts.filter((post) => post.campaignId === selectedCampaign.id)
        : [],
    [posts, selectedCampaign],
  );

  const handleSubmit = (data: CreateCampaignForm) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      status: data.status,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      targetAudience: data.targetAudience || undefined,
      goals: data.goals || undefined,
    };

    const onSuccess = () => {
      setIsCreateOpen(false);
      setEditingCampaign(null);
      form.reset();
      toast({
        title: editingCampaign ? 'Campaign updated' : 'Campaign created',
        description: 'Your campaign has been saved.',
      });
    };

    const onError = (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save campaign',
        variant: 'destructive',
      });
    };

    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: String(editingCampaign.id), ...payload }, { onSuccess, onError });
      return;
    }

    createCampaignMutation.mutate(payload, { onSuccess, onError });
  };

  const handleEdit = (campaign: SocialCampaign) => {
    setEditingCampaign(campaign);
    form.reset({
      name: campaign.name ?? '',
      description: campaign.description ?? '',
      status: (campaign.status as CreateCampaignForm['status']) ?? 'draft',
      startDate: getDateInputValue(campaign.startDate),
      endDate: getDateInputValue(campaign.endDate),
      targetAudience: campaign.targetAudience ?? '',
      goals: campaignGoalsToString(campaign.goals),
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (campaignId: string) => {
    deleteCampaignMutation.mutate(campaignId, {
      onSuccess: () => {
        setSelectedCampaign((current) => (current?.id === campaignId ? null : current));
        toast({ title: 'Campaign deleted' });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete campaign',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setEditingCampaign(null);
      form.reset();
    }
  };

  const isSaving = createCampaignMutation.isPending || updateCampaignMutation.isPending;

      <Helmet>
      <title>Campaigns | Steel City AI</title>
      <meta name="description" content="Create and manage your social media marketing campaigns" />
    </Helmet>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground text-sm">Organize your posts into campaigns</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
              <DialogDescription>Start a new social media campaign</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const statusCfg = campaignStatusConfig[campaign.status ?? 'draft'] || campaignStatusConfig.draft;
            const postCount = posts.filter((post) => post.campaignId === campaign.id).length;

                <Helmet>
      <title>Campaigns | Steel City AI</title>
      <meta name="description" content="Create and manage your social media marketing campaigns" />
    </Helmet>

            return (
              <Card
                key={campaign.id}
                className={`cursor-pointer hover-elevate ${selectedCampaign?.id === campaign.id ? 'ring-2 ring-ring' : ''}`}
                onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {postCount} post{postCount !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(campaign);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(String(campaign.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
            <p className="text-muted-foreground text-sm">
              Create a campaign to organize your social media posts.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedCampaign?.startDate)} - {formatDate(selectedCampaign?.endDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCampaign?.goals && (
              <div>
                <Label className="text-muted-foreground">Goals</Label>
                <p className="text-sm mt-1">{campaignGoalsToString(selectedCampaign.goals)}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Campaign Posts ({campaignPosts.length})</Label>
              {campaignPosts.length ? (
                <div className="space-y-3 mt-2">
                  {campaignPosts.map((post) => (
                    <div key={post.id} className="p-3 rounded-md border">
                      <p className="text-sm">{postTextPreview(post.content)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={STATUS_VARIANTS[post.status ?? 'draft'] || 'outline'}>
                          {getStatusLabel(post.status ?? 'draft')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.scheduledAt || post.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No posts in this campaign yet.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
