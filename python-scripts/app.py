#!/usr/bin/env python3
"""
Social Media Content Generator
Generates complete social media content packages with carousels, copy, and media.

Usage:
    python app.py --topic "California surfing March 2026" --style lifestyle
    python app.py --config config.json
"""

import argparse
import json
import os
from datetime import datetime

from generators.carousel import ProCarouselBuilder
from generators.copy import CopyGenerator
from generators.research import ResearchAgent


def run_pipeline(topic: str, style: str = "lifestyle", output_dir: str = "output", json_output: bool = False):
    """Run the complete content generation pipeline."""
    
    if not json_output:
        print("\n" + "=" * 60)
        print("🚀 SOCIAL MEDIA CONTENT GENERATOR")
        print("=" * 60)
        print(f"   Topic: {topic}")
        print(f"   Style: {style}")
        print(f"   Output: {output_dir}")
        print("=" * 60 + "\n")
    
    os.makedirs(output_dir, exist_ok=True)
    
    results = {
        "topic": topic,
        "style": style,
        "generated_at": datetime.now().isoformat(),
        "files": []
    }
    
    # Step 1: Research
    if not json_output:
        print("📊 RESEARCH PHASE")
        print("-" * 40)
    research = ResearchAgent()
    research_data = research.analyze(topic)
    if not json_output:
        print(f"   ✓ Generated {len(research_data.get('hooks', []))} hooks")
        print(f"   ✓ Generated hashtag sets for {len(research_data.get('hashtags', {}))} platforms")
        print()
    
    # Step 2: Copy Generation
    if not json_output:
        print("✍️  COPY GENERATION")
        print("-" * 40)
    copy_gen = CopyGenerator()
    copy_package = copy_gen.generate_all(topic, research_data)
    
    copy_path = f"{output_dir}/copy_package.md"
    with open(copy_path, 'w') as f:
        f.write(copy_package)
    results["files"].append(copy_path)
    if not json_output:
        print(f"   ✓ Twitter thread")
        print(f"   ✓ Instagram caption")
        print(f"   ✓ TikTok script")
        print(f"   ✓ LinkedIn post")
        print(f"   ✓ YouTube description")
        print(f"   ✓ Saved to {copy_path}")
        print()
    
    # Step 3: Carousel Generation
    if not json_output:
        print("🎠 CAROUSEL GENERATION")
        print("-" * 40)
    carousel = ProCarouselBuilder()
    carousel_config = carousel.generate_config(topic, style, research_data)
    carousel_files = carousel.build(carousel_config, f"{output_dir}/carousel")
    results["files"].extend(carousel_files)
    if not json_output:
        print(f"   ✓ Generated {len(carousel_files)} slides")
        print()
    
    # Step 4: Save research data as JSON
    research_path = f"{output_dir}/research.json"
    with open(research_path, 'w') as f:
        json.dump(research_data, f, indent=2)
    results["research"] = research_data
    
    # Step 5: Save results
    results_path = f"{output_dir}/results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    if not json_output:
        print("=" * 60)
        print("✅ GENERATION COMPLETE")
        print("=" * 60)
        print(f"   Output directory: {output_dir}")
        print(f"   Files generated: {len(results['files'])}")
        print()
    
    # If JSON output mode, print the full results to stdout
    if json_output:
        print(json.dumps(results, indent=2))
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Generate social media content')
    parser.add_argument('--topic', required=True, help='Content topic')
    parser.add_argument('--style', default='lifestyle', 
                        choices=['lifestyle', 'professional', 'bold', 'minimal'],
                        help='Visual style')
    parser.add_argument('--output', default='output', help='Output directory')
    parser.add_argument('--config', help='Load config from JSON file')
    parser.add_argument('--json', action='store_true', help='Output JSON to stdout instead of progress messages')
    
    args = parser.parse_args()
    
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
        topic = config.get('topic', args.topic)
        style = config.get('style', args.style)
        output = config.get('output', args.output)
    else:
        topic = args.topic
        style = args.style
        output = args.output
    
    run_pipeline(topic, style, output, args.json)


if __name__ == "__main__":
    main()
