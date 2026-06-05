/**
 * Social Generator Service
 * 
 * Agent: Luke (Build Agent for Steel City AI)
 * Team: Steel City AI Engineering
 * Purpose: Wrapper service to execute Python scripts from social-integration tool
 * 
 * Key Features:
 * - Executes Python app.py with --json flag for structured output
 * - Returns typed interfaces for all outputs
 * - Supports async execution with proper error handling
 * 
 * Last Updated: 2026-03-01
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Content angle for posts
 */
export interface ContentAngle {
  type: string;
  angle: string;
  hook_type: string;
}

/**
 * Research output from research.py
 * Contains hooks, hashtags, and content angles
 */
export interface ResearchOutput {
  topic: string;
  keywords: string[];
  hooks: string[];
  hashtags: {
    twitter: string[];
    instagram: string[];
    tiktok: string[];
    linkedin: string[];
    youtube: string[];
  };
  angles: ContentAngle[];
}

/**
 * Platform-specific copy content
 */
export interface PlatformCopy {
  content: string;
  character_count: number;
  hashtags: string[];
  mentions: string[];
}

/**
 * Copy output from copy.py
 * Multi-platform copy generation
 */
export interface CopyOutput {
  topic: string;
  twitter: PlatformCopy;
  instagram: PlatformCopy;
  tiktok: PlatformCopy;
  linkedin: PlatformCopy;
  youtube: PlatformCopy;
}

/**
 * Carousel slide content
 */
export interface CarouselSlide {
  slide_number: number;
  title: string;
  content: string;
  image_prompt?: string;
}

/**
 * Carousel output from carousel.py
 * Instagram carousel slides
 */
export interface CarouselOutput {
  topic: string;
  style: string;
  total_slides: number;
  slides: CarouselSlide[];
  image_files: string[];
}

/**
 * Complete social media package
 */
export interface SocialMediaPackage {
  topic: string;
  style: string;
  generated_at: string;
  research: ResearchOutput;
  copy: CopyOutput;
  carousel: CarouselOutput;
}

/**
 * Service configuration
 */
export interface SocialGeneratorConfig {
  outputDir?: string;
  pythonPath?: string;
  scriptsPath?: string;
}

// ============================================================================
// Service Class
// ============================================================================

export class SocialGeneratorService {
  private pythonPath: string;
  private scriptsPath: string;
  private outputDir: string;

  constructor(config?: SocialGeneratorConfig) {
    this.pythonPath = config?.pythonPath || "python3";
    this.scriptsPath = config?.scriptsPath || path.join(__dirname, "../../../python-scripts/social-media-agent");
    this.outputDir = config?.outputDir || path.join(__dirname, "../../../python-scripts/social-media-agent/output");
  }

  /**
   * Execute a Python script and return the result
   */
  private async runPythonScript(
    scriptName: string,
    args: string[] = [],
    options?: { cwd?: string; timeout?: number }
  ): Promise<string> {
    const cwd = options?.cwd || this.scriptsPath;
    const timeout = options?.timeout || 60; // 60 second default timeout
    
    const command = [
      this.pythonPath,
      scriptName,
      ...args
    ].join(" ");

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: timeout * 1000,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes("WARNING")) {
        console.warn(`[SocialGenerator] Python stderr: ${stderr}`);
      }

      return stdout;
    } catch (error: any) {
      if (error.killed) {
        throw new Error(`[SocialGenerator] Script timed out after ${timeout}s: ${scriptName}`);
      }
      throw new Error(`[SocialGenerator] Script failed: ${error.message}`);
    }
  }

  /**
   * Generate research data (hooks, hashtags, angles)
   * Uses app.py --json and extracts research from the full output
   */
  async generateResearch(topic: string): Promise<ResearchOutput> {
    console.log(`[SocialGenerator] Running research for topic: ${topic}`);
    
    try {
      // Run the full pipeline and extract research data
      const pkg = await this.generateCompletePackage(topic, "lifestyle");
      return pkg.research;
    } catch (error: any) {
      console.error(`[SocialGenerator] Research failed: ${error.message}`);
      throw new Error(`Failed to generate research: ${error.message}`);
    }
  }

  /**
   * Generate multi-platform copy
   * Uses app.py --json and extracts copy from the full output
   */
  async generateCopy(topic: string, _research?: ResearchOutput): Promise<CopyOutput> {
    console.log(`[SocialGenerator] Running copy generation for topic: ${topic}`);
    
    try {
      // Run the full pipeline and extract copy data
      const pkg = await this.generateCompletePackage(topic, "lifestyle");
      return pkg.copy;
    } catch (error: any) {
      console.error(`[SocialGenerator] Copy generation failed: ${error.message}`);
      throw new Error(`Failed to generate copy: ${error.message}`);
    }
  }

  /**
   * Generate Instagram carousel
   * Uses app.py --json and extracts carousel from the full output
   */
  async generateCarousel(topic: string, style: string = "lifestyle", _research?: ResearchOutput): Promise<CarouselOutput> {
    console.log(`[SocialGenerator] Running carousel generation for topic: ${topic}, style: ${style}`);
    
    try {
      // Run the full pipeline and extract carousel data
      const pkg = await this.generateCompletePackage(topic, style);
      return pkg.carousel;
    } catch (error: any) {
      console.error(`[SocialGenerator] Carousel generation failed: ${error.message}`);
      throw new Error(`Failed to generate carousel: ${error.message}`);
    }
  }

  /**
   * Generate complete social media package (research + copy + carousel)
   * Uses app.py --json for structured output
   */
  async generateCompletePackage(
    topic: string,
    style: string = "lifestyle"
  ): Promise<SocialMediaPackage> {
    console.log(`[SocialGenerator] Running complete package generation for: ${topic}`);
    
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Run the full pipeline via app.py with --json flag
      // The JSON output goes to stdout, files are written to outputDir
      const output = await this.runPythonScript("app.py", [
        "--topic", topic,
        "--style", style,
        "--output", this.outputDir,
        "--json"
      ], { timeout: 180 });

      // Parse the JSON output from stdout
      // The output contains stderr messages from image fetching, then JSON
      // We need to find the JSON part
      const jsonStart = output.lastIndexOf('{');
      const jsonOutput = output.substring(jsonStart);
      
      const results = JSON.parse(jsonOutput);

      // Read research data from the results
      const researchData = results.research || {
        topic,
        keywords: [],
        hooks: [],
        hashtags: { twitter: [], instagram: [], tiktok: [], linkedin: [], youtube: [] },
        angles: []
      };

      // Read the copy package
      const copyPath = path.join(this.outputDir, "copy_package.md");
      let copyContent = "";
      if (fs.existsSync(copyPath)) {
        copyContent = fs.readFileSync(copyPath, "utf-8");
      }

      // Get carousel slide files
      const carouselFiles = results.files?.filter((f: string) => f.includes("slide")) || [];

      return {
        topic: results.topic || topic,
        style: results.style || style,
        generated_at: results.generated_at || new Date().toISOString(),
        research: researchData,
        copy: {
          topic,
          twitter: { content: copyContent, character_count: copyContent.length, hashtags: researchData.hashtags?.twitter || [], mentions: [] },
          instagram: { content: copyContent, character_count: copyContent.length, hashtags: researchData.hashtags?.instagram || [], mentions: [] },
          tiktok: { content: copyContent, character_count: copyContent.length, hashtags: researchData.hashtags?.tiktok || [], mentions: [] },
          linkedin: { content: copyContent, character_count: copyContent.length, hashtags: researchData.hashtags?.linkedin || [], mentions: [] },
          youtube: { content: copyContent, character_count: copyContent.length, hashtags: researchData.hashtags?.youtube || [], mentions: [] }
        },
        carousel: {
          topic,
          style: results.style || style,
          total_slides: carouselFiles.length,
          slides: [],
          image_files: carouselFiles
        }
      };
    } catch (error: any) {
      console.error(`[SocialGenerator] Complete package generation failed: ${error.message}`);
      throw new Error(`Failed to generate complete package: ${error.message}`);
    }
  }

  /**
   * Quick test to verify Python execution works
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.runPythonScript("app.py", ["--version"]);
      console.log("[SocialGenerator] Python connection test passed");
      return true;
    } catch (error) {
      console.error("[SocialGenerator] Python connection test failed:", error);
      return false;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const socialGenerator = new SocialGeneratorService();

export default SocialGeneratorService;
