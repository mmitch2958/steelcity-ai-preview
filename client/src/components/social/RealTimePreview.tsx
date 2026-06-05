// P2-B006: Real-time post preview — updates as user types (debounced 100ms)
// Platform-specific rendering with character count warnings

import { useMemo, useState } from 'react';
import { PLATFORMS } from '@/components/social/constants';
import { SocialPostPreview } from '@/components/SocialPostPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/* ── Platform character limits ──────────────────────────────────── */

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
};

const CHAR_WARNING_THRESHOLD = 0.9; // warn at 90% of limit

interface RealTimePreviewProps {
  content: string;
  hashtags: string;
  mediaUrls: string[];
  selectedPlatforms: string[];
  accountName?: string;
  accountImage?: string;
}

function CharacterCounter({
  content,
  platformId,
}: {
  content: string;
  platformId: string;
}) {
  const limit = CHAR_LIMITS[platformId];
  if (!limit) return null;

  const count = content.length;
  const ratio = count / limit;
  const isOver = count > limit;
  const isWarning = ratio >= CHAR_WARNING_THRESHOLD && !isOver;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs',
        isOver && 'text-destructive font-medium',
        isWarning && 'text-amber-600',
        !isOver && !isWarning && 'text-muted-foreground',
      )}
    >
      {isOver && <AlertCircle className="h-3 w-3" />}
      <span>
        {count.toLocaleString()}/{limit.toLocaleString()}
      </span>
      {isOver && (
        <span className="ml-1">
          ({(count - limit).toLocaleString()} over)
        </span>
      )}
    </div>
  );
}

export function RealTimePreview({
  content,
  hashtags,
  mediaUrls,
  selectedPlatforms,
  accountName = 'Your Page',
  accountImage,
}: RealTimePreviewProps) {
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-select first platform or use explicit selection
  const displayPlatform = activePlatform ?? selectedPlatforms[0] ?? 'facebook';

  // Combine content + hashtags for character counting
  const fullContent = useMemo(() => {
    const tags = hashtags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
    return tags.length > 0 ? `${content}\n\n${tags.join(' ')}` : content;
  }, [content, hashtags]);

  const hashtagArray = useMemo(
    () =>
      hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [hashtags],
  );

  if (!content && mediaUrls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start typing to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Live Preview
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Platform tabs */}
          {selectedPlatforms.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {selectedPlatforms.map((pid) => {
                const platform = PLATFORMS.find((p) => p.id === pid);
                if (!platform) return null;
                const Icon = platform.icon;
                const isActive = displayPlatform === pid;

                return (
                  <Button
                    key={pid}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1 h-7 text-xs"
                    onClick={() => setActivePlatform(pid)}
                  >
                    <Icon className="h-3 w-3" />
                    {platform.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Character counter per platform */}
          <div className="flex flex-wrap gap-3">
            {selectedPlatforms.map((pid) => {
              const platform = PLATFORMS.find((p) => p.id === pid);
              if (!platform) return null;
              const Icon = platform.icon;

              return (
                <div key={pid} className="flex items-center gap-1">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <CharacterCounter content={fullContent} platformId={pid} />
                </div>
              );
            })}
          </div>

          {/* Preview card */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <SocialPostPreview
              content={content}
              hashtags={hashtagArray}
              mediaUrls={mediaUrls}
              platform={displayPlatform}
              accountName={accountName}
              accountImage={accountImage}
            />
          </div>

          {/* Over-limit warnings */}
          {selectedPlatforms.some(
            (pid) => fullContent.length > (CHAR_LIMITS[pid] ?? Infinity),
          ) && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Content exceeds character limit</p>
                <p>
                  {selectedPlatforms
                    .filter(
                      (pid) =>
                        fullContent.length > (CHAR_LIMITS[pid] ?? Infinity),
                    )
                    .map((pid) => {
                      const platform = PLATFORMS.find((p) => p.id === pid);
                      return `${platform?.label ?? pid} (${(fullContent.length - (CHAR_LIMITS[pid] ?? 0)).toLocaleString()} over)`;
                    })
                    .join(', ')}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RealTimePreview;
