import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { registerRoutes } from './routes';
import { storage } from './storage';
import { mockClients, mockProjects, mockProjectNotes, mockProjectDocuments, mockContactInquiries, mockUser, createMockFile } from '../client/src/test/fixtures';
import path from 'path';
import fs from 'fs';

// Mock storage
jest.mock('./storage', () => ({
  storage: {
    // User authentication methods
    getUserByUsername: jest.fn(),
    getUser: jest.fn(),
    
    // Client methods
    getAllClients: jest.fn(),
    createClient: jest.fn(),
    getClientWithProjects: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
    convertInquiryToClient: jest.fn(),
    
    // Project methods
    getProjectsByClientId: jest.fn(),
    createProject: jest.fn(),
    getProjectWithDetails: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    
    // Project notes methods
    getProjectNotes: jest.fn(),
    createProjectNote: jest.fn(),
    deleteProjectNote: jest.fn(),
    
    // Project documents methods
    getProjectDocuments: jest.fn(),
    createProjectDocument: jest.fn(),
    getProjectDocumentById: jest.fn(),
    deleteProjectDocument: jest.fn(),
    
    // Contact inquiry methods
    getContactInquiries: jest.fn(),
    updateContactInquiryStatus: jest.fn(),
  },
}));

describe('Client Management API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Configure session
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to simulate authenticated user
  const authenticateUser = async () => {
    (storage.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password'
      });
    
    return loginResponse.headers['set-cookie'];
  };

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role
      });
    });

    it('should reject invalid credentials', async () => {
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/clients', () => {
    it('should get all clients with pagination', async () => {
      const cookies = await authenticateUser();
      (storage.getAllClients as jest.Mock).mockResolvedValue({
        clients: mockClients,
        total: mockClients.length
      });

      const response = await request(app)
        .get('/api/admin/clients?page=1&limit=20')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.clients).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(storage.getAllClients).toHaveBeenCalledWith(1, 20);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/clients');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('POST /api/admin/clients', () => {
    it('should create a new client', async () => {
      const cookies = await authenticateUser();
      const newClient = {
        name: 'New Client',
        email: 'new@example.com',
        company: 'New Company',
        phone: '+1 (555) 000-0000',
        notes: 'Test client',
        status: 'active'
      };

      (storage.createClient as jest.Mock).mockResolvedValue({
        id: 'client-new',
        ...newClient,
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Cookie', cookies)
        .send(newClient);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newClient.name);
      expect(response.body.email).toBe(newClient.email);
      expect(storage.createClient).toHaveBeenCalledWith(newClient);
    });

    it('should validate required fields', async () => {
      const cookies = await authenticateUser();
      const invalidClient = {
        name: '',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Cookie', cookies)
        .send(invalidClient);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid client data');
    });
  });

  describe('GET /api/admin/clients/:id', () => {
    it('should get client details with projects', async () => {
      const cookies = await authenticateUser();
      const clientWithProjects = {
        ...mockClients[0],
        projects: mockProjects.filter(p => p.clientId === mockClients[0].id)
      };

      (storage.getClientWithProjects as jest.Mock).mockResolvedValue(clientWithProjects);

      const response = await request(app)
        .get('/api/admin/clients/client-1')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('client-1');
      expect(response.body.projects).toHaveLength(2);
      expect(storage.getClientWithProjects).toHaveBeenCalledWith('client-1');
    });

    it('should return 404 for non-existent client', async () => {
      const cookies = await authenticateUser();
      (storage.getClientWithProjects as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/clients/nonexistent')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Client not found');
    });
  });

  describe('PUT /api/admin/clients/:id', () => {
    it('should update client', async () => {
      const cookies = await authenticateUser();
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        status: 'inactive'
      };

      (storage.updateClient as jest.Mock).mockResolvedValue({
        ...mockClients[0],
        ...updateData
      });

      const response = await request(app)
        .put('/api/admin/clients/client-1')
        .set('Cookie', cookies)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
      expect(storage.updateClient).toHaveBeenCalledWith('client-1', updateData);
    });
  });

  describe('DELETE /api/admin/clients/:id', () => {
    it('should delete client', async () => {
      const cookies = await authenticateUser();
      (storage.deleteClient as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/admin/clients/client-1')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(storage.deleteClient).toHaveBeenCalledWith('client-1');
    });
  });

  describe('POST /api/admin/clients/convert-inquiry', () => {
    it('should convert inquiry to client', async () => {
      const cookies = await authenticateUser();
      const conversionData = {
        inquiryId: 'inquiry-1',
        phone: '+1 (555) 123-4567',
        notes: 'Converted from inquiry'
      };

      const newClient = {
        id: 'client-new',
        name: mockContactInquiries[0].name,
        email: mockContactInquiries[0].email,
        company: mockContactInquiries[0].company,
        phone: conversionData.phone,
        notes: conversionData.notes,
        status: 'active',
        createdAt: new Date()
      };

      (storage.convertInquiryToClient as jest.Mock).mockResolvedValue(newClient);

      const response = await request(app)
        .post('/api/admin/clients/convert-inquiry')
        .set('Cookie', cookies)
        .send(conversionData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(mockContactInquiries[0].name);
      expect(response.body.phone).toBe(conversionData.phone);
      expect(storage.convertInquiryToClient).toHaveBeenCalledWith(conversionData);
    });
  });

  describe('Project Management Endpoints', () => {
    describe('POST /api/admin/clients/:id/projects', () => {
      it('should create new project for client', async () => {
        const cookies = await authenticateUser();
        const projectData = {
          title: 'New Project',
          description: 'Test project',
          status: 'prospect',
          progress: 0,
          budget: '$10,000',
          startDate: '2024-03-01T00:00:00Z',
          endDate: '2024-06-01T00:00:00Z'
        };

        const newProject = {
          id: 'project-new',
          clientId: 'client-1',
          ...projectData,
          startDate: new Date(projectData.startDate),
          endDate: new Date(projectData.endDate),
          createdAt: new Date()
        };

        (storage.createProject as jest.Mock).mockResolvedValue(newProject);

        const response = await request(app)
          .post('/api/admin/clients/client-1/projects')
          .set('Cookie', cookies)
          .send(projectData);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(projectData.title);
        expect(response.body.clientId).toBe('client-1');
        expect(storage.createProject).toHaveBeenCalledWith({
          ...projectData,
          clientId: 'client-1'
        });
      });
    });

    describe('PUT /api/admin/clients/:clientId/projects/:projectId', () => {
      it('should update project', async () => {
        const cookies = await authenticateUser();
        const updateData = {
          title: 'Updated Project Title',
          status: 'in_progress',
          progress: 50
        };

        (storage.updateProject as jest.Mock).mockResolvedValue({
          ...mockProjects[0],
          ...updateData
        });

        const response = await request(app)
          .put('/api/admin/clients/client-1/projects/project-1')
          .set('Cookie', cookies)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(updateData.title);
        expect(response.body.progress).toBe(updateData.progress);
        expect(storage.updateProject).toHaveBeenCalledWith('project-1', updateData);
      });
    });
  });

  describe('Document Management Endpoints', () => {
    describe('GET /api/admin/clients/:clientId/projects/:projectId/documents', () => {
      it('should get project documents', async () => {
        const cookies = await authenticateUser();
        (storage.getProjectDocuments as jest.Mock).mockResolvedValue(mockProjectDocuments);

        const response = await request(app)
          .get('/api/admin/clients/client-1/projects/project-1/documents')
          .set('Cookie', cookies);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(storage.getProjectDocuments).toHaveBeenCalledWith('project-1');
      });
    });

    describe('DELETE /api/admin/clients/:clientId/projects/:projectId/documents/:docId', () => {
      it('should delete project document', async () => {
        const cookies = await authenticateUser();
        (storage.getProjectDocumentById as jest.Mock).mockResolvedValue(mockProjectDocuments[0]);
        (storage.deleteProjectDocument as jest.Mock).mockResolvedValue(undefined);
        
        // Mock fs.existsSync and fs.unlinkSync
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

        const response = await request(app)
          .delete('/api/admin/clients/client-1/projects/project-1/documents/doc-1')
          .set('Cookie', cookies);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(storage.deleteProjectDocument).toHaveBeenCalledWith('doc-1');
      });
    });
  });

  describe('Notes Management Endpoints', () => {
    describe('POST /api/admin/clients/:clientId/projects/:projectId/notes', () => {
      it('should create project note', async () => {
        const cookies = await authenticateUser();
        const noteData = { content: 'New project note' };

        const newNote = {
          id: 'note-new',
          projectId: 'project-1',
          authorId: mockUser.id,
          content: noteData.content,
          createdAt: new Date()
        };

        (storage.createProjectNote as jest.Mock).mockResolvedValue(newNote);

        const response = await request(app)
          .post('/api/admin/clients/client-1/projects/project-1/notes')
          .set('Cookie', cookies)
          .send(noteData);

        expect(response.status).toBe(200);
        expect(response.body.content).toBe(noteData.content);
        expect(storage.createProjectNote).toHaveBeenCalledWith({
          ...noteData,
          projectId: 'project-1',
          authorId: mockUser.id
        });
      });
    });

    describe('DELETE /api/admin/clients/:clientId/projects/:projectId/notes/:noteId', () => {
      it('should delete project note', async () => {
        const cookies = await authenticateUser();
        (storage.deleteProjectNote as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
          .delete('/api/admin/clients/client-1/projects/project-1/notes/note-1')
          .set('Cookie', cookies);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(storage.deleteProjectNote).toHaveBeenCalledWith('note-1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const cookies = await authenticateUser();
      (storage.getAllClients as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/clients')
        .set('Cookie', cookies);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch clients');
    });

    it('should validate request data', async () => {
      const cookies = await authenticateUser();
      const invalidData = { name: '', email: 'invalid' };

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Cookie', cookies)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid client data');
      expect(response.body.details).toBeDefined();
    });
  });
});