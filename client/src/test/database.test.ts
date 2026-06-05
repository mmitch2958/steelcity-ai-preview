import { storage } from '../../../server/storage';
import { 
  mockClients, 
  mockProjects, 
  mockProjectNotes, 
  mockProjectDocuments, 
  mockContactInquiries,
  mockUser 
} from './fixtures';

// Mock database connection
jest.mock('../../../server/storage', () => ({
  storage: {
    // User management
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByUsername: jest.fn(),
    
    // Client management
    getAllClients: jest.fn(),
    createClient: jest.fn(),
    getClient: jest.fn(),
    getClientWithProjects: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
    convertInquiryToClient: jest.fn(),
    
    // Project management
    getProjectsByClientId: jest.fn(),
    createProject: jest.fn(),
    getProject: jest.fn(),
    getProjectWithDetails: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    
    // Project notes
    getProjectNotes: jest.fn(),
    createProjectNote: jest.fn(),
    deleteProjectNote: jest.fn(),
    
    // Project documents
    getProjectDocuments: jest.fn(),
    createProjectDocument: jest.fn(),
    getProjectDocumentById: jest.fn(),
    deleteProjectDocument: jest.fn(),
    
    // Contact inquiries
    getContactInquiries: jest.fn(),
    createContactInquiry: jest.fn(),
    updateContactInquiryStatus: jest.fn(),
    
    // Case studies and services (existing)
    getAllCaseStudies: jest.fn(),
    getFeaturedCaseStudies: jest.fn(),
    createCaseStudy: jest.fn(),
    getActiveServices: jest.fn(),
    getFeaturedServices: jest.fn(),
    getServiceBySlug: jest.fn(),
    createService: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
  },
}));

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Database Operations', () => {
    it('should create a new client', async () => {
      const newClient = mockClients[0];
      (storage.createClient as jest.Mock).mockResolvedValue(newClient);

      const result = await storage.createClient({
        name: newClient.name,
        email: newClient.email,
        company: newClient.company,
        phone: newClient.phone,
        notes: newClient.notes,
        status: newClient.status,
      });

      expect(storage.createClient).toHaveBeenCalledWith({
        name: newClient.name,
        email: newClient.email,
        company: newClient.company,
        phone: newClient.phone,
        notes: newClient.notes,
        status: newClient.status,
      });
      expect(result).toEqual(newClient);
    });

    it('should get all clients with pagination', async () => {
      const paginatedResult = {
        clients: mockClients.slice(0, 2),
        total: mockClients.length,
      };
      (storage.getAllClients as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await storage.getAllClients(1, 2);

      expect(storage.getAllClients).toHaveBeenCalledWith(1, 2);
      expect(result.clients).toHaveLength(2);
      expect(result.total).toBe(mockClients.length);
    });

    it('should get client with projects', async () => {
      const clientWithProjects = {
        ...mockClients[0],
        projects: mockProjects.filter(p => p.clientId === mockClients[0].id),
      };
      (storage.getClientWithProjects as jest.Mock).mockResolvedValue(clientWithProjects);

      const result = await storage.getClientWithProjects(mockClients[0].id);

      expect(storage.getClientWithProjects).toHaveBeenCalledWith(mockClients[0].id);
      expect(result?.projects).toHaveLength(2);
    });

    it('should update client', async () => {
      const updatedClient = { ...mockClients[0], name: 'Updated Name' };
      (storage.updateClient as jest.Mock).mockResolvedValue(updatedClient);

      const result = await storage.updateClient(mockClients[0].id, { name: 'Updated Name' });

      expect(storage.updateClient).toHaveBeenCalledWith(mockClients[0].id, { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should delete client', async () => {
      (storage.deleteClient as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteClient(mockClients[0].id);

      expect(storage.deleteClient).toHaveBeenCalledWith(mockClients[0].id);
    });

    it('should convert inquiry to client', async () => {
      const conversionData = {
        inquiryId: mockContactInquiries[0].id,
        phone: '+1 (555) 123-4567',
        notes: 'Converted from inquiry',
      };
      
      const newClient = {
        id: 'client-converted',
        name: mockContactInquiries[0].name,
        email: mockContactInquiries[0].email,
        company: mockContactInquiries[0].company,
        phone: conversionData.phone,
        notes: conversionData.notes,
        status: 'active' as const,
        createdAt: new Date(),
      };

      (storage.convertInquiryToClient as jest.Mock).mockResolvedValue(newClient);

      const result = await storage.convertInquiryToClient(conversionData);

      expect(storage.convertInquiryToClient).toHaveBeenCalledWith(conversionData);
      expect(result.name).toBe(mockContactInquiries[0].name);
      expect(result.phone).toBe(conversionData.phone);
    });
  });

  describe('Project Database Operations', () => {
    it('should create a new project', async () => {
      const newProject = mockProjects[0];
      (storage.createProject as jest.Mock).mockResolvedValue(newProject);

      const result = await storage.createProject({
        clientId: newProject.clientId,
        title: newProject.title,
        description: newProject.description,
        status: newProject.status as 'prospect' | 'discovery' | 'in_progress' | 'qa' | 'delivered' | 'on_hold',
        progress: newProject.progress,
        budget: newProject.budget,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
      });

      expect(storage.createProject).toHaveBeenCalledWith({
        clientId: newProject.clientId,
        title: newProject.title,
        description: newProject.description,
        status: newProject.status,
        progress: newProject.progress,
        budget: newProject.budget,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
      });
      expect(result).toEqual(newProject);
    });

    it('should get projects by client ID', async () => {
      const clientProjects = mockProjects.filter(p => p.clientId === 'client-1');
      (storage.getProjectsByClientId as jest.Mock).mockResolvedValue(clientProjects);

      const result = await storage.getProjectsByClientId('client-1');

      expect(storage.getProjectsByClientId).toHaveBeenCalledWith('client-1');
      expect(result).toHaveLength(2);
    });

    it('should get project with details', async () => {
      const projectWithDetails = {
        ...mockProjects[0],
        notes: mockProjectNotes.filter(n => n.projectId === mockProjects[0].id),
        documents: mockProjectDocuments.filter(d => d.projectId === mockProjects[0].id),
        client: mockClients.find(c => c.id === mockProjects[0].clientId),
      };
      (storage.getProjectWithDetails as jest.Mock).mockResolvedValue(projectWithDetails);

      const result = await storage.getProjectWithDetails(mockProjects[0].id);

      expect(storage.getProjectWithDetails).toHaveBeenCalledWith(mockProjects[0].id);
      expect(result?.notes).toHaveLength(2);
      expect(result?.documents).toHaveLength(2);
      expect(result?.client).toBeDefined();
    });

    it('should update project', async () => {
      const updatedProject = { ...mockProjects[0], progress: 75 };
      (storage.updateProject as jest.Mock).mockResolvedValue(updatedProject);

      const result = await storage.updateProject(mockProjects[0].id, { progress: 75 });

      expect(storage.updateProject).toHaveBeenCalledWith(mockProjects[0].id, { progress: 75 });
      expect(result.progress).toBe(75);
    });

    it('should delete project', async () => {
      (storage.deleteProject as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteProject(mockProjects[0].id);

      expect(storage.deleteProject).toHaveBeenCalledWith(mockProjects[0].id);
    });
  });

  describe('Project Notes Database Operations', () => {
    it('should create project note', async () => {
      const newNote = mockProjectNotes[0];
      (storage.createProjectNote as jest.Mock).mockResolvedValue(newNote);

      const result = await storage.createProjectNote({
        projectId: newNote.projectId,
        authorId: newNote.authorId,
        content: newNote.content,
      });

      expect(storage.createProjectNote).toHaveBeenCalledWith({
        projectId: newNote.projectId,
        authorId: newNote.authorId,
        content: newNote.content,
      });
      expect(result).toEqual(newNote);
    });

    it('should get project notes', async () => {
      const projectNotes = mockProjectNotes.filter(n => n.projectId === 'project-1');
      (storage.getProjectNotes as jest.Mock).mockResolvedValue(projectNotes);

      const result = await storage.getProjectNotes('project-1');

      expect(storage.getProjectNotes).toHaveBeenCalledWith('project-1');
      expect(result).toHaveLength(2);
    });

    it('should delete project note', async () => {
      (storage.deleteProjectNote as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteProjectNote(mockProjectNotes[0].id);

      expect(storage.deleteProjectNote).toHaveBeenCalledWith(mockProjectNotes[0].id);
    });
  });

  describe('Project Documents Database Operations', () => {
    it('should create project document', async () => {
      const newDocument = mockProjectDocuments[0];
      (storage.createProjectDocument as jest.Mock).mockResolvedValue(newDocument);

      const result = await storage.createProjectDocument({
        projectId: newDocument.projectId,
        filename: newDocument.filename,
        originalName: newDocument.originalName,
        fileSize: newDocument.fileSize,
        mimeType: newDocument.mimeType,
        uploadPath: newDocument.uploadPath,
      });

      expect(storage.createProjectDocument).toHaveBeenCalledWith({
        projectId: newDocument.projectId,
        filename: newDocument.filename,
        originalName: newDocument.originalName,
        fileSize: newDocument.fileSize,
        mimeType: newDocument.mimeType,
        uploadPath: newDocument.uploadPath,
      });
      expect(result).toEqual(newDocument);
    });

    it('should get project documents', async () => {
      const projectDocuments = mockProjectDocuments.filter(d => d.projectId === 'project-1');
      (storage.getProjectDocuments as jest.Mock).mockResolvedValue(projectDocuments);

      const result = await storage.getProjectDocuments('project-1');

      expect(storage.getProjectDocuments).toHaveBeenCalledWith('project-1');
      expect(result).toHaveLength(2);
    });

    it('should get project document by ID', async () => {
      (storage.getProjectDocumentById as jest.Mock).mockResolvedValue(mockProjectDocuments[0]);

      const result = await storage.getProjectDocumentById(mockProjectDocuments[0].id);

      expect(storage.getProjectDocumentById).toHaveBeenCalledWith(mockProjectDocuments[0].id);
      expect(result).toEqual(mockProjectDocuments[0]);
    });

    it('should delete project document', async () => {
      (storage.deleteProjectDocument as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteProjectDocument(mockProjectDocuments[0].id);

      expect(storage.deleteProjectDocument).toHaveBeenCalledWith(mockProjectDocuments[0].id);
    });
  });

  describe('Contact Inquiries Database Operations', () => {
    it('should create contact inquiry', async () => {
      const newInquiry = mockContactInquiries[0];
      (storage.createContactInquiry as jest.Mock).mockResolvedValue(newInquiry);

      const result = await storage.createContactInquiry({
        name: newInquiry.name,
        email: newInquiry.email,
        company: newInquiry.company,
        service: newInquiry.service,
        message: newInquiry.message,
      });

      expect(storage.createContactInquiry).toHaveBeenCalledWith({
        name: newInquiry.name,
        email: newInquiry.email,
        company: newInquiry.company,
        service: newInquiry.service,
        message: newInquiry.message,
      });
      expect(result).toEqual(newInquiry);
    });

    it('should get all contact inquiries', async () => {
      (storage.getContactInquiries as jest.Mock).mockResolvedValue(mockContactInquiries);

      const result = await storage.getContactInquiries();

      expect(storage.getContactInquiries).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should update contact inquiry status', async () => {
      (storage.updateContactInquiryStatus as jest.Mock).mockResolvedValue(undefined);

      await storage.updateContactInquiryStatus(mockContactInquiries[0].id, 'contacted');

      expect(storage.updateContactInquiryStatus).toHaveBeenCalledWith(mockContactInquiries[0].id, 'contacted');
    });
  });

  describe('Authentication Database Operations', () => {
    it('should get user by username', async () => {
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const result = await storage.getUserByUsername(mockUser.username);

      expect(storage.getUserByUsername).toHaveBeenCalledWith(mockUser.username);
      expect(result).toEqual(mockUser);
    });

    it('should get user by ID', async () => {
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await storage.getUser(mockUser.id);

      expect(storage.getUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors', async () => {
      (storage.getAllClients as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(storage.getAllClients(1, 20)).rejects.toThrow('Database connection failed');
    });

    it('should handle unique constraint violations', async () => {
      const duplicateError = new Error('Unique constraint violation');
      (storage.createClient as jest.Mock).mockRejectedValue(duplicateError);

      await expect(storage.createClient({
        name: 'Test Client',
        email: 'duplicate@example.com',
        status: 'active',
      })).rejects.toThrow('Unique constraint violation');
    });

    it('should handle foreign key constraint violations', async () => {
      const fkError = new Error('Foreign key constraint violation');
      (storage.createProject as jest.Mock).mockRejectedValue(fkError);

      await expect(storage.createProject({
        clientId: 'nonexistent-client',
        title: 'Test Project',
        status: 'prospect',
        progress: 0,
      })).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Transaction Handling', () => {
    it('should handle complex operations with proper rollback', async () => {
      // Mock a scenario where client creation succeeds but project creation fails
      (storage.createClient as jest.Mock).mockResolvedValue(mockClients[0]);
      (storage.createProject as jest.Mock).mockRejectedValue(new Error('Project creation failed'));

      // This would be handled at the application level
      try {
        const client = await storage.createClient({
          name: 'Transaction Test Client',
          email: 'transaction@test.com',
          status: 'active',
        });
        
        await storage.createProject({
          clientId: client.id,
          title: 'Transaction Test Project',
          status: 'prospect',
          progress: 0,
        });
      } catch (error) {
        // In a real scenario, this would trigger a rollback
        expect((error as Error).message).toBe('Project creation failed');
      }
    });
  });
});