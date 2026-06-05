import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  FileIcon,
  FilePlus,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import type { ProjectDocument } from "@shared/schema";

interface DocumentManagerProps {
  projectId: string;
  clientId: string;
}

interface UploadProgress {
  [key: string]: number;
}

export default function DocumentManager({ projectId, clientId }: DocumentManagerProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploading, setUploading] = useState<string[]>([]);
  const { toast } = useToast();

  // Query for project documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/projects/${projectId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => 
      apiRequest(`/api/admin/clients/${clientId}/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'documents'] 
      });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const uploadDocument = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    setUploading(prev => [...prev, fileId]);
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      const formData = new FormData();
      formData.append('document', file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({ ...prev, [fileId]: percentComplete }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploading(prev => prev.filter(id => id !== fileId));
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
            queryClient.invalidateQueries({ 
              queryKey: ['/api/admin/clients', clientId, 'projects', projectId, 'documents'] 
            });
            toast({
              title: "Success",
              description: `${file.name} uploaded successfully`,
            });
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', `/api/admin/clients/${clientId}/projects/${projectId}/documents/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      setUploading(prev => prev.filter(id => id !== fileId));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      toast({
        title: "Error",
        description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
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

    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 50MB.`,
          variant: "destructive",
        });
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    // Upload files sequentially to avoid overwhelming the server
    for (const file of validFiles) {
      try {
        await uploadDocument(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [clientId, projectId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    }
  });

  const handleDeleteDocument = (documentId: string) => {
    deleteDocumentMutation.mutate(documentId);
  };

  const handleDownloadDocument = (document: ProjectDocument) => {
    const downloadUrl = `/api/admin/clients/${clientId}/projects/${projectId}/documents/${document.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return Image;
    } else if (mimeType.includes('pdf')) {
      return FileText;
    } else {
      return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Maximum file size: 50MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'}`}
            data-testid={`dropzone-upload-${projectId}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                {isDragActive ? (
                  <CheckCircle className="h-6 w-6 text-primary" />
                ) : (
                  <FilePlus className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag files here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: PDF, Word, Excel, PowerPoint, images, text, and ZIP files
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium">Uploading files...</h4>
              {uploading.map(fileId => (
                <div key={fileId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{fileId.split('-')[0]}</span>
                    <span>{Math.round(uploadProgress[fileId] || 0)}%</span>
                  </div>
                  <Progress value={uploadProgress[fileId] || 0} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Type Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            File Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Supported Formats:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• PDF Documents (.pdf)</li>
                <li>• Microsoft Word (.doc, .docx)</li>
                <li>• Microsoft Excel (.xls, .xlsx)</li>
                <li>• Microsoft PowerPoint (.ppt, .pptx)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Also Supported:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Images (.jpg, .png, .gif)</li>
                <li>• Text Files (.txt)</li>
                <li>• ZIP Archives (.zip)</li>
                <li>• Maximum Size: 50MB per file</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Project Documents ({documents.length})
          </CardTitle>
          <CardDescription>
            All files uploaded for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading documents...</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground">Upload the first document for this project</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document: ProjectDocument) => {
                  const FileIconComponent = getFileIcon(document.mimeType);
                  return (
                    <TableRow key={document.id} data-testid={`row-document-${document.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FileIconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate" title={document.originalName}>
                            {document.originalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {document.mimeType.split('/')[1].toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(document.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(document.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                            data-testid={`button-download-document-${document.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-delete-document-${document.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{document.originalName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(document.id)}
                                  data-testid={`button-confirm-delete-document-${document.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}