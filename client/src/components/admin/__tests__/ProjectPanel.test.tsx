import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import ProjectPanel from '../ProjectPanel';
import { mockProjects, mockClients, createTestProjectWithDetails } from '../../../test/fixtures';

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

describe('ProjectPanel', () => {
  const mockProjectWithDetails = createTestProjectWithDetails(0);
  const defaultProps = {
    project: mockProjectWithDetails,
    clientId: 'client-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjectWithDetails,
    });
  });

  it('renders project panel with proper data-testid attributes', async () => {
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });

    // Check project info display
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('in_progress')).toBeInTheDocument();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('displays progress bar and status with proper data-testid', () => {
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    // The progress bar should show the current progress
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('in_progress')).toBeInTheDocument();
  });

  it('enters edit mode and shows form with data-testid attributes', async () => {
    const user = userEvent.setup();
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Click edit button
    await user.click(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`));

    // Check form inputs have proper data-testid attributes
    expect(screen.getByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`)).toHaveValue('Website Redesign');
    expect(screen.getByTestId(`select-edit-project-status-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`slider-edit-project-progress-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`input-edit-project-progress-${mockProjectWithDetails.id}`)).toHaveValue(65);
    expect(screen.getByTestId(`input-edit-project-budget-${mockProjectWithDetails.id}`)).toHaveValue('$15,000');
    expect(screen.getByTestId(`input-edit-project-start-date-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`input-edit-project-end-date-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    
    // Check form buttons
    expect(screen.getByTestId(`button-cancel-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`button-save-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
  });

  it('updates project when form is submitted', async () => {
    const user = userEvent.setup();
    const mockPut = fetch as jest.Mock;

    // Mock successful update
    mockPut.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          ...mockProjectWithDetails,
          title: 'Updated Project Title',
          progress: 75,
        }),
      })
    );

    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`));

    // Update title
    const titleInput = screen.getByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Project Title');

    // Update progress using the number input
    const progressInput = screen.getByTestId(`input-edit-project-progress-${mockProjectWithDetails.id}`);
    await user.clear(progressInput);
    await user.type(progressInput, '75');

    // Submit form
    await user.click(screen.getByTestId(`button-save-project-${mockProjectWithDetails.id}`));

    // Verify API call
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/api/admin/clients/client-1/projects/${mockProjectWithDetails.id}`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Updated Project Title'),
        })
      );
    });
  });

  it('cancels editing when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`));
    expect(screen.getByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`)).toBeInTheDocument();

    // Cancel editing
    await user.click(screen.getByTestId(`button-cancel-edit-project-${mockProjectWithDetails.id}`));

    // Should return to view mode
    expect(screen.queryByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`)).not.toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
  });

  it('deletes project with confirmation', async () => {
    const user = userEvent.setup();
    const mockDelete = fetch as jest.Mock;

    // Mock successful deletion
    mockDelete.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-delete-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Click delete button
    await user.click(screen.getByTestId(`button-delete-project-${mockProjectWithDetails.id}`));

    // Confirm deletion
    await user.click(screen.getByTestId(`button-confirm-delete-project-${mockProjectWithDetails.id}`));

    // Verify API call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        `/api/admin/clients/client-1/projects/${mockProjectWithDetails.id}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  it('adds project note with proper data-testid attributes', async () => {
    const user = userEvent.setup();
    const mockPost = fetch as jest.Mock;

    // Mock successful note creation
    mockPost.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'note-new',
          projectId: mockProjectWithDetails.id,
          authorId: 'user-1',
          content: 'New project note',
          createdAt: new Date(),
        }),
      })
    );

    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-add-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Click add note button
    await user.click(screen.getByTestId(`button-add-note-${mockProjectWithDetails.id}`));

    // Check note form elements
    expect(screen.getByTestId(`textarea-add-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`button-cancel-add-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`button-save-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();

    // Add note content
    await user.type(screen.getByTestId(`textarea-add-note-${mockProjectWithDetails.id}`), 'New project note');

    // Submit note
    await user.click(screen.getByTestId(`button-save-note-${mockProjectWithDetails.id}`));

    // Verify API call
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        `/api/admin/clients/client-1/projects/${mockProjectWithDetails.id}/notes`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'New project note' }),
        })
      );
    });
  });

  it('displays existing notes with data-testid attributes', async () => {
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Initial wireframes approved by client')).toBeInTheDocument();
    });

    // Check that note content has proper data-testid
    expect(screen.getByTestId('text-note-content-note-1')).toHaveTextContent('Initial wireframes approved by client');
    expect(screen.getByTestId('text-note-content-note-2')).toHaveTextContent('Client requested changes to header design');
  });

  it('deletes note with confirmation', async () => {
    const user = userEvent.setup();
    const mockDelete = fetch as jest.Mock;

    // Mock successful note deletion
    mockDelete.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-delete-note-note-1')).toBeInTheDocument();
    });

    // Click delete note button
    await user.click(screen.getByTestId('button-delete-note-note-1'));

    // Confirm deletion
    await user.click(screen.getByTestId('button-confirm-delete-note-note-1'));

    // Verify API call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        `/api/admin/clients/client-1/projects/${mockProjectWithDetails.id}/notes/note-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  it('cancels note addition', async () => {
    const user = userEvent.setup();
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-add-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Click add note button
    await user.click(screen.getByTestId(`button-add-note-${mockProjectWithDetails.id}`));
    expect(screen.getByTestId(`textarea-add-note-${mockProjectWithDetails.id}`)).toBeInTheDocument();

    // Cancel adding note
    await user.click(screen.getByTestId(`button-cancel-add-note-${mockProjectWithDetails.id}`));

    // Note form should be hidden
    expect(screen.queryByTestId(`textarea-add-note-${mockProjectWithDetails.id}`)).not.toBeInTheDocument();
  });

  it('updates progress using slider', async () => {
    const user = userEvent.setup();
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`));

    // The slider should be present and functional
    const slider = screen.getByTestId(`slider-edit-project-progress-${mockProjectWithDetails.id}`);
    expect(slider).toBeInTheDocument();

    // The progress input should sync with slider
    const progressInput = screen.getByTestId(`input-edit-project-progress-${mockProjectWithDetails.id}`);
    expect(progressInput).toHaveValue(65);
  });

  it('handles validation errors in project form', async () => {
    const user = userEvent.setup();
    render(<ProjectPanel {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`)).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByTestId(`button-edit-project-${mockProjectWithDetails.id}`));

    // Clear required title field
    const titleInput = screen.getByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`);
    await user.clear(titleInput);

    // Try to submit
    await user.click(screen.getByTestId(`button-save-project-${mockProjectWithDetails.id}`));

    // Form should not submit and title field should still be visible (validation failed)
    expect(screen.getByTestId(`input-edit-project-title-${mockProjectWithDetails.id}`)).toBeInTheDocument();
  });
});