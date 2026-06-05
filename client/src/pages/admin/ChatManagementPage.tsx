import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock, 
  UserCheck,
  MessageSquare,
  Activity,
  Wifi,
  WifiOff,
  Eye,
  X,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'admin' | 'visitor' | 'system';
  messageType: 'text' | 'image' | 'file' | 'system_notification';
  content: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

interface ChatSession {
  id: string;
  visitorId: string;
  visitorInfo?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    currentPage?: string;
    userAgent?: string;
    referrer?: string;
  };
  status: 'waiting' | 'active' | 'ended' | 'transferred' | 'abandoned';
  adminId?: string;
  startedAt: string;
  endedAt?: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessage?: ChatMessage;
  visitorName?: string;
}

interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export default function ChatManagementPage() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('active');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Connect to WebSocket server as admin
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Admin connected to WebSocket');
        setConnectionStatus('connected');
        
        // Join as admin
        ws.send(JSON.stringify({
          type: 'admin_join',
          adminId: user?.id
        }));
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Admin WebSocket connection closed');
        setConnectionStatus('disconnected');
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect
        setTimeout(() => {
          setConnectionStatus('reconnecting');
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [user?.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'admin_connected':
        console.log('Admin connected successfully');
        break;

      case 'active_sessions':
        setActiveSessions(data.sessions);
        break;

      case 'new_chat_session':
        // New visitor started a chat
        setActiveSessions(prev => [data.session, ...prev]);
        break;

      case 'session_history':
        if (data.session) {
          setSessionMessages(prev => ({
            ...prev,
            [data.session.id]: data.session.messages || []
          }));
        }
        break;

      case 'new_message':
        const message = data.message;
        setSessionMessages(prev => ({
          ...prev,
          [message.sessionId]: [...(prev[message.sessionId] || []), message]
        }));
        
        // Update session's last message
        setActiveSessions(prev => prev.map(session => 
          session.id === message.sessionId 
            ? { ...session, lastMessage: message, lastMessageAt: message.sentAt }
            : session
        ));
        break;

      case 'user_typing':
        if (data.userType === 'visitor') {
          if (data.isTyping) {
            setTypingUsers(prev => new Set([...prev, data.userId]));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        }
        break;

      case 'user_disconnected':
        if (data.userType === 'visitor') {
          // Update session status
          setActiveSessions(prev => prev.map(session => 
            session.id === data.sessionId 
              ? { ...session, status: 'abandoned' }
              : session
          ));
        }
        break;

      case 'session_ended':
        setActiveSessions(prev => prev.map(session => 
          session.id === data.sessionId 
            ? { ...session, status: 'ended' }
            : session
        ));
        break;

      case 'pong':
        // Keep connection alive
        break;

      case 'error':
        console.error('Admin WebSocket error:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Join a specific chat session
  const joinSession = useCallback((sessionId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setSelectedSessionId(sessionId);
    
    wsRef.current.send(JSON.stringify({
      type: 'join_session',
      sessionId,
      adminId: user?.id
    }));
  }, [user?.id]);

  // Send message to current session
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !selectedSessionId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      sessionId: selectedSessionId,
      content: inputMessage.trim(),
      messageType: 'text'
    }));

    setInputMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    wsRef.current.send(JSON.stringify({
      type: 'typing_stop',
      sessionId: selectedSessionId
    }));
  }, [inputMessage, selectedSessionId]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!selectedSessionId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Send typing start
    wsRef.current.send(JSON.stringify({
      type: 'typing_start',
      sessionId: selectedSessionId
    }));

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing_stop',
          sessionId: selectedSessionId
        }));
      }
    }, 2000);
  }, [selectedSessionId]);

  // End chat session
  const endSession = useCallback((sessionId: string, notes?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'end_session',
      sessionId,
      notes
    }));

    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  }, [selectedSessionId]);

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format session duration
  const formatSessionDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Connect on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages, selectedSessionId, scrollToBottom]);

  const selectedSession = activeSessions.find(s => s.id === selectedSessionId);
  const selectedMessages = selectedSessionId ? sessionMessages[selectedSessionId] || [] : [];

  // Filter sessions by tab
  const filteredSessions = activeSessions.filter(session => {
    switch (activeTab) {
      case 'active':
        return session.status === 'active' || session.status === 'waiting';
      case 'ended':
        return session.status === 'ended' || session.status === 'abandoned';
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <MessageCircle className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Live Chat Management</h1>
            <div className={cn(
              "flex items-center gap-2 text-sm",
              connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
            )}>
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredSessions.length} Sessions
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={connectWebSocket}
              disabled={connectionStatus === 'connecting'}
              data-testid="button-refresh-connection"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", connectionStatus === 'connecting' && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sessions List */}
        <div className="w-1/3 border-r bg-card">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active" data-testid="tab-active-chats">
                  Active ({activeSessions.filter(s => s.status === 'active' || s.status === 'waiting').length})
                </TabsTrigger>
                <TabsTrigger value="ended" data-testid="tab-ended-chats">
                  Ended ({activeSessions.filter(s => s.status === 'ended' || s.status === 'abandoned').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No {activeTab} chat sessions</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={cn(
                      "cursor-pointer hover-elevate",
                      selectedSessionId === session.id && "ring-2 ring-primary"
                    )}
                    onClick={() => joinSession(session.id)}
                    data-testid={`chat-session-${session.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {session.visitorInfo?.name || session.visitorName || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.visitorInfo?.company || 'Unknown Company'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={session.status === 'active' ? 'default' : 
                                   session.status === 'waiting' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {session.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatSessionDuration(session.startedAt, session.endedAt)}
                          </span>
                        </div>
                      </div>
                      
                      {session.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          <span className="font-medium">
                            {session.lastMessage.senderType === 'visitor' ? 'Visitor: ' : 'You: '}
                          </span>
                          {session.lastMessage.content}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{session.messageCount || 0} messages</span>
                        <span>{formatMessageTime(session.lastMessageAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Session Header */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedSession.visitorInfo?.name || selectedSession.visitorName || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{selectedSession.visitorInfo?.email}</span>
                        {selectedSession.visitorInfo?.company && (
                          <span>{selectedSession.visitorInfo.company}</span>
                        )}
                        <span>Started {formatMessageTime(selectedSession.startedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Session {selectedSession.id.slice(-8)}
                    </Badge>
                    {selectedSession.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => endSession(selectedSession.id)}
                        data-testid="button-end-session"
                      >
                        <X className="w-4 h-4 mr-2" />
                        End Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          message.senderType === 'admin' ? "ml-auto flex-row-reverse" : "",
                          message.senderType === 'system' ? "justify-center" : ""
                        )}
                      >
                        {message.senderType !== 'system' && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="text-xs">
                              {message.senderType === 'visitor' ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "rounded-lg p-3",
                          message.senderType === 'admin' 
                            ? "bg-primary text-primary-foreground" 
                            : message.senderType === 'system'
                            ? "bg-muted text-muted-foreground italic text-center text-sm"
                            : "bg-muted"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1 opacity-70",
                            message.senderType === 'system' ? "hidden" : ""
                          )}>
                            {formatMessageTime(message.sentAt)}
                            {message.senderType === 'admin' && message.deliveredAt && (
                              <span className="ml-2">✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              {selectedSession.status === 'active' && (
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        handleTyping();
                      }}
                      disabled={connectionStatus !== 'connected'}
                      data-testid="input-admin-message"
                    />
                    <Button
                      type="submit"
                      disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
                      data-testid="button-send-admin-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {selectedSession.status === 'waiting' && (
                <div className="p-4 border-t">
                  <div className="text-center text-sm text-muted-foreground">
                    Session is waiting for your response...
                  </div>
                </div>
              )}

              {(selectedSession.status === 'ended' || selectedSession.status === 'abandoned') && (
                <div className="p-4 border-t">
                  <div className="text-center text-sm text-muted-foreground">
                    This chat session has {selectedSession.status === 'ended' ? 'ended' : 'been abandoned'}.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a chat session</h3>
                <p>Choose a chat session from the left to start managing conversations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}