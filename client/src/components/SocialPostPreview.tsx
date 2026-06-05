import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube } from "react-icons/si";
import { ThumbsUp, MessageCircle, Share2, Heart, Bookmark, Send, MoreHorizontal, Globe, Image as ImageIcon, Play } from "lucide-react";

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)$/i;

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url);
}

function MediaElement({ url, alt, className }: { url: string; alt: string; className?: string }) {
  if (isVideoUrl(url)) {
    return (
      <div className={`relative ${className || ""}`}>
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white rounded px-1.5 py-0.5 text-xs flex items-center gap-1 pointer-events-none">
          <Play className="h-3 w-3" />
          Video
        </div>
      </div>
    );
  }
  return <img src={url} alt={alt} className={`w-full h-full object-cover ${className || ""}`} />;
}

interface SocialPostPreviewProps {
  content: string;
  hashtags?: string[];
  mediaUrls?: string[];
  platform?: string;
  accountName?: string;
  accountImage?: string;
}

const platformConfig: Record<string, { icon: any; name: string; color: string; bgClass: string }> = {
  facebook: { icon: SiFacebook, name: "Facebook", color: "#1877F2", bgClass: "bg-white dark:bg-[#242526]" },
  instagram: { icon: SiInstagram, name: "Instagram", color: "#E4405F", bgClass: "bg-white dark:bg-black" },
  twitter: { icon: SiX, name: "X", color: "#000000", bgClass: "bg-white dark:bg-black" },
  x: { icon: SiX, name: "X", color: "#000000", bgClass: "bg-white dark:bg-black" },
  linkedin: { icon: SiLinkedin, name: "LinkedIn", color: "#0A66C2", bgClass: "bg-white dark:bg-[#1B1F23]" },
  youtube: { icon: SiYoutube, name: "YouTube", color: "#FF0000", bgClass: "bg-white dark:bg-black" },
};

function formatContentWithHashtags(content: string, hashtags?: string[]) {
  let text = content;
  const hashtagStr = hashtags && hashtags.length > 0
    ? "\n\n" + hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ")
    : "";
  text = text + hashtagStr;

  const parts = text.split(/(#\w+|https?:\/\/\S+|@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return <span key={i} className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline">{part}</span>;
    }
    if (part.startsWith("http")) {
      return <a key={i} href={part} className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{part}</a>;
    }
    if (part.startsWith("@")) {
      return <span key={i} className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function FacebookPreview({ content, hashtags, mediaUrls, accountName, accountImage }: SocialPostPreviewProps) {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[500px] w-full">
      <div className="p-3 flex items-center gap-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={accountImage} />
          <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
            {(accountName || "Page")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{accountName || "Your Page"}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Just now</span>
            <span className="mx-0.5">·</span>
            <Globe className="h-3 w-3" />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="no-default-hover-elevate no-default-active-elevate text-gray-500 h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
          {formatContentWithHashtags(content, hashtags)}
        </p>
      </div>

      {mediaUrls && mediaUrls.length > 0 && (
        <div className="border-t border-b border-gray-200 dark:border-gray-700">
          {mediaUrls.length === 1 ? (
            <MediaElement url={mediaUrls[0]} alt="Post media" className="w-full max-h-[400px]" />
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {mediaUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <MediaElement url={url} alt={`Media ${i + 1}`} className="w-full h-full" />
                  {i === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(!mediaUrls || mediaUrls.length === 0) && (
        <div className="border-t border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#3a3b3c] flex items-center justify-center py-12">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No media attached</p>
          </div>
        </div>
      )}

      <div className="px-3 py-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbsUp className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <Heart className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <span>Preview</span>
        </div>
        <span>0 comments · 0 shares</span>
      </div>

      <div className="px-2 py-1 flex items-center justify-around">
        <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-md text-gray-500 dark:text-gray-400 text-sm font-medium">
          <ThumbsUp className="h-4 w-4" />
          Like
        </button>
        <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-md text-gray-500 dark:text-gray-400 text-sm font-medium">
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-md text-gray-500 dark:text-gray-400 text-sm font-medium">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}

function InstagramPreview({ content, hashtags, mediaUrls, accountName, accountImage }: SocialPostPreviewProps) {
  return (
    <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[500px] w-full">
      <div className="p-3 flex items-center gap-2">
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          <Avatar className="h-8 w-8 border-2 border-white dark:border-black">
            <AvatarImage src={accountImage} />
            <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-sm font-semibold">
              {(accountName || "Page")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{accountName || "your_account"}</p>
        </div>
        <Button variant="ghost" size="icon" className="no-default-hover-elevate no-default-active-elevate text-gray-500 h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {mediaUrls && mediaUrls.length > 0 ? (
        <div className="aspect-square bg-gray-100 dark:bg-gray-900">
          <MediaElement url={mediaUrls[0]} alt="Post media" className="w-full h-full" />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <ImageIcon className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Image preview</p>
          </div>
        </div>
      )}

      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-gray-900 dark:text-gray-100 cursor-pointer" />
          <MessageCircle className="h-6 w-6 text-gray-900 dark:text-gray-100 cursor-pointer" />
          <Send className="h-6 w-6 text-gray-900 dark:text-gray-100 cursor-pointer" />
        </div>
        <Bookmark className="h-6 w-6 text-gray-900 dark:text-gray-100 cursor-pointer" />
      </div>

      <div className="px-3 pb-3">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
          <span className="font-semibold mr-1">{accountName || "your_account"}</span>
          {formatContentWithHashtags(content, hashtags)}
        </p>
      </div>
    </div>
  );
}

function TwitterPreview({ content, hashtags, mediaUrls, accountName, accountImage }: SocialPostPreviewProps) {
  return (
    <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[500px] w-full">
      <div className="p-3 flex gap-2">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={accountImage} />
          <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-sm font-semibold">
            {(accountName || "Page")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{accountName || "Your Account"}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">@{(accountName || "account").toLowerCase().replace(/\s+/g, "")} · now</span>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed mt-0.5">
            {formatContentWithHashtags(content, hashtags)}
          </p>

          {mediaUrls && mediaUrls.length > 0 && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {mediaUrls.length === 1 ? (
                <MediaElement url={mediaUrls[0]} alt="Post media" className="w-full max-h-[300px]" />
              ) : (
                <div className="grid grid-cols-2 gap-0.5">
                  {mediaUrls.slice(0, 4).map((url, i) => (
                    <MediaElement key={i} url={url} alt={`Media ${i + 1}`} className="w-full aspect-square" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-gray-500 dark:text-gray-400 max-w-[350px]">
            <button className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> 0</button>
            <button className="flex items-center gap-1 text-xs"><Share2 className="h-4 w-4" /> 0</button>
            <button className="flex items-center gap-1 text-xs"><Heart className="h-4 w-4" /> 0</button>
            <button className="flex items-center gap-1 text-xs"><Bookmark className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ content, hashtags, mediaUrls, accountName, accountImage }: SocialPostPreviewProps) {
  return (
    <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[500px] w-full">
      <div className="p-3 flex items-start gap-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={accountImage} />
          <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
            {(accountName || "Page")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{accountName || "Your Company"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Just now · <Globe className="inline h-3 w-3" /></p>
        </div>
        <Button variant="ghost" size="icon" className="no-default-hover-elevate no-default-active-elevate text-gray-500 h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
          {formatContentWithHashtags(content, hashtags)}
        </p>
      </div>

      {mediaUrls && mediaUrls.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <MediaElement url={mediaUrls[0]} alt="Post media" className="w-full max-h-[400px]" />
        </div>
      )}

      <div className="px-3 py-2 flex items-center justify-around border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium">
        <button className="flex items-center gap-1.5 py-1"><ThumbsUp className="h-4 w-4" /> Like</button>
        <button className="flex items-center gap-1.5 py-1"><MessageCircle className="h-4 w-4" /> Comment</button>
        <button className="flex items-center gap-1.5 py-1"><Share2 className="h-4 w-4" /> Repost</button>
        <button className="flex items-center gap-1.5 py-1"><Send className="h-4 w-4" /> Send</button>
      </div>
    </div>
  );
}

function YoutubePreview({ content, hashtags, mediaUrls, accountName, accountImage }: SocialPostPreviewProps) {
  return (
    <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-[500px] w-full">
      {mediaUrls && mediaUrls.length > 0 ? (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900">
          <MediaElement url={mediaUrls[0]} alt="Video thumbnail" className="w-full h-full" />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">YouTube Video</p>
          </div>
        </div>
      )}

      <div className="p-3 space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
            {content.split('\n')[0] || "Your Video Title"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 views · Just now</p>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={accountImage} />
            <AvatarFallback className="bg-red-600 text-white text-sm font-semibold">
              {(accountName || "Page")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{accountName || "Your Channel"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">0 subscribers</p>
          </div>
          <Button size="sm" className="bg-red-600 text-white rounded-full px-4">
            Subscribe
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-full font-medium">
            <ThumbsUp className="h-4 w-4" /> 0
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 rounded-full font-medium">
            <Share2 className="h-4 w-4" /> Share
          </Badge>
        </div>

        <div className="bg-gray-100 dark:bg-[#272727] rounded-xl p-3">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {formatContentWithHashtags(content, hashtags)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SocialPostPreview({ content, hashtags, mediaUrls, platform = "facebook", accountName, accountImage }: SocialPostPreviewProps) {
  const [activePlatform, setActivePlatform] = useState(platform);

  const PreviewComponent = {
    facebook: FacebookPreview,
    instagram: InstagramPreview,
    twitter: TwitterPreview,
    x: TwitterPreview,
    linkedin: LinkedInPreview,
    youtube: YoutubePreview,
  }[activePlatform] || FacebookPreview;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Preview as:</span>
        {Object.entries(platformConfig).filter(([key]) => key !== "x").map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = activePlatform === key || (key === "twitter" && activePlatform === "x");
          return (
            <Badge
              key={key}
              variant={isActive ? "default" : "outline"}
              className="cursor-pointer gap-1 text-xs"
              onClick={() => setActivePlatform(key)}
            >
              <Icon className="w-3 h-3" />
              {cfg.name}
            </Badge>
          );
        })}
      </div>
      <div className="flex justify-center">
        <PreviewComponent
          content={content}
          hashtags={hashtags}
          mediaUrls={mediaUrls}
          platform={activePlatform}
          accountName={accountName}
          accountImage={accountImage}
        />
      </div>
    </div>
  );
}

export function MultiPlatformPreview({ content, hashtags, mediaUrls, platforms, accountName, accountImage }: {
  content: string;
  hashtags?: string[];
  mediaUrls?: string[];
  platforms: string[];
  accountName?: string;
  accountImage?: string;
}) {
  if (!content) return null;
  return (
    <SocialPostPreview
      content={content}
      hashtags={hashtags}
      mediaUrls={mediaUrls}
      platform={platforms[0] || "facebook"}
      accountName={accountName}
      accountImage={accountImage}
    />
  );
}