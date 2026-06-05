import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

export function useMediaUpload(mode: ApiMode) {
  const { toast } = useToast();
  const base = basePath(mode);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  const uploadFiles = async (files: FileList, onSuccess: (urls: string[]) => void) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch(`${base}/media/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      const data = await res.json();
      const urls = data.urls ?? (data.url ? [data.url] : []);

      onSuccess(urls);
      toast({ title: 'Files uploaded', description: `${urls.length} file(s) uploaded.` });
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Unable to upload files.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addFromUrl = async (url: string, onSuccess: (downloadedUrl: string) => void) => {
    setIsAddingUrl(true);

    try {
      const res = await apiRequest('POST', `${base}/media/from-url`, { url });
      const data = await res.json();

      if (data.url) {
        onSuccess(data.url);
        toast({ title: 'Media added', description: 'Media downloaded and attached.' });
      }
    } catch (err: any) {
      toast({
        title: 'Failed to add media',
        description: err?.message || 'Unable to add media from URL.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingUrl(false);
    }
  };

  return { uploadFiles, addFromUrl, isUploading, isAddingUrl };
}
