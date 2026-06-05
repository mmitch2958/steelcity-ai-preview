import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Dashboard from '../Dashboard';
import { mockClients, mockContactInquiries, mockUser } from '../../../test/fixtures';

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockAuthContext,
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

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock multiple API endpoints
    (fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => [], // services
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => mockContactInquiries, // inquiries
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => [], // case studies
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          clients: mockClients,
          total: mockClients.length,
        }), // clients
      }));
  });

  it('renders dashboard with proper data-testid attributes', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    // Check logout button has data-testid
    expect(screen.getByTestId('button-logout')).toBeInTheDocument();
  });

  it('displays tab navigation with data-testid attributes', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    });

    // Check all tabs have proper data-testid attributes
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-clients')).toBeInTheDocument();
    expect(screen.getByTestId('tab-services')).toBeInTheDocument();
    expect(screen.getByTestId('tab-inquiries')).toBeInTheDocument();
    expect(screen.getByTestId('tab-case-studies')).toBeInTheDocument();
  });

  it('displays statistics cards with data-testid attributes', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('text-total-clients')).toBeInTheDocument();
    });

    // Check statistics have proper data-testid attributes
    expect(screen.getByTestId('text-total-clients')).toHaveTextContent('3');
    expect(screen.getByTestId('text-active-clients')).toBeInTheDocument();
    expect(screen.getByTestId('text-inactive-clients')).toBeInTheDocument();
    expect(screen.getByTestId('text-archived-clients')).toBeInTheDocument();
  });

  it('shows view all clients button with proper data-testid', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-view-all-clients')).toBeInTheDocument();
    });

    expect(screen.getByTestId('button-view-all-clients')).toHaveTextContent('View All Clients');
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-clients')).toBeInTheDocument();
    });

    // Switch to clients tab
    await user.click(screen.getByTestId('tab-clients'));

    // Should show client management content
    expect(screen.getByText('Client Management')).toBeInTheDocument();
    expect(screen.getByTestId('input-search-clients')).toBeInTheDocument();
    expect(screen.getByTestId('select-filter-status')).toBeInTheDocument();
  });

  it('displays inquiries with convert buttons', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-inquiries')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('tab-inquiries'));

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Check convert buttons have proper data-testid
    expect(screen.getByTestId('button-convert-inquiry-inquiry-1')).toBeInTheDocument();
    expect(screen.getByTestId('button-convert-inquiry-inquiry-2')).toBeInTheDocument();
  });

  it('handles inquiry to client conversion', async () => {
    const user = userEvent.setup();
    const mockPost = fetch as jest.Mock;

    // Mock successful conversion
    mockPost.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'client-new',
          name: mockContactInquiries[0].name,
          email: mockContactInquiries[0].email,
          status: 'active',
          createdAt: new Date(),
        }),
      })
    );

    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-inquiries')).toBeInTheDocument();
    });

    // Switch to inquiries tab
    await user.click(screen.getByTestId('tab-inquiries'));

    await waitFor(() => {
      expect(screen.getByTestId('button-convert-inquiry-inquiry-1')).toBeInTheDocument();
    });

    // Click convert button
    await user.click(screen.getByTestId('button-convert-inquiry-inquiry-1'));

    // Fill conversion form
    expect(screen.getByTestId('input-conversion-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-conversion-notes')).toBeInTheDocument();

    await user.type(screen.getByTestId('input-conversion-phone'), '+1 (555) 123-4567');
    
    // Submit conversion
    await user.click(screen.getByTestId('button-convert-to-client'));

    // Verify API call
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/admin/clients/convert-inquiry', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('inquiry-1'),
      }));
    });
  });

  it('handles logout functionality', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-logout')).toBeInTheDocument();
    });

    // Click logout
    await user.click(screen.getByTestId('button-logout'));

    // Should call logout function
    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('displays service management section', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-services')).toBeInTheDocument();
    });

    // Switch to services tab
    await user.click(screen.getByTestId('tab-services'));

    // Should show services management content
    expect(screen.getByTestId('button-add-service')).toBeInTheDocument();
  });

  it('displays case studies management section', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-case-studies')).toBeInTheDocument();
    });

    // Switch to case studies tab
    await user.click(screen.getByTestId('tab-case-studies'));

    // Should show case studies management content
    expect(screen.getByTestId('button-add-case-study')).toBeInTheDocument();
  });

  it('shows clients data in overview tab', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Recent Clients')).toBeInTheDocument();
    });

    // Should display client information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Dashboard />, { wrapper: createWrapper() });

    // Should handle error gracefully without crashing
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('displays correct user information', async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, admin')).toBeInTheDocument();
    });

    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
  });

  it('shows proper loading states', () => {
    // Mock never-resolving promises for loading state
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<Dashboard />, { wrapper: createWrapper() });

    // Should show loading states without crashing
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('validates inquiry conversion form', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-inquiries')).toBeInTheDocument();
    });

    // Switch to inquiries tab
    await user.click(screen.getByTestId('tab-inquiries'));

    await waitFor(() => {
      expect(screen.getByTestId('button-convert-inquiry-inquiry-1')).toBeInTheDocument();
    });

    // Click convert button
    await user.click(screen.getByTestId('button-convert-inquiry-inquiry-1'));

    // Try to submit without filling required fields
    await user.click(screen.getByTestId('button-convert-to-client'));

    // Form validation should prevent submission
    expect(screen.getByTestId('input-conversion-phone')).toBeInTheDocument();
  });
});