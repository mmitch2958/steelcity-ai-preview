// schemas
// Part of SMP-Updates refactor — see docs/ADR-001-social-media-component-architecture.md
// TODO: Extract from PortalSocialMedia.tsx / SocialMediaPage.tsx

import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  goals: z.string().optional(),
});

export const createBrandVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tone: z.string().optional(),
  style: z.string().optional(),
  vocabulary: z.string().optional(),
  avoidWords: z.string().optional(),
  examplePosts: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const createAccountSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  accountName: z.string().min(1, 'Account name is required'),
  username: z.string().min(1, 'Username is required'),
  clientId: z.string().optional(),
});

export type CreateCampaignForm = z.infer<typeof createCampaignSchema>;
export type CreateBrandVoiceForm = z.infer<typeof createBrandVoiceSchema>;
export type CreateAccountForm = z.infer<typeof createAccountSchema>;
