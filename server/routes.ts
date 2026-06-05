import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, db, pgPool } from "./storage";
import { registerClientPortalRoutes } from "./client-portal-routes";
import { registerSocialMediaRoutes } from "./social-media-routes";
import { startPostScheduler } from "./services/post-scheduler";
import { eq, and, desc, sql, isNull, or } from "drizzle-orm";
import { supportTickets, supportMessages, clients, clientPortalUsers } from "@shared/schema";
import { GoogleAuthService } from "./services/google-auth";
import { GoogleDriveService } from "./services/google-drive";
import { GoogleSheetsService } from "./services/google-sheets";
import { GoogleCalendarService } from "./services/google-calendar";
import { GoogleGmailService } from "./services/google-gmail";
import { sendAutomationDiscoveryEmails } from "./gmail";
import { verifyTurnstileToken } from "./turnstile";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertContactInquirySchema,
  insertConsultationSchema,
  consultationDataSchema,
  insertCaseStudySchema, 
  insertServiceSchema, 
  updateServiceSchema, 
  loginSchema, 
  registerUserSchema,
  insertClientSchema,
  updateClientSchema,
  insertProjectSchema,
  updateProjectSchema,
  insertProjectNoteSchema,
  convertInquiryToClientSchema,
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema,
  insertGoogleIntegrationSchema,
  updateGoogleIntegrationSchema,
  insertGoogleSheetsSchema,
  updateGoogleSheetsSchema,
  insertGoogleDriveFolderSchema,
  updateGoogleDriveFolderSchema,
  insertGoogleCalendarSchema,
  updateGoogleCalendarSchema,
  insertGoogleCalendarEventSchema,
  updateGoogleCalendarEventSchema,
  insertGmailThreadSchema,
  updateGmailThreadSchema,
  insertSyncLogSchema,
  insertProjectMilestoneSchema,
  updateProjectMilestoneSchema,
  insertProjectDeliverableSchema,
  updateProjectDeliverableSchema,
  insertProjectStatusUpdateSchema,
  updateProjectStatusUpdateSchema,
  insertProjectDashboardSchema,
  updateProjectDashboardSchema,
  insertAutomationDiscoverySchema,
  updateAutomationDiscoverySchema,
  type AutomationOutline
} from "@shared/schema";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Configure passport
passport.use(new LocalStrategy(
  async (username: string, password: string, done) => {
    try {
      console.log(`[LOGIN DEBUG] Attempting login for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[LOGIN DEBUG] User not found: ${username}`);
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log(`[LOGIN DEBUG] User found: ${user.username}, checking password...`);
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN DEBUG] Password valid: ${isValid}`);
      
      if (!isValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      console.log(`[LOGIN DEBUG] Login successful for: ${user.username}`);
      return done(null, user);
    } catch (error) {
      console.log(`[LOGIN DEBUG] Login error:`, error);
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Helper function for email categorization
function determineEmailCategory(subject: string, snippet: string): string {
  const text = (subject + ' ' + snippet).toLowerCase();
  
  if (text.includes('inquiry') || text.includes('consultation') || text.includes('quote') || text.includes('interested')) {
    return 'inquiry';
  } else if (text.includes('project') || text.includes('update') || text.includes('progress') || text.includes('deliverable')) {
    return 'project_update';
  } else if (text.includes('support') || text.includes('help') || text.includes('issue') || text.includes('problem')) {
    return 'support';
  } else {
    return 'general';
  }
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'project-documents');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and random string
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, Word, Excel, PowerPoint, images, text, and ZIP files.'));
    }
  }
});

// Initialize OpenAI client using Replit AI Integrations (kept for fallback)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Initialize OpenRouter client for third-party models (DeepSeek, MiniMax, etc.)
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Initialize Google Gemini client (kept for chatbot and live chat features)
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// AI-powered automation outline generation - generates BOTH primary and secondary outlines
async function generateAutomationOutline(discoveryId: string): Promise<void> {
  try {
    const discovery = await storage.getAutomationDiscoveryById(discoveryId);
    if (!discovery) {
      console.error(`Discovery request ${discoveryId} not found`);
      return;
    }

    const prompt = `You are an expert automation consultant at Steel City AI. Analyze the following business automation request and generate a comprehensive outline for implementing the automation solution.

## Business Information
- **Company:** ${discovery.companyName}
- **Industry:** ${discovery.industry || 'Not specified'}
- **Company Size:** ${discovery.companySize || 'Not specified'}
- **Contact:** ${discovery.contactName} (${discovery.jobTitle || 'Not specified'})

## Process Details
- **Process Name:** ${discovery.processName}
- **Description:** ${discovery.processDescription}
- **Current Tools:** ${discovery.currentTools || 'Not specified'}
- **Frequency:** ${discovery.processFrequency || 'Not specified'}
- **Time Spent Weekly:** ${discovery.timeSpentPerWeek || 'Not specified'}
- **People Involved:** ${discovery.peopleInvolved || 'Not specified'}

## Pain Points & Goals
- **Pain Points:** ${discovery.painPoints}
- **Desired Outcome:** ${discovery.desiredOutcome}
- **Success Metrics:** ${discovery.successMetrics || 'Not specified'}

## Technical Context
- **Data Sources:** ${discovery.dataSourcesUsed || 'Not specified'}
- **Integration Needs:** ${discovery.integrationNeeds || 'Not specified'}
- **Compliance Requirements:** ${discovery.complianceRequirements || 'Not specified'}

## Project Preferences
- **Timeline:** ${discovery.timeline || 'Flexible'}
- **Budget Range:** ${discovery.budgetRange || 'Not specified'}
- **Priority Level:** ${discovery.priorityLevel || 'Medium'}
- **Preferred Approach:** ${discovery.preferredApproach || 'Open to recommendations'}

Based on this information, provide a detailed automation outline in the following JSON format:
{
  "summary": "A 2-3 sentence executive summary of the recommended solution",
  "recommendedApproach": "Whether to use AI agent, software automation, or hybrid approach with explanation",
  "proposedSolution": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "estimatedTimeline": "Realistic timeline estimate (e.g., '4-6 weeks')",
  "estimatedBudget": "Budget range estimate based on complexity",
  "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "potentialChallenges": ["Challenge 1", "Challenge 2"],
  "nextSteps": ["Schedule discovery call", "Provide access to current systems", "..."],
  "additionalRecommendations": "Any other insights or recommendations"
}

Respond ONLY with valid JSON, no additional text.`;

    let primaryOutline: AutomationOutline | null = null;
    let secondaryOutline: AutomationOutline | null = null;

    const antiHallucinationSuffix = `\n\nIMPORTANT: Do not hallucinate or fabricate information. Base all recommendations on real, verifiable technologies and realistic timelines. If you are unsure about something, say so. Respond ONLY with valid JSON, no markdown fences or additional text.`;

    const callModel = async (model: string, label: string): Promise<AutomationOutline | null> => {
      try {
        console.log(`Generating ${label} outline for discovery ${discoveryId}`);
        const response = await openrouter.chat.completions.create({
          model,
          messages: [
            { role: "user", content: prompt + antiHallucinationSuffix }
          ],
          temperature: 0.7,
          max_tokens: 8192,
        });
        const content = response.choices?.[0]?.message?.content;
        if (content) {
          const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          const outline: AutomationOutline = {
            ...JSON.parse(cleaned),
            generatedAt: new Date().toISOString(),
            modelUsed: model
          };
          console.log(`${label} outline generated successfully for discovery ${discoveryId}`);
          return outline;
        }
      } catch (err) {
        console.error(`${label} outline generation failed for ${discoveryId}:`, err);
      }
      return null;
    };

    // Generate primary outline (Gemini 2.5 Flash - shown to client)
    primaryOutline = await callModel("google/gemini-2.5-flash", "Gemini 2.5 Flash");

    // Generate secondary outline (MiniMax M2.7 - admin comparison)
    secondaryOutline = await callModel("minimax/minimax-m2.7", "MiniMax M2.7");

    // At least one outline must succeed
    if (!primaryOutline && !secondaryOutline) {
      throw new Error("Both AI outline generations failed");
    }

    // Save both outlines to database
    await storage.updateAutomationDiscoveryOutlines(discoveryId, primaryOutline, secondaryOutline);
    console.log(`Successfully saved automation outlines for discovery ${discoveryId}`);
    
    // Send email notifications - client gets primary, admin gets both
    try {
      const emailResult = await sendAutomationDiscoveryEmails(
        discovery.contactEmail,
        discovery.contactName,
        discovery.companyName,
        discovery.processName,
        primaryOutline || secondaryOutline!, // Client gets primary
        secondaryOutline // Admin also gets secondary outline
      );
      console.log(`Email notifications sent - Client: ${emailResult.clientEmailSent}, Admin: ${emailResult.adminEmailSent}`);
    } catch (emailError) {
      console.error(`Error sending email notifications for discovery ${discoveryId}:`, emailError);
    }
  } catch (error) {
    console.error(`Error generating automation outline for ${discoveryId}:`, error);
    // Update status to indicate error
    await storage.updateAutomationDiscovery(discoveryId, {
      status: 'new',
      adminNotes: `AI outline generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  // Register client portal routes
  registerClientPortalRoutes(app);
  registerSocialMediaRoutes(app);
  startPostScheduler(60000);

  // Serve the presentation HTML file
  app.get("/Steel_City_AI_Dashboard_Demo.html", (req, res) => {
    const presentationPath = path.resolve(process.cwd(), "Steel_City_AI_Dashboard_Demo.html");
    res.sendFile(presentationPath);
  });

  // Serve screenshot images
  app.get("/screenshots/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.resolve(process.cwd(), filename);
    
    // Check if file exists and serve it
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).send("Image not found");
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ error: 'Authentication error' });
        }
        if (!user) {
          return res.status(401).json({ error: info.message || 'Invalid credentials' });
        }
        
        req.logIn(user, (err: any) => {
          if (err) {
            return res.status(500).json({ error: 'Login error' });
          }
          res.json({ 
            success: true, 
            message: 'Logged in successfully',
            user: { id: user.id, username: user.username, role: user.role }
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Invalid login data',
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: 'Login failed' });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout error' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // REMOVED: Create admin user endpoint for security
  // Admin users should be created via secure database seeding or manual process
  // This prevents unauthorized admin account creation in production

  // Contact form submission (enhanced for consultations)
  app.post("/api/contact", async (req, res) => {
    try {
      // Verify Turnstile token if provided
      const turnstileToken = req.body.turnstileToken;
      if (turnstileToken) {
        const isValidToken = await verifyTurnstileToken(turnstileToken);
        if (!isValidToken) {
          return res.status(400).json({
            success: false,
            message: "Bot verification failed. Please try again.",
          });
        }
      }

      // Check if this is a consultation request with detailed data
      if (req.body.service === 'consultation' && req.body.consultationData) {
        const validatedData = insertConsultationSchema.parse(req.body);
        const consultation = await storage.createConsultation(validatedData);
        
        console.log("Consultation request received:", {
          id: consultation.id,
          name: consultation.name,
          email: consultation.email,
          company: consultation.company,
          service: consultation.service,
          projectType: consultation.consultationData?.projectType,
          servicesInterested: consultation.consultationData?.servicesInterested?.join(', ')
        });

        res.json({ 
          success: true, 
          message: "Thank you for your consultation request! We'll contact you within 24 hours to schedule your consultation.",
          id: consultation.id 
        });
      } else {
        // Handle regular contact inquiries
        const validatedData = insertContactInquirySchema.parse(req.body);
        const inquiry = await storage.createContactInquiry(validatedData);
        
        console.log("Contact inquiry received:", {
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          company: inquiry.company,
          service: inquiry.service
        });

        res.json({ 
          success: true, 
          message: "Thank you for your inquiry! We'll get back to you within 24 hours.",
          id: inquiry.id 
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Please check your form data",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Something went wrong. Please try again." 
        });
      }
    }
  });

  // Get contact inquiries (for admin)
  app.get("/api/contact/inquiries", requireAuth, async (req, res) => {
    try {
      const inquiries = await storage.getContactInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Update contact inquiry status (for admin)
  app.patch("/api/contact/inquiries/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["new", "contacted", "qualified", "converted", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateContactInquiryStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Update contact inquiry (for progressive discovery flow - partial lead capture)
  app.patch("/api/contact/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Only allow partial updates for consultation service
      if (req.body.service !== 'consultation') {
        return res.status(400).json({ error: "Partial updates only supported for consultation service" });
      }

      // Validate the update data
      const validatedData = insertConsultationSchema.partial().parse(req.body);
      const updatedInquiry = await storage.updateContactInquiry(id, validatedData);
      
      console.log("Contact inquiry updated:", {
        id: updatedInquiry.id,
        name: updatedInquiry.name,
        email: updatedInquiry.email,
      });

      res.json({ 
        success: true, 
        message: "Inquiry updated successfully",
        id: updatedInquiry.id 
      });
    } catch (error) {
      console.error("Contact form update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Please check your form data",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Something went wrong. Please try again." 
        });
      }
    }
  });

  // Admin consultation management endpoints
  app.get("/api/admin/consultations", requireAuth, async (req, res) => {
    try {
      const consultations = await storage.getConsultations();
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ error: "Failed to fetch consultations" });
    }
  });

  app.get("/api/admin/consultations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const consultation = await storage.getConsultationById(id);
      
      if (!consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      res.json(consultation);
    } catch (error) {
      console.error("Error fetching consultation:", error);
      res.status(500).json({ error: "Failed to fetch consultation" });
    }
  });

  app.get("/api/admin/consultations/status/:status", requireAuth, async (req, res) => {
    try {
      const { status } = req.params;
      const consultations = await storage.getConsultationsByStatus(status);
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations by status:", error);
      res.status(500).json({ error: "Failed to fetch consultations" });
    }
  });

  // Get case studies
  app.get("/api/case-studies", async (req, res) => {
    try {
      const caseStudies = await storage.getAllCaseStudies();
      res.json(caseStudies);
    } catch (error) {
      console.error("Error fetching case studies:", error);
      res.status(500).json({ error: "Failed to fetch case studies" });
    }
  });

  // Get featured case studies
  app.get("/api/case-studies/featured", async (req, res) => {
    try {
      const caseStudies = await storage.getFeaturedCaseStudies();
      res.json(caseStudies);
    } catch (error) {
      console.error("Error fetching featured case studies:", error);
      res.status(500).json({ error: "Failed to fetch featured case studies" });
    }
  });

  // Create case study (for admin)
  app.post("/api/case-studies", async (req, res) => {
    try {
      const validatedData = insertCaseStudySchema.parse(req.body);
      const caseStudy = await storage.createCaseStudy(validatedData);
      res.json(caseStudy);
    } catch (error) {
      console.error("Error creating case study:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid case study data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create case study" });
      }
    }
  });

  // Services endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/featured", async (req, res) => {
    try {
      const services = await storage.getFeaturedServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching featured services:", error);
      res.status(500).json({ error: "Failed to fetch featured services" });
    }
  });

  app.get("/api/services/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const service = await storage.getServiceBySlug(slug);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  // Create service (for admin)
  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid service data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  });

  // Update service (for admin)
  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateServiceSchema.parse(req.body);
      const service = await storage.updateService(id, validatedData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid service data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update service" });
      }
    }
  });

  // Delete service (for admin)
  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // CLIENT MANAGEMENT ENDPOINTS
  
  // Get all clients with pagination
  app.get("/api/admin/clients", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getAllClients(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Create new client
  app.post("/api/admin/clients", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid client data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  // Get client details with projects
  app.get("/api/admin/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClientWithProjects(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  // Update client
  app.put("/api/admin/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateClientSchema.parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid client data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update client" });
      }
    }
  });

  // Delete client
  app.delete("/api/admin/clients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Portal user management
  app.get("/api/admin/clients/:id/portal-users", requireAuth, async (req, res) => {
    try {
      const result = await pgPool.query(
        `SELECT id, name, email, role, is_active AS "isActive", last_login_at AS "lastLoginAt", created_at AS "createdAt"
         FROM client_portal_users WHERE client_id = $1 ORDER BY created_at`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching portal users:", error);
      res.status(500).json({ error: "Failed to fetch portal users" });
    }
  });

  app.post("/api/admin/clients/:id/portal-users", requireAuth, async (req, res) => {
    try {
      const { name, email, password, role = "user" } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }
      const existing = await pgPool.query('SELECT id FROM client_portal_users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "A portal user with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pgPool.query(
        `INSERT INTO client_portal_users (id, client_id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, now(), now())
         RETURNING id, name, email, role, is_active AS "isActive", created_at AS "createdAt"`,
        [req.params.id, name, email, passwordHash, role]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating portal user:", error);
      res.status(500).json({ error: "Failed to create portal user" });
    }
  });

  app.patch("/api/admin/clients/:id/portal-users/:userId", requireAuth, async (req, res) => {
    try {
      const { password, isActive, role } = req.body;
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const isActiveValue = isActive !== undefined ? isActive : null;
      const roleValue = role || null;
      const result = await pgPool.query(
        `UPDATE client_portal_users
         SET password_hash = COALESCE($1::text, password_hash),
             is_active = COALESCE($2::boolean, is_active),
             role = COALESCE($3::text, role),
             updated_at = now()
         WHERE id = $4
         RETURNING id, name, email, role, is_active, last_login_at, created_at, updated_at`,
        [passwordHash, isActiveValue, roleValue, req.params.userId]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating portal user:", error);
      res.status(500).json({ error: "Failed to update portal user" });
    }
  });

  app.delete("/api/admin/clients/:id/portal-users/:userId", requireAuth, async (req, res) => {
    try {
      await pgPool.query('DELETE FROM client_portal_users WHERE id = $1', [req.params.userId]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting portal user:", error);
      res.status(500).json({ error: "Failed to delete portal user" });
    }
  });

  // Convert contact inquiry to client
  app.post("/api/admin/clients/convert-inquiry", requireAuth, async (req, res) => {
    try {
      const validatedData = convertInquiryToClientSchema.parse(req.body);
      const client = await storage.convertInquiryToClient(validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error converting inquiry to client:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid inquiry conversion data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to convert inquiry to client" });
      }
    }
  });

  // PROJECT MANAGEMENT ENDPOINTS

  // Get projects for a client
  app.get("/api/admin/clients/:id/projects", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const projects = await storage.getProjectsByClientId(id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Create new project for a client
  app.post("/api/admin/clients/:id/projects", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        clientId: id
      });
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid project data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project" });
      }
    }
  });

  // Get project details with notes and documents
  app.get("/api/admin/clients/:clientId/projects/:projectId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      const project = await storage.getProjectWithDetails(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Update project
  app.put("/api/admin/clients/:clientId/projects/:projectId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const existingProject = await storage.getProjectById(projectId);
      if (!existingProject || existingProject.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(projectId, validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid project data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update project" });
      }
    }
  });

  // Delete project
  app.delete("/api/admin/clients/:clientId/projects/:projectId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      await storage.deleteProject(projectId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // PROJECT NOTES ENDPOINTS

  // Get project notes
  app.get("/api/admin/clients/:clientId/projects/:projectId/notes", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const notes = await storage.getProjectNotes(projectId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching project notes:", error);
      res.status(500).json({ error: "Failed to fetch project notes" });
    }
  });

  // Create project note
  app.post("/api/admin/clients/:clientId/projects/:projectId/notes", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      const user = req.user as any;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectNoteSchema.parse({
        ...req.body,
        projectId,
        authorId: user.id
      });
      const note = await storage.createProjectNote(validatedData);
      res.json(note);
    } catch (error) {
      console.error("Error creating project note:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid note data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project note" });
      }
    }
  });

  // Delete project note
  app.delete("/api/admin/clients/:clientId/projects/:projectId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, noteId } = req.params;
      
      // Verify note exists and belongs to this project
      const note = await storage.getProjectNoteById(noteId);
      if (!note || note.projectId !== projectId) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Verify project belongs to this client  
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      await storage.deleteProjectNote(noteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project note:", error);
      res.status(500).json({ error: "Failed to delete project note" });
    }
  });

  // PROJECT DOCUMENTS ENDPOINTS

  // Get project documents
  app.get("/api/admin/clients/:clientId/projects/:projectId/documents", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const documents = await storage.getProjectDocuments(projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching project documents:", error);
      res.status(500).json({ error: "Failed to fetch project documents" });
    }
  });

  // Upload project document
  app.post("/api/admin/clients/:clientId/projects/:projectId/documents/upload", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const documentData = {
        projectId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadPath: req.file.path
      };

      const document = await storage.createProjectDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Download project document
  app.get("/api/admin/clients/:clientId/projects/:projectId/documents/:docId/download", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, docId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const document = await storage.getProjectDocumentById(docId);
      if (!document || document.projectId !== projectId) {
        return res.status(404).json({ error: "Document not found" });
      }

      const filePath = document.uploadPath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Delete project document
  app.delete("/api/admin/clients/:clientId/projects/:projectId/documents/:docId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, docId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get document info and verify it belongs to this project
      const document = await storage.getProjectDocumentById(docId);
      if (!document || document.projectId !== projectId) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Delete file from disk if it exists
      if (fs.existsSync(document.uploadPath)) {
        fs.unlinkSync(document.uploadPath);
      }
      
      await storage.deleteProjectDocument(docId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project document:", error);
      res.status(500).json({ error: "Failed to delete project document" });
    }
  });

  // PROJECT MILESTONE ENDPOINTS

  // Get project milestones
  app.get("/api/admin/clients/:clientId/projects/:projectId/milestones", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const milestones = await storage.getProjectMilestonesByProjectId(projectId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching project milestones:", error);
      res.status(500).json({ error: "Failed to fetch project milestones" });
    }
  });

  // Create project milestone
  app.post("/api/admin/clients/:clientId/projects/:projectId/milestones", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectMilestoneSchema.parse({
        ...req.body,
        projectId
      });
      const milestone = await storage.createProjectMilestone(validatedData);
      res.json(milestone);
    } catch (error) {
      console.error("Error creating project milestone:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid milestone data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project milestone" });
      }
    }
  });

  // Update project milestone
  app.put("/api/admin/clients/:clientId/projects/:projectId/milestones/:milestoneId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, milestoneId } = req.params;
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = updateProjectMilestoneSchema.parse(req.body);
      const updatedMilestone = await storage.updateProjectMilestone(milestoneId, validatedData);
      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error updating project milestone:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid milestone data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update project milestone" });
      }
    }
  });

  // Delete project milestone
  app.delete("/api/admin/clients/:clientId/projects/:projectId/milestones/:milestoneId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, milestoneId } = req.params;
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      await storage.deleteProjectMilestone(milestoneId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project milestone:", error);
      res.status(500).json({ error: "Failed to delete project milestone" });
    }
  });

  // PROJECT DELIVERABLE ENDPOINTS

  // Get deliverables by milestone
  app.get("/api/admin/clients/:clientId/projects/:projectId/milestones/:milestoneId/deliverables", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, milestoneId } = req.params;
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const deliverables = await storage.getProjectDeliverablesByMilestoneId(milestoneId);
      res.json(deliverables);
    } catch (error) {
      console.error("Error fetching milestone deliverables:", error);
      res.status(500).json({ error: "Failed to fetch milestone deliverables" });
    }
  });

  // Get all deliverables by project
  app.get("/api/admin/clients/:clientId/projects/:projectId/deliverables", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const deliverables = await storage.getProjectDeliverablesByProjectId(projectId);
      res.json(deliverables);
    } catch (error) {
      console.error("Error fetching project deliverables:", error);
      res.status(500).json({ error: "Failed to fetch project deliverables" });
    }
  });

  // Create project deliverable
  app.post("/api/admin/clients/:clientId/projects/:projectId/milestones/:milestoneId/deliverables", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, milestoneId } = req.params;
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectDeliverableSchema.parse({
        ...req.body,
        milestoneId
      });
      const deliverable = await storage.createProjectDeliverable(validatedData);
      res.json(deliverable);
    } catch (error) {
      console.error("Error creating project deliverable:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid deliverable data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project deliverable" });
      }
    }
  });

  // Update project deliverable
  app.put("/api/admin/clients/:clientId/projects/:projectId/deliverables/:deliverableId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, deliverableId } = req.params;
      
      // Verify deliverable exists and get its milestone
      const deliverable = await storage.getProjectDeliverableById(deliverableId);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(deliverable.milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = updateProjectDeliverableSchema.parse(req.body);
      const updatedDeliverable = await storage.updateProjectDeliverable(deliverableId, validatedData);
      res.json(updatedDeliverable);
    } catch (error) {
      console.error("Error updating project deliverable:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid deliverable data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update project deliverable" });
      }
    }
  });

  // Delete project deliverable
  app.delete("/api/admin/clients/:clientId/projects/:projectId/deliverables/:deliverableId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, deliverableId } = req.params;
      
      // Verify deliverable exists and get its milestone
      const deliverable = await storage.getProjectDeliverableById(deliverableId);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      
      // Verify milestone belongs to this project
      const milestone = await storage.getProjectMilestoneById(deliverable.milestoneId);
      if (!milestone || milestone.projectId !== projectId) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      await storage.deleteProjectDeliverable(deliverableId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project deliverable:", error);
      res.status(500).json({ error: "Failed to delete project deliverable" });
    }
  });

  // PROJECT STATUS UPDATE ENDPOINTS

  // Get project status updates
  app.get("/api/admin/clients/:clientId/projects/:projectId/status-updates", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const statusUpdates = await storage.getProjectStatusUpdatesByProjectId(projectId);
      res.json(statusUpdates);
    } catch (error) {
      console.error("Error fetching project status updates:", error);
      res.status(500).json({ error: "Failed to fetch project status updates" });
    }
  });

  // Create project status update
  app.post("/api/admin/clients/:clientId/projects/:projectId/status-updates", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      const user = req.user as any;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectStatusUpdateSchema.parse({
        ...req.body,
        projectId,
        authorId: user.id
      });
      const statusUpdate = await storage.createProjectStatusUpdate(validatedData);
      res.json(statusUpdate);
    } catch (error) {
      console.error("Error creating project status update:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid status update data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project status update" });
      }
    }
  });

  // Update project status update
  app.put("/api/admin/clients/:clientId/projects/:projectId/status-updates/:statusUpdateId", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, statusUpdateId } = req.params;
      
      // Verify status update belongs to this project
      const statusUpdate = await storage.getProjectStatusUpdateById(statusUpdateId);
      if (!statusUpdate || statusUpdate.projectId !== projectId) {
        return res.status(404).json({ error: "Status update not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = updateProjectStatusUpdateSchema.parse(req.body);
      const updatedStatusUpdate = await storage.updateProjectStatusUpdate(statusUpdateId, validatedData);
      res.json(updatedStatusUpdate);
    } catch (error) {
      console.error("Error updating project status update:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid status update data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update project status update" });
      }
    }
  });

  // Mark status update as sent
  app.patch("/api/admin/clients/:clientId/projects/:projectId/status-updates/:statusUpdateId/mark-sent", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId, statusUpdateId } = req.params;
      
      // Verify status update belongs to this project
      const statusUpdate = await storage.getProjectStatusUpdateById(statusUpdateId);
      if (!statusUpdate || statusUpdate.projectId !== projectId) {
        return res.status(404).json({ error: "Status update not found" });
      }
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      await storage.markStatusUpdateSent(statusUpdateId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking status update as sent:", error);
      res.status(500).json({ error: "Failed to mark status update as sent" });
    }
  });

  // PROJECT DASHBOARD ENDPOINTS

  // Get project dashboard
  app.get("/api/admin/clients/:clientId/projects/:projectId/dashboard", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const dashboard = await storage.getProjectDashboardByProjectId(projectId);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching project dashboard:", error);
      res.status(500).json({ error: "Failed to fetch project dashboard" });
    }
  });

  // Create project dashboard
  app.post("/api/admin/clients/:clientId/projects/:projectId/dashboard", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const validatedData = insertProjectDashboardSchema.parse({
        ...req.body,
        projectId
      });
      const dashboard = await storage.createProjectDashboard(validatedData);
      res.json(dashboard);
    } catch (error) {
      console.error("Error creating project dashboard:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid dashboard data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create project dashboard" });
      }
    }
  });

  // Update project dashboard
  app.put("/api/admin/clients/:clientId/projects/:projectId/dashboard", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Verify project belongs to this client
      const project = await storage.getProjectById(projectId);
      if (!project || project.clientId !== clientId) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const dashboard = await storage.getProjectDashboardByProjectId(projectId);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard not found" });
      }
      
      const validatedData = updateProjectDashboardSchema.parse(req.body);
      const updatedDashboard = await storage.updateProjectDashboard(dashboard.id, validatedData);
      res.json(updatedDashboard);
    } catch (error) {
      console.error("Error updating project dashboard:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid dashboard data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to update project dashboard" });
      }
    }
  });

  // Sync project dashboard (local update without Google Sheets)
  app.post("/api/admin/clients/:clientId/projects/:projectId/dashboard/sync", requireAuth, async (req, res) => {
    try {
      const { clientId, projectId } = req.params;
      
      // Get project and client data
      const project = await storage.getProjectById(projectId);
      const client = await storage.getClientById(clientId);
      
      if (!project || !client) {
        return res.status(404).json({ error: "Project or client not found" });
      }

      // Get all project data for dashboard
      const milestones = await storage.getProjectMilestonesByProjectId(projectId);
      const deliverables = await storage.getProjectDeliverablesByProjectId(projectId);
      const statusUpdates = await storage.getProjectStatusUpdatesByProjectId(projectId);
      
      // Update dashboard record with local sync (no Google Sheets needed)
      let dashboard = await storage.getProjectDashboardByProjectId(projectId);
      if (dashboard) {
        await storage.updateProjectDashboardSync(dashboard.id, {
          lastSyncedAt: new Date(),
          syncStatus: 'success',
          syncError: null
        });
      } else {
        return res.status(404).json({ error: "Dashboard not found. Please create a dashboard first." });
      }
      
      res.json({ 
        success: true, 
        message: "Dashboard synced successfully",
        dashboard,
        milestones: milestones.length,
        deliverables: deliverables.length,
        statusUpdates: statusUpdates.length
      });
    } catch (error) {
      console.error("Error syncing project dashboard:", error);
      res.status(500).json({ error: "Failed to sync project dashboard" });
    }
  });

  // Chat escalation routes
  app.post("/api/admin/chat/sessions/:sessionId/escalate", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const consultationData = req.body;
      
      const result = await storage.escalateChatToConsultation(sessionId, consultationData);
      
      console.log("Chat escalated to consultation:", {
        sessionId: result.sessionId,
        consultationId: result.consultationId,
        adminId: req.user?.id
      });

      res.json({
        success: true,
        message: "Chat escalated to consultation successfully",
        data: result
      });
    } catch (error: any) {
      console.error("Chat escalation error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to escalate chat to consultation"
      });
    }
  });

  app.patch("/api/admin/chat/sessions/:sessionId/link-consultation", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { consultationId } = req.body;
      
      await storage.linkChatToConsultation(sessionId, consultationId);
      
      console.log("Chat linked to consultation:", { sessionId, consultationId });

      res.json({
        success: true,
        message: "Chat linked to consultation successfully"
      });
    } catch (error: any) {
      console.error("Chat linking error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to link chat to consultation"
      });
    }
  });

  // Google Integration routes
  app.get("/api/google/auth/url", requireAuth, async (req, res) => {
    try {
      const { serviceType } = req.query;
      
      if (!serviceType || !['drive', 'gmail', 'calendar', 'sheets'].includes(serviceType as string)) {
        return res.status(400).json({ error: "Valid service type required (drive, gmail, calendar, sheets)" });
      }

      const googleAuth = new GoogleAuthService();
      const authUrl = googleAuth.generateAuthUrl(GoogleAuthService.ALL_SCOPES);
      
      console.log('[GOOGLE OAUTH DEBUG] Generated auth URL:', authUrl);
      console.log('[GOOGLE OAUTH DEBUG] Redirect URI being used:', googleAuth.getOAuth2Client()._clientId ? 'Client ID exists' : 'No Client ID');
      
      res.json({ 
        authUrl,
        serviceType,
        message: "Redirect user to this URL for Google authentication"
      });
    } catch (error: any) {
      console.error("Google auth URL generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate Google auth URL",
        details: error.message 
      });
    }
  });

  app.get("/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/admin?error=google_auth_failed');
      }

      // Initialize Google Auth Service
      const googleAuth = new GoogleAuthService();
      
      // Exchange code for tokens
      const tokens = await googleAuth.getTokenFromCode(code as string);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        return res.redirect('/admin?error=google_auth_failed');
      }

      // Store tokens temporarily in session for frontend to pick up
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope
      };

      // Redirect back to admin with success
      res.redirect('/admin?google_auth=success');
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      res.redirect('/admin?error=google_auth_failed');
    }
  });

  app.post("/api/google/auth", requireAuth, async (req, res) => {
    try {
      const { serviceType } = req.body;
      const userId = (req.user as any)?.id;
      
      if (!serviceType || !userId) {
        return res.status(400).json({ error: "Service type and user authentication are required" });
      }

      if (!['drive', 'gmail', 'calendar', 'sheets'].includes(serviceType)) {
        return res.status(400).json({ error: "Invalid service type" });
      }

      // Get tokens from session (set by OAuth callback)
      const tokens = req.session.googleTokens;
      if (!tokens || !tokens.access_token || !tokens.refresh_token) {
        return res.status(400).json({ error: "No Google tokens found. Please authenticate first." });
      }

      // Create integration record
      const integration = await storage.createGoogleIntegration({
        userId,
        serviceType,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000), // 1 hour default
        scope: tokens.scope ? tokens.scope.split(' ') : [`https://www.googleapis.com/auth/${serviceType}`],
        isActive: true,
        syncStatus: 'pending'
      });

      // Clear tokens from session after use
      delete req.session.googleTokens;

      console.log(`Google ${serviceType} integration created:`, {
        integrationId: integration.id,
        userId,
        serviceType,
        scopes: integration.scope
      });

      res.json({ 
        success: true, 
        message: `Google ${serviceType} authenticated successfully`,
        integration: {
          id: integration.id,
          serviceType: integration.serviceType,
          syncStatus: integration.syncStatus,
          createdAt: integration.createdAt
        }
      });
    } catch (error: any) {
      console.error("Google auth error:", error);
      res.status(500).json({ 
        error: "Failed to authenticate with Google",
        details: error.message 
      });
    }
  });

  app.get("/api/google/integrations", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      const integrations = await storage.getActiveGoogleIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching Google integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/google/drive/setup", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.body;
      const userId = (req.user as any)?.id;
      
      if (!clientId || !userId) {
        return res.status(400).json({ error: "Client ID and user authentication are required" });
      }

      // Verify client exists
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get Google Drive integration
      const driveIntegration = await storage.getGoogleIntegration(userId, 'drive');
      if (!driveIntegration) {
        return res.status(400).json({ error: "Google Drive not connected. Please authenticate first." });
      }

      // Initialize Google Drive service with tokens
      const googleAuth = new GoogleAuthService();
      const auth = googleAuth.setCredentials({
        access_token: driveIntegration.accessToken,
        refresh_token: driveIntegration.refreshToken
      });

      const driveService = new GoogleDriveService(auth);

      // Create client folder structure
      const folderResult = await driveService.createClientFolderStructure(client.name, clientId);

      // Store main folder in database with validation
      const mainFolderData = insertGoogleDriveFolderSchema.parse({
        clientId,
        folderId: folderResult.mainFolderId,
        folderName: client.name,
        folderUrl: `https://drive.google.com/drive/folders/${folderResult.mainFolderId}`,
        folderType: 'main',
        permissions: { 
          clientEmail: client.email,
          accessLevel: 'reader',
          sharedAt: new Date().toISOString()
        }
      });

      const mainFolder = await storage.createGoogleDriveFolder(mainFolderData);

      // Map folder names to valid enum values
      const folderTypeMap: Record<string, 'main' | 'documents' | 'processed' | 'reports' | 'communications'> = {
        'Documents': 'documents',
        'Processed Files': 'processed', 
        'Reports': 'reports',
        'Communications': 'communications'
      };

      // Store subfolders in database
      const subfolders = [];
      for (const [folderName, folderId] of Object.entries(folderResult.subfolderIds)) {
        const folderType = folderTypeMap[folderName] || 'documents';
        
        // Validate folder data before storage
        const folderData = insertGoogleDriveFolderSchema.parse({
          clientId,
          folderId,
          folderName,
          folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
          folderType,
          parentFolderId: folderResult.mainFolderId,
          permissions: { 
            clientEmail: client.email,
            accessLevel: 'reader',
            sharedAt: new Date().toISOString()
          }
        });

        const subfolder = await storage.createGoogleDriveFolder(folderData);
        subfolders.push(subfolder);
      }

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'drive',
        operation: 'create',
        googleResourceId: folderResult.mainFolderId,
        status: 'completed',
        requestPayload: { clientName: client.name },
        responsePayload: folderResult
      });

      console.log(`Google Drive folders created for client ${client.name}:`, {
        mainFolderId: folderResult.mainFolderId,
        subfolders: Object.keys(folderResult.subfolderIds)
      });

      res.json({
        success: true,
        message: `Google Drive folders created for ${client.name}`,
        data: {
          mainFolder,
          subfolders,
          folderStructure: folderResult
        }
      });
    } catch (error: any) {
      console.error("Error setting up Google Drive:", error);
      
      // Log error to sync logs if we have the required data
      if (req.body.clientId) {
        try {
          await storage.createSyncLog({
            entityType: 'client',
            entityId: req.body.clientId,
            syncType: 'drive',
            operation: 'create',
            status: 'failed',
            errorMessage: error.message,
            requestPayload: req.body
          });
        } catch (logError) {
          console.error("Failed to log sync error:", logError);
        }
      }

      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid folder data", details: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to setup Google Drive",
          details: error.message 
        });
      }
    }
  });

  app.get("/api/google/drive/folders/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const folders = await storage.getGoogleDriveFoldersByClientId(clientId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching Drive folders:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  // Google Calendar integration routes
  app.post("/api/google/calendar/setup", requireAuth, async (req, res) => {
    try {
      // Validate incoming request body
      const requestSchema = z.object({
        clientId: z.string().min(1, "Client ID is required"),
        calendarName: z.string().optional()
      });

      const validatedRequest = requestSchema.parse(req.body);
      const { clientId, calendarName } = validatedRequest;

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Verify client exists
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Check if calendar already exists for this client
      const existingCalendar = await storage.getGoogleCalendar(clientId);
      if (existingCalendar) {
        return res.status(400).json({ 
          error: "Calendar already exists for this client",
          data: { calendar: existingCalendar }
        });
      }

      // Get Google Calendar integration
      const calendarIntegration = await storage.getGoogleIntegration(userId, 'calendar');
      if (!calendarIntegration) {
        return res.status(400).json({ error: "Google Calendar not connected. Please authenticate first." });
      }

      // Initialize Google Calendar service with tokens
      const googleAuth = new GoogleAuthService();
      const auth = googleAuth.setCredentials({
        access_token: calendarIntegration.accessToken,
        refresh_token: calendarIntegration.refreshToken
      });

      const calendarService = new GoogleCalendarService(auth);

      // Create client calendar
      const calendarResult = await calendarService.createClientCalendar(
        calendarName || `${client.name} - AI Automation Project`,
        `Calendar for managing meetings and consultations with ${client.name}`,
        'America/New_York' // Use a consistent timezone for now
      );

      // Validate calendar data before storage
      const calendarData = insertGoogleCalendarSchema.parse({
        clientId,
        calendarId: calendarResult.calendarId,
        calendarName: calendarResult.name,
        calendarUrl: calendarResult.calendarUrl,
        timezone: calendarResult.timezone || 'America/New_York', // Ensure timezone is always set
        permissions: {
          clientEmail: client.email,
          accessLevel: 'reader' as const,
          sharedAt: new Date().toISOString()
        }
      });

      const calendar = await storage.createGoogleCalendar(calendarData);

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'calendar',
        operation: 'create',
        googleResourceId: calendarResult.calendarId,
        status: 'completed',
        requestPayload: { clientName: client.name, calendarName },
        responsePayload: calendarResult
      });

      console.log(`Google Calendar created for client ${client.name}:`, {
        calendarId: calendarResult.calendarId,
        calendarName: calendarResult.name
      });

      res.json({
        success: true,
        message: `Google Calendar created for ${client.name}`,
        data: {
          calendar,
          calendarResult
        }
      });
    } catch (error: any) {
      console.error("Error setting up Google Calendar:", error);
      
      // Log error to sync logs if we have the required data
      if (req.body.clientId) {
        try {
          await storage.createSyncLog({
            entityType: 'client',
            entityId: req.body.clientId,
            syncType: 'calendar',
            operation: 'create',
            status: 'failed',
            errorMessage: error.message,
            requestPayload: req.body
          });
        } catch (logError) {
          console.error("Failed to log sync error:", logError);
        }
      }

      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid calendar data", details: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to setup Google Calendar",
          details: error.message 
        });
      }
    }
  });

  app.get("/api/google/calendar/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const calendar = await storage.getGoogleCalendar(clientId);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found for this client" });
      }
      res.json(calendar);
    } catch (error) {
      console.error("Error fetching Google Calendar:", error);
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  app.put("/api/google/calendar/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const updates = updateGoogleCalendarSchema.parse(req.body);
      
      const calendar = await storage.getGoogleCalendar(clientId);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found for this client" });
      }

      const updatedCalendar = await storage.updateGoogleCalendar(calendar.id, updates);
      res.json(updatedCalendar);
    } catch (error: any) {
      console.error("Error updating Google Calendar:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid calendar data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update calendar" });
      }
    }
  });

  app.delete("/api/google/calendar/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const calendar = await storage.getGoogleCalendar(clientId);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found for this client" });
      }

      await storage.deleteGoogleCalendar(calendar.id);
      res.json({ success: true, message: "Calendar deleted successfully" });
    } catch (error) {
      console.error("Error deleting Google Calendar:", error);
      res.status(500).json({ error: "Failed to delete calendar" });
    }
  });

  // Google Gmail integration routes
  app.post("/api/google/gmail/setup", requireAuth, async (req, res) => {
    try {
      // Validate incoming request body
      const requestSchema = z.object({
        clientId: z.string().min(1, "Client ID is required"),
        enableAutoReply: z.boolean().optional().default(false),
        categories: z.array(z.string()).optional().default(['inquiry', 'project_update', 'support', 'general'])
      });

      const validatedRequest = requestSchema.parse(req.body);
      const { clientId, enableAutoReply, categories } = validatedRequest;

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Verify client exists
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get Google Gmail integration
      const gmailIntegration = await storage.getGoogleIntegration(userId, 'gmail');
      if (!gmailIntegration) {
        return res.status(400).json({ error: "Google Gmail not connected. Please authenticate first." });
      }

      // Initialize Google Gmail service with tokens
      const googleAuth = new GoogleAuthService();
      const auth = googleAuth.setCredentials({
        access_token: gmailIntegration.accessToken,
        refresh_token: gmailIntegration.refreshToken
      });

      const gmailService = new GoogleGmailService(auth);

      // Get recent emails for this client to start tracking
      const clientEmailQuery = `from:${client.email} OR to:${client.email}`;
      const recentEmails = await gmailService.getEmails(clientEmailQuery, 10);

      // Process and store email threads
      const emailThreads = [];
      for (const email of recentEmails) {
        // Check if thread already exists
        const existingThread = await storage.getGmailThreadsByClientId(clientId);
        const threadExists = existingThread.some((t: any) => t.threadId === email.threadId);
        
        if (!threadExists) {
          // Validate thread data before storage
          const threadData = insertGmailThreadSchema.parse({
            clientId,
            threadId: email.threadId,
            subject: email.subject,
            participants: [email.from, client.email],
            messageCount: 1,
            lastMessageAt: new Date(email.date || Date.now()),
            status: 'active',
            labels: email.labelIds,
            isUnread: email.labelIds.includes('UNREAD'),
            category: determineEmailCategory(email.subject, email.snippet),
            autoReplied: false
          });

          const thread = await storage.createGmailThread(threadData);
          emailThreads.push(thread);
        }
      }

      // Update Gmail integration with settings and status
      const updatedIntegration = await storage.updateGoogleIntegration(gmailIntegration.id, {
        lastSyncAt: new Date(),
        syncStatus: 'completed',
        errorMessage: null,
        settings: {
          enableAutoReply,
          categories,
          clientId,
          setupAt: new Date().toISOString()
        }
      });

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'gmail',
        operation: 'create',
        googleResourceId: `gmail_${clientId}`,
        status: 'completed',
        requestPayload: { clientName: client.name, enableAutoReply, categories },
        responsePayload: { threadsCreated: emailThreads.length, recentEmails: recentEmails.length, settingsPersisted: true }
      });

      console.log(`Gmail integration setup for client ${client.name}:`, {
        threadsCreated: emailThreads.length,
        recentEmails: recentEmails.length,
        settingsPersisted: true
      });

      res.json({
        success: true,
        message: `Gmail integration setup for ${client.name}`,
        data: {
          emailThreads,
          recentEmails: recentEmails.length,
          settings: { enableAutoReply, categories },
          integration: updatedIntegration
        }
      });
    } catch (error: any) {
      console.error("Error setting up Gmail integration:", error);
      
      // Log error to sync logs if we have the required data
      if (req.body.clientId) {
        try {
          await storage.createSyncLog({
            entityType: 'client',
            entityId: req.body.clientId,
            syncType: 'gmail',
            operation: 'create',
            status: 'failed',
            errorMessage: error.message,
            requestPayload: req.body
          });
        } catch (logError) {
          console.error("Failed to log sync error:", logError);
        }
      }

      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Gmail setup data", details: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to setup Gmail integration",
          details: error.message 
        });
      }
    }
  });

  app.get("/api/google/gmail/threads/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const threads = await storage.getGmailThreadsByClientId(clientId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching Gmail threads:", error);
      res.status(500).json({ error: "Failed to fetch Gmail threads" });
    }
  });

  app.post("/api/google/gmail/send", requireAuth, async (req, res) => {
    try {
      // Validate email sending request
      const emailSchema = z.object({
        to: z.string().email("Valid email address required"),
        subject: z.string().min(1, "Subject is required"),
        htmlBody: z.string().min(1, "Email body is required"),
        textBody: z.string().optional(),
        clientId: z.string().optional()
      });

      const validatedEmail = emailSchema.parse(req.body);
      const { to, subject, htmlBody, textBody, clientId } = validatedEmail;

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Get Google Gmail integration
      const gmailIntegration = await storage.getGoogleIntegration(userId, 'gmail');
      if (!gmailIntegration) {
        return res.status(400).json({ error: "Google Gmail not connected. Please authenticate first." });
      }

      // Initialize Google Gmail service with tokens
      const googleAuth = new GoogleAuthService();
      const auth = googleAuth.setCredentials({
        access_token: gmailIntegration.accessToken,
        refresh_token: gmailIntegration.refreshToken
      });

      const gmailService = new GoogleGmailService(auth);

      // Send email
      const emailResult = await gmailService.sendEmail(to, subject, htmlBody, textBody);

      // If clientId provided, track this in a thread
      if (clientId) {
        try {
          const threadData = insertGmailThreadSchema.parse({
            clientId,
            threadId: emailResult.threadId,
            subject,
            participants: [to, 'me'],
            messageCount: 1,
            lastMessageAt: new Date(),
            status: 'active',
            labels: ['SENT'],
            isUnread: false,
            category: 'general',
            autoReplied: false
          });

          await storage.createGmailThread(threadData);
        } catch (threadError) {
          console.error("Failed to track sent email in thread:", threadError);
          // Don't fail the email send if thread tracking fails
        }
      }

      res.json({
        success: true,
        message: "Email sent successfully",
        data: emailResult
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid email data", details: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to send email",
          details: error.message 
        });
      }
    }
  });

  // Google Sheets setup route for dual storage
  app.post("/api/google/sheets/setup", requireAuth, async (req, res) => {
    try {
      const sheetsSetupSchema = z.object({
        clientId: z.string().min(1, "Client ID is required"),
        dashboardType: z.enum(['project', 'analytics', 'full']).default('full'),
        shareWithClient: z.boolean().default(true),
        clientEmail: z.string().email().optional()
      });

      const { clientId, dashboardType, shareWithClient, clientEmail } = sheetsSetupSchema.parse(req.body);

      // Validate client exists
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get or create Google Sheets integration
      let sheetsIntegration = await storage.getGoogleIntegration(req.user.id, 'sheets');
      if (!sheetsIntegration) {
        return res.status(400).json({ 
          error: "Google Sheets integration not found. Please authenticate with Google first." 
        });
      }

      // Check if sheets already exists for this client
      const existingSheet = await storage.getGoogleSheetByClientId(clientId);
      if (existingSheet) {
        return res.status(409).json({ 
          error: "Google Sheets dashboard already exists for this client",
          data: existingSheet
        });
      }

      // Set up Google Sheets service with authenticated client
      const googleAuth = new GoogleAuthService();
      const authClient = googleAuth.setCredentials({
        access_token: sheetsIntegration.accessToken,
        refresh_token: sheetsIntegration.refreshToken
      });

      const sheetsService = new GoogleSheetsService(authClient);

      // Create the client spreadsheet using Google API
      const spreadsheetResult = await sheetsService.createClientSpreadsheet(client.name, clientId);

      // Share with client if requested and email provided
      if (shareWithClient && clientEmail) {
        try {
          await sheetsService.shareSpreadsheet(spreadsheetResult.spreadsheetId, clientEmail, 'reader');
          console.log(`Shared spreadsheet with client: ${clientEmail}`);
        } catch (shareError) {
          console.warn(`Failed to share spreadsheet with client: ${shareError}`);
          // Continue despite sharing failure
        }
      }

      // Store in local database for dual storage
      const sheetRecord = await storage.createGoogleSheet({
        clientId,
        userId: req.user.id,
        spreadsheetId: spreadsheetResult.spreadsheetId,
        spreadsheetUrl: spreadsheetResult.spreadsheetUrl,
        dashboardType,
        permissions: {
          clientEmail: clientEmail || null,
          accessLevel: 'reader',
          sharedAt: shareWithClient && clientEmail ? new Date().toISOString() : undefined
        }
      });

      // Update integration status and settings
      const updatedIntegration = await storage.updateGoogleIntegration(sheetsIntegration.id, {
        lastSyncAt: new Date(),
        syncStatus: 'completed',
        errorMessage: null,
        settings: {
          dashboardType,
          shareWithClient,
          clientId,
          setupAt: new Date().toISOString()
        }
      });

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'sheets',
        operation: 'create',
        googleResourceId: spreadsheetResult.spreadsheetId,
        status: 'completed',
        requestPayload: { clientName: client.name, dashboardType, shareWithClient },
        responsePayload: { spreadsheetCreated: true, sharedWithClient: shareWithClient && !!clientEmail }
      });

      console.log(`Google Sheets dashboard created for client ${client.name}:`, {
        spreadsheetId: spreadsheetResult.spreadsheetId,
        sharedWithClient: shareWithClient && !!clientEmail
      });

      res.json({
        success: true,
        message: `Google Sheets dashboard created for ${client.name}`,
        data: {
          sheet: sheetRecord,
          googleSpreadsheet: spreadsheetResult,
          integration: updatedIntegration
        }
      });
    } catch (error: any) {
      console.error("Error setting up Google Sheets:", error);
      
      // Log error to sync logs if we have the required data
      if (req.body?.clientId) {
        try {
          await storage.createSyncLog({
            entityType: 'client',
            entityId: req.body.clientId,
            syncType: 'sheets',
            operation: 'create',
            googleResourceId: 'unknown',
            status: 'error',
            requestPayload: req.body,
            responsePayload: { error: error.message }
          });
        } catch (logError) {
          console.error("Failed to log sync error:", logError);
        }
      }

      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to setup Google Sheets dashboard" });
      }
    }
  });

  app.get("/api/google/sheets/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const sheet = await storage.getGoogleSheetByClientId(clientId);
      if (!sheet) {
        return res.status(404).json({ error: "Sheet not found" });
      }
      res.json(sheet);
    } catch (error) {
      console.error("Error fetching Google Sheet:", error);
      res.status(500).json({ error: "Failed to fetch sheet" });
    }
  });

  // Sync project data to Google Sheets (dual storage)
  app.post("/api/google/sheets/:clientId/sync-projects", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Validate client and sheet exist
      const [client, sheet] = await Promise.all([
        storage.getClientById(clientId),
        storage.getGoogleSheetByClientId(clientId)
      ]);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      if (!sheet) {
        return res.status(404).json({ error: "Google Sheets dashboard not found for this client" });
      }

      // Get projects for this client from local database
      const clientWithProjects = await storage.getClientWithProjects(clientId);
      const projects = clientWithProjects?.projects || [];

      // Get Google Sheets integration
      const sheetsIntegration = await storage.getGoogleIntegrationByUserAndService(req.user.id, 'sheets');
      if (!sheetsIntegration) {
        return res.status(400).json({ error: "Google Sheets integration not found" });
      }

      // Set up Google Sheets service
      const googleAuth = new GoogleAuthService();
      const authClient = googleAuth.setCredentials({
        access_token: sheetsIntegration.accessToken,
        refresh_token: sheetsIntegration.refreshToken
      });

      const sheetsService = new GoogleSheetsService(authClient);

      // Transform project data for Sheets
      const projectData = projects.map(project => ({
        name: project.name,
        status: project.status,
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
        estimatedCompletion: project.estimatedCompletion ? new Date(project.estimatedCompletion).toLocaleDateString() : '',
        progress: `${project.progress || 0}%`,
        serviceType: project.serviceType || 'General',
        priority: project.priority || 'Medium',
        lastUpdated: new Date(project.updatedAt).toLocaleDateString(),
        notes: project.description || '',
        nextAction: 'Review with client'
      }));

      // Update Google Sheets with project data
      if (projectData.length > 0) {
        await sheetsService.updateProjectData(sheet.spreadsheetId, projectData);
      }

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'sheets',
        operation: 'sync',
        googleResourceId: sheet.spreadsheetId,
        status: 'completed',
        requestPayload: { projectCount: projects.length },
        responsePayload: { projectsSynced: projectData.length }
      });

      res.json({
        success: true,
        message: `Synced ${projectData.length} projects to Google Sheets`,
        data: {
          projectsSynced: projectData.length,
          spreadsheetUrl: sheet.spreadsheetUrl
        }
      });
    } catch (error: any) {
      console.error("Error syncing projects to Google Sheets:", error);
      
      // Log error
      if (req.params.clientId) {
        try {
          await storage.createSyncLog({
            entityType: 'client',
            entityId: req.params.clientId,
            syncType: 'sheets',
            operation: 'sync',
            googleResourceId: 'unknown',
            status: 'error',
            requestPayload: {},
            responsePayload: { error: error.message }
          });
        } catch (logError) {
          console.error("Failed to log sync error:", logError);
        }
      }

      res.status(500).json({ error: "Failed to sync projects to Google Sheets" });
    }
  });

  // Sync consultation data to Google Sheets
  app.post("/api/google/sheets/:clientId/sync-consultations", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const [client, sheet] = await Promise.all([
        storage.getClientById(clientId),
        storage.getGoogleSheetByClientId(clientId)
      ]);
      
      if (!client || !sheet) {
        return res.status(404).json({ error: "Client or Google Sheets dashboard not found" });
      }

      // Get consultations for this client from local database
      const consultations = await storage.getConsultationsByClientId?.(clientId) || [];

      // Get Google Sheets integration
      const sheetsIntegration = await storage.getGoogleIntegrationByUserAndService(req.user.id, 'sheets');
      if (!sheetsIntegration) {
        return res.status(400).json({ error: "Google Sheets integration not found" });
      }

      // Set up Google Sheets service
      const googleAuth = new GoogleAuthService();
      const authClient = googleAuth.setCredentials({
        access_token: sheetsIntegration.accessToken,
        refresh_token: sheetsIntegration.refreshToken
      });

      const sheetsService = new GoogleSheetsService(authClient);

      // Transform consultation data for Sheets
      const consultationData = consultations.map(consultation => ({
        date: new Date(consultation.createdAt).toLocaleDateString(),
        time: new Date(consultation.createdAt).toLocaleTimeString(),
        type: consultation.type || 'General Consultation',
        status: consultation.status,
        meetingLink: consultation.meetingLink || '',
        notes: consultation.message || '',
        followupRequired: consultation.followUpRequired ? 'Yes' : 'No',
        nextSteps: consultation.nextSteps || 'TBD'
      }));

      // Update Google Sheets with consultation data
      if (consultationData.length > 0) {
        await sheetsService.updateConsultationsData(sheet.spreadsheetId, consultationData);
      }

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'sheets',
        operation: 'sync',
        googleResourceId: sheet.spreadsheetId,
        status: 'completed',
        requestPayload: { consultationCount: consultations.length },
        responsePayload: { consultationsSynced: consultationData.length }
      });

      res.json({
        success: true,
        message: `Synced ${consultationData.length} consultations to Google Sheets`,
        data: {
          consultationsSynced: consultationData.length,
          spreadsheetUrl: sheet.spreadsheetUrl
        }
      });
    } catch (error: any) {
      console.error("Error syncing consultations to Google Sheets:", error);
      res.status(500).json({ error: "Failed to sync consultations to Google Sheets" });
    }
  });

  // Sync document data to Google Sheets
  app.post("/api/google/sheets/:clientId/sync-documents", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const [client, sheet] = await Promise.all([
        storage.getClientById(clientId),
        storage.getGoogleSheetByClientId(clientId)
      ]);
      
      if (!client || !sheet) {
        return res.status(404).json({ error: "Client or Google Sheets dashboard not found" });
      }

      // Get documents for this client from local database
      const documents = await storage.getProjectDocumentsByClientId?.(clientId) || [];

      // Get Google Sheets integration
      const sheetsIntegration = await storage.getGoogleIntegrationByUserAndService(req.user.id, 'sheets');
      if (!sheetsIntegration) {
        return res.status(400).json({ error: "Google Sheets integration not found" });
      }

      // Set up Google Sheets service
      const googleAuth = new GoogleAuthService();
      const authClient = googleAuth.setCredentials({
        access_token: sheetsIntegration.accessToken,
        refresh_token: sheetsIntegration.refreshToken
      });

      const sheetsService = new GoogleSheetsService(authClient);

      // Transform document data for Sheets
      const documentData = documents.map(doc => ({
        name: doc.filename,
        type: doc.fileType || 'Document',
        uploadDate: new Date(doc.uploadedAt).toLocaleDateString(),
        status: doc.status || 'Uploaded',
        driveLink: doc.fileUrl || '',
        description: doc.description || ''
      }));

      // Update Google Sheets with document data
      if (documentData.length > 0) {
        await sheetsService.updateDocumentsData(sheet.spreadsheetId, documentData);
      }

      // Create sync log
      await storage.createSyncLog({
        entityType: 'client',
        entityId: clientId,
        syncType: 'sheets',
        operation: 'sync',
        googleResourceId: sheet.spreadsheetId,
        status: 'completed',
        requestPayload: { documentCount: documents.length },
        responsePayload: { documentsSynced: documentData.length }
      });

      res.json({
        success: true,
        message: `Synced ${documentData.length} documents to Google Sheets`,
        data: {
          documentsSynced: documentData.length,
          spreadsheetUrl: sheet.spreadsheetUrl
        }
      });
    } catch (error: any) {
      console.error("Error syncing documents to Google Sheets:", error);
      res.status(500).json({ error: "Failed to sync documents to Google Sheets" });
    }
  });

  app.post("/api/google/calendar/events", requireAuth, async (req, res) => {
    try {
      const validatedData = insertGoogleCalendarEventSchema.parse(req.body);
      const event = await storage.createGoogleCalendarEvent(validatedData);
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid event data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create event" });
      }
    }
  });

  app.get("/api/google/calendar/events/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const events = await storage.getGoogleCalendarEventsByClientId(clientId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/google/gmail/threads", requireAuth, async (req, res) => {
    try {
      const validatedData = insertGmailThreadSchema.parse(req.body);
      const thread = await storage.createGmailThread(validatedData);
      res.json(thread);
    } catch (error) {
      console.error("Error creating Gmail thread:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid thread data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create thread" });
      }
    }
  });

  app.get("/api/google/gmail/threads/:clientId", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const threads = await storage.getGmailThreadsByClientId(clientId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching Gmail threads:", error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.post("/api/google/sync", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSyncLogSchema.parse(req.body);
      const log = await storage.createSyncLog(validatedData);
      res.json(log);
    } catch (error) {
      console.error("Error creating sync log:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid sync data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create sync log" });
      }
    }
  });

  app.get("/api/google/sync/logs/:entityId", requireAuth, async (req, res) => {
    try {
      const { entityId } = req.params;
      const logs = await storage.getSyncLogsByEntityId(entityId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // SEO endpoints
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = req.protocol + '://' + req.get('host');
      const lastmod = new Date().toISOString();

      // Get all active services to include in sitemap
      const activeServices = await storage.getActiveServices();
      const serviceUrls = activeServices.map(service => `
  <url>
    <loc>${baseUrl}/services/${service.slug}</loc>
    <lastmod>${service.updatedAt ? new Date(service.updatedAt).toISOString() : lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/ai-employees</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/automation-discovery</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>${serviceUrls}
  <url>
    <loc>${baseUrl}/careers</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/support</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // ============================================
  // Automation Discovery Routes
  // ============================================

  // Submit automation discovery request (public endpoint)
  app.post("/api/automation-discovery", async (req, res) => {
    try {
      // Verify Turnstile token if provided
      const turnstileToken = req.body.turnstileToken;
      if (turnstileToken) {
        const isValidToken = await verifyTurnstileToken(turnstileToken);
        if (!isValidToken) {
          return res.status(400).json({
            success: false,
            message: "Bot verification failed. Please try again.",
          });
        }
      }

      const validatedData = insertAutomationDiscoverySchema.parse(req.body);
      const discovery = await storage.createAutomationDiscovery(validatedData);
      
      // Generate AI outline asynchronously
      generateAutomationOutline(discovery.id).catch(err => {
        console.error("Error generating automation outline:", err);
      });
      
      res.status(201).json({ 
        success: true, 
        message: "Your automation discovery request has been submitted. We'll analyze your needs and send you a personalized outline shortly.",
        requestId: discovery.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid form data", details: error.errors });
      } else {
        console.error("Error creating automation discovery:", error);
        res.status(500).json({ error: "Failed to submit request" });
      }
    }
  });

  // Get automation discovery request by ID (public - for confirmation page)
  app.get("/api/automation-discovery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const discovery = await storage.getAutomationDiscoveryById(id);
      
      if (!discovery) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      // Return limited data for public view
      res.json({
        id: discovery.id,
        contactName: discovery.contactName,
        companyName: discovery.companyName,
        processName: discovery.processName,
        status: discovery.status,
        aiOutline: discovery.aiOutline,
        createdAt: discovery.createdAt
      });
    } catch (error) {
      console.error("Error fetching automation discovery:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Admin: Get all automation discovery requests
  app.get("/api/admin/automation-discoveries", requireAuth, async (req, res) => {
    try {
      const discoveries = await storage.getAllAutomationDiscoveries();
      res.json(discoveries);
    } catch (error) {
      console.error("Error fetching automation discoveries:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Admin: Get automation discovery requests by status
  app.get("/api/admin/automation-discoveries/status/:status", requireAuth, async (req, res) => {
    try {
      const { status } = req.params;
      const discoveries = await storage.getAutomationDiscoveriesByStatus(status);
      res.json(discoveries);
    } catch (error) {
      console.error("Error fetching automation discoveries by status:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Admin: Get single automation discovery with full details
  app.get("/api/admin/automation-discoveries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const discovery = await storage.getAutomationDiscoveryById(id);
      
      if (!discovery) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(discovery);
    } catch (error) {
      console.error("Error fetching automation discovery:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Admin: Update automation discovery
  app.patch("/api/admin/automation-discoveries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateAutomationDiscoverySchema.parse(req.body);
      
      // If admin is reviewing, set reviewed fields
      if (updateData.status === 'reviewed') {
        updateData.reviewedBy = (req.user as any)?.id;
        updateData.reviewedAt = new Date();
      }
      
      const updated = await storage.updateAutomationDiscovery(id, updateData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid update data", details: error.errors });
      } else {
        console.error("Error updating automation discovery:", error);
        res.status(500).json({ error: "Failed to update request" });
      }
    }
  });

  // Admin: Regenerate AI outline
  app.post("/api/admin/automation-discoveries/:id/regenerate-outline", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const discovery = await storage.getAutomationDiscoveryById(id);
      
      if (!discovery) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      // Trigger outline regeneration
      await generateAutomationOutline(id);
      
      // Get updated discovery
      const updated = await storage.getAutomationDiscoveryById(id);
      res.json(updated);
    } catch (error) {
      console.error("Error regenerating outline:", error);
      res.status(500).json({ error: "Failed to regenerate outline" });
    }
  });

  // Admin: Merge AI outlines (best of both)
  app.post("/api/admin/automation-discoveries/:id/merge", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const discovery = await storage.getAutomationDiscoveryById(id);
      
      if (!discovery) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      if (!discovery.aiOutline || !(discovery as any).geminiOutline) {
        return res.status(400).json({ error: "Both OpenAI and Gemini outlines are required to merge" });
      }
      
      const openaiOutline = discovery.aiOutline;
      const geminiOutline = (discovery as any).geminiOutline;
      
      // Use AI to merge the best elements from both outlines
      const mergePrompt = `You are an expert AI consultant reviewing two automation proposals generated by different AI models.
Your task is to create a single, superior merged proposal that combines the best insights from both.

OPENAI PROPOSAL:
${JSON.stringify(openaiOutline, null, 2)}

GEMINI PROPOSAL:
${JSON.stringify(geminiOutline, null, 2)}

Create a merged proposal that:
1. Takes the clearer, more specific summary between the two
2. Combines unique insights from both recommended approaches
3. Merges the best solution steps, eliminating redundancy
4. Uses the more realistic timeline estimate
5. Provides the most accurate budget estimate
6. Combines all unique key benefits
7. Lists all potential challenges from both
8. Merges next steps into a comprehensive action plan
9. Combines additional recommendations

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{
  "summary": "Clear executive summary merging the best from both",
  "recommendedApproach": "Detailed approach combining best elements",
  "proposedSolution": ["Step 1", "Step 2", "..."],
  "estimatedTimeline": "Realistic timeline",
  "estimatedBudget": "Budget range",
  "keyBenefits": ["Benefit 1", "Benefit 2", "..."],
  "potentialChallenges": ["Challenge 1", "Challenge 2", "..."],
  "nextSteps": ["Step 1", "Step 2", "..."],
  "additionalRecommendations": "Combined recommendations"
}`;

      try {
        const mergeResponse = await openrouter.chat.completions.create({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: mergePrompt + "\n\nIMPORTANT: Do not hallucinate. Respond ONLY with valid JSON, no markdown fences." }
          ],
          temperature: 0.7,
          max_tokens: 8192,
        });
        
        const content = mergeResponse.choices?.[0]?.message?.content || "";
        const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const mergedOutline = JSON.parse(cleanedContent);
        
        mergedOutline.generatedAt = new Date().toISOString();
        mergedOutline.modelUsed = "DeepSeek V4 Pro (Merged)";
        
        // Update the discovery with the merged outline
        await storage.updateAutomationDiscovery(id, { mergedOutline } as any);
        
        const updated = await storage.getAutomationDiscoveryById(id);
        res.json(updated);
      } catch (aiError) {
        console.error("Error calling AI for merge:", aiError);
        res.status(500).json({ error: "Failed to generate merged outline" });
      }
    } catch (error) {
      console.error("Error merging outlines:", error);
      res.status(500).json({ error: "Failed to merge outlines" });
    }
  });

  // Admin: Delete automation discovery
  app.delete("/api/admin/automation-discoveries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAutomationDiscovery(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting automation discovery:", error);
      res.status(500).json({ error: "Failed to delete request" });
    }
  });

  // ============================================
  // ADMIN SUPPORT TICKETS (Client Portal)
  // ============================================

  // Admin: Get all support tickets across all clients
  app.get("/api/admin/support-tickets", requireAuth, async (req, res) => {
    try {
      const { status, priority, clientId } = req.query;
      
      let query = db.select({
        ticket: supportTickets,
        client: clients,
        portalUser: clientPortalUsers
      })
        .from(supportTickets)
        .leftJoin(clients, eq(supportTickets.clientId, clients.id))
        .leftJoin(clientPortalUsers, eq(supportTickets.portalUserId, clientPortalUsers.id))
        .orderBy(desc(supportTickets.updatedAt));
      
      const results = await query;
      
      // Get message counts for each ticket
      const ticketsWithCounts = await Promise.all(results.map(async (row) => {
        const messageCount = await db.select({ count: sql<number>`count(*)` })
          .from(supportMessages)
          .where(eq(supportMessages.ticketId, row.ticket.id));
        
        const unreadCount = await db.select({ count: sql<number>`count(*)` })
          .from(supportMessages)
          .where(and(
            eq(supportMessages.ticketId, row.ticket.id),
            eq(supportMessages.senderType, 'client'),
            isNull(supportMessages.readAt)
          ));
        
        return {
          ...row.ticket,
          clientName: row.client?.name || 'Unknown Client',
          clientSlug: row.client?.slug,
          portalUserName: row.portalUser?.name || 'Unknown User',
          portalUserEmail: row.portalUser?.email,
          messageCount: Number(messageCount[0]?.count || 0),
          unreadCount: Number(unreadCount[0]?.count || 0)
        };
      }));
      
      // Filter by status/priority/clientId if provided
      let filtered = ticketsWithCounts;
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }
      if (priority) {
        filtered = filtered.filter(t => t.priority === priority);
      }
      if (clientId) {
        filtered = filtered.filter(t => t.clientId === clientId);
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching admin support tickets:", error);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  // Admin: Get support ticket stats (MUST be before /:id route)
  app.get("/api/admin/support-tickets/stats", requireAuth, async (req, res) => {
    try {
      const openCount = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'));
      
      const inProgressCount = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'in_progress'));
      
      const waitingCount = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'waiting_on_client'));
      
      const resolvedCount = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'resolved'));
      
      const urgentCount = await db.select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(and(
          eq(supportTickets.priority, 'urgent'),
          or(eq(supportTickets.status, 'open'), eq(supportTickets.status, 'in_progress'))
        ));
      
      res.json({
        open: Number(openCount[0]?.count || 0),
        inProgress: Number(inProgressCount[0]?.count || 0),
        waitingOnClient: Number(waitingCount[0]?.count || 0),
        resolved: Number(resolvedCount[0]?.count || 0),
        urgent: Number(urgentCount[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching support ticket stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: Get single ticket with messages
  app.get("/api/admin/support-tickets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const ticketResult = await db.select({
        ticket: supportTickets,
        client: clients,
        portalUser: clientPortalUsers
      })
        .from(supportTickets)
        .leftJoin(clients, eq(supportTickets.clientId, clients.id))
        .leftJoin(clientPortalUsers, eq(supportTickets.portalUserId, clientPortalUsers.id))
        .where(eq(supportTickets.id, id))
        .limit(1);
      
      if (!ticketResult.length) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const messages = await db.select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, id))
        .orderBy(supportMessages.createdAt);
      
      // Mark client messages as read
      await db.update(supportMessages)
        .set({ readAt: new Date() })
        .where(and(
          eq(supportMessages.ticketId, id),
          eq(supportMessages.senderType, 'client'),
          isNull(supportMessages.readAt)
        ));
      
      res.json({
        ...ticketResult[0].ticket,
        clientName: ticketResult[0].client?.name || 'Unknown Client',
        clientSlug: ticketResult[0].client?.slug,
        portalUserName: ticketResult[0].portalUser?.name || 'Unknown User',
        portalUserEmail: ticketResult[0].portalUser?.email,
        messages
      });
    } catch (error) {
      console.error("Error fetching admin support ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  // Admin: Reply to ticket
  app.post("/api/admin/support-tickets/:id/reply", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content, isInternal } = req.body;
      const adminUser = req.user as { id: string; email: string };
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Check ticket exists
      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
      if (!ticket.length) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      // Create message
      const [message] = await db.insert(supportMessages).values({
        ticketId: id,
        senderId: adminUser.id,
        senderType: 'admin',
        content: content.trim(),
        isInternal: isInternal || false
      }).returning();
      
      // Update ticket status and last reply time
      await db.update(supportTickets)
        .set({ 
          lastReplyAt: new Date(),
          updatedAt: new Date(),
          status: isInternal ? ticket[0].status : 'waiting_on_client'
        })
        .where(eq(supportTickets.id, id));
      
      res.json(message);
    } catch (error) {
      console.error("Error replying to support ticket:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  // Admin: Update ticket status/priority/assignment
  app.patch("/api/admin/support-tickets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority, assignedTo } = req.body;
      
      const updates: any = { updatedAt: new Date() };
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (status === 'resolved') updates.resolvedAt = new Date();
      
      const [updated] = await db.update(supportTickets)
        .set(updates)
        .where(eq(supportTickets.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // ============================================
  // CHATBOT ADMIN API (Transferable Module)
  // ============================================

  // Get chatbot configuration
  app.get("/api/admin/chatbot/config", requireAuth, async (req, res) => {
    try {
      const config = await storage.getChatbotConfig();
      res.json(config || {});
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
      res.status(500).json({ error: "Failed to fetch chatbot configuration" });
    }
  });

  // Update chatbot configuration
  app.put("/api/admin/chatbot/config", requireAuth, async (req, res) => {
    try {
      const config = await storage.updateChatbotConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating chatbot config:", error);
      res.status(500).json({ error: "Failed to update chatbot configuration" });
    }
  });

  // Get all knowledge base entries
  app.get("/api/admin/chatbot/knowledge", requireAuth, async (req, res) => {
    try {
      const knowledge = await storage.getChatbotKnowledgeBase();
      res.json(knowledge);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ error: "Failed to fetch knowledge base" });
    }
  });

  // Create knowledge base entry
  app.post("/api/admin/chatbot/knowledge", requireAuth, async (req, res) => {
    try {
      const entry = await storage.createChatbotKnowledge(req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error creating knowledge entry:", error);
      res.status(500).json({ error: "Failed to create knowledge entry" });
    }
  });

  // Get single knowledge base entry
  app.get("/api/admin/chatbot/knowledge/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getChatbotKnowledgeById(id);
      if (!entry) {
        return res.status(404).json({ error: "Knowledge entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching knowledge entry:", error);
      res.status(500).json({ error: "Failed to fetch knowledge entry" });
    }
  });

  // Update knowledge base entry
  app.put("/api/admin/chatbot/knowledge/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.updateChatbotKnowledge(id, req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error updating knowledge entry:", error);
      res.status(500).json({ error: "Failed to update knowledge entry" });
    }
  });

  // Delete knowledge base entry
  app.delete("/api/admin/chatbot/knowledge/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChatbotKnowledge(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge entry:", error);
      res.status(500).json({ error: "Failed to delete knowledge entry" });
    }
  });

  // Search knowledge base
  app.get("/api/admin/chatbot/knowledge/search/:query", requireAuth, async (req, res) => {
    try {
      const results = await storage.searchChatbotKnowledge(req.params.query);
      res.json(results);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });

  // Test chatbot response (preview mode)
  app.post("/api/admin/chatbot/test", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const config = await storage.getChatbotConfig();
      const knowledge = await storage.searchChatbotKnowledge(message);
      
      if (!config) {
        return res.status(400).json({ error: "Chatbot not configured" });
      }

      // Build knowledge context
      const knowledgeContext = knowledge.length > 0 
        ? `\n\nRelevant Knowledge Base:\n${knowledge.map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n')}`
        : '';

      const chatbotResponse = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${config.systemPrompt}${knowledgeContext}\n\nUser message: ${message}` }],
          },
        ],
        config: { maxOutputTokens: config.maxResponseLength || 500 },
      });

      res.json({ 
        response: chatbotResponse.text || "No response generated",
        knowledgeUsed: knowledge.map(k => k.question)
      });
    } catch (error) {
      console.error("Error testing chatbot:", error);
      res.status(500).json({ error: "Failed to test chatbot response" });
    }
  });

  const server = httpServer || createServer(app);

  // WebSocket server implementation with noServer mode for better proxy compatibility
  const wss = new WebSocketServer({ noServer: true });
  
  // Handle WebSocket upgrade manually for better compatibility with Replit's proxy
  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0] || '';
    console.log('WebSocket upgrade request for path:', pathname);
    
    // Only handle /ws path, let Vite handle its own HMR upgrades
    if (pathname === '/ws') {
      console.log('Handling /ws upgrade');
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('WebSocket upgrade completed');
        wss.emit('connection', ws, request);
      });
    } else {
      console.log('Ignoring upgrade for path:', pathname);
    }
  });
  
  // Track connected clients and admin users
  const connectedClients = new Map<string, {
    ws: WebSocket;
    sessionId?: string;
    userId?: string;
    userType: 'visitor' | 'admin';
    visitorInfo?: any;
    lastPing?: number;
  }>();

  // AI response throttling - prevent spam by limiting requests per session
  const aiResponseThrottle = new Map<string, number>();
  const AI_THROTTLE_MS = 2000; // Minimum 2 seconds between AI responses per session

  // Helper function to broadcast message to specific session participants
  const broadcastToSession = (sessionId: string, message: any, excludeUserId?: string) => {
    for (const [userId, client] of connectedClients) {
      if (client.sessionId === sessionId && 
          client.ws.readyState === WebSocket.OPEN && 
          userId !== excludeUserId) {
        client.ws.send(JSON.stringify(message));
      }
    }
  };

  // Helper function to broadcast to all admins
  const broadcastToAdmins = (message: any, excludeUserId?: string) => {
    for (const [userId, client] of connectedClients) {
      if (client.userType === 'admin' && 
          client.ws.readyState === WebSocket.OPEN && 
          userId !== excludeUserId) {
        client.ws.send(JSON.stringify(message));
      }
    }
  };

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    const connectionId = Math.random().toString(36).substring(7);
    let currentSessionId: string | undefined;
    let currentUserId: string | undefined;
    let userType: 'visitor' | 'admin' = 'visitor';

    // Add client to connected clients map
    connectedClients.set(connectionId, {
      ws,
      userType,
      lastPing: Date.now()
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString()
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type);

        switch (message.type) {
          case 'ping':
            // Update last ping and respond with pong
            const client = connectedClients.get(connectionId);
            if (client) {
              client.lastPing = Date.now();
            }
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

          case 'visitor_join':
            // Visitor wants to start or update a chat session
            try {
              const visitorInfo = message.visitorInfo || {};
              const visitorId = message.visitorId || `visitor_${connectionId}`;
              const existingSessionId = message.sessionId || currentSessionId;
              
              if (existingSessionId) {
                // Update existing session with new visitor info
                await storage.updateChatSession(existingSessionId, {
                  visitorInfo: visitorInfo
                });

                const clientInfo = connectedClients.get(connectionId);
                if (clientInfo) {
                  clientInfo.visitorInfo = visitorInfo;
                }

                console.log(`Updated chat session ${existingSessionId} with visitor info`);

                // Notify admins of the update
                broadcastToAdmins({
                  type: 'chat_session_updated',
                  sessionId: existingSessionId,
                  visitorInfo,
                  timestamp: new Date().toISOString()
                });

                return;
              }

              // Create new chat session
              const session = await storage.createChatSession({
                visitorId,
                visitorInfo,
                status: 'waiting'
              });

              currentSessionId = session.id;
              currentUserId = visitorId;

              // Add visitor as participant
              await storage.addChatParticipant({
                sessionId: session.id,
                participantId: visitorId,
                participantType: 'visitor'
              });

              // Update client info
              const clientInfo = connectedClients.get(connectionId);
              if (clientInfo) {
                clientInfo.sessionId = session.id;
                clientInfo.userId = visitorId;
                clientInfo.visitorInfo = visitorInfo;
              }

              // Send session created confirmation to visitor
              ws.send(JSON.stringify({
                type: 'session_created',
                sessionId: session.id,
                visitorId,
                status: 'waiting',
                timestamp: new Date().toISOString()
              }));

              // Send AI greeting immediately so visitor isn't stuck in "waiting"
              setImmediate(async () => {
                try {
                  const chatbotCfg = await storage.getChatbotConfig();
                  if (chatbotCfg?.isEnabled) {
                    const greetingText = chatbotCfg.greetingMessage || "Hi! I'm the Steel City AI assistant. How can I help you today?";
                    const greetingMsg = await storage.createChatMessage({
                      sessionId: session.id,
                      senderId: 'ai-assistant',
                      senderType: 'admin',
                      messageType: 'text',
                      content: greetingText
                    });
                    ws.send(JSON.stringify({
                      type: 'new_message',
                      message: greetingMsg,
                      isAiResponse: true,
                      timestamp: new Date().toISOString()
                    }));
                  }
                } catch (greetErr) {
                  console.error('Failed to send greeting:', greetErr);
                }
              });

              // Notify all admins of new chat session
              broadcastToAdmins({
                type: 'new_chat_session',
                session: {
                  id: session.id,
                  visitorId,
                  visitorInfo,
                  status: 'waiting',
                  startedAt: session.startedAt
                },
                timestamp: new Date().toISOString()
              });

            } catch (error) {
              console.error('Error handling visitor join:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join chat session',
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case 'admin_join':
            // Admin joins the system
            try {
              const adminId = message.adminId;
              if (!adminId) {
                throw new Error('Admin ID required');
              }

              currentUserId = adminId;
              userType = 'admin';

              // Update client info
              const clientInfo = connectedClients.get(connectionId);
              if (clientInfo) {
                clientInfo.userId = adminId;
                clientInfo.userType = 'admin';
              }

              // Send admin connected confirmation
              ws.send(JSON.stringify({
                type: 'admin_connected',
                adminId,
                timestamp: new Date().toISOString()
              }));

              // Send current active sessions to admin
              const activeSessions = await storage.getActiveChatSessions();
              ws.send(JSON.stringify({
                type: 'active_sessions',
                sessions: activeSessions,
                timestamp: new Date().toISOString()
              }));

            } catch (error) {
              console.error('Error connecting admin:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to connect admin',
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case 'join_session':
            // Admin joins a specific chat session
            try {
              const { sessionId, adminId } = message;
              if (!sessionId || !adminId) {
                throw new Error('Session ID and Admin ID required');
              }

              currentSessionId = sessionId;

              // Update session with admin
              await storage.updateChatSession(sessionId, {
                adminId,
                status: 'active'
              });

              // Add admin as participant
              await storage.addChatParticipant({
                sessionId,
                participantId: adminId,
                participantType: 'admin'
              });

              // Update client info
              const clientInfo = connectedClients.get(connectionId);
              if (clientInfo) {
                clientInfo.sessionId = sessionId;
              }

              // Notify visitor that admin joined
              broadcastToSession(sessionId, {
                type: 'admin_joined',
                sessionId,
                adminId,
                timestamp: new Date().toISOString()
              }, adminId);

              // Send session history to admin
              const sessionWithMessages = await storage.getChatSessionWithMessages(sessionId);
              ws.send(JSON.stringify({
                type: 'session_history',
                session: sessionWithMessages,
                timestamp: new Date().toISOString()
              }));

            } catch (error) {
              console.error('Error joining session:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join session',
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case 'send_message':
            // Send a chat message
            try {
              const { sessionId, content, messageType = 'text' } = message;
              if (!sessionId || !content || !currentUserId) {
                throw new Error('Session ID, content, and user ID required');
              }

              // Save message to database
              const chatMessage = await storage.createChatMessage({
                sessionId,
                senderId: currentUserId,
                senderType: userType,
                messageType,
                content
              });

              // Broadcast message to all session participants
              broadcastToSession(sessionId, {
                type: 'new_message',
                message: chatMessage,
                timestamp: new Date().toISOString()
              });

              // AI Chatbot: Auto-respond to visitor messages when no admin is present
              if (userType === 'visitor') {
                // Check if any admin is in this session
                let adminInSession = false;
                for (const [, client] of connectedClients) {
                  if (client.sessionId === sessionId && client.userType === 'admin') {
                    adminInSession = true;
                    break;
                  }
                }

                // If no admin is present, generate AI response
                if (!adminInSession) {
                  // Check throttle - prevent spam
                  const lastAiResponse = aiResponseThrottle.get(sessionId);
                  const now = Date.now();
                  if (lastAiResponse && (now - lastAiResponse) < AI_THROTTLE_MS) {
                    console.log(`AI response throttled for session ${sessionId}`);
                    return; // Skip this AI response
                  }
                  aiResponseThrottle.set(sessionId, now);

                  try {
                    // Get session context for the AI
                    const session = await storage.getChatSessionById(sessionId);
                    const recentMessages = await storage.getChatMessagesBySessionId(sessionId);
                    
                    // Build conversation history for context (last 10 messages, excluding the one we just received)
                    const conversationHistory = recentMessages
                      .slice(-11, -1) // Get last 10 messages before the current one
                      .map(msg => ({
                        role: msg.senderType === 'visitor' ? 'user' as const : 'assistant' as const,
                        content: msg.content
                      }));

                    // Show typing indicator
                    broadcastToSession(sessionId, {
                      type: 'user_typing',
                      sessionId,
                      userId: 'ai-assistant',
                      userType: 'admin',
                      isTyping: true,
                      timestamp: new Date().toISOString()
                    });

                    // Get chatbot configuration from database (Transferable Module)
                    const chatbotConfiguration = await storage.getChatbotConfig();
                    
                    // Check if chatbot is enabled
                    if (!chatbotConfiguration?.isEnabled) {
                      console.log('Chatbot is disabled, skipping AI response');
                      broadcastToSession(sessionId, {
                        type: 'user_typing',
                        sessionId,
                        userId: 'ai-assistant',
                        userType: 'admin',
                        isTyping: false,
                        timestamp: new Date().toISOString()
                      });
                      return;
                    }

                    // Search knowledge base for relevant information
                    const relevantKnowledge = await storage.searchChatbotKnowledge(content);
                    const knowledgeContext = relevantKnowledge.length > 0
                      ? `\n\nRelevant Knowledge Base Information:\n${relevantKnowledge.slice(0, 3).map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n')}`
                      : '';

                    // Build system prompt with visitor info
                    const visitorContext = session?.visitorInfo 
                      ? `\n\nVisitor info: Name: ${session.visitorInfo.name || 'Unknown'}, Email: ${session.visitorInfo.email || 'Unknown'}, Company: ${session.visitorInfo.company || 'Not provided'}`
                      : '';

                    const systemPrompt = chatbotConfiguration?.systemPrompt || 
                      'You are a helpful AI assistant. Be concise and professional.';

                    // Generate AI response using Gemini 3.1 Pro
                    const chatHistory = conversationHistory.map((msg: any) => 
                      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                    ).join('\n');
                    const fullPrompt = `${systemPrompt}${knowledgeContext}${visitorContext}\n\n${chatHistory ? `Conversation so far:\n${chatHistory}\n\n` : ''}User: ${content}`;
                    
                    const aiResponse = await gemini.models.generateContent({
                      model: 'gemini-2.5-flash',
                      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                      config: { 
                        maxOutputTokens: chatbotConfiguration?.maxResponseLength || 500,
                        temperature: 0.7,
                      },
                    });

                    // Stop typing indicator
                    broadcastToSession(sessionId, {
                      type: 'user_typing',
                      sessionId,
                      userId: 'ai-assistant',
                      userType: 'admin',
                      isTyping: false,
                      timestamp: new Date().toISOString()
                    });

                    const aiContent = aiResponse.text;
                    if (aiContent) {
                      // Save AI message to database
                      const aiMessage = await storage.createChatMessage({
                        sessionId,
                        senderId: 'ai-assistant',
                        senderType: 'admin',
                        messageType: 'text',
                        content: aiContent
                      });

                      // Broadcast AI message
                      broadcastToSession(sessionId, {
                        type: 'new_message',
                        message: aiMessage,
                        isAiResponse: true,
                        timestamp: new Date().toISOString()
                      });
                    }
                  } catch (aiError) {
                    console.error('AI chatbot error:', aiError);
                    
                    // Stop typing indicator
                    broadcastToSession(sessionId, {
                      type: 'user_typing',
                      sessionId,
                      userId: 'ai-assistant',
                      userType: 'admin',
                      isTyping: false,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Send fallback message to user
                    try {
                      const fallbackMessage = await storage.createChatMessage({
                        sessionId,
                        senderId: 'ai-assistant',
                        senderType: 'admin',
                        messageType: 'text',
                        content: "Thanks for your message! I'm having a brief technical hiccup. A team member will be with you shortly, or feel free to continue - I'll try to respond to your next message."
                      });
                      
                      broadcastToSession(sessionId, {
                        type: 'new_message',
                        message: fallbackMessage,
                        isAiResponse: true,
                        timestamp: new Date().toISOString()
                      });
                    } catch (fallbackError) {
                      console.error('Failed to send fallback message:', fallbackError);
                    }
                  }
                }
              }

            } catch (error) {
              console.error('Error sending message:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to send message',
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case 'typing_start':
            // User started typing
            if (currentSessionId && currentUserId) {
              broadcastToSession(currentSessionId, {
                type: 'user_typing',
                sessionId: currentSessionId,
                userId: currentUserId,
                userType,
                isTyping: true,
                timestamp: new Date().toISOString()
              }, currentUserId);
            }
            break;

          case 'typing_stop':
            // User stopped typing
            if (currentSessionId && currentUserId) {
              broadcastToSession(currentSessionId, {
                type: 'user_typing',
                sessionId: currentSessionId,
                userId: currentUserId,
                userType,
                isTyping: false,
                timestamp: new Date().toISOString()
              }, currentUserId);
            }
            break;

          case 'end_session':
            // End chat session
            try {
              const { sessionId, notes } = message;
              if (!sessionId) {
                throw new Error('Session ID required');
              }

              await storage.endChatSession(sessionId, notes);

              // Notify all session participants
              broadcastToSession(sessionId, {
                type: 'session_ended',
                sessionId,
                timestamp: new Date().toISOString()
              });

              // Clear session from connected clients
              currentSessionId = undefined;
              const clientInfo = connectedClients.get(connectionId);
              if (clientInfo) {
                clientInfo.sessionId = undefined;
              }

            } catch (error) {
              console.error('Error ending session:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to end session',
                timestamp: new Date().toISOString()
              }));
            }
            break;

          case 'mark_messages_read':
            // Mark messages as read
            try {
              const { sessionId } = message;
              if (!sessionId || !currentUserId) {
                throw new Error('Session ID and user ID required');
              }

              await storage.markMessagesAsRead(sessionId, currentUserId);

              broadcastToSession(sessionId, {
                type: 'messages_read',
                sessionId,
                userId: currentUserId,
                timestamp: new Date().toISOString()
              }, currentUserId);

            } catch (error) {
              console.error('Error marking messages as read:', error);
            }
            break;

          default:
            console.log('Unknown message type:', message.type);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
              timestamp: new Date().toISOString()
            }));
        }

      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      
      try {
        // Update participant status if in a session
        if (currentSessionId && currentUserId) {
          await storage.updateParticipantStatus(currentSessionId, currentUserId, false);
          
          // Notify other participants
          broadcastToSession(currentSessionId, {
            type: 'user_disconnected',
            sessionId: currentSessionId,
            userId: currentUserId,
            userType,
            timestamp: new Date().toISOString()
          }, currentUserId);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }

      // Remove from connected clients
      connectedClients.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(connectionId);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = Date.now();
    for (const [connectionId, client] of connectedClients) {
      if (client.lastPing && (now - client.lastPing > 60000)) { // 1 minute timeout
        console.log('Removing stale connection:', connectionId);
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.close();
        }
        connectedClients.delete(connectionId);
      }
    }
  }, 30000); // Check every 30 seconds

  console.log('WebSocket server initialized on /ws path');

  return server;
}
