import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import ClientDetail from '../ClientDetail';
import { mockClients, mockProjects, createTestClientWithProjects } from '../../../test/fixtures';

// Mock wouter useParams
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useParams: () => ({ id: 'client-1' }),
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock the API
global.fetch = jest.fn();

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

describe('ClientDetail', () => {
  const mockClientWithProjects = createTestClientWithProjects(0);

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockClientWithProjects,
    });
  });

  it('renders client detail page with proper data-testid attributes', async () => {
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('text-client-name')).toBeInTheDocument();
    });

    // Check main navigation and action buttons
    expect(screen.getByTestId('button-back-to-clients')).toBeInTheDocument();
    expect(screen.getByTestId('text-client-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('badge-client-status')).toHaveTextContent('active');
    expect(screen.getByTestId('button-add-project')).toBeInTheDocument();
    expect(screen.getByTestId('button-edit-client')).toBeInTheDocument();
  });

  it('displays client information with data-testid attributes', async () => {
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('text-client-email')).toBeInTheDocument();
    });

    // Check client info display elements
    expect(screen.getByTestId('text-client-email')).toHaveTextContent('john@example.com');
    expect(screen.getByTestId('text-client-phone')).toHaveTextContent('+1 (555) 123-4567');
    expect(screen.getByTestId('text-client-company')).toHaveTextContent('Acme Corp');
    expect(screen.getByTestId('text-client-created')).toBeInTheDocument();
    expect(screen.getByTestId('text-client-notes')).toHaveTextContent('Important client with multiple projects');
  });

  it('has tabs with proper data-testid attributes', async () => {
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    });

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-projects')).toBeInTheDocument();
    expect(screen.getByTestId('tab-projects')).toHaveTextContent('Projects (2)');
  });

  it('opens edit client form with proper data-testid attributes', async () => {
    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-edit-client')).toBeInTheDocument();
    });

    // Click edit button
    await user.click(screen.getByTestId('button-edit-client'));

    // Check form inputs have data-testid attributes
    expect(screen.getByTestId('input-edit-client-name')).toHaveValue('John Doe');
    expect(screen.getByTestId('input-edit-client-email')).toHaveValue('john@example.com');
    expect(screen.getByTestId('input-edit-client-company')).toHaveValue('Acme Corp');
    expect(screen.getByTestId('input-edit-client-phone')).toHaveValue('+1 (555) 123-4567');
    expect(screen.getByTestId('select-edit-client-status')).toBeInTheDocument();
    expect(screen.getByTestId('input-edit-client-notes')).toHaveValue('Important client with multiple projects');
    
    // Check form buttons
    expect(screen.getByTestId('button-cancel-edit')).toBeInTheDocument();
    expect(screen.getByTestId('button-save-client')).toBeInTheDocument();
  });

  it('updates client information when form is submitted', async () => {
    const user = userEvent.setup();
    const mockPut = fetch as jest.Mock;

    // Mock successful update
    mockPut.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          ...mockClientWithProjects,
          name: 'Updated Client Name',
        }),
      })
    );

    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-edit-client')).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId('button-edit-client'));

    // Update name
    const nameInput = screen.getByTestId('input-edit-client-name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Client Name');

    // Submit form
    await user.click(screen.getByTestId('button-save-client'));

    // Verify API call
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/admin/clients/client-1', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Updated Client Name'),
      }));
    });
  });

  it('cancels client editing', async () => {
    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-edit-client')).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId('button-edit-client'));
    expect(screen.getByTestId('input-edit-client-name')).toBeInTheDocument();

    // Cancel editing
    await user.click(screen.getByTestId('button-cancel-edit'));

    // Should return to view mode
    expect(screen.queryByTestId('input-edit-client-name')).not.toBeInTheDocument();
    expect(screen.getByTestId('text-client-name')).toBeInTheDocument();
  });

  it('opens add project modal with proper data-testid attributes', async () => {
    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-add-project')).toBeInTheDocument();
    });

    // Click add project button
    await user.click(screen.getByTestId('button-add-project'));

    // Check project form inputs have data-testid attributes
    expect(screen.getByTestId('input-project-title')).toBeInTheDocument();
    expect(screen.getByTestId('select-project-status')).toBeInTheDocument();
    expect(screen.getByTestId('input-project-progress')).toBeInTheDocument();
    expect(screen.getByTestId('input-project-budget')).toBeInTheDocument();
    expect(screen.getByTestId('input-project-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('input-project-end-date')).toBeInTheDocument();
    expect(screen.getByTestId('input-project-description')).toBeInTheDocument();
    expect(screen.getByTestId('button-create-project')).toBeInTheDocument();
  });

  it('creates new project when form is submitted', async () => {
    const user = userEvent.setup();
    const mockPost = fetch as jest.Mock;

    // Mock successful project creation
    mockPost.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'project-new',
          clientId: 'client-1',
          title: 'New Project',
          description: 'Test project',
          status: 'prospect',
          progress: 0,
          createdAt: new Date(),
        }),
      })
    );

    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-add-project')).toBeInTheDocument();
    });

    // Open project modal
    await user.click(screen.getByTestId('button-add-project'));

    // Fill project form
    await user.type(screen.getByTestId('input-project-title'), 'New Project');
    await user.type(screen.getByTestId('input-project-description'), 'Test project');
    await user.type(screen.getByTestId('input-project-budget'), '$10,000');

    // Submit form
    await user.click(screen.getByTestId('button-create-project'));

    // Verify API call
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/admin/clients/client-1/projects', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('New Project'),
      }));
    });
  });

  it('switches between overview and projects tabs', async () => {
    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    });

    // Should be on overview tab by default
    expect(screen.getByText('Client Information')).toBeInTheDocument();

    // Switch to projects tab
    await user.click(screen.getByTestId('tab-projects'));

    // Should show project content
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
  });

  it('shows create first project button when no projects exist', async () => {
    const clientWithoutProjects = { ...mockClients[0], projects: [] };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => clientWithoutProjects,
    });

    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-projects')).toBeInTheDocument();
    });

    // Switch to projects tab
    await user.click(screen.getByTestId('tab-projects'));

    // Should show create first project button
    expect(screen.getByTestId('button-create-first-project')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });

  it('handles client not found error', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Client not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Clients')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Mock never-resolving promise for loading state
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ClientDetail />, { wrapper: createWrapper() });

    // Should show loading state (component doesn't crash)
    expect(screen.queryByText('Client Management')).not.toBeInTheDocument();
  });

  it('displays project overview cards correctly', async () => {
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
    });

    // Check that projects are displayed in overview
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    expect(screen.getByText('Progress: 65%')).toBeInTheDocument();
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
  });

  it('validates project form inputs', async () => {
    const user = userEvent.setup();
    render(<ClientDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-add-project')).toBeInTheDocument();
    });

    // Open project modal
    await user.click(screen.getByTestId('button-add-project'));

    // Try to submit without required title
    await user.click(screen.getByTestId('button-create-project'));

    // Should show validation error (form doesn't submit)
    expect(screen.getByTestId('input-project-title')).toBeInTheDocument();
  });
});