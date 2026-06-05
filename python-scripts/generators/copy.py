"""
Copy Generator
Generates social media copy for all platforms.
"""

from typing import Dict, List
from datetime import datetime


class CopyGenerator:
    """Generates platform-specific social media copy."""
    
    PLATFORM_LIMITS = {
        "twitter": {"chars": 280, "hashtags": 3},
        "instagram": {"chars": 2200, "hashtags": 10},
        "tiktok": {"chars": 150, "hashtags": 5},
        "linkedin": {"chars": 3000, "hashtags": 5},
        "youtube": {"title": 100, "description": 5000},
        "facebook": {"chars": 63206, "hashtags": 3}
    }
    
    CTA_TEMPLATES = {
        "engagement": [
            "Drop a {emoji} if this resonates",
            "Comment below with your thoughts",
            "Tag someone who needs to see this"
        ],
        "save": [
            "Save this for later 📌",
            "Bookmark this post",
            "Save this guide for your trip"
        ],
        "follow": [
            "Follow for more {topic} content",
            "Follow for daily {topic} tips",
            "Hit follow for more insights"
        ],
        "share": [
            "Share this with a friend who needs it",
            "Send this to someone planning a trip",
            "Tag a friend in the comments"
        ]
    }
    
    def generate_twitter_thread(self, topic: str, data: Dict) -> str:
        """Generate a Twitter thread."""
        
        hooks = data.get("hooks", [])
        hook = hooks[0] if hooks else f"Let's talk about {topic}"
        
        thread = f"""## 🐦 Twitter/X Thread

**Tweet 1 (Hook)**
{hook}

Here's what you need to know 🧵

**Tweet 2 (Setup)**
The secret that most people miss:

[Add your main insight here based on research]

**Tweet 3 (Data)**
📊 The numbers:
• Key stat 1
• Key stat 2  
• Key stat 3

This is why it matters.

**Tweet 4 (Details)**
Breaking it down further:

[Add supporting points]

**Tweet 5 (Honest Take)**
⚠️ The honest truth though:
• Consideration 1
• Consideration 2
• Consideration 3

Nothing's perfect.

**Tweet 6 (CTA)**
But here's the thing:

[Summary insight]

Save this thread. Follow for more.

{self._format_hashtags(data.get('hashtags', {}).get('twitter', []))}
"""
        return thread
    
    def generate_instagram_caption(self, topic: str, data: Dict) -> str:
        """Generate Instagram caption."""
        
        hooks = data.get("hooks", [])
        hook = hooks[0] if hooks else topic
        hashtags = data.get("hashtags", {}).get("instagram", [])
        
        caption = f"""## 📸 Instagram Caption

{hook}

Here's everything you need to know 👇

**THE OVERVIEW**
[Add main overview here]

**THE DETAILS**
🎯 Point 1
🎯 Point 2
🎯 Point 3
🎯 Point 4

**THE PLAY**
[Add actionable advice]

**THE GEAR/PREP**
• Item 1
• Item 2
• Item 3

**THE VIBE**
[Add emotional/lifestyle angle]

Save this for your next trip 📌

.
.
.
{self._format_hashtags(hashtags)}
"""
        return caption
    
    def generate_tiktok_script(self, topic: str, data: Dict) -> str:
        """Generate TikTok script with timestamps."""
        
        hooks = data.get("hooks", [])
        hook = hooks[0] if hooks else f"POV: You just discovered {topic}"
        hashtags = data.get("hashtags", {}).get("tiktok", [])
        
        script = f"""## 🎵 TikTok Script

**[HOOK] 0:00 - 0:03**
"{hook}"
*Text overlay: {topic} 🎯*

**[SETUP] 0:03 - 0:08**
"Here's what nobody tells you about {topic}"
*B-roll: Relevant visuals*

**[POINT 1] 0:08 - 0:15**
"First thing you need to know..."
*Text overlay: Key Point 1*

**[POINT 2] 0:15 - 0:25**
"And here's where it gets interesting..."
*Text overlay: Key Point 2*

**[POINT 3] 0:25 - 0:35**
"But the real secret is..."
*Text overlay: Key Point 3*

**[CTA] 0:35 - 0:40**
"Save this for later. Follow for more."
*Text overlay: Follow for more 🎯*

**Caption:**
{hook} {self._format_hashtags(hashtags)}
"""
        return script
    
    def generate_linkedin_post(self, topic: str, data: Dict) -> str:
        """Generate LinkedIn post."""
        
        hashtags = data.get("hashtags", {}).get("linkedin", [])
        
        post = f"""## 💼 LinkedIn Post

The best opportunities often exist where others aren't looking.

Case in point: {topic}.

Here's what the data shows:

📊 **The Reality:**
• Key insight 1
• Key insight 2
• Key insight 3

🎯 **What This Means:**
[Add professional insight]

⚡ **The Trade-offs:**
[Add balanced perspective]

Whether it's {topic.split()[0].lower()}, business, or life – the best opportunities often exist in the spaces others overlook.

Sometimes showing up when others don't is the entire strategy.

{self._format_hashtags(hashtags)}
"""
        return post
    
    def generate_youtube_content(self, topic: str, data: Dict) -> str:
        """Generate YouTube title, description, and timestamps."""
        
        content = f"""## 📺 YouTube

### Title Options
1. "Why {topic} is More Important Than You Think (Complete Guide)"
2. "{topic}: The Complete Guide for 2026"
3. "I Tried {topic}. Here's What I Learned."

### Description
Planning to explore {topic}? This might be exactly what you need.

In this video, I break down everything you need to know about {topic} – from basics to advanced tips.

🎯 WHAT WE COVER:
0:00 - Introduction
1:30 - Overview & Context
3:00 - Key Details
6:00 - Deep Dive
8:00 - Practical Tips
10:00 - Common Mistakes
12:00 - Final Thoughts

📍 KEY POINTS:
• Point 1
• Point 2
• Point 3

🔔 Subscribe for more content like this!

#Topic #Guide #Tips

### Thumbnail Concept
Split image or reaction face with bold text overlay
Text: "TOPIC TITLE" with contrasting elements
"""
        return content
    
    def _format_hashtags(self, hashtags: List[str]) -> str:
        """Format hashtags for display."""
        if not hashtags:
            return ""
        return " ".join([f"#{h}" if not h.startswith("#") else h for h in hashtags])
    
    def generate_all(self, topic: str, research_data: Dict) -> str:
        """Generate complete copy package."""
        
        output = f"""# {topic} - Complete Copy Package

*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*

---

## 📊 Research Summary

**Topic:** {topic}

**Top Hooks:**
"""
        for i, hook in enumerate(research_data.get("hooks", [])[:5], 1):
            output += f"{i}. {hook}\n"
        
        output += """
---

## #️⃣ Hashtags by Platform

"""
        for platform, tags in research_data.get("hashtags", {}).items():
            output += f"### {platform.title()}\n```\n{self._format_hashtags(tags)}\n```\n\n"
        
        output += "---\n\n"
        output += self.generate_twitter_thread(topic, research_data)
        output += "\n---\n\n"
        output += self.generate_instagram_caption(topic, research_data)
        output += "\n---\n\n"
        output += self.generate_tiktok_script(topic, research_data)
        output += "\n---\n\n"
        output += self.generate_linkedin_post(topic, research_data)
        output += "\n---\n\n"
        output += self.generate_youtube_content(topic, research_data)
        output += "\n---\n\n"
        output += self._generate_ai_prompts(topic)
        output += f"\n\n---\n\n*Generated by Social Media Content Generator*"
        
        return output
    
    def _generate_ai_prompts(self, topic: str) -> str:
        """Generate AI image prompts."""
        
        return f"""## 🎨 AI Image Prompts (Midjourney/DALL-E)

### Hero Shot
```
{topic} professional photography, golden hour lighting, lifestyle aesthetic, high quality, 8K resolution --ar 4:5 --v 6 --q 2
```

### Lifestyle Shot
```
{topic} candid moment, natural lighting, authentic feel, lifestyle photography --ar 4:5 --v 6 --q 2
```

### Detail Shot
```
{topic} close-up details, professional product photography, clean background --ar 1:1 --v 6 --q 2
```

### Scenic Shot
```
{topic} wide angle, dramatic landscape, cinematic photography, epic lighting --ar 16:9 --v 6 --q 2
```
"""
