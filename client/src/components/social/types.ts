// types
// Part of SMP-Updates refactor — see docs/ADR-001-social-media-component-architecture.md
// TODO: Extract from PortalSocialMedia.tsx / SocialMediaPage.tsx

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  clicks?: number;
  saves?: number;
  engagementRate?: number;
}

export interface ReviewResult {
  score?: number;
  strengths?: string[];
  improvements?: string[];
  suggestions?: string[];
  platformTips?: Record<string, string[]>;
}

export interface DesignResult {
  visualDirection?: string;
  colorPalette?: string[];
  typography?: string[];
  layoutSuggestions?: string[];
  imagePrompts?: string[];
  recommendations?: string[];
}

export interface ResearchResult {
  topic?: string;
  trends?: string[];
  keywords?: string[];
  hashtags?: string[];
  competitorInsights?: string[];
  audienceInsights?: string[];
}

export interface AiContentResult {
  content?: string;
  hashtags?: string[];
  generatedContent?: string;
  platformVersions?: Record<string, string | { content: string }>;
  review?: ReviewResult;
  designSuggestions?: DesignResult;
  research?: ResearchResult;
}

export interface AutonomousResult {
  autoPost?: boolean;
  postId?: string;
  message?: string;
  aiResults?: {
    schedule?: {
      scheduledAt?: string;
      status?: string;
    };
    content?: AiContentResult;
    review?: ReviewResult;
    design?: DesignResult;
    research?: ResearchResult;
  };
}

export interface PostEditorState {
  mode: 'manual' | 'ai' | 'autonomous';
  content: string;
  selectedPlatforms: string[];
  scheduledAt: string;
  hashtags: string;
  briefing: string;
  selectedBrandVoiceId: string;
  mediaUrls: string[];
  mediaUrlInput: string;
  vibeDirection: string;
  showResearch: boolean;
  autoPost: boolean;
}
