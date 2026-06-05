export interface CreatePostState {
  mode: 'manual' | 'ai' | 'autonomous';

  content: string;
  selectedPlatforms: string[];
  scheduledAt: string;
  hashtags: string;
  briefing: string;
  selectedBrandVoiceId: string;
  researchTopic: string;
  campaignId: string;

  aiResult: any | null;
  reviewResult: any | null;
  designResult: any | null;
  autonomousResult: any | null;
  researchResult: any | null;
  scrapedData: any | null;

  mediaUrls: string[];
  mediaUrlInput: string;
  videoSource: 'stock' | 'ai';
  videoPrompt: string;
  scrapeUrlInput: string;

  vibeDirection: string;
  showResearch: boolean;
  autoPost: boolean;
  isEditingContent: boolean;
}

export type CreatePostAction =
  | { type: 'SET_MODE'; mode: CreatePostState['mode'] }
  | { type: 'SET_FIELD'; field: keyof CreatePostState; value: any }
  | { type: 'TOGGLE_PLATFORM'; platformId: string }
  | { type: 'ADD_MEDIA'; urls: string[] }
  | { type: 'REMOVE_MEDIA'; index: number }
  | { type: 'REORDER_MEDIA'; fromIndex: number; toIndex: number }
  | { type: 'APPLY_AI_CONTENT'; aiResult: any }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_AI' };

export const initialState: CreatePostState = {
  mode: 'manual',

  content: '',
  selectedPlatforms: [],
  scheduledAt: '',
  hashtags: '',
  briefing: '',
  selectedBrandVoiceId: '',
  researchTopic: '',
  campaignId: '',

  aiResult: null,
  reviewResult: null,
  designResult: null,
  autonomousResult: null,
  researchResult: null,
  scrapedData: null,

  mediaUrls: [],
  mediaUrlInput: '',
  videoSource: 'stock',
  videoPrompt: '',
  scrapeUrlInput: '',

  vibeDirection: '',
  showResearch: false,
  autoPost: false,
  isEditingContent: false,
};

export function createPostReducer(
  state: CreatePostState,
  action: CreatePostAction,
): CreatePostState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'TOGGLE_PLATFORM':
      return {
        ...state,
        selectedPlatforms: state.selectedPlatforms.includes(action.platformId)
          ? state.selectedPlatforms.filter((p) => p !== action.platformId)
          : [...state.selectedPlatforms, action.platformId],
      };

    case 'ADD_MEDIA':
      return { ...state, mediaUrls: [...state.mediaUrls, ...action.urls] };

    case 'REMOVE_MEDIA':
      return {
        ...state,
        mediaUrls: state.mediaUrls.filter((_, i) => i !== action.index),
      };

    case 'REORDER_MEDIA': {
      const urls = [...state.mediaUrls];
      const [moved] = urls.splice(action.fromIndex, 1);
      urls.splice(action.toIndex, 0, moved);
      return { ...state, mediaUrls: urls };
    }

    case 'APPLY_AI_CONTENT':
      return {
        ...state,
        content: action.aiResult?.content ?? state.content,
        hashtags: Array.isArray(action.aiResult?.hashtags)
          ? action.aiResult.hashtags.join(', ')
          : state.hashtags,
        aiResult: action.aiResult,
      };

    case 'RESET_FORM':
      return { ...initialState };

    case 'RESET_AI':
      return {
        ...state,
        aiResult: null,
        reviewResult: null,
        designResult: null,
        autonomousResult: null,
        researchResult: null,
      };

    default:
      return state;
  }
}
