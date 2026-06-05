"""
Research Agent
Generates hooks, hashtags, and content angles from topics.
"""

from typing import Dict, List
import re


class ResearchAgent:
    """Analyzes topics and generates content research."""
    
    HOOK_FORMULAS = {
        "curiosity": [
            "I discovered something about {topic} that changed everything",
            "{topic} isn't what you think it is",
            "The truth about {topic} that nobody talks about"
        ],
        "contrarian": [
            "Unpopular opinion: {topic} is overrated... unless you do this",
            "Everyone's wrong about {topic}. Here's why.",
            "Stop doing {topic} the wrong way"
        ],
        "pov": [
            "POV: You just discovered {topic}",
            "POV: You're trying {topic} for the first time",
            "POV: You finally understand {topic}"
        ],
        "list": [
            "5 things I wish I knew about {topic}",
            "The complete guide to {topic}",
            "{topic}: Everything you need to know"
        ],
        "story": [
            "I tried {topic} and here's what happened",
            "My experience with {topic} changed my perspective",
            "What nobody tells you about {topic}"
        ],
        "question": [
            "Why is nobody talking about {topic}?",
            "Is {topic} worth it in 2026?",
            "What makes {topic} so special?"
        ]
    }
    
    HASHTAG_TEMPLATES = {
        "twitter": {
            "count": 3,
            "style": "broad"
        },
        "instagram": {
            "count": 10,
            "style": "mixed"
        },
        "tiktok": {
            "count": 5,
            "style": "trending"
        },
        "linkedin": {
            "count": 5,
            "style": "professional"
        },
        "youtube": {
            "count": 5,
            "style": "searchable"
        }
    }
    
    def analyze(self, topic: str) -> Dict:
        """Analyze topic and generate research data."""
        
        # Extract key terms
        keywords = self._extract_keywords(topic)
        
        # Generate hooks
        hooks = self._generate_hooks(topic)
        
        # Generate hashtags
        hashtags = self._generate_hashtags(topic, keywords)
        
        # Generate content angles
        angles = self._generate_angles(topic)
        
        return {
            "topic": topic,
            "keywords": keywords,
            "hooks": hooks,
            "hashtags": hashtags,
            "angles": angles
        }
    
    def _extract_keywords(self, topic: str) -> List[str]:
        """Extract keywords from topic."""
        
        # Remove common words
        stop_words = {'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are'}
        words = topic.lower().split()
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        
        return keywords
    
    def _generate_hooks(self, topic: str) -> List[str]:
        """Generate hook variations."""
        
        hooks = []
        
        for formula_type, templates in self.HOOK_FORMULAS.items():
            for template in templates:
                hook = template.format(topic=topic)
                hooks.append(hook)
        
        # Score and sort hooks (simple heuristic)
        scored_hooks = []
        for hook in hooks:
            score = self._score_hook(hook)
            scored_hooks.append((hook, score))
        
        scored_hooks.sort(key=lambda x: x[1], reverse=True)
        
        return [h[0] for h in scored_hooks[:10]]
    
    def _score_hook(self, hook: str) -> int:
        """Score a hook based on engagement factors."""
        
        score = 50  # Base score
        
        # Length bonus (shorter is better for hooks)
        if len(hook) < 50:
            score += 10
        elif len(hook) < 80:
            score += 5
        
        # Emotional triggers
        emotional_words = ['secret', 'truth', 'discover', 'change', 'amazing', 'incredible']
        for word in emotional_words:
            if word in hook.lower():
                score += 5
        
        # Questions get bonus
        if '?' in hook:
            score += 8
        
        # Numbers get bonus
        if any(char.isdigit() for char in hook):
            score += 7
        
        # POV format bonus
        if hook.lower().startswith('pov'):
            score += 10
        
        return score
    
    def _generate_hashtags(self, topic: str, keywords: List[str]) -> Dict[str, List[str]]:
        """Generate platform-specific hashtags."""
        
        hashtags = {}
        
        # Base hashtags from topic
        base_tags = self._create_base_hashtags(topic, keywords)
        
        for platform, config in self.HASHTAG_TEMPLATES.items():
            count = config["count"]
            style = config["style"]
            
            platform_tags = self._filter_hashtags_for_platform(base_tags, style, count)
            hashtags[platform] = platform_tags
        
        return hashtags
    
    def _create_base_hashtags(self, topic: str, keywords: List[str]) -> List[str]:
        """Create base hashtag pool."""
        
        tags = []
        
        # From keywords
        for kw in keywords:
            tags.append(kw.title().replace(" ", ""))
        
        # Combined keywords
        if len(keywords) >= 2:
            tags.append("".join([k.title() for k in keywords[:2]]))
        
        # Common suffixes
        suffixes = ["Life", "Tips", "Guide", "2026", "Goals"]
        for kw in keywords[:2]:
            for suffix in suffixes:
                tags.append(f"{kw.title()}{suffix}")
        
        # Topic variations
        topic_clean = re.sub(r'[^a-zA-Z0-9\s]', '', topic)
        topic_tag = topic_clean.title().replace(" ", "")
        tags.append(topic_tag)
        
        return list(set(tags))
    
    def _filter_hashtags_for_platform(self, tags: List[str], style: str, count: int) -> List[str]:
        """Filter hashtags for specific platform style."""
        
        filtered = tags[:count]
        
        # Add platform-specific tags
        if style == "trending":
            filtered.extend(["fyp", "viral", "trending"])
        elif style == "professional":
            filtered.extend(["Business", "Professional", "Growth"])
        elif style == "broad":
            filtered = filtered[:count]  # Keep it simple for Twitter
        
        return filtered[:count]
    
    def _generate_angles(self, topic: str) -> List[Dict]:
        """Generate content angles."""
        
        return [
            {
                "type": "educational",
                "title": f"The Complete Guide to {topic}",
                "description": "Comprehensive breakdown with actionable tips"
            },
            {
                "type": "story",
                "title": f"My Experience with {topic}",
                "description": "Personal narrative with lessons learned"
            },
            {
                "type": "listicle",
                "title": f"Top 10 Things to Know About {topic}",
                "description": "Quick, scannable format"
            },
            {
                "type": "contrarian",
                "title": f"Why Everyone's Wrong About {topic}",
                "description": "Challenge common assumptions"
            },
            {
                "type": "comparison",
                "title": f"{topic}: Expectations vs Reality",
                "description": "Before/after or myth vs truth format"
            }
        ]
