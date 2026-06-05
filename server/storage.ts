import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import { eq, desc, and, asc, count, sql as drizzleSql, isNull, gte, lte } from "drizzle-orm";
import { 
  type User, 
  type InsertUser, 
  type ContactInquiry, 
  type InsertContactInquiry,
  type ConsultationData,
  type InsertConsultation,
  type CaseStudy,
  type InsertCaseStudy,
  type Service,
  type InsertService,
  type Client,
  type InsertClient,
  type UpdateClient,
  type Project,
  type InsertProject,
  type UpdateProject,
  type ProjectNote,
  type InsertProjectNote,
  type ProjectDocument,
  type InsertProjectDocument,
  type ClientWithProjects,
  type ProjectWithDetails,
  type ConvertInquiryToClient,
  type ChatSession,
  type InsertChatSession,
  type UpdateChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type ChatParticipant,
  type InsertChatParticipant,
  type ChatSessionWithMessages,
  type ChatSessionSummary,
  type InsertGoogleIntegration,
  type UpdateGoogleIntegration,
  type InsertGoogleSheets,
  type UpdateGoogleSheets,
  type InsertGoogleDriveFolder,
  type UpdateGoogleDriveFolder,
  type InsertGoogleCalendar,
  type UpdateGoogleCalendar,
  type InsertGoogleCalendarEvent,
  type UpdateGoogleCalendarEvent,
  type InsertGmailThread,
  type UpdateGmailThread,
  type InsertSyncLog,
  type InsertProjectMilestone,
  type UpdateProjectMilestone,
  type ProjectMilestone,
  type InsertProjectDeliverable,
  type UpdateProjectDeliverable,
  type ProjectDeliverable,
  type InsertProjectStatusUpdate,
  type UpdateProjectStatusUpdate,
  type ProjectStatusUpdate,
  type InsertProjectDashboard,
  type UpdateProjectDashboard,
  type ProjectDashboard,
  type AutomationDiscoveryRequest,
  type InsertAutomationDiscovery,
  type UpdateAutomationDiscovery,
  type AutomationOutline,
  type ChatbotConfig,
  type UpdateChatbotConfig,
  type ChatbotKnowledge,
  type InsertChatbotKnowledge,
  type UpdateChatbotKnowledge,
  type SocialAccount,
  type InsertSocialAccount,
  type UpdateSocialAccount,
  type SocialCampaign,
  type InsertSocialCampaign,
  type UpdateSocialCampaign,
  type SocialPost,
  type InsertSocialPost,
  type UpdateSocialPost,
  type AiAgent,
  type InsertAiAgent,
  type UpdateAiAgent,
  type AiAgentTask,
  type InsertAiAgentTask,
  type UpdateAiAgentTask,
  type TrainingFeedback,
  type InsertTrainingFeedback,
  type BrandVoiceProfile,
  type InsertBrandVoiceProfile,
  type UpdateBrandVoiceProfile,
  type SocialPostApproval,
  type InsertSocialPostApproval,
  type SocialPostApprovalChain,
  type InsertSocialPostApprovalChain,
  type SocialHashtagMetric,
  type InsertSocialHashtagMetric,
  type PredictionRecord,
  type InsertPredictionRecord,
  type NotificationPreference,
  type InsertNotificationPreference,
  type UpdateNotificationPreference,
  users,
  contactInquiries,
  caseStudies,
  services,
  clients,
  projects,
  projectNotes,
  projectDocuments,
  chatSessions,
  chatMessages,
  chatParticipants,
  googleIntegrations,
  googleSheets,
  googleDriveFolders,
  googleCalendar,
  googleCalendarEvents,
  gmailThreads,
  syncLogs,
  projectMilestones,
  projectDeliverables,
  projectStatusUpdates,
  projectDashboards,
  automationDiscoveryRequests,
  chatbotConfig,
  chatbotKnowledgeBase,
  socialAccounts,
  socialCampaigns,
  socialPosts,
  socialPostApprovals,
  socialPostApprovalChain,
  socialHashtagMetrics,
  predictionRecords,
  notificationPreferences,
  aiAgents,
  aiAgentTasks,
  trainingFeedback,
  brandVoiceProfiles,
  clientPortalUsers,
  aiUsageTracking,
  supportTickets
} from "@shared/schema";

const neonSql = neon(process.env.DATABASE_URL!);
export { neonSql };
export const db = drizzle(neonSql);
export const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const dbPg = drizzleNode(pgPool);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact inquiry methods
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;
  getContactInquiries(): Promise<ContactInquiry[]>;
  updateContactInquiry(id: string, update: Partial<InsertContactInquiry>): Promise<ContactInquiry>;
  updateContactInquiryStatus(id: string, status: string): Promise<void>;
  linkContactInquiryToClient(inquiryId: string, clientId: string): Promise<void>;
  
  // Consultation-specific methods
  createConsultation(consultation: InsertConsultation): Promise<ContactInquiry>;
  getConsultations(): Promise<ContactInquiry[]>;
  getConsultationById(id: string): Promise<ContactInquiry | undefined>;
  getConsultationsByStatus(status: string): Promise<ContactInquiry[]>;
  
  // Case study methods
  getAllCaseStudies(): Promise<CaseStudy[]>;
  getFeaturedCaseStudies(): Promise<CaseStudy[]>;
  createCaseStudy(caseStudy: InsertCaseStudy): Promise<CaseStudy>;
  getCaseStudyById(id: string): Promise<CaseStudy | undefined>;
  
  // Service methods
  getAllServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  getFeaturedServices(): Promise<Service[]>;
  getServiceBySlug(slug: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Client management methods
  getAllClients(page?: number, limit?: number): Promise<{ clients: Client[], total: number }>;
  getClientById(id: string): Promise<Client | undefined>;
  getClientWithProjects(id: string): Promise<ClientWithProjects | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: UpdateClient): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  convertInquiryToClient(inquiryData: ConvertInquiryToClient): Promise<Client>;
  
  // Project management methods
  getProjectsByClientId(clientId: string): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  getProjectWithDetails(id: string): Promise<ProjectWithDetails | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: UpdateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project notes methods
  getProjectNotes(projectId: string): Promise<ProjectNote[]>;
  getProjectNoteById(id: string): Promise<ProjectNote | undefined>;
  createProjectNote(note: InsertProjectNote): Promise<ProjectNote>;
  deleteProjectNote(id: string): Promise<void>;
  
  // Project documents methods
  getProjectDocuments(projectId: string): Promise<ProjectDocument[]>;
  createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument>;
  getProjectDocumentById(id: string): Promise<ProjectDocument | undefined>;
  deleteProjectDocument(id: string): Promise<void>;

  // Chat session methods
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionById(id: string): Promise<ChatSession | undefined>;
  getChatSessionWithMessages(id: string): Promise<ChatSessionWithMessages | undefined>;
  getActiveChatSessions(): Promise<ChatSessionSummary[]>;
  getChatSessionsByAdminId(adminId: string): Promise<ChatSessionSummary[]>;
  getChatSessionsByStatus(status: string): Promise<ChatSessionSummary[]>;
  updateChatSession(id: string, session: UpdateChatSession): Promise<ChatSession>;
  endChatSession(id: string, notes?: string): Promise<void>;

  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(sessionId: string, participantId: string): Promise<void>;
  markMessageAsDelivered(messageId: string): Promise<void>;

  // Chat participant methods
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  getChatParticipants(sessionId: string): Promise<ChatParticipant[]>;
  updateParticipantStatus(sessionId: string, participantId: string, isOnline: boolean): Promise<void>;
  removeParticipant(sessionId: string, participantId: string): Promise<void>;

  // Chat analytics and reporting
  getChatMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalSessions: number;
    activeSessions: number;
    averageSessionDuration: number;
    totalMessages: number;
    satisfactionRatings: number[];
  }>;

  // Chat-consultation integration
  escalateChatToConsultation(sessionId: string, consultationData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    projectDescription?: string;
    timeline?: string;
    budget?: string;
    servicesInterested?: string[];
    additionalNotes?: string;
  }): Promise<{ sessionId: string; consultationId: string; }>;
  
  linkChatToConsultation(sessionId: string, consultationId: string): Promise<void>;

  // Google Integration methods
  createGoogleIntegration(integration: InsertGoogleIntegration): Promise<any>;
  getGoogleIntegration(userId: string, serviceType: string): Promise<any | undefined>;
  updateGoogleIntegration(id: string, integration: UpdateGoogleIntegration): Promise<any>;
  deleteGoogleIntegration(id: string): Promise<void>;
  getActiveGoogleIntegrations(userId: string): Promise<any[]>;

  // Google Sheets methods
  createGoogleSheet(sheet: InsertGoogleSheets): Promise<any>;
  getGoogleSheetByClientId(clientId: string): Promise<any | undefined>;
  updateGoogleSheet(id: string, sheet: UpdateGoogleSheets): Promise<any>;
  deleteGoogleSheet(id: string): Promise<void>;

  // Google Drive folder methods
  createGoogleDriveFolder(folder: InsertGoogleDriveFolder): Promise<any>;
  getGoogleDriveFoldersByClientId(clientId: string): Promise<any[]>;
  updateGoogleDriveFolder(id: string, folder: UpdateGoogleDriveFolder): Promise<any>;
  deleteGoogleDriveFolder(id: string): Promise<void>;

  // Google Calendar methods
  createGoogleCalendar(calendar: InsertGoogleCalendar): Promise<any>;
  getGoogleCalendar(clientId: string): Promise<any | undefined>;
  updateGoogleCalendar(id: string, calendar: UpdateGoogleCalendar): Promise<any>;
  deleteGoogleCalendar(id: string): Promise<void>;

  // Google Calendar event methods
  createGoogleCalendarEvent(event: InsertGoogleCalendarEvent): Promise<any>;
  getGoogleCalendarEventsByClientId(clientId: string): Promise<any[]>;
  updateGoogleCalendarEvent(id: string, event: UpdateGoogleCalendarEvent): Promise<any>;
  deleteGoogleCalendarEvent(id: string): Promise<void>;

  // Gmail thread methods
  createGmailThread(thread: InsertGmailThread): Promise<any>;
  getGmailThreadsByClientId(clientId: string): Promise<any[]>;
  updateGmailThread(id: string, thread: UpdateGmailThread): Promise<any>;
  deleteGmailThread(id: string): Promise<void>;

  // Sync log methods
  createSyncLog(log: InsertSyncLog): Promise<any>;
  getSyncLogsByEntityId(entityId: string): Promise<any[]>;
  getSyncLogsByStatus(status: string): Promise<any[]>;
  updateSyncLogStatus(id: string, status: string, errorMessage?: string): Promise<void>;

  // Project milestone methods
  createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone>;
  getProjectMilestonesByProjectId(projectId: string): Promise<ProjectMilestone[]>;
  getProjectMilestoneById(id: string): Promise<ProjectMilestone | undefined>;
  updateProjectMilestone(id: string, milestone: UpdateProjectMilestone): Promise<ProjectMilestone>;
  deleteProjectMilestone(id: string): Promise<void>;

  // Project deliverable methods
  createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable>;
  getProjectDeliverablesByMilestoneId(milestoneId: string): Promise<ProjectDeliverable[]>;
  getProjectDeliverablesByProjectId(projectId: string): Promise<ProjectDeliverable[]>;
  getProjectDeliverableById(id: string): Promise<ProjectDeliverable | undefined>;
  updateProjectDeliverable(id: string, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable>;
  deleteProjectDeliverable(id: string): Promise<void>;

  // Project status update methods
  createProjectStatusUpdate(statusUpdate: InsertProjectStatusUpdate): Promise<ProjectStatusUpdate>;
  getProjectStatusUpdatesByProjectId(projectId: string): Promise<ProjectStatusUpdate[]>;
  getProjectStatusUpdateById(id: string): Promise<ProjectStatusUpdate | undefined>;
  updateProjectStatusUpdate(id: string, statusUpdate: UpdateProjectStatusUpdate): Promise<ProjectStatusUpdate>;
  markStatusUpdateSent(id: string): Promise<void>;

  // Project dashboard methods
  createProjectDashboard(dashboard: InsertProjectDashboard): Promise<ProjectDashboard>;
  getProjectDashboardByProjectId(projectId: string): Promise<ProjectDashboard | undefined>;
  updateProjectDashboard(id: string, dashboard: UpdateProjectDashboard): Promise<ProjectDashboard>;
  updateProjectDashboardSync(id: string, syncData: { lastSyncedAt: Date; syncStatus: string; syncError?: string }): Promise<void>;
  deleteProjectDashboard(id: string): Promise<void>;

  // Automation discovery methods
  createAutomationDiscovery(discovery: InsertAutomationDiscovery): Promise<AutomationDiscoveryRequest>;
  getAllAutomationDiscoveries(): Promise<AutomationDiscoveryRequest[]>;
  getAutomationDiscoveryById(id: string): Promise<AutomationDiscoveryRequest | undefined>;
  getAutomationDiscoveriesByStatus(status: string): Promise<AutomationDiscoveryRequest[]>;
  updateAutomationDiscovery(id: string, discovery: UpdateAutomationDiscovery): Promise<AutomationDiscoveryRequest>;
  updateAutomationDiscoveryOutline(id: string, outline: AutomationOutline): Promise<AutomationDiscoveryRequest>;
  updateAutomationDiscoveryOutlines(id: string, primaryOutline: AutomationOutline | null, secondaryOutline: AutomationOutline | null): Promise<AutomationDiscoveryRequest>;
  deleteAutomationDiscovery(id: string): Promise<void>;

  // Chatbot configuration methods (Transferable Module)
  getChatbotConfig(): Promise<ChatbotConfig | undefined>;
  updateChatbotConfig(config: UpdateChatbotConfig): Promise<ChatbotConfig>;
  
  // Chatbot knowledge base methods
  getChatbotKnowledgeBase(): Promise<ChatbotKnowledge[]>;
  getChatbotKnowledgeByCategory(category: string): Promise<ChatbotKnowledge[]>;
  getChatbotKnowledgeById(id: number): Promise<ChatbotKnowledge | undefined>;
  createChatbotKnowledge(knowledge: InsertChatbotKnowledge): Promise<ChatbotKnowledge>;
  updateChatbotKnowledge(id: number, knowledge: UpdateChatbotKnowledge): Promise<ChatbotKnowledge>;
  deleteChatbotKnowledge(id: number): Promise<void>;
  searchChatbotKnowledge(query: string): Promise<ChatbotKnowledge[]>;

  // Social media management methods
  getSocialAccounts(clientId?: string): Promise<SocialAccount[]>;
  getSocialAccountById(id: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, account: UpdateSocialAccount): Promise<SocialAccount>;
  deleteSocialAccount(id: string): Promise<void>;
  
  getSocialCampaigns(clientId?: string): Promise<SocialCampaign[]>;
  getSocialCampaignById(id: string): Promise<SocialCampaign | undefined>;
  createSocialCampaign(campaign: InsertSocialCampaign): Promise<SocialCampaign>;
  updateSocialCampaign(id: string, campaign: UpdateSocialCampaign): Promise<SocialCampaign>;
  deleteSocialCampaign(id: string): Promise<void>;
  
  getSocialPosts(clientId?: string, campaignId?: string): Promise<SocialPost[]>;
  getSocialPostById(id: string): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: string, post: UpdateSocialPost): Promise<SocialPost>;
  deleteSocialPost(id: string): Promise<void>;
  
  getAiAgents(): Promise<AiAgent[]>;
  getAiAgentById(id: string): Promise<AiAgent | undefined>;
  getAiAgentByRole(role: string): Promise<AiAgent | undefined>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: string, agent: UpdateAiAgent): Promise<AiAgent>;
  
  getAiAgentTasks(agentId?: string, clientId?: string): Promise<AiAgentTask[]>;
  getAiAgentTaskById(id: string): Promise<AiAgentTask | undefined>;
  createAiAgentTask(task: InsertAiAgentTask): Promise<AiAgentTask>;
  updateAiAgentTask(id: string, task: UpdateAiAgentTask): Promise<AiAgentTask>;
  
  getTrainingFeedback(clientId?: string): Promise<TrainingFeedback[]>;
  createTrainingFeedback(feedback: InsertTrainingFeedback): Promise<TrainingFeedback>;
  
  getBrandVoiceProfiles(clientId?: string): Promise<BrandVoiceProfile[]>;
  getBrandVoiceProfileById(id: string): Promise<BrandVoiceProfile | undefined>;
  createBrandVoiceProfile(profile: InsertBrandVoiceProfile): Promise<BrandVoiceProfile>;
  updateBrandVoiceProfile(id: string, profile: UpdateBrandVoiceProfile): Promise<BrandVoiceProfile>;
  deleteBrandVoiceProfile(id: string): Promise<void>;
  
  // Approval workflow
  getApprovalRequests(filters?: { status?: string }): Promise<any[]>;
  getPostApprovals(postId: string): Promise<SocialPostApproval[]>;
  createPostApproval(approval: InsertSocialPostApproval): Promise<SocialPostApproval>;
  getApprovalChain(postId: string): Promise<SocialPostApprovalChain[]>;
  createApprovalChainStep(step: InsertSocialPostApprovalChain): Promise<SocialPostApprovalChain>;
  updateApprovalChainStep(id: string, data: Partial<SocialPostApprovalChain>): Promise<SocialPostApprovalChain>;
  
  // Hashtag analytics
  getHashtagMetrics(filters?: { hashtag?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<SocialHashtagMetric[]>;
  createHashtagMetric(metric: InsertSocialHashtagMetric): Promise<SocialHashtagMetric>;
  getTopHashtags(options?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<{ hashtag: string; totalImpressions: number; totalEngagements: number; totalClicks: number; postCount: number }[]>;

  // Prediction records
  createPredictionRecord(record: InsertPredictionRecord): Promise<PredictionRecord>;
  getPredictionByPostId(postId: string): Promise<PredictionRecord | undefined>;
  updatePredictionActual(postId: string, actualScore: number): Promise<PredictionRecord | undefined>;
  getPredictionAccuracy(options?: { limit?: number }): Promise<PredictionRecord[]>;

  // Notification preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined>;
  upsertNotificationPreferences(prefs: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: string, data: UpdateNotificationPreference): Promise<NotificationPreference | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Contact inquiry methods
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const result = await dbPg.insert(contactInquiries).values(inquiry).returning();
    return result[0];
  }

  async getContactInquiries(): Promise<ContactInquiry[]> {
    return await dbPg.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
  }

  async updateContactInquiry(id: string, update: Partial<InsertContactInquiry>): Promise<ContactInquiry> {
    const result = await dbPg.update(contactInquiries)
      .set(update)
      .where(eq(contactInquiries.id, id))
      .returning();
    if (!result[0]) {
      throw new Error(`Contact inquiry with id ${id} not found`);
    }
    return result[0];
  }

  async updateContactInquiryStatus(id: string, status: string): Promise<void> {
    await dbPg.update(contactInquiries).set({ status }).where(eq(contactInquiries.id, id));
  }

  async linkContactInquiryToClient(inquiryId: string, clientId: string): Promise<void> {
    await dbPg.update(contactInquiries).set({ clientId }).where(eq(contactInquiries.id, inquiryId));
  }

  // Consultation-specific methods
  async createConsultation(consultation: InsertConsultation): Promise<ContactInquiry> {
    const result = await dbPg.insert(contactInquiries).values(consultation).returning();
    return result[0];
  }

  async getConsultations(): Promise<ContactInquiry[]> {
    return await dbPg.select().from(contactInquiries)
      .where(eq(contactInquiries.service, 'consultation'))
      .orderBy(desc(contactInquiries.createdAt));
  }

  async getConsultationById(id: string): Promise<ContactInquiry | undefined> {
    const result = await dbPg.select().from(contactInquiries)
      .where(and(eq(contactInquiries.id, id), eq(contactInquiries.service, 'consultation')))
      .limit(1);
    return result[0];
  }

  async getConsultationsByStatus(status: string): Promise<ContactInquiry[]> {
    return await dbPg.select().from(contactInquiries)
      .where(and(eq(contactInquiries.service, 'consultation'), eq(contactInquiries.status, status)))
      .orderBy(desc(contactInquiries.createdAt));
  }

  // Case study methods
  async getAllCaseStudies(): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt));
  }

  async getFeaturedCaseStudies(): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies)
      .where(eq(caseStudies.featured, true))
      .orderBy(desc(caseStudies.createdAt))
      .limit(3);
  }

  async createCaseStudy(caseStudy: InsertCaseStudy): Promise<CaseStudy> {
    const result = await db.insert(caseStudies).values(caseStudy).returning();
    return result[0];
  }

  async getCaseStudyById(id: string): Promise<CaseStudy | undefined> {
    const result = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).limit(1);
    return result[0];
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return await dbPg.select().from(services).orderBy(services.order, desc(services.createdAt));
  }

  async getActiveServices(): Promise<Service[]> {
    return await dbPg.select().from(services)
      .where(eq(services.active, true))
      .orderBy(services.order, desc(services.createdAt));
  }

  async getFeaturedServices(): Promise<Service[]> {
    return await dbPg.select().from(services)
      .where(and(eq(services.active, true), eq(services.featured, true)))
      .orderBy(services.order, desc(services.createdAt));
  }

  async getServiceBySlug(slug: string): Promise<Service | undefined> {
    const result = await dbPg.select().from(services)
      .where(and(eq(services.slug, slug), eq(services.active, true)))
      .limit(1);
    return result[0];
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await dbPg.insert(services).values(service as any).returning();
    return result[0];
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const updateData = { ...service, updatedAt: new Date() };
    const result = await dbPg.update(services)
      .set(updateData as any)
      .where(eq(services.id, id))
      .returning();
    return result[0];
  }

  async deleteService(id: string): Promise<void> {
    await dbPg.delete(services).where(eq(services.id, id));
  }

  // Client management methods
  async getAllClients(page: number = 1, limit: number = 20): Promise<{ clients: Client[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [clientsResult, totalResult] = await Promise.all([
      db.select().from(clients).orderBy(desc(clients.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(clients)
    ]);
    
    return {
      clients: clientsResult,
      total: totalResult[0].count
    };
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async getClientWithProjects(id: string): Promise<ClientWithProjects | undefined> {
    const client = await this.getClientById(id);
    if (!client) return undefined;
    
    const clientProjects = await this.getProjectsByClientId(id);
    
    return {
      ...client,
      projects: clientProjects
    };
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: string, client: UpdateClient): Promise<Client> {
    const result = await db.update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<void> {
    // Delete portal users first
    await db.delete(clientPortalUsers).where(eq(clientPortalUsers.clientId, id));

    // Delete social media data
    await db.delete(socialPosts).where(eq(socialPosts.clientId, id));
    await db.delete(socialCampaigns).where(eq(socialCampaigns.clientId, id));
    await db.delete(socialAccounts).where(eq(socialAccounts.clientId, id));
    await db.delete(brandVoiceProfiles).where(eq(brandVoiceProfiles.clientId, id));
    await db.delete(trainingFeedback).where(eq(trainingFeedback.clientId, id));

    // Delete support tickets
    await db.delete(supportTickets).where(eq(supportTickets.clientId, id));

    // Delete AI usage tracking
    await db.delete(aiUsageTracking).where(eq(aiUsageTracking.clientId, id));

    // Delete related projects, notes, and documents
    const clientProjects = await this.getProjectsByClientId(id);
    for (const project of clientProjects) {
      await this.deleteProject(project.id);
    }

    // Delete the client
    await db.delete(clients).where(eq(clients.id, id));
  }

  async convertInquiryToClient(inquiryData: ConvertInquiryToClient): Promise<Client> {
    // Get the inquiry
    const inquiry = await db.select().from(contactInquiries)
      .where(eq(contactInquiries.id, inquiryData.inquiryId)).limit(1);
    
    if (!inquiry[0]) {
      throw new Error('Contact inquiry not found');
    }

    const inquiryRecord = inquiry[0];
    
    // Create new client from inquiry data
    const newClient = await this.createClient({
      name: inquiryRecord.name,
      email: inquiryRecord.email,
      company: inquiryRecord.company || '',
      phone: inquiryData.phone || '',
      notes: inquiryData.notes || `Converted from inquiry: ${inquiryRecord.message}`,
      status: 'active',
      hasSocialAccess: false
    });

    // Link the inquiry to the new client
    await this.linkContactInquiryToClient(inquiryData.inquiryId, newClient.id);

    return newClient;
  }

  // Project management methods
  async getProjectsByClientId(clientId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectWithDetails(id: string): Promise<ProjectWithDetails | undefined> {
    const project = await this.getProjectById(id);
    if (!project) return undefined;
    
    const [client, notes, documents] = await Promise.all([
      this.getClientById(project.clientId),
      this.getProjectNotes(id),
      this.getProjectDocuments(id)
    ]);

    if (!client) return undefined;

    return {
      ...project,
      client,
      notes,
      documents
    };
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, project: UpdateProject): Promise<Project> {
    const result = await db.update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    // Delete related notes and documents first
    await Promise.all([
      db.delete(projectNotes).where(eq(projectNotes.projectId, id)),
      db.delete(projectDocuments).where(eq(projectDocuments.projectId, id))
    ]);
    
    // Delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project notes methods
  async getProjectNotes(projectId: string): Promise<ProjectNote[]> {
    return await db.select().from(projectNotes)
      .where(eq(projectNotes.projectId, projectId))
      .orderBy(desc(projectNotes.createdAt));
  }

  async getProjectNoteById(id: string): Promise<ProjectNote | undefined> {
    const result = await db.select().from(projectNotes)
      .where(eq(projectNotes.id, id))
      .limit(1);
    return result[0];
  }

  async createProjectNote(note: InsertProjectNote): Promise<ProjectNote> {
    const result = await db.insert(projectNotes).values(note).returning();
    return result[0];
  }

  async deleteProjectNote(id: string): Promise<void> {
    await db.delete(projectNotes).where(eq(projectNotes.id, id));
  }

  // Project documents methods
  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return await db.select().from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(desc(projectDocuments.createdAt));
  }

  async createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument> {
    const result = await db.insert(projectDocuments).values(document).returning();
    return result[0];
  }

  async getProjectDocumentById(id: string): Promise<ProjectDocument | undefined> {
    const result = await db.select().from(projectDocuments).where(eq(projectDocuments.id, id)).limit(1);
    return result[0];
  }

  async deleteProjectDocument(id: string): Promise<void> {
    await db.delete(projectDocuments).where(eq(projectDocuments.id, id));
  }

  // Chat session methods
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await dbPg.insert(chatSessions).values(session).returning();
    return result[0];
  }

  async getChatSessionById(id: string): Promise<ChatSession | undefined> {
    const result = await dbPg.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    return result[0];
  }

  async getChatSessionWithMessages(id: string): Promise<ChatSessionWithMessages | undefined> {
    const session = await this.getChatSessionById(id);
    if (!session) return undefined;

    const [messages, participants, client] = await Promise.all([
      this.getChatMessagesBySessionId(id),
      this.getChatParticipants(id),
      session.clientId ? this.getClientById(session.clientId) : Promise.resolve(undefined)
    ]);

    return {
      ...session,
      messages,
      participants,
      client: client || undefined
    };
  }

  async getActiveChatSessions(): Promise<ChatSessionSummary[]> {
    const sessions = await dbPg.select().from(chatSessions)
      .where(eq(chatSessions.status, 'active'))
      .orderBy(desc(chatSessions.lastMessageAt));

    return await Promise.all(sessions.map(async (session) => {
      const messageCount = await dbPg.select({ count: count() })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id));

      const lastMessage = await dbPg.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(desc(chatMessages.sentAt))
        .limit(1);

      return {
        ...session,
        messageCount: messageCount[0]?.count || 0,
        lastMessage: lastMessage[0],
        visitorName: session.visitorInfo?.name || 'Anonymous'
      };
    }));
  }

  async getChatSessionsByAdminId(adminId: string): Promise<ChatSessionSummary[]> {
    const sessions = await dbPg.select().from(chatSessions)
      .where(eq(chatSessions.adminId, adminId))
      .orderBy(desc(chatSessions.lastMessageAt));

    return await Promise.all(sessions.map(async (session) => {
      const messageCount = await dbPg.select({ count: count() })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id));

      const lastMessage = await dbPg.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(desc(chatMessages.sentAt))
        .limit(1);

      return {
        ...session,
        messageCount: messageCount[0]?.count || 0,
        lastMessage: lastMessage[0],
        visitorName: session.visitorInfo?.name || 'Anonymous'
      };
    }));
  }

  async getChatSessionsByStatus(status: string): Promise<ChatSessionSummary[]> {
    const sessions = await dbPg.select().from(chatSessions)
      .where(eq(chatSessions.status, status))
      .orderBy(desc(chatSessions.lastMessageAt));

    return await Promise.all(sessions.map(async (session) => {
      const messageCount = await dbPg.select({ count: count() })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id));

      const lastMessage = await dbPg.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(desc(chatMessages.sentAt))
        .limit(1);

      return {
        ...session,
        messageCount: messageCount[0]?.count || 0,
        lastMessage: lastMessage[0],
        visitorName: session.visitorInfo?.name || 'Anonymous'
      };
    }));
  }

  async updateChatSession(id: string, session: UpdateChatSession): Promise<ChatSession> {
    const result = await dbPg.update(chatSessions)
      .set({ ...session, lastMessageAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return result[0];
  }

  async endChatSession(id: string, notes?: string): Promise<void> {
    const updateData: any = {
      status: 'ended',
      endedAt: new Date()
    };
    if (notes) {
      updateData.notes = notes;
    }
    await dbPg.update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, id));
  }

  // Chat message methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await dbPg.insert(chatMessages).values(message).returning();
    
    // Update session's last message time
    await dbPg.update(chatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatSessions.id, message.sessionId));
    
    return result[0];
  }

  async getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return await dbPg.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.sentAt));
  }

  async markMessagesAsRead(sessionId: string, participantId: string): Promise<void> {
    await dbPg.update(chatMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(chatMessages.sessionId, sessionId),
          isNull(chatMessages.readAt)
        )
      );
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    await dbPg.update(chatMessages)
      .set({ deliveredAt: new Date() })
      .where(eq(chatMessages.id, messageId));
  }

  // Chat participant methods
  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const result = await dbPg.insert(chatParticipants).values(participant).returning();
    return result[0];
  }

  async getChatParticipants(sessionId: string): Promise<ChatParticipant[]> {
    return await dbPg.select().from(chatParticipants)
      .where(eq(chatParticipants.sessionId, sessionId))
      .orderBy(asc(chatParticipants.joinedAt));
  }

  async updateParticipantStatus(sessionId: string, participantId: string, isOnline: boolean): Promise<void> {
    await dbPg.update(chatParticipants)
      .set({ 
        isOnline, 
        lastSeenAt: new Date(),
        leftAt: isOnline ? null : new Date()
      })
      .where(
        and(
          eq(chatParticipants.sessionId, sessionId),
          eq(chatParticipants.participantId, participantId)
        )
      );
  }

  async removeParticipant(sessionId: string, participantId: string): Promise<void> {
    await dbPg.update(chatParticipants)
      .set({ 
        isOnline: false,
        leftAt: new Date()
      })
      .where(
        and(
          eq(chatParticipants.sessionId, sessionId),
          eq(chatParticipants.participantId, participantId)
        )
      );
  }

  // Chat analytics and reporting
  async getChatMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalSessions: number;
    activeSessions: number;
    averageSessionDuration: number;
    totalMessages: number;
    satisfactionRatings: number[];
  }> {
    let sessionsQuery = dbPg.select().from(chatSessions);
    
    if (startDate && endDate) {
      sessionsQuery = sessionsQuery.where(
        and(
          gte(chatSessions.startedAt, startDate),
          lte(chatSessions.startedAt, endDate)
        )
      );
    }

    const sessions = await sessionsQuery;
    const activeSessions = await dbPg.select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.status, 'active'));

    let messagesQuery = dbPg.select({ count: count() }).from(chatMessages);
    if (startDate && endDate) {
      messagesQuery = messagesQuery.where(
        and(
          gte(chatMessages.sentAt, startDate),
          lte(chatMessages.sentAt, endDate)
        )
      );
    }
    const totalMessagesResult = await messagesQuery;

    // Calculate average session duration
    const endedSessions = sessions.filter(s => s.endedAt && s.startedAt);
    const averageSessionDuration = endedSessions.length > 0
      ? endedSessions.reduce((sum, session) => {
          const duration = session.endedAt!.getTime() - session.startedAt.getTime();
          return sum + duration;
        }, 0) / endedSessions.length / 1000 / 60 // Convert to minutes
      : 0;

    const satisfactionRatings = sessions
      .filter(s => s.satisfactionRating !== null)
      .map(s => s.satisfactionRating!);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions[0]?.count || 0,
      averageSessionDuration,
      totalMessages: totalMessagesResult[0]?.count || 0,
      satisfactionRatings
    };
  }

  // Chat-consultation integration methods
  async escalateChatToConsultation(sessionId: string, consultationData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    projectDescription?: string;
    timeline?: string;
    budget?: string;
    servicesInterested?: string[];
    additionalNotes?: string;
  }): Promise<{ sessionId: string; consultationId: string; }> {
    // Get the chat session and its messages for context
    const session = await this.getChatSessionWithMessages(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Generate chat transcript for consultation context
    const chatTranscript = session.messages
      .filter(msg => msg.messageType === 'text')
      .map(msg => `${msg.senderType === 'admin' ? 'Admin' : 'Visitor'}: ${msg.content}`)
      .join('\n');

    // Create consultation with chat context
    const consultation = await this.createConsultation({
      name: consultationData.name,
      email: consultationData.email,
      company: consultationData.company,
      service: 'consultation',
      message: `Consultation escalated from live chat session`,
      consultationData: {
        phone: consultationData.phone,
        projectDescription: consultationData.projectDescription || 'Escalated from chat session',
        timeline: consultationData.timeline,
        budget: consultationData.budget,
        servicesInterested: consultationData.servicesInterested || [],
        additionalNotes: `Chat transcript:\n${chatTranscript}\n\nAdditional notes: ${consultationData.additionalNotes || 'None'}`
      }
    });

    // Update chat session to link to consultation
    await this.updateChatSession(sessionId, {
      consultationId: consultation.id,
      escalatedAt: new Date(),
      notes: `Escalated to consultation #${consultation.id}`
    });

    return {
      sessionId,
      consultationId: consultation.id
    };
  }

  async linkChatToConsultation(sessionId: string, consultationId: string): Promise<void> {
    await this.updateChatSession(sessionId, {
      consultationId,
      escalatedAt: new Date()
    });
  }

  // Google Integration methods implementation
  async createGoogleIntegration(integration: InsertGoogleIntegration) {
    const result = await db.insert(googleIntegrations).values(integration).returning();
    return result[0];
  }

  async getGoogleIntegration(userId: string, serviceType: string) {
    const result = await db.select()
      .from(googleIntegrations)
      .where(and(
        eq(googleIntegrations.userId, userId),
        eq(googleIntegrations.serviceType, serviceType),
        eq(googleIntegrations.isActive, true)
      ))
      .limit(1);
    return result[0];
  }

  async updateGoogleIntegration(id: string, integration: UpdateGoogleIntegration) {
    const result = await db.update(googleIntegrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(googleIntegrations.id, id))
      .returning();
    return result[0];
  }

  async deleteGoogleIntegration(id: string) {
    await db.delete(googleIntegrations).where(eq(googleIntegrations.id, id));
  }

  async getActiveGoogleIntegrations(userId: string) {
    return await db.select()
      .from(googleIntegrations)
      .where(and(
        eq(googleIntegrations.userId, userId),
        eq(googleIntegrations.isActive, true)
      ))
      .orderBy(desc(googleIntegrations.createdAt));
  }

  // Google Sheets methods implementation
  async createGoogleSheet(sheet: InsertGoogleSheets) {
    const result = await db.insert(googleSheets).values(sheet).returning();
    return result[0];
  }

  async getGoogleSheetByClientId(clientId: string) {
    const result = await db.select()
      .from(googleSheets)
      .where(eq(googleSheets.clientId, clientId))
      .limit(1);
    return result[0];
  }

  async updateGoogleSheet(id: string, sheet: UpdateGoogleSheets) {
    const result = await db.update(googleSheets)
      .set({ ...sheet, updatedAt: new Date() })
      .where(eq(googleSheets.id, id))
      .returning();
    return result[0];
  }

  async deleteGoogleSheet(id: string) {
    await db.delete(googleSheets).where(eq(googleSheets.id, id));
  }

  // Google Drive folder methods implementation
  async createGoogleDriveFolder(folder: InsertGoogleDriveFolder) {
    const result = await db.insert(googleDriveFolders).values(folder).returning();
    return result[0];
  }

  async getGoogleDriveFoldersByClientId(clientId: string) {
    return await db.select()
      .from(googleDriveFolders)
      .where(eq(googleDriveFolders.clientId, clientId))
      .orderBy(asc(googleDriveFolders.folderType), desc(googleDriveFolders.createdAt));
  }

  async updateGoogleDriveFolder(id: string, folder: UpdateGoogleDriveFolder) {
    const result = await db.update(googleDriveFolders)
      .set({ ...folder, updatedAt: new Date() })
      .where(eq(googleDriveFolders.id, id))
      .returning();
    return result[0];
  }

  async deleteGoogleDriveFolder(id: string) {
    await db.delete(googleDriveFolders).where(eq(googleDriveFolders.id, id));
  }

  // Google Calendar methods
  async createGoogleCalendar(calendar: InsertGoogleCalendar) {
    const result = await db.insert(googleCalendar).values(calendar).returning();
    return result[0];
  }

  async getGoogleCalendar(clientId: string) {
    const result = await db.select()
      .from(googleCalendar)
      .where(eq(googleCalendar.clientId, clientId))
      .limit(1);
    return result[0];
  }

  async updateGoogleCalendar(id: string, calendar: UpdateGoogleCalendar) {
    const result = await db.update(googleCalendar)
      .set({ ...calendar, updatedAt: new Date() })
      .where(eq(googleCalendar.id, id))
      .returning();
    return result[0];
  }

  async deleteGoogleCalendar(id: string) {
    await db.delete(googleCalendar).where(eq(googleCalendar.id, id));
  }

  // Google Calendar event methods implementation
  async createGoogleCalendarEvent(event: InsertGoogleCalendarEvent) {
    const result = await db.insert(googleCalendarEvents).values(event).returning();
    return result[0];
  }

  async getGoogleCalendarEventsByClientId(clientId: string) {
    return await db.select()
      .from(googleCalendarEvents)
      .where(eq(googleCalendarEvents.clientId, clientId))
      .orderBy(desc(googleCalendarEvents.startTime));
  }

  async updateGoogleCalendarEvent(id: string, event: UpdateGoogleCalendarEvent) {
    const result = await db.update(googleCalendarEvents)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(googleCalendarEvents.id, id))
      .returning();
    return result[0];
  }

  async deleteGoogleCalendarEvent(id: string) {
    await db.delete(googleCalendarEvents).where(eq(googleCalendarEvents.id, id));
  }

  // Gmail thread methods implementation
  async createGmailThread(thread: InsertGmailThread) {
    const result = await db.insert(gmailThreads).values(thread).returning();
    return result[0];
  }

  async getGmailThreadsByClientId(clientId: string) {
    return await db.select()
      .from(gmailThreads)
      .where(eq(gmailThreads.clientId, clientId))
      .orderBy(desc(gmailThreads.lastMessageAt));
  }

  async updateGmailThread(id: string, thread: UpdateGmailThread) {
    const result = await db.update(gmailThreads)
      .set({ ...thread, updatedAt: new Date() })
      .where(eq(gmailThreads.id, id))
      .returning();
    return result[0];
  }

  async deleteGmailThread(id: string) {
    await db.delete(gmailThreads).where(eq(gmailThreads.id, id));
  }

  // Sync log methods implementation
  async createSyncLog(log: InsertSyncLog) {
    const result = await db.insert(syncLogs).values(log).returning();
    return result[0];
  }

  async getSyncLogsByEntityId(entityId: string) {
    return await db.select()
      .from(syncLogs)
      .where(eq(syncLogs.entityId, entityId))
      .orderBy(desc(syncLogs.createdAt));
  }

  async getSyncLogsByStatus(status: string) {
    return await db.select()
      .from(syncLogs)
      .where(eq(syncLogs.status, status))
      .orderBy(desc(syncLogs.createdAt));
  }

  async updateSyncLogStatus(id: string, status: string, errorMessage?: string) {
    await db.update(syncLogs)
      .set({ 
        status, 
        errorMessage,
        processedAt: status === 'completed' || status === 'failed' ? new Date() : undefined
      })
      .where(eq(syncLogs.id, id));
  }

  // Project milestone methods implementation
  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    const result = await db.insert(projectMilestones).values(milestone).returning();
    return result[0];
  }

  async getProjectMilestonesByProjectId(projectId: string): Promise<ProjectMilestone[]> {
    return await db.select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(projectMilestones.order);
  }

  async getProjectMilestoneById(id: string): Promise<ProjectMilestone | undefined> {
    const result = await db.select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, id))
      .limit(1);
    return result[0];
  }

  async updateProjectMilestone(id: string, milestone: UpdateProjectMilestone): Promise<ProjectMilestone> {
    const result = await db.update(projectMilestones)
      .set({ ...milestone, updatedAt: new Date() })
      .where(eq(projectMilestones.id, id))
      .returning();
    return result[0];
  }

  async deleteProjectMilestone(id: string): Promise<void> {
    await db.delete(projectMilestones).where(eq(projectMilestones.id, id));
  }

  // Project deliverable methods implementation
  async createProjectDeliverable(deliverable: InsertProjectDeliverable): Promise<ProjectDeliverable> {
    const result = await db.insert(projectDeliverables).values(deliverable).returning();
    return result[0];
  }

  async getProjectDeliverablesByMilestoneId(milestoneId: string): Promise<ProjectDeliverable[]> {
    return await db.select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.milestoneId, milestoneId))
      .orderBy(projectDeliverables.createdAt);
  }

  async getProjectDeliverablesByProjectId(projectId: string): Promise<ProjectDeliverable[]> {
    return await db.select()
      .from(projectDeliverables)
      .leftJoin(projectMilestones, eq(projectDeliverables.milestoneId, projectMilestones.id))
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(projectDeliverables.createdAt);
  }

  async getProjectDeliverableById(id: string): Promise<ProjectDeliverable | undefined> {
    const result = await db.select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.id, id))
      .limit(1);
    return result[0];
  }

  async updateProjectDeliverable(id: string, deliverable: UpdateProjectDeliverable): Promise<ProjectDeliverable> {
    const result = await db.update(projectDeliverables)
      .set({ ...deliverable, updatedAt: new Date() })
      .where(eq(projectDeliverables.id, id))
      .returning();
    return result[0];
  }

  async deleteProjectDeliverable(id: string): Promise<void> {
    await db.delete(projectDeliverables).where(eq(projectDeliverables.id, id));
  }

  // Project status update methods implementation
  async createProjectStatusUpdate(statusUpdate: InsertProjectStatusUpdate): Promise<ProjectStatusUpdate> {
    const result = await db.insert(projectStatusUpdates).values(statusUpdate).returning();
    return result[0];
  }

  async getProjectStatusUpdatesByProjectId(projectId: string): Promise<ProjectStatusUpdate[]> {
    return await db.select()
      .from(projectStatusUpdates)
      .where(eq(projectStatusUpdates.projectId, projectId))
      .orderBy(desc(projectStatusUpdates.createdAt));
  }

  async getProjectStatusUpdateById(id: string): Promise<ProjectStatusUpdate | undefined> {
    const result = await db.select()
      .from(projectStatusUpdates)
      .where(eq(projectStatusUpdates.id, id))
      .limit(1);
    return result[0];
  }

  async updateProjectStatusUpdate(id: string, statusUpdate: UpdateProjectStatusUpdate): Promise<ProjectStatusUpdate> {
    const result = await db.update(projectStatusUpdates)
      .set(statusUpdate)
      .where(eq(projectStatusUpdates.id, id))
      .returning();
    return result[0];
  }

  async markStatusUpdateSent(id: string): Promise<void> {
    await db.update(projectStatusUpdates)
      .set({ 
        sentToClient: true,
        emailSentAt: new Date()
      })
      .where(eq(projectStatusUpdates.id, id));
  }

  // Project dashboard methods implementation
  async createProjectDashboard(dashboard: InsertProjectDashboard): Promise<ProjectDashboard> {
    const result = await db.insert(projectDashboards).values(dashboard).returning();
    return result[0];
  }

  async getProjectDashboardByProjectId(projectId: string): Promise<ProjectDashboard | undefined> {
    const result = await db.select()
      .from(projectDashboards)
      .where(eq(projectDashboards.projectId, projectId))
      .limit(1);
    return result[0];
  }

  async updateProjectDashboard(id: string, dashboard: UpdateProjectDashboard): Promise<ProjectDashboard> {
    const result = await db.update(projectDashboards)
      .set({ ...dashboard, updatedAt: new Date() })
      .where(eq(projectDashboards.id, id))
      .returning();
    return result[0];
  }

  async updateProjectDashboardSync(id: string, syncData: { lastSyncedAt: Date; syncStatus: string; syncError?: string }): Promise<void> {
    await db.update(projectDashboards)
      .set({ 
        lastSyncedAt: syncData.lastSyncedAt,
        syncStatus: syncData.syncStatus,
        syncError: syncData.syncError,
        updatedAt: new Date()
      })
      .where(eq(projectDashboards.id, id));
  }

  async deleteProjectDashboard(id: string): Promise<void> {
    await db.delete(projectDashboards).where(eq(projectDashboards.id, id));
  }

  // Automation discovery methods implementation
  async createAutomationDiscovery(discovery: InsertAutomationDiscovery): Promise<AutomationDiscoveryRequest> {
    const result = await db.insert(automationDiscoveryRequests).values(discovery).returning();
    return result[0];
  }

  async getAllAutomationDiscoveries(): Promise<AutomationDiscoveryRequest[]> {
    return await db.select()
      .from(automationDiscoveryRequests)
      .orderBy(desc(automationDiscoveryRequests.createdAt));
  }

  async getAutomationDiscoveryById(id: string): Promise<AutomationDiscoveryRequest | undefined> {
    const result = await db.select()
      .from(automationDiscoveryRequests)
      .where(eq(automationDiscoveryRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getAutomationDiscoveriesByStatus(status: string): Promise<AutomationDiscoveryRequest[]> {
    return await db.select()
      .from(automationDiscoveryRequests)
      .where(eq(automationDiscoveryRequests.status, status))
      .orderBy(desc(automationDiscoveryRequests.createdAt));
  }

  async updateAutomationDiscovery(id: string, discovery: UpdateAutomationDiscovery): Promise<AutomationDiscoveryRequest> {
    const result = await db.update(automationDiscoveryRequests)
      .set({ ...discovery, updatedAt: new Date() })
      .where(eq(automationDiscoveryRequests.id, id))
      .returning();
    return result[0];
  }

  async updateAutomationDiscoveryOutline(id: string, outline: AutomationOutline): Promise<AutomationDiscoveryRequest> {
    const result = await db.update(automationDiscoveryRequests)
      .set({ 
        aiOutline: outline,
        status: 'outline_generated',
        updatedAt: new Date()
      })
      .where(eq(automationDiscoveryRequests.id, id))
      .returning();
    return result[0];
  }

  async updateAutomationDiscoveryOutlines(id: string, primaryOutline: AutomationOutline | null, secondaryOutline: AutomationOutline | null): Promise<AutomationDiscoveryRequest> {
    const updateData: any = {
      status: 'outline_generated',
      updatedAt: new Date()
    };
    
    if (primaryOutline) {
      updateData.aiOutline = primaryOutline;
    }
    if (secondaryOutline) {
      updateData.geminiOutline = secondaryOutline;
    }
    
    const result = await db.update(automationDiscoveryRequests)
      .set(updateData)
      .where(eq(automationDiscoveryRequests.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomationDiscovery(id: string): Promise<void> {
    await db.delete(automationDiscoveryRequests).where(eq(automationDiscoveryRequests.id, id));
  }

  // ============================================
  // CHATBOT CONFIGURATION METHODS (Transferable)
  // ============================================

  async getChatbotConfig(): Promise<ChatbotConfig | undefined> {
    const result = await dbPg.select().from(chatbotConfig).where(eq(chatbotConfig.id, 1)).limit(1);
    if (result[0]) return result[0];
    const inserted = await dbPg.insert(chatbotConfig).values({
      id: 1,
      systemPrompt: "You are a helpful AI assistant for Steel City AI. Be concise, professional, and helpful. Answer questions about our AI automation services including document processing, customer service automation, and marketing optimization.",
      isEnabled: true,
    }).onConflictDoNothing().returning();
    return inserted[0];
  }

  async updateChatbotConfig(config: UpdateChatbotConfig): Promise<ChatbotConfig> {
    await this.getChatbotConfig();
    const result = await dbPg.update(chatbotConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(chatbotConfig.id, 1))
      .returning();
    return result[0];
  }

  // Knowledge base methods
  async getChatbotKnowledgeBase(): Promise<ChatbotKnowledge[]> {
    return await dbPg.select().from(chatbotKnowledgeBase)
      .where(eq(chatbotKnowledgeBase.isActive, true))
      .orderBy(desc(chatbotKnowledgeBase.priority), asc(chatbotKnowledgeBase.category));
  }

  async getChatbotKnowledgeByCategory(category: string): Promise<ChatbotKnowledge[]> {
    return await dbPg.select().from(chatbotKnowledgeBase)
      .where(and(
        eq(chatbotKnowledgeBase.category, category),
        eq(chatbotKnowledgeBase.isActive, true)
      ))
      .orderBy(desc(chatbotKnowledgeBase.priority));
  }

  async getChatbotKnowledgeById(id: number): Promise<ChatbotKnowledge | undefined> {
    const result = await dbPg.select().from(chatbotKnowledgeBase)
      .where(eq(chatbotKnowledgeBase.id, id))
      .limit(1);
    return result[0];
  }

  async createChatbotKnowledge(knowledge: InsertChatbotKnowledge): Promise<ChatbotKnowledge> {
    const result = await dbPg.insert(chatbotKnowledgeBase).values(knowledge).returning();
    return result[0];
  }

  async updateChatbotKnowledge(id: number, knowledge: UpdateChatbotKnowledge): Promise<ChatbotKnowledge> {
    const { id: _id, createdAt, updatedAt, ...updateData } = knowledge as any;
    const result = await dbPg.update(chatbotKnowledgeBase)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(chatbotKnowledgeBase.id, id))
      .returning();
    return result[0];
  }

  async deleteChatbotKnowledge(id: number): Promise<void> {
    await dbPg.delete(chatbotKnowledgeBase).where(eq(chatbotKnowledgeBase.id, id));
  }

  async searchChatbotKnowledge(query: string): Promise<ChatbotKnowledge[]> {
    const lowercaseQuery = query.toLowerCase();
    const allKnowledge = await this.getChatbotKnowledgeBase();
    
    // Simple keyword matching - can be enhanced with vector search later
    return allKnowledge.filter(k => {
      const questionMatch = k.question.toLowerCase().includes(lowercaseQuery);
      const answerMatch = k.answer.toLowerCase().includes(lowercaseQuery);
      const keywordMatch = k.keywords?.some(kw => kw.toLowerCase().includes(lowercaseQuery) || lowercaseQuery.includes(kw.toLowerCase()));
      return questionMatch || answerMatch || keywordMatch;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  // Social media management implementations
  async getSocialAccounts(clientId?: string): Promise<SocialAccount[]> {
    if (clientId) {
      return dbPg.select().from(socialAccounts).where(eq(socialAccounts.clientId, clientId)).orderBy(desc(socialAccounts.createdAt));
    }
    return dbPg.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
  }

  async getSocialAccountById(id: string): Promise<SocialAccount | undefined> {
    const result = await dbPg.select().from(socialAccounts).where(eq(socialAccounts.id, id)).limit(1);
    return result[0];
  }

  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const result = await dbPg.insert(socialAccounts).values(account).returning();
    return result[0];
  }

  async updateSocialAccount(id: string, account: UpdateSocialAccount): Promise<SocialAccount> {
    const result = await dbPg.update(socialAccounts).set({ ...account, updatedAt: new Date() }).where(eq(socialAccounts.id, id)).returning();
    return result[0];
  }

  async deleteSocialAccount(id: string): Promise<void> {
    await dbPg.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  async getSocialCampaigns(clientId?: string): Promise<SocialCampaign[]> {
    if (clientId) {
      return dbPg.select().from(socialCampaigns).where(eq(socialCampaigns.clientId, clientId)).orderBy(desc(socialCampaigns.createdAt));
    }
    return dbPg.select().from(socialCampaigns).orderBy(desc(socialCampaigns.createdAt));
  }

  async getSocialCampaignById(id: string): Promise<SocialCampaign | undefined> {
    const result = await dbPg.select().from(socialCampaigns).where(eq(socialCampaigns.id, id)).limit(1);
    return result[0];
  }

  async createSocialCampaign(campaign: InsertSocialCampaign): Promise<SocialCampaign> {
    const result = await dbPg.insert(socialCampaigns).values(campaign).returning();
    return result[0];
  }

  async updateSocialCampaign(id: string, campaign: UpdateSocialCampaign): Promise<SocialCampaign> {
    const result = await dbPg.update(socialCampaigns).set({ ...campaign, updatedAt: new Date() }).where(eq(socialCampaigns.id, id)).returning();
    return result[0];
  }

  async deleteSocialCampaign(id: string): Promise<void> {
    await dbPg.delete(socialCampaigns).where(eq(socialCampaigns.id, id));
  }

  async getSocialPosts(clientId?: string, campaignId?: string): Promise<SocialPost[]> {
    const conditions = [];
    if (clientId) conditions.push(eq(socialPosts.clientId, clientId));
    if (campaignId) conditions.push(eq(socialPosts.campaignId, campaignId));
    
    const query = dbPg.select().from(socialPosts);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(socialPosts.createdAt));
    }
    return query.orderBy(desc(socialPosts.createdAt));
  }

  async getSocialPostById(id: string): Promise<SocialPost | undefined> {
    const result = await dbPg.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    return result[0];
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const result = await dbPg.insert(socialPosts).values(post).returning();
    return result[0];
  }

  async updateSocialPost(id: string, post: UpdateSocialPost): Promise<SocialPost> {
    const result = await dbPg.update(socialPosts).set({ ...post, updatedAt: new Date() }).where(eq(socialPosts.id, id)).returning();
    return result[0];
  }

  async deleteSocialPost(id: string): Promise<void> {
    await dbPg.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  async getDueScheduledPosts(): Promise<SocialPost[]> {
    return dbPg
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, "scheduled"),
          lte(socialPosts.scheduledAt, new Date())
        )
      )
      .orderBy(asc(socialPosts.scheduledAt));
  }

  async getAiAgents(): Promise<AiAgent[]> {
    return dbPg.select().from(aiAgents).orderBy(desc(aiAgents.createdAt));
  }

  async getAiAgentById(id: string): Promise<AiAgent | undefined> {
    const result = await dbPg.select().from(aiAgents).where(eq(aiAgents.id, id)).limit(1);
    return result[0];
  }

  async getAiAgentByRole(role: string): Promise<AiAgent | undefined> {
    const result = await dbPg.select().from(aiAgents).where(eq(aiAgents.role, role)).limit(1);
    return result[0];
  }

  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    const result = await dbPg.insert(aiAgents).values(agent).returning();
    return result[0];
  }

  async updateAiAgent(id: string, agent: UpdateAiAgent): Promise<AiAgent> {
    const result = await dbPg.update(aiAgents).set({ ...agent, updatedAt: new Date() }).where(eq(aiAgents.id, id)).returning();
    return result[0];
  }

  async getAiAgentTasks(agentId?: string, clientId?: string): Promise<AiAgentTask[]> {
    const conditions = [];
    if (agentId) conditions.push(eq(aiAgentTasks.agentId, agentId));
    if (clientId) conditions.push(eq(aiAgentTasks.clientId, clientId));
    
    const query = dbPg.select().from(aiAgentTasks);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(aiAgentTasks.createdAt));
    }
    return query.orderBy(desc(aiAgentTasks.createdAt));
  }

  async getAiAgentTaskById(id: string): Promise<AiAgentTask | undefined> {
    const result = await dbPg.select().from(aiAgentTasks).where(eq(aiAgentTasks.id, id)).limit(1);
    return result[0];
  }

  async createAiAgentTask(task: InsertAiAgentTask): Promise<AiAgentTask> {
    const id = crypto.randomUUID();
    const values: Record<string, any> = {
      id,
      agentId: task.agentId,
      taskType: task.taskType,
      status: task.status ?? "pending",
    };
    if (task.clientId) values.clientId = task.clientId;
    if (task.input !== undefined && task.input !== null) values.input = task.input;
    if (task.output !== undefined && task.output !== null) values.output = task.output;
    if (task.parentTaskId) values.parentTaskId = task.parentTaskId;
    if (task.postId) values.postId = task.postId;
    if (task.campaignId) values.campaignId = task.campaignId;
    await dbPg.insert(aiAgentTasks).values(values as any);
    const result = await dbPg.select().from(aiAgentTasks).where(eq(aiAgentTasks.id, id)).limit(1);
    return result[0];
  }

  async updateAiAgentTask(id: string, task: UpdateAiAgentTask): Promise<AiAgentTask> {
    await dbPg.update(aiAgentTasks).set(task).where(eq(aiAgentTasks.id, id));
    const result = await dbPg.select().from(aiAgentTasks).where(eq(aiAgentTasks.id, id)).limit(1);
    return result[0];
  }

  async getTrainingFeedback(clientId?: string): Promise<TrainingFeedback[]> {
    if (clientId) {
      return dbPg.select().from(trainingFeedback).where(eq(trainingFeedback.clientId, clientId)).orderBy(desc(trainingFeedback.createdAt));
    }
    return dbPg.select().from(trainingFeedback).orderBy(desc(trainingFeedback.createdAt));
  }

  async createTrainingFeedback(feedback: InsertTrainingFeedback): Promise<TrainingFeedback> {
    const result = await dbPg.insert(trainingFeedback).values(feedback).returning();
    return result[0];
  }

  async getBrandVoiceProfiles(clientId?: string): Promise<BrandVoiceProfile[]> {
    if (clientId) {
      return dbPg.select().from(brandVoiceProfiles).where(eq(brandVoiceProfiles.clientId, clientId)).orderBy(desc(brandVoiceProfiles.createdAt));
    }
    return dbPg.select().from(brandVoiceProfiles).orderBy(desc(brandVoiceProfiles.createdAt));
  }

  async getBrandVoiceProfileById(id: string): Promise<BrandVoiceProfile | undefined> {
    const result = await dbPg.select().from(brandVoiceProfiles).where(eq(brandVoiceProfiles.id, id)).limit(1);
    return result[0];
  }

  async createBrandVoiceProfile(profile: InsertBrandVoiceProfile): Promise<BrandVoiceProfile> {
    const result = await dbPg.insert(brandVoiceProfiles).values(profile).returning();
    return result[0];
  }

  async updateBrandVoiceProfile(id: string, profile: UpdateBrandVoiceProfile): Promise<BrandVoiceProfile> {
    const result = await dbPg.update(brandVoiceProfiles).set({ ...profile, updatedAt: new Date() }).where(eq(brandVoiceProfiles.id, id)).returning();
    return result[0];
  }

  async deleteBrandVoiceProfile(id: string): Promise<void> {
    await db.delete(brandVoiceProfiles).where(eq(brandVoiceProfiles.id, id));
  }

  // ============ APPROVAL WORKFLOW ============

  async getApprovalRequests(filters?: { status?: string }): Promise<any[]> {
    // Get posts that have an approval status, with their latest approval record
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(socialPosts.approvalStatus, filters.status));
    } else {
      conditions.push(drizzleSql`${socialPosts.approvalStatus} IS NOT NULL`);
    }

    const posts = await dbPg
      .select()
      .from(socialPosts)
      .where(and(...conditions))
      .orderBy(desc(socialPosts.updatedAt));

    // For each post, get the latest approval record
    const results = [];
    for (const post of posts) {
      const approvals = await dbPg
        .select()
        .from(socialPostApprovals)
        .where(eq(socialPostApprovals.postId, post.id))
        .orderBy(desc(socialPostApprovals.createdAt))
        .limit(1);

      const latestApproval = approvals[0];

      results.push({
        id: latestApproval?.id || post.id,
        postId: post.id,
        post: {
          id: post.id,
          content: post.content,
          platforms: post.platforms,
          mediaUrls: post.mediaUrls,
          hashtags: post.hashtags,
          scheduledAt: post.scheduledAt,
          createdAt: post.createdAt,
        },
        status: post.approvalStatus || 'pending',
        level: 1,
        comments: latestApproval?.comments || null,
        createdAt: latestApproval?.createdAt || post.createdAt,
        updatedAt: post.updatedAt,
      });
    }

    return results;
  }

  async getPostApprovals(postId: string): Promise<SocialPostApproval[]> {
    return dbPg.select().from(socialPostApprovals)
      .where(eq(socialPostApprovals.postId, postId))
      .orderBy(desc(socialPostApprovals.createdAt));
  }

  async createPostApproval(approval: InsertSocialPostApproval): Promise<SocialPostApproval> {
    const result = await dbPg.insert(socialPostApprovals).values(approval).returning();
    return result[0];
  }

  async getApprovalChain(postId: string): Promise<SocialPostApprovalChain[]> {
    return dbPg.select().from(socialPostApprovalChain)
      .where(eq(socialPostApprovalChain.postId, postId))
      .orderBy(asc(socialPostApprovalChain.chainOrder));
  }

  async createApprovalChainStep(step: InsertSocialPostApprovalChain): Promise<SocialPostApprovalChain> {
    const result = await dbPg.insert(socialPostApprovalChain).values(step).returning();
    return result[0];
  }

  async updateApprovalChainStep(id: string, data: Partial<SocialPostApprovalChain>): Promise<SocialPostApprovalChain> {
    const result = await dbPg.update(socialPostApprovalChain)
      .set(data)
      .where(eq(socialPostApprovalChain.id, id))
      .returning();
    return result[0];
  }

  // ============ HASHTAG ANALYTICS ============

  async getHashtagMetrics(filters?: { hashtag?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<SocialHashtagMetric[]> {
    const conditions: any[] = [];
    if (filters?.hashtag) conditions.push(eq(socialHashtagMetrics.hashtag, filters.hashtag));
    if (filters?.startDate) conditions.push(gte(socialHashtagMetrics.measuredAt, filters.startDate));
    if (filters?.endDate) conditions.push(lte(socialHashtagMetrics.measuredAt, filters.endDate));

    const query = dbPg.select().from(socialHashtagMetrics);
    const ordered = conditions.length > 0
      ? query.where(and(...conditions)).orderBy(desc(socialHashtagMetrics.measuredAt))
      : query.orderBy(desc(socialHashtagMetrics.measuredAt));

    if (filters?.limit) {
      return ordered.limit(filters.limit);
    }
    return ordered;
  }

  async createHashtagMetric(metric: InsertSocialHashtagMetric): Promise<SocialHashtagMetric> {
    const result = await dbPg.insert(socialHashtagMetrics).values(metric).returning();
    return result[0];
  }

  async getTopHashtags(options?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<{ hashtag: string; totalImpressions: number; totalEngagements: number; totalClicks: number; postCount: number }[]> {
    const conditions: any[] = [];
    if (options?.startDate) conditions.push(gte(socialHashtagMetrics.measuredAt, options.startDate));
    if (options?.endDate) conditions.push(lte(socialHashtagMetrics.measuredAt, options.endDate));

    const baseQuery = dbPg
      .select({
        hashtag: socialHashtagMetrics.hashtag,
        totalImpressions: drizzleSql<number>`COALESCE(SUM(${socialHashtagMetrics.impressions}), 0)::int`.as("total_impressions"),
        totalEngagements: drizzleSql<number>`COALESCE(SUM(${socialHashtagMetrics.engagements}), 0)::int`.as("total_engagements"),
        totalClicks: drizzleSql<number>`COALESCE(SUM(${socialHashtagMetrics.clicks}), 0)::int`.as("total_clicks"),
        postCount: drizzleSql<number>`COUNT(DISTINCT ${socialHashtagMetrics.postId})::int`.as("post_count"),
      })
      .from(socialHashtagMetrics);

    const filtered = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const grouped = filtered
      .groupBy(socialHashtagMetrics.hashtag)
      .orderBy(drizzleSql`total_engagements DESC`);

    if (options?.limit) {
      return grouped.limit(options.limit);
    }
    return grouped.limit(50); // default top 50
  }

  // ============ PREDICTION RECORDS ============

  async createPredictionRecord(record: InsertPredictionRecord): Promise<PredictionRecord> {
    const result = await dbPg.insert(predictionRecords).values(record).returning();
    return result[0];
  }

  async getPredictionByPostId(postId: string): Promise<PredictionRecord | undefined> {
    const result = await dbPg
      .select()
      .from(predictionRecords)
      .where(eq(predictionRecords.postId, postId))
      .orderBy(desc(predictionRecords.predictedAt))
      .limit(1);
    return result[0];
  }

  async updatePredictionActual(postId: string, actualScore: number): Promise<PredictionRecord | undefined> {
    const existing = await this.getPredictionByPostId(postId);
    if (!existing) return undefined;

    const result = await dbPg
      .update(predictionRecords)
      .set({ actualScore: String(actualScore), actualMeasuredAt: new Date() })
      .where(eq(predictionRecords.id, existing.id))
      .returning();
    return result[0];
  }

  async getPredictionAccuracy(options?: { limit?: number }): Promise<PredictionRecord[]> {
    const limit = options?.limit ?? 100;
    return dbPg
      .select()
      .from(predictionRecords)
      .where(
        and(
          drizzleSql`${predictionRecords.actualScore} IS NOT NULL`
        )
      )
      .orderBy(desc(predictionRecords.predictedAt))
      .limit(limit);
  }

  // ============ NOTIFICATION PREFERENCES ============

  async getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined> {
    const result = await dbPg
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    return result[0];
  }

  async upsertNotificationPreferences(prefs: InsertNotificationPreference): Promise<NotificationPreference> {
    // Check if exists
    const existing = await this.getNotificationPreferences(prefs.userId);
    if (existing) {
      const result = await dbPg
        .update(notificationPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(notificationPreferences.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await dbPg.insert(notificationPreferences).values(prefs).returning();
    return result[0];
  }

  async updateNotificationPreferences(userId: string, data: UpdateNotificationPreference): Promise<NotificationPreference | undefined> {
    const existing = await this.getNotificationPreferences(userId);
    if (!existing) return undefined;

    const result = await dbPg
      .update(notificationPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing.id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
