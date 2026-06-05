# Social Media Content Generator

Generate complete social media content packages including Instagram carousels with photo backgrounds, platform-specific copy, hashtags, and AI image prompts.

## Features

- 🎠 **Pro Carousels** - Instagram carousels with real photo backgrounds from Unsplash
- ✍️ **Multi-Platform Copy** - Twitter threads, Instagram captions, TikTok scripts, LinkedIn posts, YouTube descriptions
- #️⃣ **Smart Hashtags** - Platform-optimized hashtag sets
- 🔥 **Hook Generator** - Engagement-optimized hooks and openers
- 🎨 **AI Prompts** - Midjourney/DALL-E ready prompts
- 📷 **Media Sourcing** - Stock images and videos from Unsplash & Pexels

## Installation

```bash
# Clone or copy the files
cd social-media-agent

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

```bash
# Generate content for a topic
python app.py --topic "California surfing in March" --style lifestyle --output ./output

# Use a config file
python app.py --config config.json
```

## Output Structure

```
output/
├── carousel/
│   ├── slide_01.png
│   ├── slide_02.png
│   ├── ...
│   └── slide_07.png
├── copy_package.md
└── results.json
```

## Configuration

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--topic` | Content topic (required) | - |
| `--style` | Visual style | `lifestyle` |
| `--output` | Output directory | `output` |
| `--config` | Load from JSON config | - |

### Style Presets

| Style | Description | Best For |
|-------|-------------|----------|
| `lifestyle` | Warm tones, gold accents | Travel, wellness, real estate |
| `professional` | Cool tones, blue accents | B2B, tech, finance |
| `bold` | Vibrant colors, red accents | Sports, entertainment |
| `minimal` | Muted tones, white accents | Fashion, luxury |

### Config File Example

```json
{
  "topic": "California Surfing March 2026",
  "style": "lifestyle",
  "output": "./my-output",
  "carousel": {
    "platform": "instagram_portrait",
    "slides": [
      {
        "type": "cover",
        "title": "California Surfing in March",
        "subtitle": "Your Complete 2026 Guide"
      },
      {
        "type": "stat",
        "stat": "57-60°F",
        "label": "Water Temperature",
        "detail": "4/3mm wetsuit recommended",
        "icon": "🌊"
      },
      {
        "type": "list",
        "title": "🏄 Best March Spots",
        "items": [
          "Trestles – World-class performance",
          "Malibu – Classic longboard point",
          "Steamer Lane – Santa Cruz legend"
        ]
      }
    ],
    "background_queries": [
      "california surfing sunset",
      "surfer riding wave",
      "beach sunrise coast"
    ]
  }
}
```

## Slide Types

### Cover
Title slide with main topic and subtitle.
```json
{
  "type": "cover",
  "title": "Your Title Here",
  "subtitle": "Supporting subtitle"
}
```

### Stat
Large statistic with label and supporting detail.
```json
{
  "type": "stat",
  "stat": "$286K",
  "label": "Median Price",
  "detail": "Up 7.6% YoY",
  "icon": "🏠"
}
```

### List
Bullet point list with title.
```json
{
  "type": "list",
  "title": "🎯 Key Points",
  "items": [
    "First point",
    "Second point",
    "Third point"
  ]
}
```

### Warning
Caution/honest truth slide with amber styling.
```json
{
  "type": "warning",
  "title": "⚠️ Things to Know",
  "items": [
    "Consideration one",
    "Consideration two"
  ]
}
```

### CTA
Call-to-action slide.
```json
{
  "type": "cta",
  "title": "Save This Post 📌",
  "subtitle": "Follow for more content"
}
```

### Content
General text content slide.
```json
{
  "type": "content",
  "title": "The Details",
  "body": "Your detailed text content here..."
}
```

## API Keys (Optional)

For additional media sources, set environment variables:

```bash
# Pexels API (free) - for more images + video
export PEXELS_API_KEY="your_key_here"
```

Get a free Pexels API key at: https://www.pexels.com/api/

## Using Individual Modules

### Carousel Builder

```python
from generators import ProCarouselBuilder

builder = ProCarouselBuilder()

config = {
    "topic": "My Topic",
    "style": "lifestyle",
    "platform": "instagram_portrait",
    "slides": [...],
    "background_queries": [...]
}

files = builder.build(config, "output/carousel")
```

### Copy Generator

```python
from generators import CopyGenerator, ResearchAgent

research = ResearchAgent()
data = research.analyze("My Topic")

copy = CopyGenerator()
package = copy.generate_all("My Topic", data)
```

### Media Sourcer

```python
from generators import ImageSourcer, VideoSourcer

images = ImageSourcer()
results = images.search("california beach", count=10)

videos = VideoSourcer(pexels_api_key="your_key")
results = videos.search("surfing waves", count=5)
```

## Integration Examples

### Flask API

```python
from flask import Flask, request, jsonify
from generators import ProCarouselBuilder, CopyGenerator, ResearchAgent

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    topic = data.get('topic')
    style = data.get('style', 'lifestyle')
    
    # Research
    research = ResearchAgent()
    research_data = research.analyze(topic)
    
    # Copy
    copy_gen = CopyGenerator()
    copy_package = copy_gen.generate_all(topic, research_data)
    
    # Carousel
    carousel = ProCarouselBuilder()
    config = carousel.generate_config(topic, style, research_data)
    files = carousel.build(config, f"output/{topic}")
    
    return jsonify({
        "copy": copy_package,
        "carousel_files": files,
        "research": research_data
    })
```

### FastAPI

```python
from fastapi import FastAPI
from pydantic import BaseModel
from generators import ProCarouselBuilder, CopyGenerator, ResearchAgent

app = FastAPI()

class ContentRequest(BaseModel):
    topic: str
    style: str = "lifestyle"

@app.post("/generate")
async def generate(request: ContentRequest):
    research = ResearchAgent()
    data = research.analyze(request.topic)
    
    copy = CopyGenerator()
    package = copy.generate_all(request.topic, data)
    
    return {"copy": package, "research": data}
```

## File Structure

```
social-media-agent/
├── app.py                    # Main entry point
├── requirements.txt          # Dependencies
├── README.md                 # Documentation
├── generators/
│   ├── __init__.py
│   ├── carousel.py           # Pro carousel builder
│   ├── copy.py               # Copy generator
│   ├── research.py           # Research agent
│   └── media.py              # Image/video sourcing
└── output/                   # Generated content
```

## License

MIT License - Use freely in your projects.

## Credits

- Background images from [Unsplash](https://unsplash.com)
- Additional media from [Pexels](https://pexels.com)
