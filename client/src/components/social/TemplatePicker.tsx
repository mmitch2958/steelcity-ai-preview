// P2-B007: Template picker UI — card-based grid with category filter and "Use Template" action

import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';
import {
  useSocialTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  type PostTemplate,
} from '@/hooks/social/use-social-templates';
import { PLATFORMS } from '@/components/social/constants';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplatePickerProps {
  onSelectTemplate: (template: PostTemplate) => void;
}

export function TemplatePicker({ onSelectTemplate }: TemplatePickerProps) {
  const { templates, isLoading } = useSocialTemplates('portal');
  const createTemplate = useCreateTemplate('portal');
  const deleteTemplate = useDeleteTemplate('portal');

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPlatforms, setNewPlatforms] = useState<string[]>([]);
  const [newHashtags, setNewHashtags] = useState('');

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = () => {
    createTemplate.mutate(
      {
        name: newName,
        content: newContent,
        platforms: newPlatforms,
        hashtags: newHashtags
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewName('');
          setNewContent('');
          setNewPlatforms([]);
          setNewHashtags('');
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Save reusable content as a template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Template Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Weekly Tips Post"
                />
              </div>
              <div className="space-y-1">
                <Label>Content</Label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your template content..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-1">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <label
                        key={platform.id}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={newPlatforms.includes(platform.id)}
                          onCheckedChange={(checked) => {
                            setNewPlatforms((prev) =>
                              checked
                                ? [...prev, platform.id]
                                : prev.filter((p) => p !== platform.id),
                            );
                          }}
                        />
                        <Icon className="h-3 w-3" />
                        <span className="text-xs">{platform.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Hashtags (comma-separated)</Label>
                <Input
                  value={newHashtags}
                  onChange={(e) => setNewHashtags(e.target.value)}
                  placeholder="#marketing, #tips"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={
                  !newName.trim() ||
                  !newContent.trim() ||
                  newPlatforms.length === 0 ||
                  createTemplate.isPending
                }
              >
                {createTemplate.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Template grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {templates.length === 0
              ? 'No templates yet. Create one to get started.'
              : 'No templates match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'group cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all',
              )}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-medium truncate flex-1">
                    {template.name}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate.mutate(template.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {template.content}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    {template.platforms.slice(0, 3).map((pid) => {
                      const p = PLATFORMS.find((pl) => pl.id === pid);
                      if (!p) return null;
                      const Icon = p.icon;
                      return (
                        <Icon
                          key={pid}
                          className="h-3 w-3 text-muted-foreground"
                        />
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplatePicker;
