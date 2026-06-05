import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { BrandVoiceProfile } from '@shared/schema';

import { useBrandVoices, useSaveBrandVoice, useDeleteBrandVoice } from '@/hooks/social/use-brand-voice';
import { createBrandVoiceSchema, type CreateBrandVoiceForm } from '@/components/social/schemas';
import { useToast } from '@/hooks/use-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function BrandVoiceTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BrandVoiceProfile | null>(null);
  const { toast } = useToast();

  const { brandVoices: profiles, isLoading } = useBrandVoices('portal');
  const saveMutation = useSaveBrandVoice('portal');
  const deleteMutation = useDeleteBrandVoice('portal');

  const form = useForm<CreateBrandVoiceForm>({
    resolver: zodResolver(createBrandVoiceSchema),
    defaultValues: {
      name: '',
      tone: '',
      style: '',
      vocabulary: '',
      avoidWords: '',
      examplePosts: '',
      isDefault: false,
    },
  });

  const handleEdit = (profile: BrandVoiceProfile) => {
    setEditingProfile(profile);
    form.reset({
      name: profile.name || '',
      tone: profile.tone || '',
      style: profile.style || '',
      vocabulary: Array.isArray(profile.vocabulary)
        ? profile.vocabulary.join(', ')
        : profile.vocabulary || '',
      avoidWords: Array.isArray(profile.avoidWords)
        ? profile.avoidWords.join(', ')
        : profile.avoidWords || '',
      examplePosts: Array.isArray(profile.examplePosts)
        ? profile.examplePosts.join('\n')
        : profile.examplePosts || '',
      isDefault: profile.isDefault || false,
    });
    setIsCreateOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setEditingProfile(null);
      form.reset();
    }
  };

  const handleSave = (data: CreateBrandVoiceForm) => {
    saveMutation.mutate(
      { data, editingId: editingProfile?.id },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setEditingProfile(null);
          form.reset();
          toast({
            title: 'Brand voice saved',
            description: 'Your brand voice profile has been saved.',
          });
        },
        onError: (error: Error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to save brand voice',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Profile deleted' });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete profile',
          variant: 'destructive',
        });
      },
    });
  };

      <Helmet>
      <title>Brand Voice | Steel City AI</title>
      <meta name="description" content="Maintain consistent brand voice across all your content" />
    </Helmet>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Brand Voice</h2>
          <p className="text-muted-foreground text-sm">
            Define how your brand sounds across social media
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? 'Edit Brand Voice' : 'Create Brand Voice'}
              </DialogTitle>
              <DialogDescription>
                Define the tone and style for your brand
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Professional, Casual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Friendly, Authoritative, Playful"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Concise, Storytelling, Data-driven"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vocabulary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Vocabulary (comma-separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="innovation, empower, transform"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avoidWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Words to Avoid (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="cheap, basic, simple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="examplePosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Example Posts (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste example posts that represent your brand voice..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4 rounded-md border p-3">
                      <div>
                        <FormLabel className="mb-0">Default Profile</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Use this as the default brand voice
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingProfile ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !Array.isArray(profiles) || profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No brand voice profiles</h3>
            <p className="text-muted-foreground text-sm">
              Create a brand voice profile to guide your AI-generated content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover-elevate">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-semibold cursor-pointer"
                    onClick={() => handleEdit(profile)}
                  >
                    {profile.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {profile.isDefault && <Badge variant="default">Default</Badge>}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(profile.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {profile.tone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tone:</span> {profile.tone}
                  </div>
                )}
                {profile.style && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Style:</span> {profile.style}
                  </div>
                )}
                {profile.vocabulary && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(profile.vocabulary) ? profile.vocabulary : [])
                      .slice(0, 5)
                      .map((word: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {word}
                        </Badge>
                      ))}
                    {Array.isArray(profile.vocabulary) &&
                      profile.vocabulary.length > 5 && (
                        <Badge variant="outline">
                          +{profile.vocabulary.length - 5}
                        </Badge>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
