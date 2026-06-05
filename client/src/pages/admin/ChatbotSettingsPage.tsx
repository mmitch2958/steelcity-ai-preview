import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bot, Settings, BookOpen, MessageSquare, Plus, Edit, Trash2, Save, TestTube, Loader2, Send } from "lucide-react";
import type { ChatbotConfig, ChatbotKnowledge } from "@shared/schema";

export default function ChatbotSettingsPage() {
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<{ response: string; knowledgeUsed: string[] } | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState<ChatbotKnowledge | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    category: "",
    question: "",
    answer: "",
    keywords: "",
    priority: 0,
    isActive: true
  });

  const { data: config, isLoading: configLoading } = useQuery<ChatbotConfig>({
    queryKey: ["/api/admin/chatbot/config"]
  });

  const { data: knowledge = [], isLoading: knowledgeLoading } = useQuery<ChatbotKnowledge[]>({
    queryKey: ["/api/admin/chatbot/knowledge"]
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<ChatbotConfig>) => {
      const res = await apiRequest("PUT", "/api/admin/chatbot/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/config"] });
      toast({ title: "Configuration updated", description: "Chatbot settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update configuration.", variant: "destructive" });
    }
  });

  const testChatbotMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/admin/chatbot/test", { message });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResponse(data);
    },
    onError: () => {
      toast({ title: "Test failed", description: "Could not generate test response.", variant: "destructive" });
    }
  });

  const createKnowledgeMutation = useMutation({
    mutationFn: async (data: typeof newKnowledge) => {
      const res = await apiRequest("POST", "/api/admin/chatbot/knowledge", {
        ...data,
        keywords: data.keywords.split(",").map(k => k.trim()).filter(Boolean)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/knowledge"] });
      setShowAddDialog(false);
      setNewKnowledge({ category: "", question: "", answer: "", keywords: "", priority: 0, isActive: true });
      toast({ title: "Knowledge added", description: "New FAQ entry has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create knowledge entry.", variant: "destructive" });
    }
  });

  const updateKnowledgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChatbotKnowledge> }) => {
      const res = await apiRequest("PUT", `/api/admin/chatbot/knowledge/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/knowledge"] });
      setEditingKnowledge(null);
      toast({ title: "Knowledge updated", description: "FAQ entry has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update knowledge entry.", variant: "destructive" });
    }
  });

  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/chatbot/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/knowledge"] });
      toast({ title: "Knowledge deleted", description: "FAQ entry has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete knowledge entry.", variant: "destructive" });
    }
  });

  const [localConfig, setLocalConfig] = useState<Partial<ChatbotConfig>>({});

  const handleConfigChange = (field: keyof ChatbotConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfig = () => {
    if (Object.keys(localConfig).length > 0) {
      updateConfigMutation.mutate(localConfig);
      setLocalConfig({});
    }
  };

  const currentConfig = { ...config, ...localConfig };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            Chatbot Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your AI chatbot's personality, knowledge, and behavior
          </p>
        </div>
        <Badge variant={config?.isEnabled ? "default" : "secondary"}>
          {config?.isEnabled ? "Active" : "Disabled"}
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Chatbot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic chatbot identity and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Chatbot</Label>
                  <p className="text-sm text-muted-foreground">Allow AI to respond when no admin is present</p>
                </div>
                <Switch
                  checked={currentConfig?.isEnabled ?? true}
                  onCheckedChange={(checked) => handleConfigChange("isEnabled", checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bot Name</Label>
                  <Input
                    value={currentConfig?.botName ?? ""}
                    onChange={(e) => handleConfigChange("botName", e.target.value)}
                    placeholder="AI Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={currentConfig?.companyName ?? ""}
                    onChange={(e) => handleConfigChange("companyName", e.target.value)}
                    placeholder="Steel City AI"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Personality</Label>
                  <Select
                    value={currentConfig?.personality ?? "friendly"}
                    onValueChange={(value) => handleConfigChange("personality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <Select
                    value={currentConfig?.responseStyle ?? "concise"}
                    onValueChange={(value) => handleConfigChange("responseStyle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Response Length (tokens)</Label>
                <Input
                  type="number"
                  value={currentConfig?.maxResponseLength ?? 500}
                  onChange={(e) => handleConfigChange("maxResponseLength", parseInt(e.target.value))}
                  min={100}
                  max={2000}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Define how the chatbot should behave and what information it should provide.
                This is the main instruction that shapes the AI's responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentConfig?.systemPrompt ?? ""}
                onChange={(e) => handleConfigChange("systemPrompt", e.target.value)}
                placeholder="You are a helpful AI assistant..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Be specific about your services, tone, and what topics the bot should cover or avoid.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Configure automated messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea
                  value={currentConfig?.greetingMessage ?? ""}
                  onChange={(e) => handleConfigChange("greetingMessage", e.target.value)}
                  placeholder="Hi! How can I help you today?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Fallback Message (when AI has issues)</Label>
                <Textarea
                  value={currentConfig?.fallbackMessage ?? ""}
                  onChange={(e) => handleConfigChange("fallbackMessage", e.target.value)}
                  placeholder="I'm having technical difficulties..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={saveConfig} 
              disabled={Object.keys(localConfig).length === 0 || updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Knowledge Base</h2>
              <p className="text-sm text-muted-foreground">
                Add FAQs and information that the chatbot can reference when answering questions
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Knowledge Entry</DialogTitle>
                  <DialogDescription>
                    Add a new FAQ or information that the chatbot can use
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={newKnowledge.category}
                        onChange={(e) => setNewKnowledge(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Services, Pricing, Getting Started"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority (higher = more important)</Label>
                      <Input
                        type="number"
                        value={newKnowledge.priority}
                        onChange={(e) => setNewKnowledge(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input
                      value={newKnowledge.question}
                      onChange={(e) => setNewKnowledge(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="What question does this answer?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea
                      value={newKnowledge.answer}
                      onChange={(e) => setNewKnowledge(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="The answer the chatbot should provide..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords (comma-separated)</Label>
                    <Input
                      value={newKnowledge.keywords}
                      onChange={(e) => setNewKnowledge(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="pricing, cost, how much, price"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createKnowledgeMutation.mutate(newKnowledge)}
                    disabled={createKnowledgeMutation.isPending}
                  >
                    {createKnowledgeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Entry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {knowledgeLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : knowledge.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No knowledge entries yet</h3>
                <p className="text-muted-foreground text-center mt-1">
                  Add FAQs and information to help your chatbot answer questions better
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {knowledge.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    {editingKnowledge?.id === entry.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            value={editingKnowledge.category}
                            onChange={(e) => setEditingKnowledge({ ...editingKnowledge, category: e.target.value })}
                            placeholder="Category"
                          />
                          <Input
                            type="number"
                            value={editingKnowledge.priority || 0}
                            onChange={(e) => setEditingKnowledge({ ...editingKnowledge, priority: parseInt(e.target.value) || 0 })}
                            placeholder="Priority"
                          />
                        </div>
                        <Input
                          value={editingKnowledge.question}
                          onChange={(e) => setEditingKnowledge({ ...editingKnowledge, question: e.target.value })}
                          placeholder="Question"
                        />
                        <Textarea
                          value={editingKnowledge.answer}
                          onChange={(e) => setEditingKnowledge({ ...editingKnowledge, answer: e.target.value })}
                          placeholder="Answer"
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingKnowledge(null)}>Cancel</Button>
                          <Button 
                            onClick={() => updateKnowledgeMutation.mutate({ 
                              id: entry.id, 
                              data: editingKnowledge 
                            })}
                            disabled={updateKnowledgeMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.category}</Badge>
                            <Badge variant="secondary">Priority: {entry.priority}</Badge>
                            {!entry.isActive && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <h4 className="font-medium">{entry.question}</h4>
                          <p className="text-sm text-muted-foreground">{entry.answer}</p>
                          {entry.keywords && entry.keywords.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {entry.keywords.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingKnowledge(entry)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteKnowledgeMutation.mutate(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Test Your Chatbot
              </CardTitle>
              <CardDescription>
                Send a test message to see how your chatbot responds with the current configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type a test message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && testMessage.trim()) {
                      testChatbotMutation.mutate(testMessage);
                    }
                  }}
                />
                <Button 
                  onClick={() => testChatbotMutation.mutate(testMessage)}
                  disabled={!testMessage.trim() || testChatbotMutation.isPending}
                >
                  {testChatbotMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {testResponse && (
                <div className="space-y-4 mt-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Chatbot Response:</p>
                    <p className="text-sm">{testResponse.response}</p>
                  </div>
                  {testResponse.knowledgeUsed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Knowledge Base Used:</p>
                      <div className="flex gap-2 flex-wrap">
                        {testResponse.knowledgeUsed.map((q, i) => (
                          <Badge key={i} variant="outline">{q}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
