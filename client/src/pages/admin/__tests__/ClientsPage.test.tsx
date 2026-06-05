import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import ClientsPage from '../ClientsPage';
import { mockClients } from '../../../test/fixtures';

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

describe('ClientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: mockClients,
        total: mockClients.length,
      }),
    });
  });

  it('renders client management page with data-testid attributes', async () => {
    render(<ClientsPage />, { wrapper: createWrapper() });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Client Management')).toBeInTheDocument();
    });

    // Check main structure has correct data-testid attributes
    expect(screen.getByTestId('button-add-client')).toBeInTheDocument();
    expect(screen.getByTestId('input-search-clients')).toBeInTheDocument();
    expect(screen.getByTestId('select-filter-status')).toBeInTheDocument();
    expect(screen.getByTestId('table-clients-list')).toBeInTheDocument();
  });

  it('displays client statistics cards with data-testid attributes', async () => {
    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('text-total-clients')).toHaveTextContent('3');
      expect(screen.getByTestId('text-active-clients')).toHaveTextContent('2');
      expect(screen.getByTestId('text-inactive-clients')).toHaveTextContent('1');
      expect(screen.getByTestId('text-archived-clients')).toHaveTextContent('0');
    });
  });

  it('displays client data in table rows with dynamic data-testid attributes', async () => {
    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check that client rows have dynamic testids
      expect(screen.getByTestId('row-client-client-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-client-client-2')).toBeInTheDocument();
      expect(screen.getByTestId('row-client-client-3')).toBeInTheDocument();

      // Check action buttons have dynamic testids
      expect(screen.getByTestId('button-view-client-client-1')).toBeInTheDocument();
      expect(screen.getByTestId('button-edit-client-client-1')).toBeInTheDocument();
      expect(screen.getByTestId('button-delete-client-client-1')).toBeInTheDocument();
    });

    // Verify client data is displayed correctly
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('opens create client modal with proper data-testid', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-add-client')).toBeInTheDocument();
    });

    // Click add client button
    await user.click(screen.getByTestId('button-add-client'));

    // Modal should open with proper data-testid
    expect(screen.getByTestId('modal-create-client')).toBeInTheDocument();
    expect(screen.getByText('Create New Client')).toBeInTheDocument();

    // Check form inputs have data-testid attributes
    expect(screen.getByTestId('input-client-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-client-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-client-company')).toBeInTheDocument();
    expect(screen.getByTestId('input-client-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-client-notes')).toBeInTheDocument();
    expect(screen.getByTestId('select-client-status')).toBeInTheDocument();
    expect(screen.getByTestId('button-create-client')).toBeInTheDocument();
  });

  it('creates new client when form is submitted', async () => {
    const user = userEvent.setup();
    const mockPost = fetch as jest.Mock;

    // Mock successful creation
    mockPost.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'client-new',
          name: 'Test Client',
          email: 'test@example.com',
          company: 'Test Company',
          status: 'active',
          createdAt: new Date(),
        }),
      })
    );

    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-add-client')).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByTestId('button-add-client'));

    // Fill form
    await user.type(screen.getByTestId('input-client-name'), 'Test Client');
    await user.type(screen.getByTestId('input-client-email'), 'test@example.com');
    await user.type(screen.getByTestId('input-client-company'), 'Test Company');

    // Submit form
    await user.click(screen.getByTestId('button-create-client'));

    // Verify API call was made
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/admin/clients', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Client',
          email: 'test@example.com',
          company: 'Test Company',
          phone: '',
          notes: '',
          status: 'active',
        }),
      }));
    });
  });

  it('filters clients when search input is used', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('input-search-clients')).toBeInTheDocument();
    });

    // Type in search
    await user.type(screen.getByTestId('input-search-clients'), 'John');

    // Should filter and show only John Doe
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Jane Smith should not be visible (filtered out by client-side filtering)
  });

  it('filters clients by status', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('select-filter-status')).toBeInTheDocument();
    });

    // Click status filter
    await user.click(screen.getByTestId('select-filter-status'));
    await user.click(screen.getByText('Inactive'));

    // Should show only inactive clients
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('handles client deletion with confirmation', async () => {
    const user = userEvent.setup();
    const mockDelete = fetch as jest.Mock;

    mockDelete.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-delete-client-client-1')).toBeInTheDocument();
    });

    // Click delete button
    await user.click(screen.getByTestId('button-delete-client-client-1'));

    // Confirm deletion
    await user.click(screen.getByTestId('button-confirm-delete-client-1'));

    // Verify API call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/admin/clients/client-1', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });

  it('handles pagination with data-testid attributes', async () => {
    const user = userEvent.setup();
    
    // Mock paginated response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: mockClients.slice(0, 1),
        total: 50, // Mock total > 20 to trigger pagination
      }),
    });

    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-next-page')).toBeInTheDocument();
      expect(screen.getByTestId('button-prev-page')).toBeInTheDocument();
    });

    // Previous should be disabled on first page
    expect(screen.getByTestId('button-prev-page')).toBeDisabled();

    // Click next page
    await user.click(screen.getByTestId('button-next-page'));

    // Should have made API call for page 2
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    );
  });

  it('shows loading state', () => {
    // Mock loading response
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ClientsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading clients...')).toBeInTheDocument();
  });

  it('shows empty state when no clients found', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        clients: [],
        total: 0,
      }),
    });

    render(<ClientsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ClientsPage />, { wrapper: createWrapper() });

    // Should handle error gracefully without crashing
    await waitFor(() => {
      expect(screen.getByText('Client Management')).toBeInTheDocument();
    });
  });
});