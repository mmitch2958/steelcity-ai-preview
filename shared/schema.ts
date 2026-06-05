import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, index, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper function to validate and format pricing - STRICT validation
const validateAndFormatCurrency = (value: string): string => {
  // Allow explicit custom pricing text
  if (value.toLowerCase().includes('custom') || value.toLowerCase().includes('contact')) {
    return value
  }
  
  // Strict validation: reject malformed inputs like ",000" or "00"
  const normalizedValue = value.replace(/[^0-9.,]/g, '').trim()
  
  // Reject empty or invalid patterns
  if (!normalizedValue || normalizedValue.startsWith(',') || normalizedValue.endsWith(',')) {
    throw new Error(`Invalid currency format: "${value}". Use formats like "500", "1,200", or "$1,500"`)
  }
  
  // Reject decimal inputs - these should be whole dollar amounts
  if (normalizedValue.includes('.')) {
    throw new Error(`Invalid currency format: "${value}". Use whole dollar amounts without decimals (e.g., "1500" not "1500.00")`)
  }
  
  // Handle comma-separated numbers (including multi-comma like "1,200,000")
  if (normalizedValue.includes(',')) {
    // Validate proper comma formatting: groups of 3 digits from right
    const parts = normalizedValue.split(',')
    
    // First part can be 1-3 digits, subsequent parts must be exactly 3 digits
    if (parts[0].length === 0 || parts[0].length > 3) {
      throw new Error(`Invalid currency format: "${value}". First number group should be 1-3 digits`)
    }
    
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length !== 3) {
        throw new Error(`Invalid currency format: "${value}". Each comma-separated group must be exactly 3 digits`)
      }
    }
    
    const number = parseInt(normalizedValue.replace(/,/g, ''))
    if (isNaN(number) || number <= 0) {
      throw new Error(`Invalid currency amount: "${value}"`)
    }
    return `$${number.toLocaleString()}`
  }
  
  // Handle simple numbers
  const number = parseInt(normalizedValue)
  if (isNaN(number) || number <= 0) {
    throw new Error(`Invalid currency amount: "${value}"`)
  }
  return `$${number.toLocaleString()}`
}

// Strict pricing validation schemas - reject malformed data
const pricingPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  price: z.string().min(1, 'Price is required').refine((val) => {
    try {
      validateAndFormatCurrency(val)
      return true
    } catch (error) {
      console.error('Price validation failed:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }, {
    message: 'Invalid price format. Use valid currency (e.g., "500", "1,200") or "Custom pricing"'
  }),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  popular: z.boolean().default(false)
}).transform((data) => ({
  ...data,
  price: validateAndFormatCurrency(data.price)
}))

const pricingSchema = z.object({
  pricingModel: z.enum(['monthly', 'yearly', 'custom', 'fixed', 'hourly', 'consultation']),
  startingPrice: z.string().min(1, 'Starting price is required').refine((val) => {
    // Handle "From $X" patterns
    const fromMatch = val.match(/from\s*\$?([0-9,]+)/i)
    if (fromMatch) {
      try {
        validateAndFormatCurrency(fromMatch[1])
        return true
      } catch (error) {
        console.error('Starting price validation failed:', error instanceof Error ? error.message : 'Unknown error')
        return false
      }
    }
    // Handle direct currency or custom pricing
    try {
      validateAndFormatCurrency(val)
      return true
    } catch (error) {
      console.error('Starting price validation failed:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }, {
    message: 'Invalid starting price format. Use "From $X" format with valid currency or "Custom pricing"'
  }),
  packages: z.array(pricingPackageSchema).min(1, 'At least one pricing package is required')
}).transform((data) => ({
  ...data,
  startingPrice: (() => {
    const fromMatch = data.startingPrice.match(/from\s*\$?([0-9,]+)/i)
    if (fromMatch) {
      return `From ${validateAndFormatCurrency(fromMatch[1])}`
    }
    return validateAndFormatCurrency(data.startingPrice)
  })()
}))

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Contact inquiries table (updated with client link and consultation data)
export const contactInquiries = pgTable("contact_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  service: text("service"),
  message: text("message").notNull(),
  clientId: varchar("client_id"), // Optional FK to clients table
  consultationData: jsonb("consultation_data").$type<{
    // Client Information
    phone?: string;
    jobTitle?: string;
    
    // Project Information
    projectType?: string;
    projectDescription?: string;
    currentChallenges?: string;
    goals?: string;
    timeline?: string;
    budget?: string;
    
    // Services Interest
    servicesInterested?: string[];
    
    // Additional Information
    hasExistingAI?: boolean;
    teamSize?: string;
    urgency?: string;
    preferredContactMethod?: string;
    additionalNotes?: string;
  }>(), // Store detailed consultation data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("new").notNull(), // new, contacted, qualified, converted, closed
});

// Clients table for client management
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  notes: text("notes"),
  slug: text("slug").unique(), // URL-friendly identifier for client portal (e.g., "coldwell" for /coldwell)
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for billing
  status: text("status").default("active").notNull(), // active, inactive, archived
  hasSocialAccess: boolean("has_social_access").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects table for tracking client projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("prospect").notNull(), // prospect, discovery, in_progress, qa, delivered, on_hold
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  budget: text("budget"), // Budget as text to allow custom formats
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("projects_client_id_idx").on(table.clientId),
  index("projects_client_status_idx").on(table.clientId, table.status),
]);

// Project notes for timeline tracking
export const projectNotes = pgTable("project_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("project_notes_project_id_idx").on(table.projectId),
]);

// Project documents for file management
export const projectDocuments = pgTable("project_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  filename: text("filename").notNull(), // Generated unique filename
  originalName: text("original_name").notNull(), // Original user filename
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(),
  uploadPath: text("upload_path").notNull(), // Storage path
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("project_documents_project_id_idx").on(table.projectId),
]);

// Case studies result type for type safety
const resultSchema = z.object({
  label: z.string(),
  value: z.string(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  features: text("features").array().notNull(),
  benefits: text("benefits").array(),
  pricing: jsonb("pricing").$type<{
    startingPrice?: string;
    pricingModel: 'fixed' | 'hourly' | 'monthly' | 'custom' | 'consultation';
    packages?: Array<{
      name: string;
      price: string;
      features: string[];
      popular?: boolean;
    }>;
  }>(),
  deliveryTime: text("delivery_time"),
  iconUrl: text("icon_url"),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  tags: text("tags").array(),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Case studies table
export const caseStudies = pgTable("case_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  duration: text("duration").notNull(),
  tags: text("tags").array().notNull(),
  results: jsonb("results").$type<Array<{ label: string; value: string }>>().notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({
  id: true,
  createdAt: true,
  status: true,
  clientId: true, // Exclude clientId from public form submissions
});

// Consultation-specific validation schema
export const consultationDataSchema = z.object({
  // Client Information
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  
  // Project Information
  projectType: z.string().optional(),
  projectDescription: z.string().optional(),
  currentChallenges: z.string().optional(),
  goals: z.string().optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  
  // Services Interest
  servicesInterested: z.array(z.string()).default([]),
  
  // Additional Information
  hasExistingAI: z.boolean().default(false),
  teamSize: z.string().optional(),
  urgency: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  additionalNotes: z.string().optional(),
});

// Enhanced consultation request schema
export const insertConsultationSchema = insertContactInquirySchema.extend({
  consultationData: consultationDataSchema.optional(),
});

// Client management schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const updateClientSchema = insertClientSchema.partial();

// Project management schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(['prospect', 'discovery', 'in_progress', 'qa', 'delivered', 'on_hold']).default('prospect'),
  progress: z.number().min(0).max(100).default(0),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const updateProjectSchema = insertProjectSchema.partial();

// Project note schemas
export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({
  id: true,
  createdAt: true,
});

// Project document schemas
export const insertProjectDocumentSchema = createInsertSchema(projectDocuments).omit({
  id: true,
  createdAt: true,
});

// File upload validation schema
export const fileUploadSchema = z.object({
  originalName: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0").max(50 * 1024 * 1024, "File size must be less than 50MB"), // 50MB limit
});

// Convert contact inquiry to client schema (enhanced for consultations)
export const convertInquiryToClientSchema = z.object({
  inquiryId: z.string().min(1, "Inquiry ID is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  // Optional project creation from consultation data
  createProject: z.boolean().default(false),
  projectTitle: z.string().optional(),
  projectDescription: z.string().optional(),
  projectBudget: z.string().optional(),
  projectTimeline: z.string().optional(),
});

export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
}).extend({
  results: z.array(resultSchema),
});

// Base service schema for creation
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).superRefine((data, ctx) => {
  // If pricing is provided, it must be valid - no bypassing
  if (data.pricing !== null && data.pricing !== undefined) {
    try {
      pricingSchema.parse(data.pricing)
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pricing'],
          message: 'Invalid pricing data: ' + error.errors.map(e => e.message).join(', ')
        })
      }
    }
  }
}).transform((data) => ({
  ...data,
  pricing: data.pricing ? pricingSchema.parse(data.pricing) : null
}))

// Separate schema for updates that preserves existing pricing when not provided
export const updateServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().superRefine((data, ctx) => {
  // Only validate pricing if it's explicitly provided
  if (data.pricing !== null && data.pricing !== undefined) {
    try {
      pricingSchema.parse(data.pricing)
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pricing'],
          message: 'Invalid pricing data: ' + error.errors.map(e => e.message).join(', ')
        })
      }
    }
  }
}).transform((data) => {
  const result: any = { ...data }
  // Only transform pricing if it was explicitly provided
  if (data.pricing !== undefined) {
    result.pricing = data.pricing ? pricingSchema.parse(data.pricing) : null
  }
  return result
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type ConsultationData = z.infer<typeof consultationDataSchema>;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type UpdateService = z.infer<typeof updateServiceSchema>;
export type Service = typeof services.$inferSelect;

// Client management types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;
export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type ConvertInquiryToClient = z.infer<typeof convertInquiryToClientSchema>;

// Extended types with relationships
export type ClientWithProjects = Client & {
  projects: Project[];
};

export type ProjectWithDetails = Project & {
  notes: ProjectNote[];
  documents: ProjectDocument[];
  client: Client;
};

export type ProjectStatus = 'prospect' | 'discovery' | 'in_progress' | 'qa' | 'delivered' | 'on_hold';

// Chat sessions table for managing live chat conversations
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"), // Optional FK to clients table
  visitorId: varchar("visitor_id"), // Unique ID for anonymous visitors
  consultationId: varchar("consultation_id"), // Optional FK to consultation inquiry
  visitorInfo: jsonb("visitor_info").$type<{
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    currentPage?: string;
  }>(),
  status: text("status").default("waiting").notNull(), // waiting, active, ended, transferred, abandoned
  adminId: varchar("admin_id"), // Admin handling the chat
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  satisfactionRating: integer("satisfaction_rating"), // 1-5 rating after chat
  tags: text("tags").array(), // For categorizing chats
  notes: text("notes"), // Admin notes about the session
  escalatedAt: timestamp("escalated_at"), // When chat was escalated to consultation
}, (table) => [
  index("chat_sessions_status_idx").on(table.status),
  index("chat_sessions_client_id_idx").on(table.clientId),
  index("chat_sessions_last_message_idx").on(table.lastMessageAt),
]);

// Chat messages table for storing all chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  senderId: varchar("sender_id"), // Either adminId or visitorId
  senderType: text("sender_type").notNull(), // 'admin', 'visitor', 'system'
  messageType: text("message_type").default("text").notNull(), // text, image, file, system_notification
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileUrl?: string;
    isTyping?: boolean;
    readBy?: string[];
    edited?: boolean;
    editedAt?: string;
  }>(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
}, (table) => [
  index("chat_messages_session_id_idx").on(table.sessionId),
  index("chat_messages_session_sent_idx").on(table.sessionId, table.sentAt),
]);

// Chat participants table for tracking who's in each session
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  participantId: varchar("participant_id").notNull(), // adminId or visitorId
  participantType: text("participant_type").notNull(), // 'admin', 'visitor'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  isOnline: boolean("is_online").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => [
  index("chat_participants_session_id_idx").on(table.sessionId),
]);

// Chat session schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  startedAt: true,
  lastMessageAt: true,
}).extend({
  status: z.enum(['waiting', 'active', 'ended', 'transferred', 'abandoned']).default('waiting'),
});

export const updateChatSessionSchema = insertChatSessionSchema.partial();

// Chat message schemas
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  readAt: true,
}).extend({
  senderType: z.enum(['admin', 'visitor', 'system']),
  messageType: z.enum(['text', 'image', 'file', 'system_notification']).default('text'),
});

export const updateChatMessageSchema = insertChatMessageSchema.partial();

// Chat participant schemas
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
  lastSeenAt: true,
}).extend({
  participantType: z.enum(['admin', 'visitor']),
});

// Chat session types
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type UpdateChatSession = z.infer<typeof updateChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UpdateChatMessage = z.infer<typeof updateChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Extended chat types with relationships
export type ChatSessionWithMessages = ChatSession & {
  messages: ChatMessage[];
  participants: ChatParticipant[];
  client?: Client;
};

export type ChatSessionSummary = ChatSession & {
  messageCount: number;
  lastMessage?: ChatMessage;
  visitorName?: string;
};

export type ChatStatus = 'waiting' | 'active' | 'ended' | 'transferred' | 'abandoned';
export type MessageType = 'text' | 'image' | 'file' | 'system_notification';
export type ParticipantType = 'admin' | 'visitor';
export type SenderType = 'admin' | 'visitor' | 'system';

// Automation Discovery Requests table
export const automationDiscoveryRequests = pgTable("automation_discovery_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Contact Information
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title"),
  industry: text("industry"),
  companySize: text("company_size"),
  
  // Current Process Details
  processName: text("process_name").notNull(),
  processDescription: text("process_description").notNull(),
  currentTools: text("current_tools"), // What tools/software currently used
  processFrequency: text("process_frequency"), // How often this process runs
  timeSpentPerWeek: text("time_spent_per_week"), // Hours spent on this process
  peopleInvolved: text("people_involved"), // Number of people involved
  
  // Pain Points & Goals
  painPoints: text("pain_points").notNull(), // What problems they face
  desiredOutcome: text("desired_outcome").notNull(), // What they want to achieve
  successMetrics: text("success_metrics"), // How they'll measure success
  
  // Technical Context
  dataSourcesUsed: text("data_sources_used"), // What data sources are involved
  integrationNeeds: text("integration_needs"), // What systems need to connect
  complianceRequirements: text("compliance_requirements"), // HIPAA, GDPR, etc.
  
  // Project Preferences
  timeline: text("timeline"), // When they want to start/complete
  budgetRange: text("budget_range"),
  priorityLevel: text("priority_level"), // low, medium, high, urgent
  preferredApproach: text("preferred_approach"), // AI agent, software automation, hybrid
  
  // Additional Information
  additionalNotes: text("additional_notes"),
  howHeardAboutUs: text("how_heard_about_us"),
  
  // AI-Generated Outline (OpenAI - shown to client)
  aiOutline: jsonb("ai_outline").$type<{
    summary: string;
    recommendedApproach: string;
    proposedSolution: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
    keyBenefits: string[];
    potentialChallenges: string[];
    nextSteps: string[];
    additionalRecommendations: string;
    generatedAt: string;
    modelUsed: string;
  }>(),
  
  // AI-Generated Outline (Gemini - admin only)
  geminiOutline: jsonb("gemini_outline").$type<{
    summary: string;
    recommendedApproach: string;
    proposedSolution: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
    keyBenefits: string[];
    potentialChallenges: string[];
    nextSteps: string[];
    additionalRecommendations: string;
    generatedAt: string;
    modelUsed: string;
  }>(),
  
  // AI-Generated Merged Outline (best of both - admin only)
  mergedOutline: jsonb("merged_outline").$type<{
    summary: string;
    recommendedApproach: string;
    proposedSolution: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
    keyBenefits: string[];
    potentialChallenges: string[];
    nextSteps: string[];
    additionalRecommendations: string;
    generatedAt: string;
    modelUsed: string;
  }>(),
  
  // Status tracking
  status: text("status").default("new").notNull(), // new, outline_generated, reviewed, contacted, converted, closed
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  
  // Link to client if converted
  clientId: varchar("client_id"),
  projectId: varchar("project_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automation Discovery Schemas
export const insertAutomationDiscoverySchema = createInsertSchema(automationDiscoveryRequests).omit({
  id: true,
  aiOutline: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  clientId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contactName: z.string().min(2, "Name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(2, "Company name is required"),
  processName: z.string().min(3, "Process name is required"),
  processDescription: z.string().min(20, "Please provide more detail about the process"),
  painPoints: z.string().min(10, "Please describe your pain points"),
  desiredOutcome: z.string().min(10, "Please describe your desired outcome"),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  preferredApproach: z.enum(['ai_agent', 'software_automation', 'hybrid', 'not_sure']).optional(),
});

export const updateAutomationDiscoverySchema = createInsertSchema(automationDiscoveryRequests).omit({
  id: true,
  createdAt: true,
}).partial();

// Automation Discovery Types
export type InsertAutomationDiscovery = z.infer<typeof insertAutomationDiscoverySchema>;
export type UpdateAutomationDiscovery = z.infer<typeof updateAutomationDiscoverySchema>;
export type AutomationDiscoveryRequest = typeof automationDiscoveryRequests.$inferSelect;

export type AutomationOutline = {
  summary: string;
  recommendedApproach: string;
  proposedSolution: string[];
  estimatedTimeline: string;
  estimatedBudget: string;
  keyBenefits: string[];
  potentialChallenges: string[];
  nextSteps: string[];
  additionalRecommendations: string;
  generatedAt: string;
  modelUsed: string;
};

export type AutomationDiscoveryStatus = 'new' | 'outline_generated' | 'reviewed' | 'contacted' | 'converted' | 'closed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type PreferredApproach = 'ai_agent' | 'software_automation' | 'hybrid' | 'not_sure';

// Google integrations table for storing OAuth tokens and connection status
export const googleIntegrations = pgTable("google_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // FK to users table
  serviceType: text("service_type").notNull(), // 'drive', 'gmail', 'calendar', 'sheets'
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  scope: text("scope").array().notNull(), // Array of granted scopes
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("pending").notNull(), // pending, syncing, completed, error
  errorMessage: text("error_message"),
  settings: jsonb("settings").$type<{
    enableAutoReply?: boolean;
    categories?: string[];
    clientId?: string;
    setupAt?: string;
    [key: string]: any; // Allow additional service-specific settings
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Sheets tracking for dual storage system
export const googleSheets = pgTable("google_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(), // FK to clients table
  spreadsheetId: text("spreadsheet_id").notNull().unique(),
  spreadsheetUrl: text("spreadsheet_url").notNull(),
  title: text("title").notNull(),
  sheetNames: text("sheet_names").array().notNull(), // Array of sheet names
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("pending").notNull(), // pending, syncing, completed, error
  autoSync: boolean("auto_sync").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Drive folders for client file organization
export const googleDriveFolders = pgTable("google_drive_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(), // FK to clients table
  folderId: text("folder_id").notNull().unique(),
  folderName: text("folder_name").notNull(),
  folderUrl: text("folder_url").notNull(),
  parentFolderId: text("parent_folder_id"), // For subfolder structure
  folderType: text("folder_type").notNull(), // 'main', 'documents', 'processed', 'reports', 'communications'
  permissions: jsonb("permissions").$type<{
    clientEmail?: string;
    accessLevel: 'reader' | 'writer' | 'owner';
    sharedAt?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Calendar for client calendar management
export const googleCalendar = pgTable("google_calendar", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(), // FK to clients table
  calendarId: text("calendar_id").notNull().unique(),
  calendarName: text("calendar_name").notNull(),
  calendarUrl: text("calendar_url").notNull(),
  timezone: text("timezone").default("America/New_York").notNull(),
  permissions: jsonb("permissions").$type<{
    clientEmail?: string;
    accessLevel: 'reader' | 'writer' | 'owner';
    sharedAt?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("google_calendar_client_id_idx").on(table.clientId),
]);

// Google Calendar events for consultation tracking
export const googleCalendarEvents = pgTable("google_calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultationId: varchar("consultation_id"), // FK to contactInquiries table
  clientId: varchar("client_id"), // FK to clients table
  eventId: text("event_id").notNull().unique(),
  calendarId: text("calendar_id").default("primary").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingUrl: text("meeting_url"), // Google Meet link
  attendeeEmails: text("attendee_emails").array().notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled, rescheduled
  remindersSent: boolean("reminders_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("cal_events_client_id_idx").on(table.clientId),
  index("cal_events_start_time_idx").on(table.startTime),
]);

// Gmail thread tracking for client communications
export const gmailThreads = pgTable("gmail_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"), // FK to clients table
  consultationId: varchar("consultation_id"), // FK to contactInquiries table
  threadId: text("thread_id").notNull().unique(),
  subject: text("subject").notNull(),
  participants: text("participants").array().notNull(), // Array of email addresses
  messageCount: integer("message_count").default(1).notNull(),
  lastMessageAt: timestamp("last_message_at").notNull(),
  status: text("status").default("active").notNull(), // active, archived, important
  labels: text("labels").array(), // Gmail labels
  isUnread: boolean("is_unread").default(false).notNull(),
  category: text("category"), // 'inquiry', 'project_update', 'support', 'general'
  autoReplied: boolean("auto_replied").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("gmail_threads_client_id_idx").on(table.clientId),
  index("gmail_threads_last_message_idx").on(table.lastMessageAt),
]);

// Project milestones for detailed project tracking
export const projectMilestones = pgTable("project_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, in_progress, completed, blocked
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  order: integer("order").notNull(), // Order within the project
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("milestones_project_id_idx").on(table.projectId),
]);

// Project deliverables for tracking specific outputs
export const projectDeliverables = pgTable("project_deliverables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  milestoneId: varchar("milestone_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, in_progress, review, completed
  deliverableType: text("deliverable_type").notNull(), // document, code, design, report, training
  fileUrl: text("file_url"), // Link to Google Drive file or local storage
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project status updates for timeline and client communication
export const projectStatusUpdates = pgTable("project_status_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  milestoneId: varchar("milestone_id"), // Optional - can be project-wide update
  updateType: text("update_type").notNull(), // progress, milestone_completed, issue, general
  title: text("title").notNull(),
  message: text("message").notNull(),
  clientVisible: boolean("client_visible").default(true).notNull(),
  sentToClient: boolean("sent_to_client").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  attachments: text("attachments").array(), // Array of file URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project dashboards for Google Sheets integration tracking
export const projectDashboards = pgTable("project_dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().unique(), // One dashboard per project
  spreadsheetId: text("spreadsheet_id"), // Google Sheets ID
  spreadsheetUrl: text("spreadsheet_url"), // Full URL for client access
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status").default("pending").notNull(), // pending, syncing, completed, error
  syncError: text("sync_error"),
  clientHasAccess: boolean("client_has_access").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sync logs for tracking dual storage operations
export const syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // 'client', 'project', 'consultation', 'document'
  entityId: varchar("entity_id").notNull(),
  syncType: text("sync_type").notNull(), // 'sheets', 'drive', 'calendar', 'gmail'
  operation: text("operation").notNull(), // 'create', 'update', 'delete', 'sync'
  googleResourceId: text("google_resource_id"), // Spreadsheet ID, folder ID, event ID, etc.
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed'
  errorMessage: text("error_message"),
  requestPayload: jsonb("request_payload"), // Data that was sent to Google
  responsePayload: jsonb("response_payload"), // Response from Google
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  nextRetryAt: timestamp("next_retry_at"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Google integration schemas  
export const insertGoogleIntegrationSchema = createInsertSchema(googleIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  serviceType: z.enum(['drive', 'gmail', 'calendar', 'sheets']),
  syncStatus: z.enum(['pending', 'syncing', 'completed', 'error']).default('pending'),
  scope: z.array(z.string()).min(1, "At least one scope is required"),
  tokenExpiry: z.date(),
});

export const updateGoogleIntegrationSchema = insertGoogleIntegrationSchema.partial();

// Google Sheets schemas
export const insertGoogleSheetsSchema = createInsertSchema(googleSheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  syncStatus: z.enum(['pending', 'syncing', 'completed', 'error']).default('pending'),
  sheetNames: z.array(z.string()).min(1, "At least one sheet name is required"),
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  spreadsheetUrl: z.string().url("Valid spreadsheet URL is required"),
  title: z.string().min(1, "Title is required"),
});

export const updateGoogleSheetsSchema = insertGoogleSheetsSchema.partial();

// Google Drive folder schemas
export const insertGoogleDriveFolderSchema = createInsertSchema(googleDriveFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  folderType: z.enum(['main', 'documents', 'processed', 'reports', 'communications']),
  folderId: z.string().min(1, "Folder ID is required"),
  folderName: z.string().min(1, "Folder name is required"),
  folderUrl: z.string().url("Valid folder URL is required"),
});

export const updateGoogleDriveFolderSchema = insertGoogleDriveFolderSchema.partial();

// Google Calendar schemas
export const insertGoogleCalendarSchema = createInsertSchema(googleCalendar).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  calendarId: z.string().min(1, "Calendar ID is required"),
  calendarName: z.string().min(1, "Calendar name is required"),
  calendarUrl: z.string().url("Valid calendar URL is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

export const updateGoogleCalendarSchema = insertGoogleCalendarSchema.partial();

// Google Calendar event schemas
export const insertGoogleCalendarEventSchema = createInsertSchema(googleCalendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).default('scheduled'),
  eventId: z.string().min(1, "Event ID is required"),
  title: z.string().min(1, "Event title is required"),
  startTime: z.date(),
  endTime: z.date(),
  attendeeEmails: z.array(z.string().email()).min(1, "At least one attendee email is required"),
});

export const updateGoogleCalendarEventSchema = insertGoogleCalendarEventSchema.partial();

// Gmail thread schemas
export const insertGmailThreadSchema = createInsertSchema(gmailThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['active', 'archived', 'important']).default('active'),
  category: z.enum(['inquiry', 'project_update', 'support', 'general']).optional(),
  threadId: z.string().min(1, "Thread ID is required"),
  subject: z.string().min(1, "Subject is required"),
  participants: z.array(z.string().email()).min(1, "At least one participant email is required"),
  lastMessageAt: z.date(),
});

export const updateGmailThreadSchema = insertGmailThreadSchema.partial();

// Project milestone schemas
export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
  progress: z.number().min(0).max(100).default(0),
  order: z.number().min(1),
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required"),
  dueDate: z.coerce.date().optional(),
});

export const updateProjectMilestoneSchema = insertProjectMilestoneSchema.partial().extend({
  id: z.string().optional(),
});

// Project deliverable schemas
export const insertProjectDeliverableSchema = createInsertSchema(projectDeliverables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(['pending', 'in_progress', 'review', 'completed']).default('pending'),
  deliverableType: z.enum(['document', 'code', 'design', 'report', 'training']),
  milestoneId: z.string().min(1, "Milestone ID is required"),
  title: z.string().min(1, "Title is required"),
});

export const updateProjectDeliverableSchema = insertProjectDeliverableSchema.partial().extend({
  id: z.string().optional(),
});

// Project status update schemas
export const insertProjectStatusUpdateSchema = createInsertSchema(projectStatusUpdates).omit({
  id: true,
  createdAt: true,
}).extend({
  updateType: z.enum(['progress', 'milestone_completed', 'issue', 'general']),
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  clientVisible: z.boolean().default(true),
  sentToClient: z.boolean().default(false),
});

export const updateProjectStatusUpdateSchema = insertProjectStatusUpdateSchema.partial().extend({
  id: z.string().optional(),
});

// Project dashboard schemas
export const insertProjectDashboardSchema = createInsertSchema(projectDashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  syncStatus: z.enum(['pending', 'syncing', 'completed', 'error']).default('pending'),
  projectId: z.string().min(1, "Project ID is required"),
  clientHasAccess: z.boolean().default(false),
});

export const updateProjectDashboardSchema = insertProjectDashboardSchema.partial().extend({
  id: z.string().optional(),
});

// Sync log schemas
export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  entityType: z.enum(['client', 'project', 'consultation', 'document']),
  syncType: z.enum(['sheets', 'drive', 'calendar', 'gmail']),
  operation: z.enum(['create', 'update', 'delete', 'sync']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  entityId: z.string().min(1, "Entity ID is required"),
});

// Google integration types
export type InsertGoogleIntegration = z.infer<typeof insertGoogleIntegrationSchema>;
export type UpdateGoogleIntegration = z.infer<typeof updateGoogleIntegrationSchema>;
export type GoogleIntegration = typeof googleIntegrations.$inferSelect;

export type InsertGoogleSheets = z.infer<typeof insertGoogleSheetsSchema>;
export type UpdateGoogleSheets = z.infer<typeof updateGoogleSheetsSchema>;
export type GoogleSheets = typeof googleSheets.$inferSelect;

export type InsertGoogleDriveFolder = z.infer<typeof insertGoogleDriveFolderSchema>;
export type UpdateGoogleDriveFolder = z.infer<typeof updateGoogleDriveFolderSchema>;
export type GoogleDriveFolder = typeof googleDriveFolders.$inferSelect;

export type InsertGoogleCalendar = z.infer<typeof insertGoogleCalendarSchema>;
export type UpdateGoogleCalendar = z.infer<typeof updateGoogleCalendarSchema>;
export type GoogleCalendar = typeof googleCalendar.$inferSelect;

export type InsertGoogleCalendarEvent = z.infer<typeof insertGoogleCalendarEventSchema>;
export type UpdateGoogleCalendarEvent = z.infer<typeof updateGoogleCalendarEventSchema>;
export type GoogleCalendarEvent = typeof googleCalendarEvents.$inferSelect;

export type InsertGmailThread = z.infer<typeof insertGmailThreadSchema>;
export type UpdateGmailThread = z.infer<typeof updateGmailThreadSchema>;
export type GmailThread = typeof gmailThreads.$inferSelect;

export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;

// Project milestone types
export type InsertProjectMilestone = z.infer<typeof insertProjectMilestoneSchema>;
export type UpdateProjectMilestone = z.infer<typeof updateProjectMilestoneSchema>;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;

// Project deliverable types
export type InsertProjectDeliverable = z.infer<typeof insertProjectDeliverableSchema>;
export type UpdateProjectDeliverable = z.infer<typeof updateProjectDeliverableSchema>;
export type ProjectDeliverable = typeof projectDeliverables.$inferSelect;

// Project status update types
export type InsertProjectStatusUpdate = z.infer<typeof insertProjectStatusUpdateSchema>;
export type UpdateProjectStatusUpdate = z.infer<typeof updateProjectStatusUpdateSchema>;
export type ProjectStatusUpdate = typeof projectStatusUpdates.$inferSelect;

// Project dashboard types
export type InsertProjectDashboard = z.infer<typeof insertProjectDashboardSchema>;
export type UpdateProjectDashboard = z.infer<typeof updateProjectDashboardSchema>;
export type ProjectDashboard = typeof projectDashboards.$inferSelect;

// Extended types for dual storage relationships
export type ClientWithGoogleIntegrations = Client & {
  googleSheets?: GoogleSheets;
  driveFolders: GoogleDriveFolder[];
  calendarEvents: GoogleCalendarEvent[];
  gmailThreads: GmailThread[];
};

export type ProjectWithGoogleData = Project & {
  client: ClientWithGoogleIntegrations;
  syncLogs: SyncLog[];
};

// Enhanced project with milestones and dashboard for live tracking
export type ProjectWithMilestones = Project & {
  client: Client;
  milestones: (ProjectMilestone & {
    deliverables: ProjectDeliverable[];
  })[];
  statusUpdates: ProjectStatusUpdate[];
  dashboard?: ProjectDashboard;
};

// ============================================
// CLIENT PORTAL SYSTEM
// ============================================

// Client portal users - separate from admin users, specific to each client
export const clientPortalUsers = pgTable("client_portal_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(), // Links to clients table
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("user").notNull(), // admin, user, viewer
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("portal_users_client_id_idx").on(table.clientId),
  index("portal_users_email_idx").on(table.email),
]);

// AI usage tracking for each client
export const aiUsageTracking = pgTable("ai_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  projectId: varchar("project_id"), // Optional - can be tied to a specific project
  serviceType: text("service_type").notNull(), // document_processing, customer_service, marketing, etc.
  usageDate: timestamp("usage_date").defaultNow().notNull(),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  requestsCount: integer("requests_count").default(0).notNull(),
  processingTimeMs: integer("processing_time_ms").default(0).notNull(),
  costUsd: text("cost_usd"), // Cost in USD as string to handle decimals
  metadata: jsonb("metadata").$type<{
    model?: string;
    features?: string[];
    inputSize?: number;
    outputSize?: number;
    errorCount?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_usage_client_id_idx").on(table.clientId),
  index("ai_usage_client_date_idx").on(table.clientId, table.usageDate),
]);

// Client invoices for billing
export const clientInvoices = pgTable("client_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  stripeInvoiceId: text("stripe_invoice_id"), // Stripe invoice ID if using Stripe
  status: text("status").default("draft").notNull(), // draft, pending, paid, overdue, cancelled
  amountDue: text("amount_due").notNull(), // Amount as string for currency formatting
  amountPaid: text("amount_paid").default("0"),
  currency: text("currency").default("USD").notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  items: jsonb("items").$type<Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("invoices_client_id_idx").on(table.clientId),
  index("invoices_client_status_idx").on(table.clientId, table.status),
]);

// Software updates that clients can view
export const softwareUpdates = pgTable("software_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"), // Null means visible to all clients
  projectId: varchar("project_id"), // Optional - can be tied to a specific project
  title: text("title").notNull(),
  version: text("version"),
  description: text("description").notNull(),
  updateType: text("update_type").default("feature").notNull(), // feature, bugfix, security, maintenance
  status: text("status").default("available").notNull(), // available, installed, scheduled
  releaseDate: timestamp("release_date").defaultNow().notNull(),
  scheduledDate: timestamp("scheduled_date"), // When the update will be applied
  changelog: jsonb("changelog").$type<Array<{
    type: 'added' | 'changed' | 'fixed' | 'removed';
    description: string;
  }>>(),
  isRequired: boolean("is_required").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("software_updates_client_id_idx").on(table.clientId),
]);

// Support tickets for messaging system
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  portalUserId: varchar("portal_user_id").notNull(), // Who created the ticket
  projectId: varchar("project_id"), // Optional - can be tied to a specific project
  ticketNumber: text("ticket_number").notNull(),
  subject: text("subject").notNull(),
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  status: text("status").default("open").notNull(), // open, in_progress, waiting_on_client, resolved, closed
  category: text("category").default("general").notNull(), // general, technical, billing, feature_request
  assignedTo: varchar("assigned_to"), // Admin user ID
  lastReplyAt: timestamp("last_reply_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tickets_client_id_idx").on(table.clientId),
  index("tickets_portal_user_id_idx").on(table.portalUserId),
  index("tickets_client_status_idx").on(table.clientId, table.status),
]);

// Support messages within tickets
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  senderId: varchar("sender_id").notNull(), // Portal user ID or admin ID
  senderType: text("sender_type").notNull(), // client, admin
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>>(),
  isInternal: boolean("is_internal").default(false).notNull(), // Internal admin notes
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("support_messages_ticket_id_idx").on(table.ticketId),
]);

// ============================================
// CLIENT PORTAL SCHEMAS
// ============================================

// Portal user schemas
export const insertClientPortalUserSchema = createInsertSchema(clientPortalUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const updateClientPortalUserSchema = insertClientPortalUserSchema.partial();

export const clientPortalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  clientSlug: z.string(), // e.g., "coldwell" for Coldwell Banker
});

// AI usage schemas
export const insertAiUsageTrackingSchema = createInsertSchema(aiUsageTracking).omit({
  id: true,
  createdAt: true,
});

// Invoice schemas
export const insertClientInvoiceSchema = createInsertSchema(clientInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientInvoiceSchema = insertClientInvoiceSchema.partial();

// Software update schemas
export const insertSoftwareUpdateSchema = createInsertSchema(softwareUpdates).omit({
  id: true,
  createdAt: true,
});

export const updateSoftwareUpdateSchema = insertSoftwareUpdateSchema.partial();

// Support ticket schemas
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  lastReplyAt: true,
  resolvedAt: true,
});

export const updateSupportTicketSchema = insertSupportTicketSchema.partial();

// Support message schemas
export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// ============================================
// CLIENT PORTAL TYPES
// ============================================

export type InsertClientPortalUser = z.infer<typeof insertClientPortalUserSchema>;
export type UpdateClientPortalUser = z.infer<typeof updateClientPortalUserSchema>;
export type ClientPortalUser = typeof clientPortalUsers.$inferSelect;
export type ClientPortalLogin = z.infer<typeof clientPortalLoginSchema>;

export type InsertAiUsageTracking = z.infer<typeof insertAiUsageTrackingSchema>;
export type AiUsageTracking = typeof aiUsageTracking.$inferSelect;

export type InsertClientInvoice = z.infer<typeof insertClientInvoiceSchema>;
export type UpdateClientInvoice = z.infer<typeof updateClientInvoiceSchema>;
export type ClientInvoice = typeof clientInvoices.$inferSelect;

export type InsertSoftwareUpdate = z.infer<typeof insertSoftwareUpdateSchema>;
export type UpdateSoftwareUpdate = z.infer<typeof updateSoftwareUpdateSchema>;
export type SoftwareUpdate = typeof softwareUpdates.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type UpdateSupportTicket = z.infer<typeof updateSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;

// Extended types for client portal
export type SupportTicketWithMessages = SupportTicket & {
  messages: SupportMessage[];
  createdBy?: ClientPortalUser;
};

export type ClientPortalDashboard = {
  client: Client;
  projects: Project[];
  recentUsage: AiUsageTracking[];
  pendingInvoices: ClientInvoice[];
  updates: SoftwareUpdate[];
  openTickets: SupportTicket[];
};

// ============================================
// CHATBOT CONFIGURATION (Transferable Module)
// ============================================

export const chatbotConfig = pgTable("chatbot_config", {
  id: integer("id").primaryKey().default(1),
  botName: varchar("bot_name", { length: 100 }).default("AI Assistant"),
  companyName: varchar("company_name", { length: 200 }).default("Steel City AI"),
  systemPrompt: text("system_prompt").notNull(),
  greetingMessage: text("greeting_message").default("Hi! How can I help you today?"),
  fallbackMessage: text("fallback_message").default("I'm having a brief technical issue. A team member will be with you shortly."),
  personality: varchar("personality", { length: 50 }).default("friendly"),
  responseStyle: varchar("response_style", { length: 50 }).default("concise"),
  isEnabled: boolean("is_enabled").default(true),
  maxResponseLength: integer("max_response_length").default(500),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }),
});

export const chatbotKnowledgeBase = pgTable("chatbot_knowledge_base", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  category: varchar("category", { length: 100 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array(),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatbot schemas
export const insertChatbotConfigSchema = createInsertSchema(chatbotConfig).omit({
  updatedAt: true,
});

export const updateChatbotConfigSchema = insertChatbotConfigSchema.partial();

export const insertChatbotKnowledgeSchema = createInsertSchema(chatbotKnowledgeBase).omit({
  // id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateChatbotKnowledgeSchema = insertChatbotKnowledgeSchema.partial();

// Chatbot types
export type InsertChatbotConfig = z.infer<typeof insertChatbotConfigSchema>;
export type UpdateChatbotConfig = z.infer<typeof updateChatbotConfigSchema>;
export type ChatbotConfig = typeof chatbotConfig.$inferSelect;

export type InsertChatbotKnowledge = z.infer<typeof insertChatbotKnowledgeSchema>;
export type UpdateChatbotKnowledge = z.infer<typeof updateChatbotKnowledgeSchema>;
export type ChatbotKnowledge = typeof chatbotKnowledgeBase.$inferSelect;

// ============================================
// SOCIAL MEDIA MANAGEMENT
// ============================================

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  accountUsername: text("account_username"),
  accountImage: text("account_image"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  platformAccountId: text("platform_account_id"),
  isConnected: boolean("is_connected").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("social_accounts_client_id_idx").on(table.clientId),
  index("social_accounts_client_platform_idx").on(table.clientId, table.platform),
]);

export const socialCampaigns = pgTable("social_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  goals: text("goals").array(),
  targetAudience: text("target_audience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("campaigns_client_id_idx").on(table.clientId),
]);

export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  campaignId: varchar("campaign_id"),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  platforms: text("platforms").array().notNull(),
  accountIds: text("account_ids").array(),
  status: text("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  platformPostIds: jsonb("platform_post_ids"),
  platformOptions: jsonb("platform_options"),
  hashtags: text("hashtags").array(),
  aiGenerated: boolean("ai_generated").default(false),
  agentId: varchar("agent_id"),
  engagement: jsonb("engagement"),
  approvalStatus: text("approval_status"), // pending | approved | rejected | changes_requested | null (no approval needed)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("posts_client_id_idx").on(table.clientId),
  index("posts_status_idx").on(table.status),
  index("posts_scheduled_at_idx").on(table.scheduledAt),
  index("posts_client_status_idx").on(table.clientId, table.status),
  index("posts_campaign_id_idx").on(table.campaignId),
  index("posts_approval_status_idx").on(table.approvalStatus),
]);

// ============ APPROVAL WORKFLOW TABLES ============

export const socialPostApprovals = pgTable("social_post_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  approverId: varchar("approver_id"), // userId or portalUserId who took action
  status: text("status").notNull(), // pending | approved | rejected | changes_requested
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("approvals_post_id_idx").on(table.postId),
  index("approvals_approver_id_idx").on(table.approverId),
  index("approvals_status_idx").on(table.status),
]);

export const socialPostApprovalChain = pgTable("social_post_approval_chain", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  chainOrder: integer("chain_order").notNull(), // 1, 2, 3... order of approval
  approverRole: text("approver_role").notNull(), // e.g. "client", "manager", "admin"
  approverId: varchar("approver_id"), // specific user assigned
  required: boolean("required").default(true).notNull(),
  status: text("status").default("pending").notNull(), // pending | approved | rejected | changes_requested
  respondedAt: timestamp("responded_at"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("approval_chain_post_id_idx").on(table.postId),
  index("approval_chain_order_idx").on(table.postId, table.chainOrder),
]);

// ============ HASHTAG ANALYTICS TABLE ============

export const socialHashtagMetrics = pgTable("social_hashtag_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hashtag: text("hashtag").notNull(),
  postId: varchar("post_id"),
  platform: text("platform"),
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  clicks: integer("clicks").default(0),
  reach: integer("reach").default(0),
  saves: integer("saves").default(0),
  engagementRate: numeric("engagement_rate", { precision: 10, scale: 4 }),
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("hashtag_metrics_hashtag_idx").on(table.hashtag),
  index("hashtag_metrics_post_id_idx").on(table.postId),
  index("hashtag_metrics_measured_at_idx").on(table.measuredAt),
  index("hashtag_metrics_hashtag_date_idx").on(table.hashtag, table.measuredAt),
]);

export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  configuration: jsonb("configuration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiAgentTasks = pgTable("ai_agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  clientId: varchar("client_id"),
  taskType: text("task_type").notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  status: text("status").default("pending").notNull(),
  parentTaskId: varchar("parent_task_id"),
  postId: varchar("post_id"),
  campaignId: varchar("campaign_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("agent_tasks_client_id_idx").on(table.clientId),
  index("agent_tasks_post_id_idx").on(table.postId),
  index("agent_tasks_status_idx").on(table.status),
]);

export const trainingFeedback = pgTable("training_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  postId: varchar("post_id"),
  originalContent: text("original_content").notNull(),
  editedContent: text("edited_content"),
  feedbackType: text("feedback_type").notNull(),
  vibeDirection: text("vibe_direction"),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("training_feedback_client_id_idx").on(table.clientId),
  index("training_feedback_post_id_idx").on(table.postId),
]);

export const brandVoiceProfiles = pgTable("brand_voice_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id"),
  name: text("name").notNull(),
  tone: text("tone"),
  style: text("style"),
  vocabulary: text("vocabulary").array(),
  avoidWords: text("avoid_words").array(),
  examplePosts: text("example_posts").array(),
  preferences: jsonb("preferences"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("brand_voice_client_id_idx").on(table.clientId),
]);

// Social Media schemas
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSocialAccountSchema = insertSocialAccountSchema.partial();

export const insertSocialCampaignSchema = createInsertSchema(socialCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.coerce.date(), z.null()]).optional(),
  endDate: z.union([z.coerce.date(), z.null()]).optional(),
});
export const updateSocialCampaignSchema = insertSocialCampaignSchema.partial();

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1, "Post content is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  scheduledAt: z.union([z.coerce.date(), z.null()]).optional(),
  publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
});
export const updateSocialPostSchema = insertSocialPostSchema.partial();

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateAiAgentSchema = insertAiAgentSchema.partial();

export const insertAiAgentTaskSchema = createInsertSchema(aiAgentTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const updateAiAgentTaskSchema = createInsertSchema(aiAgentTasks).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertTrainingFeedbackSchema = createInsertSchema(trainingFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertBrandVoiceProfileSchema = createInsertSchema(brandVoiceProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateBrandVoiceProfileSchema = insertBrandVoiceProfileSchema.partial();

// Social Media types
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type UpdateSocialAccount = z.infer<typeof updateSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertSocialCampaign = z.infer<typeof insertSocialCampaignSchema>;
export type UpdateSocialCampaign = z.infer<typeof updateSocialCampaignSchema>;
export type SocialCampaign = typeof socialCampaigns.$inferSelect;

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type UpdateSocialPost = z.infer<typeof updateSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type UpdateAiAgent = z.infer<typeof updateAiAgentSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;

export type InsertAiAgentTask = z.infer<typeof insertAiAgentTaskSchema>;
export type UpdateAiAgentTask = z.infer<typeof updateAiAgentTaskSchema>;
export type AiAgentTask = typeof aiAgentTasks.$inferSelect;

export type InsertTrainingFeedback = z.infer<typeof insertTrainingFeedbackSchema>;
export type TrainingFeedback = typeof trainingFeedback.$inferSelect;

export type InsertBrandVoiceProfile = z.infer<typeof insertBrandVoiceProfileSchema>;
export type UpdateBrandVoiceProfile = z.infer<typeof updateBrandVoiceProfileSchema>;
export type BrandVoiceProfile = typeof brandVoiceProfiles.$inferSelect;

// ============ Approval Workflow Schemas & Types ============

export const approvalStatusEnum = z.enum(["pending", "approved", "rejected", "changes_requested"]);
export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

export const insertSocialPostApprovalSchema = createInsertSchema(socialPostApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostApprovalChainSchema = createInsertSchema(socialPostApprovalChain).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type SocialPostApproval = typeof socialPostApprovals.$inferSelect;
export type InsertSocialPostApproval = z.infer<typeof insertSocialPostApprovalSchema>;

export type SocialPostApprovalChain = typeof socialPostApprovalChain.$inferSelect;
export type InsertSocialPostApprovalChain = z.infer<typeof insertSocialPostApprovalChainSchema>;

// ============ Hashtag Analytics Schemas & Types ============

export const insertSocialHashtagMetricSchema = createInsertSchema(socialHashtagMetrics).omit({
  id: true,
  createdAt: true,
});

export type SocialHashtagMetric = typeof socialHashtagMetrics.$inferSelect;
export type InsertSocialHashtagMetric = z.infer<typeof insertSocialHashtagMetricSchema>;

// ============ PREDICTION RECORDS TABLE ============

export const predictionRecords = pgTable("prediction_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  predictedScore: numeric("predicted_score", { precision: 5, scale: 2 }).notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  factors: jsonb("factors"), // Array of { name, impact, value, suggestion }
  actualScore: numeric("actual_score", { precision: 5, scale: 2 }),
  actualMeasuredAt: timestamp("actual_measured_at"),
  predictedAt: timestamp("predicted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("prediction_records_post_id_idx").on(table.postId),
  index("prediction_records_predicted_at_idx").on(table.predictedAt),
]);

// ============ NOTIFICATION PREFERENCES TABLE ============

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userType: text("user_type").notNull(), // 'admin' | 'portal'
  emailOnApprovalRequest: boolean("email_on_approval_request").default(true).notNull(),
  emailOnApprovalResponse: boolean("email_on_approval_response").default(true).notNull(),
  emailOnChangesRequested: boolean("email_on_changes_requested").default(true).notNull(),
  inAppNotifications: boolean("in_app_notifications").default(true).notNull(),
  emailAddress: text("email_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("notification_prefs_user_id_idx").on(table.userId),
]);

// ============ Prediction Records Schemas & Types ============

export const insertPredictionRecordSchema = createInsertSchema(predictionRecords).omit({
  id: true,
  createdAt: true,
});

export type PredictionRecord = typeof predictionRecords.$inferSelect;
export type InsertPredictionRecord = z.infer<typeof insertPredictionRecordSchema>;

// ============ Notification Preferences Schemas & Types ============

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateNotificationPreferenceSchema = insertNotificationPreferenceSchema.partial();

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type UpdateNotificationPreference = z.infer<typeof updateNotificationPreferenceSchema>;
