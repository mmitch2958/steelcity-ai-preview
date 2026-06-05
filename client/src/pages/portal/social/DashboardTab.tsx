import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, Megaphone, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { PLATFORMS, STATUS_VARIANTS } from '@/components/social/constants';
import * as SocialUtils from '@/components/social/utils';
import * as SocialPostsHooks from '@/hooks/social/use-social-posts';
import * as SocialCampaignsHooks from '@/hooks/social/use-social-campaigns';
import * as SocialAccountsHooks from '@/hooks/social/use-social-accounts';

type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | string;
type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | string;

interface SocialPost {
  id: number | string;
  content: string;
  platforms?: string[];
  status?: PostStatus;
  scheduledAt?: string | null;
  createdAt?: string | null;
}

interface SocialCampaign {
  id: number | string;
  name: string;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
}

interface SocialAccount {
  id: number | string;
  platform: string;
  accountName?: string;
  username?: string;
}

type ListOrWrapped<T> = T[] | { posts?: T[]; campaigns?: T[]; accounts?: T[] } | undefined;

function normalizePosts(data: ListOrWrapped<SocialPost>): SocialPost[] {
  if (Array.isArray(data)) return data;
  return data?.posts ?? [];
}

function normalizeCampaigns(data: ListOrWrapped<SocialCampaign>): SocialCampaign[] {
  if (Array.isArray(data)) return data;
  return data?.campaigns ?? [];
}

function normalizeAccounts(data: ListOrWrapped<SocialAccount>): SocialAccount[] {
  if (Array.isArray(data)) return data;
  return data?.accounts ?? [];
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

const hookAdapters = {
  useSocialPosts:
    (SocialPostsHooks as { useSocialPosts?: (scope: 'portal') => { data?: ListOrWrapped<SocialPost>; isLoading: boolean } })
      .useSocialPosts,
  useSocialCampaigns:
    (SocialCampaignsHooks as {
      useSocialCampaigns?: (scope: 'portal') => { data?: ListOrWrapped<SocialCampaign>; isLoading: boolean };
    }).useSocialCampaigns,
  useSocialAccounts:
    (SocialAccountsHooks as {
      useSocialAccounts?: (scope: 'portal') => { data?: ListOrWrapped<SocialAccount>; isLoading: boolean };
    }).useSocialAccounts,
};

export function DashboardTab() {
  const postsHookResult = hookAdapters.useSocialPosts?.('portal');
  const campaignsHookResult = hookAdapters.useSocialCampaigns?.('portal');
  const accountsHookResult = hookAdapters.useSocialAccounts?.('portal');

  const postsFallback = useQuery<ListOrWrapped<SocialPost>>({ queryKey: ['/api/portal/social/posts'] });
  const campaignsFallback = useQuery<ListOrWrapped<SocialCampaign>>({ queryKey: ['/api/portal/social/campaigns'] });
  const accountsFallback = useQuery<ListOrWrapped<SocialAccount>>({ queryKey: ['/api/portal/social/accounts'] });

  const postsLoading = postsHookResult?.isLoading ?? postsFallback.isLoading;
  const campaignsLoading = campaignsHookResult?.isLoading ?? campaignsFallback.isLoading;

  const posts = normalizePosts(postsHookResult?.data ?? postsFallback.data);
  const campaigns = normalizeCampaigns(campaignsHookResult?.data ?? campaignsFallback.data);
  const accounts = normalizeAccounts(accountsHookResult?.data ?? accountsFallback.data);

  const isLoading = postsLoading || campaignsLoading;
  const scheduled = posts.filter((post) => post.status === 'scheduled').length;
  const published = posts.filter((post) => post.status === 'published').length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;

  // keep import and fetched data intentionally referenced while migration is in-progress
  void SocialUtils;
  void accounts;

      <Helmet>
      <title>Dashboard | Steel City AI</title>
      <meta name="description" content="Overview of your social media performance and key metrics" />
    </Helmet>

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-sm">Total Posts</div>
                <p className="text-3xl font-bold mt-1">{posts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Scheduled
                </div>
                <p className="text-3xl font-bold mt-1">{scheduled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-sm flex items-center gap-1">
                  <Send className="h-3 w-3" /> Published
                </div>
                <p className="text-3xl font-bold mt-1">{published}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-sm flex items-center gap-1">
                  <Megaphone className="h-3 w-3" /> Active Campaigns
                </div>
                <p className="text-3xl font-bold mt-1">{activeCampaigns}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length > 0 ? (
                  <div className="space-y-3">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="flex items-start justify-between gap-3 p-3 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{post.content}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {(post.platforms ?? []).map((platformId) => {
                              const platform = PLATFORMS.find((pl) => pl.id === platformId);
                              if (!platform) return null;

                              const Icon = platform.icon;
                              return <Icon key={platformId} className="h-3 w-3 text-muted-foreground" />;
                            })}
                            <Badge variant={STATUS_VARIANTS[post.status ?? 'draft'] ?? 'outline'}>
                              {getStatusLabel(post.status ?? 'draft')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(post.scheduledAt ?? post.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No posts yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.filter((campaign) => campaign.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    {campaigns
                      .filter((campaign) => campaign.status === 'active')
                      .slice(0, 5)
                      .map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-md border"
                        >
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No active campaigns</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardTab;
