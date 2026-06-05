// constants
// Part of SMP-Updates refactor — see docs/ADR-001-social-media-component-architecture.md
// TODO: Extract from PortalSocialMedia.tsx / SocialMediaPage.tsx

import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube } from 'react-icons/si';

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: SiFacebook, color: 'bg-blue-600' },
  { id: 'instagram', label: 'Instagram', icon: SiInstagram, color: 'bg-pink-600' },
  { id: 'x', label: 'X', icon: SiX, color: 'bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-800' },
  { id: 'linkedin', label: 'LinkedIn', icon: SiLinkedin, color: 'bg-blue-700' },
  { id: 'youtube', label: 'YouTube', icon: SiYoutube, color: 'bg-red-600' },
] as const;

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  scheduled: 'secondary',
  published: 'default',
  failed: 'destructive',
};

export const campaignStatusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
};
