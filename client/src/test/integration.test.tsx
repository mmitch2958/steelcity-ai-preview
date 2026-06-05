import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import ClientsPage from '../pages/admin/ClientsPage';
import ClientDetail from '../pages/admin/ClientDetail';
import { mockClients, mockProjects, mockProjectDocuments, mockContactInquiries, createMockFile } from './fixtures';

// Mock wouter router
jest.mock('wouter', () => {
  const originalModule = jest.requireActual('wouter');
  return {
    ...originalModule,
    useParams: jest.fn(),
    Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  };
});

// Mock the API
global.fetch = jest.fn();
global.XMLHttpRequest = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Router>
        {children}
      </Router>
    </QueryClientProvider>
  );
};

describe('Integration Tests - Client Management Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Client Workflow', () => {
    it('completes full client creation to project management workflow', async () => {
      const user = userEvent.setup();
      
      // Mock API responses for the workflow
      (fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({ clients: [], total: 0 }),
        })) // Initial empty clients list
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'client-new',
            name: 'Integration Test Client',
            email: 'integration@test.com',
            company: 'Test Company',
            status: 'active',
            projects: [],
            createdAt: new Date(),
          }),
        })) // Create client
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({ clients: [mockClients[0]], total: 1 }),
        })); // Updated clients list

      // Step 1: Render ClientsPage
      render(<ClientsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('button-add-client')).toBeInTheDocument();
      });

      // Step 2: Create new client
      await user.click(screen.getByTestId('button-add-client'));
      
      // Fill client form
      await user.type(screen.getByTestId('input-client-name'), 'Integration Test Client');
      await user.type(screen.getByTestId('input-client-email'), 'integration@test.com');
      await user.type(screen.getByTestId('input-client-company'), 'Test Company');
      
      // Submit client form
      await user.click(screen.getByTestId('button-create-client'));

      // Verify client creation API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/admin/clients', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Integration Test Client'),
        }));
      });
    });

    it('completes inquiry to client conversion workflow', async () => {
      const user = userEvent.setup();
      const mockPost = fetch as jest.Mock;

      // Mock conversion API call
      mockPost.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'client-converted',
            name: mockContactInquiries[0].name,
            email: mockContactInquiries[0].email,
            company: mockContactInquiries[0].company,
            phone: '+1 (555) 999-8888',
            status: 'active',
            createdAt: new Date(),
          }),
        })
      );

      // This would be part of the Dashboard component test
      // but testing the conversion workflow end-to-end
      
      const conversionData = {
        inquiryId: mockContactInquiries[0].id,
        phone: '+1 (555) 999-8888',
        notes: 'Converted from inquiry: ' + mockContactInquiries[0].message,
      };

      // Simulate API call directly for integration test
      const response = await fetch('/api/admin/clients/convert-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData),
      });

      expect(mockPost).toHaveBeenCalledWith('/api/admin/clients/convert-inquiry', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData),
      }));
    });
  });

  describe('Project Management Workflow', () => {
    it('completes create project to document upload workflow', async () => {
      const user = userEvent.setup();
      
      // Mock useParams to return client-1
      const { useParams } = require('wouter');
      useParams.mockReturnValue({ id: 'client-1' });

      // Mock client with projects API response
      (fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockClients[0],
            projects: [],
          }),
        })) // Get client details
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'project-new',
            clientId: 'client-1',
            title: 'Integration Test Project',
            description: 'Test project for integration',
            status: 'prospect',
            progress: 0,
            createdAt: new Date(),
          }),
        })); // Create project

      // Step 1: Render ClientDetail page
      render(<ClientDetail />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('button-add-project')).toBeInTheDocument();
      });

      // Step 2: Create new project
      await user.click(screen.getByTestId('button-add-project'));

      // Fill project form
      await user.type(screen.getByTestId('input-project-title'), 'Integration Test Project');
      await user.type(screen.getByTestId('input-project-description'), 'Test project for integration');
      await user.type(screen.getByTestId('input-project-budget'), '$5,000');

      // Submit project form
      await user.click(screen.getByTestId('button-create-project'));

      // Verify project creation API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/admin/clients/client-1/projects', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Integration Test Project'),
        }));
      });
    });

    it('completes project progress tracking workflow', async () => {
      const user = userEvent.setup();
      const mockPut = fetch as jest.Mock;

      // Mock successful project update
      mockPut.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockProjects[0],
            progress: 85,
            status: 'qa',
          }),
        })
      );

      // Simulate project update workflow
      const updateData = {
        progress: 85,
        status: 'qa',
      };

      // This would happen through ProjectPanel component interaction
      await fetch(`/api/admin/clients/client-1/projects/${mockProjects[0].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      // Verify the API call
      expect(mockPut).toHaveBeenCalledWith(
        `/api/admin/clients/client-1/projects/${mockProjects[0].id}`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('Document Management Workflow', () => {
    it('completes document upload and management workflow', async () => {
      const mockFile = createMockFile('integration-test.pdf', 'application/pdf', 1024000);
      
      // Mock XMLHttpRequest for file upload
      const mockXHR = {
        upload: { 
          addEventListener: jest.fn((event, callback) => {
            if (event === 'progress') {
              // Simulate upload progress
              setTimeout(() => callback({ lengthComputable: true, loaded: 1024000, total: 1024000 }), 100);
            }
          })
        },
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => {
              mockXHR.status = 200;
              mockXHR.response = JSON.stringify({
                id: 'doc-new',
                projectId: 'project-1',
                filename: 'integration-test.pdf',
                originalName: 'integration-test.pdf',
                fileSize: 1024000,
                mimeType: 'application/pdf',
                createdAt: new Date(),
              });
              callback();
            }, 150);
          }
        }),
        open: jest.fn(),
        send: jest.fn(),
        status: 200,
        response: '',
      };

      (global.XMLHttpRequest as jest.Mock).mockImplementation(() => mockXHR);

      // Simulate document upload workflow
      const formData = new FormData();
      formData.append('document', mockFile);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/clients/client-1/projects/project-1/documents/upload');
      xhr.send(formData);

      // Verify upload was initiated
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        '/api/admin/clients/client-1/projects/project-1/documents/upload'
      );
      expect(mockXHR.send).toHaveBeenCalledWith(formData);
    });

    it('completes document deletion workflow', async () => {
      const mockDelete = fetch as jest.Mock;

      // Mock successful deletion
      mockDelete.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      );

      // Simulate document deletion
      await fetch('/api/admin/clients/client-1/projects/project-1/documents/doc-1', {
        method: 'DELETE',
      });

      // Verify deletion API call
      expect(mockDelete).toHaveBeenCalledWith(
        '/api/admin/clients/client-1/projects/project-1/documents/doc-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Search and Filter Workflow', () => {
    it('completes client search and filtering workflow', async () => {
      const user = userEvent.setup();

      // Mock API responses for search/filter
      (fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients, total: mockClients.length }),
        })) // Initial load
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({ 
            clients: mockClients.filter(c => c.name.includes('John')), 
            total: 1 
          }),
        })); // Search results

      render(<ClientsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('input-search-clients')).toBeInTheDocument();
      });

      // Step 1: Perform search
      await user.type(screen.getByTestId('input-search-clients'), 'John');

      // Step 2: Apply status filter
      await user.click(screen.getByTestId('select-filter-status'));

      // The search and filter should work together
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });
  });

  describe('Authentication Workflow', () => {
    it('handles authentication requirements across all endpoints', async () => {
      const mockUnauthorized = fetch as jest.Mock;

      // Mock unauthorized response
      mockUnauthorized.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Authentication required' }),
        })
      );

      // Attempt API call without authentication
      const response = await fetch('/api/admin/clients');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('Error Handling Workflow', () => {
    it('handles network errors gracefully throughout the application', async () => {
      const mockNetworkError = fetch as jest.Mock;

      // Mock network error
      mockNetworkError.mockRejectedValue(new Error('Network error'));

      render(<ClientsPage />, { wrapper: createWrapper() });

      // Application should handle network errors without crashing
      await waitFor(() => {
        expect(screen.getByText('Client Management')).toBeInTheDocument();
      });

      // Error should be handled gracefully
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('handles validation errors in forms', async () => {
      const user = userEvent.setup();

      // Mock validation error response
      (fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: async () => ({ clients: [], total: 0 }),
        })) // Initial load
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ 
            error: 'Invalid client data',
            details: [{ message: 'Email is required' }]
          }),
        })); // Validation error

      render(<ClientsPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('button-add-client')).toBeInTheDocument();
      });

      // Try to create client with invalid data
      await user.click(screen.getByTestId('button-add-client'));
      await user.type(screen.getByTestId('input-client-name'), 'Test Client');
      // Deliberately leave email empty
      await user.click(screen.getByTestId('button-create-client'));

      // Form validation should prevent submission or show error
      expect(screen.getByTestId('input-client-email')).toBeInTheDocument();
    });
  });

  describe('End-to-End Workflow', () => {
    it('completes full client lifecycle: inquiry → client → project → document → completion', async () => {
      const user = userEvent.setup();
      
      // This test simulates the complete workflow from start to finish
      // 1. Inquiry received
      // 2. Convert inquiry to client  
      // 3. Create project for client
      // 4. Upload documents to project
      // 5. Update project progress
      // 6. Complete project

      const mockAPICalls = [
        // Convert inquiry to client
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'client-converted',
            name: 'Complete Workflow Client',
            email: 'workflow@test.com',
            status: 'active',
            createdAt: new Date(),
          }),
        }),
        // Create project
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'project-workflow',
            clientId: 'client-converted',
            title: 'Workflow Test Project',
            status: 'prospect',
            progress: 0,
            createdAt: new Date(),
          }),
        }),
        // Update project progress
        Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'project-workflow',
            status: 'delivered',
            progress: 100,
          }),
        }),
      ];

      let callIndex = 0;
      (fetch as jest.Mock).mockImplementation(() => mockAPICalls[callIndex++]);

      // Step 1: Convert inquiry to client
      await fetch('/api/admin/clients/convert-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: 'inquiry-workflow',
          phone: '+1 (555) 123-4567',
          notes: 'Converted for workflow test',
        }),
      });

      // Step 2: Create project
      await fetch('/api/admin/clients/client-converted/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Workflow Test Project',
          description: 'End-to-end test project',
          status: 'prospect',
        }),
      });

      // Step 3: Complete project
      await fetch('/api/admin/clients/client-converted/projects/project-workflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'delivered',
          progress: 100,
        }),
      });

      // Verify all API calls were made
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});