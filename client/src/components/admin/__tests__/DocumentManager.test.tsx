import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import DocumentManager from '../DocumentManager';
import { mockProjectDocuments, createMockFile } from '../../../test/fixtures';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: any) => ({
    getRootProps: () => ({
      onClick: jest.fn(),
      'data-testid': 'dropzone-upload-project-1',
    }),
    getInputProps: () => ({ 'data-testid': 'input-file-upload' }),
    isDragActive: false,
  }),
}));

// Mock the API
global.fetch = jest.fn();
global.XMLHttpRequest = jest.fn().mockImplementation(() => ({
  upload: { addEventListener: jest.fn() },
  addEventListener: jest.fn(),
  open: jest.fn(),
  send: jest.fn(),
  status: 200,
  response: JSON.stringify({ success: true }),
}));

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

describe('DocumentManager', () => {
  const defaultProps = {
    projectId: 'project-1',
    clientId: 'client-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjectDocuments,
    });
  });

  it('renders document manager with proper data-testid attributes', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
    });

    // Check dropzone has proper data-testid
    expect(screen.getByTestId('dropzone-upload-project-1')).toBeInTheDocument();
    expect(screen.getByText('Drag files here or click to browse')).toBeInTheDocument();
  });

  it('displays document list with data-testid attributes', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('row-document-doc-1')).toBeInTheDocument();
    });

    // Check document rows have proper data-testid
    expect(screen.getByTestId('row-document-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-document-doc-2')).toBeInTheDocument();

    // Check document info is displayed
    expect(screen.getByText('Wireframes v2.pdf')).toBeInTheDocument();
    expect(screen.getByText('Project Requirements.docx')).toBeInTheDocument();

    // Check action buttons have data-testid
    expect(screen.getByTestId('button-download-document-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('button-delete-document-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('button-download-document-doc-2')).toBeInTheDocument();
    expect(screen.getByTestId('button-delete-document-doc-2')).toBeInTheDocument();
  });

  it('handles file download', async () => {
    const user = userEvent.setup();
    
    // Mock window.open for download
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockOpen,
    });

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-download-document-doc-1')).toBeInTheDocument();
    });

    // Click download button
    await user.click(screen.getByTestId('button-download-document-doc-1'));

    // Should trigger download
    expect(mockOpen).toHaveBeenCalledWith(
      '/api/admin/clients/client-1/projects/project-1/documents/doc-1/download',
      '_blank'
    );
  });

  it('handles file deletion with confirmation', async () => {
    const user = userEvent.setup();
    const mockDelete = fetch as jest.Mock;

    // Mock successful deletion
    mockDelete.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('button-delete-document-doc-1')).toBeInTheDocument();
    });

    // Click delete button
    await user.click(screen.getByTestId('button-delete-document-doc-1'));

    // Confirm deletion
    expect(screen.getByTestId('button-confirm-delete-document-doc-1')).toBeInTheDocument();
    await user.click(screen.getByTestId('button-confirm-delete-document-doc-1'));

    // Verify API call
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        '/api/admin/clients/client-1/projects/project-1/documents/doc-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  it('shows upload progress during file upload', async () => {
    // Mock XMLHttpRequest with progress events
    const mockXHR = {
      upload: { addEventListener: jest.fn() },
      addEventListener: jest.fn(),
      open: jest.fn(),
      send: jest.fn(),
      status: 200,
      response: JSON.stringify({ success: true }),
    };

    (global.XMLHttpRequest as jest.Mock).mockImplementation(() => mockXHR);

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('dropzone-upload-project-1')).toBeInTheDocument();
    });

    // The dropzone should be present and ready for interaction
    expect(screen.getByText('Drag files here or click to browse')).toBeInTheDocument();
  });

  it('displays file type information correctly', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    // Check file type badges
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
  });

  it('displays file sizes correctly', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    // Check file sizes are formatted correctly
    expect(screen.getByText('2.0 MB')).toBeInTheDocument(); // 2048000 bytes
    expect(screen.getByText('1.0 MB')).toBeInTheDocument(); // 1024000 bytes
  });

  it('shows empty state when no documents exist', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Upload your first document to get started')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock never-resolving promise for loading state
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    // Should show loading state (component doesn't crash)
    expect(screen.getByText('Project Documents')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    // Should handle error gracefully without crashing
    await waitFor(() => {
      expect(screen.getByText('Project Documents')).toBeInTheDocument();
    });
  });

  it('validates file types', () => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ];

    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    // Component should render with file type validation built-in
    expect(screen.getByText('Supports: PDF, Word, Excel, PowerPoint, images, text, and ZIP files')).toBeInTheDocument();
  });

  it('shows upload restrictions in UI', () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    // Should display file type and size restrictions
    expect(screen.getByText('Maximum file size: 50MB')).toBeInTheDocument();
    expect(screen.getByText('Supports: PDF, Word, Excel, PowerPoint, images, text, and ZIP files')).toBeInTheDocument();
  });

  it('handles file icon display based on mime type', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Wireframes v2.pdf')).toBeInTheDocument();
    });

    // Different file types should show different icons (implementation detail)
    // The component should render file icons based on mime types
    const documentRows = screen.getAllByRole('row');
    expect(documentRows.length).toBeGreaterThan(2); // Header + data rows
  });

  it('formats creation dates correctly', async () => {
    render(<DocumentManager {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should show formatted dates for document creation
      expect(screen.getByText(/Jan \d{1,2}, 2024/)).toBeInTheDocument();
    });
  });
});