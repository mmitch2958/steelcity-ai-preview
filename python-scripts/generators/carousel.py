"""
Pro Carousel Builder
Creates Instagram carousels with photo backgrounds and professional text overlays.
"""

import os
import requests
from io import BytesIO
from typing import Dict, List, Optional, Tuple

try:
    from PIL import Image, ImageDraw, ImageFont, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class ProCarouselBuilder:
    """Builds professional Instagram carousels with photo backgrounds."""
    
    UNSPLASH_API = "https://unsplash.com/napi/search/photos"
    HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
    
    DIMENSIONS = {
        "instagram_square": (1080, 1080),
        "instagram_portrait": (1080, 1350),
        "instagram_story": (1080, 1920),
    }
    
    STYLE_PRESETS = {
        "lifestyle": {
            "treatment": "warm",
            "overlay_opacity": 0.65,
            "accent_color": (255, 215, 0),  # Gold
        },
        "professional": {
            "treatment": "cool",
            "overlay_opacity": 0.7,
            "accent_color": (59, 130, 246),  # Blue
        },
        "bold": {
            "treatment": "vibrant",
            "overlay_opacity": 0.6,
            "accent_color": (239, 68, 68),  # Red
        },
        "minimal": {
            "treatment": "muted",
            "overlay_opacity": 0.75,
            "accent_color": (255, 255, 255),  # White
        }
    }
    
    def __init__(self):
        if not PIL_AVAILABLE:
            raise ImportError("Pillow is required. Install with: pip install Pillow")
    
    def get_font(self, size: int, bold: bool = False) -> ImageFont:
        """Get a font with fallbacks."""
        paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold 
                else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold 
                else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "C:/Windows/Fonts/arial.ttf",
        ]
        for p in paths:
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except:
                    continue
        return ImageFont.load_default()
    
    def fetch_image(self, query: str, width: int = 1080, height: int = 1350) -> Optional[Image.Image]:
        """Fetch a background image from Unsplash."""
        try:
            params = {
                "query": query, 
                "per_page": 3, 
                "orientation": "portrait" if height > width else "landscape"
            }
            r = requests.get(self.UNSPLASH_API, params=params, headers=self.HEADERS, timeout=10)
            
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    url = results[0].get("urls", {}).get("regular")
                    if url:
                        img_r = requests.get(url, headers=self.HEADERS, timeout=30)
                        if img_r.status_code == 200:
                            return Image.open(BytesIO(img_r.content))
        except Exception as e:
            print(f"   Warning: Could not fetch image: {e}")
        return None
    
    def resize_crop(self, img: Image.Image, size: Tuple[int, int]) -> Image.Image:
        """Resize and crop image to target size, keeping center."""
        tw, th = size
        iw, ih = img.size
        tr = tw / th
        ir = iw / ih
        
        if ir > tr:
            nw = int(ih * tr)
            left = (iw - nw) // 2
            img = img.crop((left, 0, left + nw, ih))
        else:
            nh = int(iw / tr)
            top = (ih - nh) // 2
            img = img.crop((0, top, iw, top + nh))
        
        return img.resize(size, Image.Resampling.LANCZOS)
    
    def apply_treatment(self, img: Image.Image, treatment: str) -> Image.Image:
        """Apply color treatment to image."""
        if treatment == "warm":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.1)
        elif treatment == "cool":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(0.9)
        elif treatment == "muted":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(0.7)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
        elif treatment == "vibrant":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.3)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
        return img
    
    def add_gradient(self, img: Image.Image, opacity: float = 0.65) -> Image.Image:
        """Add gradient overlay for text readability."""
        w, h = img.size
        overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        for y in range(h):
            if y > h * 0.3:
                ratio = (y - h * 0.3) / (h * 0.7)
                alpha = int(255 * ratio * opacity)
                draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        
        img = img.convert('RGBA')
        return Image.alpha_composite(img, overlay).convert('RGB')
    
    def draw_shadow_text(self, draw: ImageDraw, pos: Tuple[int, int], text: str, 
                         font: ImageFont, fill: Tuple = (255, 255, 255), shadow: int = 2):
        """Draw text with shadow for readability."""
        x, y = pos
        draw.text((x + shadow, y + shadow), text, font=font, fill=(0, 0, 0, 120))
        draw.text((x, y), text, font=font, fill=fill)
    
    def wrap_text(self, draw: ImageDraw, text: str, font: ImageFont, max_width: int) -> List[str]:
        """Wrap text to fit within max width."""
        words = text.split()
        lines = []
        current = ""
        
        for word in words:
            test = f"{current} {word}".strip()
            bbox = draw.textbbox((0, 0), test, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        
        return lines
    
    def create_slide(self, data: Dict, num: int, total: int, 
                     bg_img: Optional[Image.Image], size: Tuple[int, int],
                     style_preset: Dict) -> Image.Image:
        """Create a single carousel slide."""
        
        slide_type = data.get("type", "content")
        accent = style_preset.get("accent_color", (255, 215, 0))
        
        # Background
        if bg_img:
            img = self.resize_crop(bg_img.copy(), size)
            img = self.apply_treatment(img, style_preset.get("treatment", "warm"))
            img = self.add_gradient(img, style_preset.get("overlay_opacity", 0.65))
        else:
            img = Image.new('RGB', size, (30, 30, 50))
        
        draw = ImageDraw.Draw(img)
        
        # Slide indicator dots
        if total > 1:
            dot_y = size[1] - 50
            spacing = 16
            start_x = (size[0] - (total - 1) * spacing) // 2
            for i in range(total):
                x = start_x + i * spacing
                color = (255, 255, 255) if i == num else (100, 100, 100)
                r = 5 if i == num else 4
                draw.ellipse([x - r, dot_y - r, x + r, dot_y + r], fill=color)
        
        # Draw content based on type
        if slide_type == "cover":
            self._draw_cover(draw, data, size, accent)
        elif slide_type == "stat":
            self._draw_stat(draw, data, size, accent)
        elif slide_type == "list":
            self._draw_list(draw, data, size, accent)
        elif slide_type == "warning":
            self._draw_warning(draw, data, size)
        elif slide_type == "cta":
            self._draw_cta(draw, data, size)
        elif slide_type == "content":
            self._draw_content(draw, data, size, accent)
        
        return img
    
    def _draw_cover(self, draw: ImageDraw, data: Dict, size: Tuple[int, int], accent: Tuple):
        """Draw cover slide."""
        title = data.get("title", "").upper()
        subtitle = data.get("subtitle", "")
        
        title_font = self.get_font(int(size[0] * 0.085), bold=True)
        sub_font = self.get_font(int(size[0] * 0.038))
        
        lines = self.wrap_text(draw, title, title_font, size[0] - 140)
        line_h = int(size[0] * 0.1)
        start_y = (size[1] - len(lines) * line_h) // 2 - 30
        
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=title_font)
            x = (size[0] - (bbox[2] - bbox[0])) // 2
            self.draw_shadow_text(draw, (x, start_y + i * line_h), line, title_font)
        
        if subtitle:
            bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
            x = (size[0] - (bbox[2] - bbox[0])) // 2
            self.draw_shadow_text(draw, (x, start_y + len(lines) * line_h + 25), 
                                 subtitle, sub_font, (220, 220, 220))
        
        swipe_font = self.get_font(26)
        self.draw_shadow_text(draw, ((size[0] - 100) // 2, size[1] - 100), 
                             "SWIPE →", swipe_font, (200, 200, 200))
    
    def _draw_stat(self, draw: ImageDraw, data: Dict, size: Tuple[int, int], accent: Tuple):
        """Draw stat slide."""
        stat = data.get("stat", "")
        label = data.get("label", "")
        detail = data.get("detail", "")
        icon = data.get("icon", "")
        
        stat_font = self.get_font(int(size[0] * 0.16), bold=True)
        label_font = self.get_font(int(size[0] * 0.045), bold=True)
        detail_font = self.get_font(int(size[0] * 0.032))
        
        cy = size[1] // 2
        
        if icon:
            icon_font = self.get_font(60)
            bbox = draw.textbbox((0, 0), icon, font=icon_font)
            draw.text(((size[0] - (bbox[2] - bbox[0])) // 2, cy - 180), icon, font=icon_font)
        
        bbox = draw.textbbox((0, 0), stat, font=stat_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, cy - 80), 
                             stat, stat_font, shadow=3)
        
        bbox = draw.textbbox((0, 0), label, font=label_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, cy + 80), 
                             label, label_font)
        
        if detail:
            bbox = draw.textbbox((0, 0), detail, font=detail_font)
            self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, cy + 140), 
                                 detail, detail_font, (200, 200, 200))
    
    def _draw_list(self, draw: ImageDraw, data: Dict, size: Tuple[int, int], accent: Tuple):
        """Draw list slide."""
        title = data.get("title", "")
        items = data.get("items", [])
        
        title_font = self.get_font(int(size[0] * 0.055), bold=True)
        item_font = self.get_font(int(size[0] * 0.036))
        
        bbox = draw.textbbox((0, 0), title, font=title_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, 180), title, title_font)
        
        draw.line([(80, 260), (size[0] - 80, 260)], fill=(255, 255, 255, 80), width=1)
        
        y = 320
        for item in items[:6]:
            draw.ellipse([80, y + 12, 90, y + 22], fill=accent)
            self.draw_shadow_text(draw, (110, y), item, item_font)
            y += int(size[0] * 0.09)
    
    def _draw_warning(self, draw: ImageDraw, data: Dict, size: Tuple[int, int]):
        """Draw warning slide."""
        title = data.get("title", "")
        items = data.get("items", [])
        
        title_font = self.get_font(int(size[0] * 0.05), bold=True)
        item_font = self.get_font(int(size[0] * 0.034))
        
        bbox = draw.textbbox((0, 0), title, font=title_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, 200), 
                             title, title_font, (255, 200, 100))
        
        y = 340
        for item in items[:6]:
            draw.text((80, y), "•", font=item_font, fill=(255, 200, 100))
            self.draw_shadow_text(draw, (110, y), item, item_font, (255, 230, 200))
            y += int(size[0] * 0.09)
    
    def _draw_cta(self, draw: ImageDraw, data: Dict, size: Tuple[int, int]):
        """Draw CTA slide."""
        title = data.get("title", "")
        subtitle = data.get("subtitle", "")
        
        title_font = self.get_font(int(size[0] * 0.07), bold=True)
        sub_font = self.get_font(int(size[0] * 0.04))
        
        cy = size[1] // 2
        
        bbox = draw.textbbox((0, 0), title, font=title_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, cy - 50), title, title_font)
        
        bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, cy + 30), 
                             subtitle, sub_font, (220, 220, 220))
        
        icons = "📌  👆  💬"
        icon_font = self.get_font(50)
        bbox = draw.textbbox((0, 0), icons, font=icon_font)
        draw.text(((size[0] - (bbox[2] - bbox[0])) // 2, cy + 100), icons, font=icon_font)
    
    def _draw_content(self, draw: ImageDraw, data: Dict, size: Tuple[int, int], accent: Tuple):
        """Draw content slide."""
        title = data.get("title", "")
        body = data.get("body", "")
        
        title_font = self.get_font(int(size[0] * 0.055), bold=True)
        body_font = self.get_font(int(size[0] * 0.036))
        
        bbox = draw.textbbox((0, 0), title, font=title_font)
        self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, 200), title, title_font)
        
        lines = self.wrap_text(draw, body, body_font, size[0] - 160)
        y = 340
        line_h = int(size[0] * 0.055)
        
        for line in lines[:12]:
            bbox = draw.textbbox((0, 0), line, font=body_font)
            self.draw_shadow_text(draw, ((size[0] - (bbox[2] - bbox[0])) // 2, y), 
                                 line, body_font, (230, 230, 230))
            y += line_h
    
    def generate_config(self, topic: str, style: str, research_data: Dict = None) -> Dict:
        """Generate carousel configuration from topic."""
        
        # Default background queries based on topic keywords
        topic_lower = topic.lower()
        
        if any(word in topic_lower for word in ["surf", "beach", "ocean", "wave"]):
            bg_queries = [
                f"{topic} sunset ocean",
                "surfer riding wave barrel",
                "beach sunrise california coast",
                "ocean waves closeup power",
                "surfboard beach sand lifestyle",
                "pacific coast scenic",
                "surfer silhouette golden hour",
                "california beach palm trees"
            ]
        elif any(word in topic_lower for word in ["real estate", "home", "house", "property"]):
            bg_queries = [
                "beautiful suburban home exterior",
                "luxury kitchen interior modern",
                "family neighborhood tree lined",
                "modern living room fireplace",
                "suburban neighborhood aerial",
                "beautiful backyard patio",
                "cozy home interior warm",
                "real estate open house"
            ]
        else:
            bg_queries = [
                f"{topic} lifestyle",
                f"{topic} aesthetic",
                f"{topic} professional",
                f"{topic} modern",
                f"{topic} beautiful",
                "lifestyle photography",
                "modern aesthetic",
                "professional setting"
            ]
        
        # Generate default slides
        slides = [
            {
                "type": "cover",
                "title": topic,
                "subtitle": "Your Complete Guide"
            },
            {
                "type": "stat",
                "stat": "KEY STAT",
                "label": "Important Metric",
                "detail": "Supporting detail here",
                "icon": "📊"
            },
            {
                "type": "list",
                "title": "🎯 Key Points",
                "items": [
                    "First key point here",
                    "Second key point here",
                    "Third key point here",
                    "Fourth key point here"
                ]
            },
            {
                "type": "stat",
                "stat": "2ND STAT",
                "label": "Another Metric",
                "detail": "More details",
                "icon": "⚡"
            },
            {
                "type": "list",
                "title": "✨ Benefits",
                "items": [
                    "First benefit",
                    "Second benefit",
                    "Third benefit",
                    "Fourth benefit"
                ]
            },
            {
                "type": "warning",
                "title": "⚠️ Things to Know",
                "items": [
                    "Important consideration one",
                    "Important consideration two",
                    "Important consideration three"
                ]
            },
            {
                "type": "cta",
                "title": "Save This Post 📌",
                "subtitle": "Follow for more insights"
            }
        ]
        
        return {
            "topic": topic,
            "platform": "instagram_portrait",
            "style": style,
            "background_queries": bg_queries,
            "slides": slides
        }
    
    def build(self, config: Dict, output_dir: str = "output/carousel") -> List[str]:
        """Build complete carousel from config."""
        
        os.makedirs(output_dir, exist_ok=True)
        
        slides = config.get("slides", [])
        bg_queries = config.get("background_queries", [])
        style_name = config.get("style", "lifestyle")
        style_preset = self.STYLE_PRESETS.get(style_name, self.STYLE_PRESETS["lifestyle"])
        platform = config.get("platform", "instagram_portrait")
        size = self.DIMENSIONS.get(platform, (1080, 1350))
        
        # Fetch backgrounds
        print(f"   Fetching {len(bg_queries)} background images...")
        bg_images = []
        for q in bg_queries[:len(slides) + 2]:
            print(f"   → {q[:40]}...")
            img = self.fetch_image(q, size[0], size[1])
            if img:
                bg_images.append(img)
        
        print(f"   ✓ Found {len(bg_images)} images")
        
        # Build slides
        output_files = []
        for i, slide_data in enumerate(slides):
            print(f"   Creating slide {i + 1}/{len(slides)}: {slide_data.get('type')}")
            bg = bg_images[i % len(bg_images)] if bg_images else None
            img = self.create_slide(slide_data, i, len(slides), bg, size, style_preset)
            
            filepath = f"{output_dir}/slide_{i + 1:02d}.png"
            img.save(filepath, quality=95)
            output_files.append(filepath)
        
        return output_files
