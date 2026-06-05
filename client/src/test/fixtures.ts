import type { 
  Client, 
  Project, 
  ProjectDocument, 
  ProjectNote, 
  ContactInquiry,
  User 
} from '@shared/schema';

// Test user data
export const mockUser: User = {
  id: 'user-1',
  username: 'admin',
  password: 'hashedpassword',
  role: 'admin',
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

// Test client data
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    phone: '+1 (555) 123-4567',
    notes: 'Important client with multiple projects',
    status: 'active',
    createdAt: new Date('2024-01-15T00:00:00Z'),
  },
  {
    id: 'client-2',
    name: 'Jane Smith',
    email: 'jane@techstart.com',
    company: 'TechStart Inc',
    phone: '+1 (555) 987-6543',
    notes: 'New startup, very responsive',
    status: 'active',
    createdAt: new Date('2024-02-01T00:00:00Z'),
  },
  {
    id: 'client-3',
    name: 'Bob Wilson',
    email: 'bob@oldcorp.com',
    company: 'Old Corp',
    phone: null,
    notes: 'Legacy client, needs migration',
    status: 'inactive',
    createdAt: new Date('2023-12-01T00:00:00Z'),
  },
];

// Test project data
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    clientId: 'client-1',
    title: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UX',
    status: 'in_progress',
    progress: 65,
    budget: '$15,000',
    startDate: new Date('2024-01-20T00:00:00Z'),
    endDate: new Date('2024-04-15T00:00:00Z'),
    createdAt: new Date('2024-01-20T00:00:00Z'),
  },
  {
    id: 'project-2',
    clientId: 'client-1',
    title: 'Mobile App Development',
    description: 'Native iOS and Android app for customer engagement',
    status: 'prospect',
    progress: 0,
    budget: '$50,000',
    startDate: null,
    endDate: null,
    createdAt: new Date('2024-02-10T00:00:00Z'),
  },
  {
    id: 'project-3',
    clientId: 'client-2',
    title: 'AI Integration',
    description: 'Integrate AI chatbot into existing platform',
    status: 'qa',
    progress: 90,
    budget: '$25,000',
    startDate: new Date('2024-01-10T00:00:00Z'),
    endDate: new Date('2024-03-01T00:00:00Z'),
    createdAt: new Date('2024-01-10T00:00:00Z'),
  },
];

// Test project notes
export const mockProjectNotes: ProjectNote[] = [
  {
    id: 'note-1',
    projectId: 'project-1',
    authorId: 'user-1',
    content: 'Initial wireframes approved by client',
    createdAt: new Date('2024-01-25T00:00:00Z'),
  },
  {
    id: 'note-2',
    projectId: 'project-1',
    authorId: 'user-1',
    content: 'Client requested changes to header design',
    createdAt: new Date('2024-02-15T00:00:00Z'),
  },
  {
    id: 'note-3',
    projectId: 'project-3',
    authorId: 'user-1',
    content: 'AI model training completed successfully',
    createdAt: new Date('2024-02-20T00:00:00Z'),
  },
];

// Test project documents
export const mockProjectDocuments: ProjectDocument[] = [
  {
    id: 'doc-1',
    projectId: 'project-1',
    filename: 'wireframes-20240125.pdf',
    originalName: 'Wireframes v2.pdf',
    fileSize: 2048000,
    mimeType: 'application/pdf',
    uploadPath: '/uploads/project-documents/wireframes-20240125.pdf',
    createdAt: new Date('2024-01-25T00:00:00Z'),
  },
  {
    id: 'doc-2',
    projectId: 'project-1',
    filename: 'requirements-20240120.docx',
    originalName: 'Project Requirements.docx',
    fileSize: 1024000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadPath: '/uploads/project-documents/requirements-20240120.docx',
    createdAt: new Date('2024-01-20T00:00:00Z'),
  },
];

// Test contact inquiries
export const mockContactInquiries: ContactInquiry[] = [
  {
    id: 'inquiry-1',
    name: 'Alice Johnson',
    email: 'alice@newcompany.com',
    company: 'New Company Ltd',
    service: 'Web Development',
    message: 'We need a new website for our startup. Can you help?',
    clientId: null,
    createdAt: new Date('2024-02-25T00:00:00Z'),
    status: 'new',
  },
  {
    id: 'inquiry-2',
    name: 'David Brown',
    email: 'david@enterprise.com',
    company: 'Enterprise Solutions',
    service: 'AI Integration',
    message: 'Looking for AI automation solutions for our business processes',
    clientId: null,
    createdAt: new Date('2024-02-20T00:00:00Z'),
    status: 'contacted',
  },
];

// Test file mock for upload testing
export const createMockFile = (
  name: string = 'test-document.pdf',
  type: string = 'application/pdf',
  size: number = 1024
): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to create test data combinations
export const createTestClientWithProjects = (clientIndex: number = 0) => {
  const client = mockClients[clientIndex];
  const clientProjects = mockProjects.filter(p => p.clientId === client.id);
  return {
    ...client,
    projects: clientProjects,
  };
};

export const createTestProjectWithDetails = (projectIndex: number = 0) => {
  const project = mockProjects[projectIndex];
  const projectNotes = mockProjectNotes.filter(n => n.projectId === project.id);
  const projectDocs = mockProjectDocuments.filter(d => d.projectId === project.id);
  const client = mockClients.find(c => c.id === project.clientId);
  
  return {
    ...project,
    notes: projectNotes,
    documents: projectDocs,
    client,
  };
};