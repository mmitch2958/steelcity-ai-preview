import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Send, 
  User, 
  Bot,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
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

interface VisitorInfo {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  currentPage?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
type ChatStatus = 'closed' | 'waiting' | 'active' | 'ended';

interface ChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
  position?: 'floating' | 'header';
}

export default function ChatWidget({ isOpen: externalIsOpen, onToggle, position = 'floating' }: ChatWidgetProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [chatStatus, setChatStatus] = useState<ChatStatus>('closed');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showWelcomeForm, setShowWelcomeForm] = useState(false);
  const [infoProvided, setInfoProvided] = useState(false);
  const [isCapturingInfo, setIsCapturingInfo] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    console.log('connectWebSocket called, current readyState:', wsRef.current?.readyState);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping');
      return;
    }

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      console.log('WebSocket object created');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Chat widget connected to WebSocket');
        setConnectionStatus('connected');
        
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
        console.log('Chat widget WebSocket connection closed');
        setConnectionStatus('disconnected');
        setAdminOnline(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if chat was active
        if (sessionId && chatStatus !== 'ended') {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('Chat widget WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  }, [sessionId, chatStatus]);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;
    
    setConnectionStatus('reconnecting');
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connectWebSocket();
    }, 3000);
  }, [connectWebSocket]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        console.log('Chat widget connection established');
        // Auto-join as visitor if no session exists yet
        if (!sessionId && wsRef.current?.readyState === WebSocket.OPEN) {
          const visitorIdToUse = visitorId || `visitor_${Date.now()}`;
          wsRef.current.send(JSON.stringify({
            type: 'visitor_join',
            visitorInfo: {},
            visitorId: visitorIdToUse
          }));
        }
        break;

      case 'session_created':
        setSessionId(data.sessionId);
        setVisitorId(data.visitorId);
        setChatStatus('waiting');
        console.log('Chat session created:', data.sessionId);
        break;

      case 'admin_joined':
        setChatStatus('active');
        setAdminOnline(true);
        addSystemMessage('An agent has joined the chat');
        break;

      case 'new_message':
        const message = data.message;
        setMessages(prev => {
          const newMessages = [...prev, message];

          // Logic for "Chat-First" lead capture:
          // After 2 visitor messages, if info not provided, trigger info capture
          const visitorMessageCount = newMessages.filter(m => m.senderType === 'visitor').length;
          if (visitorMessageCount >= 2 && !infoProvided && !isCapturingInfo) {
            setIsCapturingInfo(true);
          }

          return newMessages;
        });
        
        // If this is an AI response or admin message, change status to active
        if (message.isAiResponse || message.senderType === 'admin') {
          setChatStatus('active');
        }
        
        // Increment unread count if widget is minimized or closed
        if (!isOpen || isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Mark message as delivered
        if (wsRef.current?.readyState === WebSocket.OPEN && message.senderType !== 'visitor') {
          wsRef.current.send(JSON.stringify({
            type: 'mark_message_delivered',
            messageId: message.id
          }));
        }
        break;

      case 'user_typing':
        if (data.userType === 'admin' && data.userId !== visitorId) {
          if (data.isTyping) {
            setTypingUsers(prev => new Set(Array.from(prev).concat(data.userId)));
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
        if (data.userType === 'admin') {
          setAdminOnline(false);
          addSystemMessage('Agent has disconnected');
        }
        break;

      case 'session_ended':
        setChatStatus('ended');
        setAdminOnline(false);
        addSystemMessage('Chat session has ended');
        break;

      case 'pong':
        // Keep connection alive
        break;

      case 'error':
        console.error('Chat widget error:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [isOpen, isMinimized, visitorId]);

  // Add system message
  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      sessionId: sessionId || '',
      senderId: 'system',
      senderType: 'system',
      messageType: 'system_notification',
      content,
      sentAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, systemMessage]);
  }, [sessionId]);

  // Start chat session (or update info)
  const provideInfo = useCallback((info: VisitorInfo) => {
    const visitor = {
      ...visitorInfo,
      ...info,
      currentPage: window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    setVisitorInfo(visitor);
    setInfoProvided(true);
    setIsCapturingInfo(false);
    setShowWelcomeForm(false);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionId) {
      // Send message to update visitor info in current session
      // Since there's no explicit update_info type in routes.ts,
      // we'll send a message that the admin can see and the system can log.
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        sessionId,
        content: `[System: Visitor provided contact info: ${info.name} (${info.email})${info.company ? `, Company: ${info.company}` : ''}]`,
        messageType: 'text'
      }));

      // Also re-send join with info to update session metadata if possible
      wsRef.current.send(JSON.stringify({
        type: 'visitor_join',
        visitorInfo: visitor,
        visitorId: visitorId,
        sessionId: sessionId // Hint to server to update existing session
      }));
    }
  }, [visitorInfo, sessionId, visitorId]);

  // Compatibility for initial implementation
  const startChat = provideInfo;

  // Send message
  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !sessionId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      sessionId,
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
      sessionId
    }));
  }, [inputMessage, sessionId]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!sessionId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Send typing start
    wsRef.current.send(JSON.stringify({
      type: 'typing_start',
      sessionId
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
          sessionId
        }));
      }
    }, 2000);
  }, [sessionId]);

  // Toggle chat widget
  const toggleChat = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      if (!isOpen) {
        setInternalIsOpen(true);
        setUnreadCount(0);
        
        if (chatStatus === 'closed' && connectionStatus === 'disconnected') {
          // In Chat-First mode, we don't show the form immediately
          setShowWelcomeForm(false);
          connectWebSocket();
        }
      } else {
        setInternalIsOpen(false);
      }
    }
  }, [isOpen, chatStatus, connectionStatus, connectWebSocket, onToggle]);

  // Handle keyboard events in message input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Minimize/maximize chat
  const toggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // Close chat completely
  const closeChat = useCallback(() => {
    if (sessionId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_session',
        sessionId
      }));
    }
    
    setInternalIsOpen(false);
    setIsMinimized(false);
    setChatStatus('closed');
    setMessages([]);
    setSessionId(null);
    setUnreadCount(0);
    setShowWelcomeForm(false);
    
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, [sessionId]);

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Connect WebSocket when chat is opened (for header mode especially)
  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected' && chatStatus === 'closed') {
      console.log('Chat opened, connecting WebSocket...');
      setShowWelcomeForm(true);
      connectWebSocket();
    }
  }, [isOpen, connectionStatus, chatStatus, connectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
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
  }, []);

  // Welcome form component
  const WelcomeForm = ({ inline = false }: { inline?: boolean }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      provideInfo({ name, email, company });
    };

    return (
      <div className={cn("p-4 space-y-4", inline ? "bg-muted/50 rounded-lg m-2 border border-primary/20" : "")}>
        <div className="text-center">
          <h3 className="font-semibold text-lg">
            {inline ? "Save this conversation" : "Start a conversation"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {inline
              ? "Please provide your details so we can reach out if we get disconnected."
              : "We're here to help! Please provide your information to get started."}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Your name *"
            aria-label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            data-testid="input-visitor-name"
          />
          <Input
            type="email"
            placeholder="Email address *"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-visitor-email"
          />
          <Input
            placeholder="Company (optional)"
            aria-label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            data-testid="input-visitor-company"
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={!name.trim() || !email.trim()}
            data-testid="button-start-chat"
          >
            Start Chat
          </Button>
        </form>
      </div>
    );
  };

  // Connection status indicator
  const ConnectionIndicator = () => {
    const getStatusColor = () => {
      switch (connectionStatus) {
        case 'connected': return 'text-green-500';
        case 'connecting': case 'reconnecting': return 'text-yellow-500';
        default: return 'text-red-500';
      }
    };

    const getStatusIcon = () => {
      return connectionStatus === 'disconnected' ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />;
    };

    return (
      <div className={cn("flex items-center gap-1 text-xs", getStatusColor())}>
        {getStatusIcon()}
        <span className="capitalize">{connectionStatus}</span>
      </div>
    );
  };

  // Only render the floating toggle button in floating mode
  if (position === 'floating') {
    return (
      <>
        {/* Chat Widget Toggle Button */}
        {!isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleChat}
                className={cn(
                  "fixed bottom-4 left-4 z-50 h-14 w-14 rounded-full shadow-lg hover-elevate",
                  "bg-primary hover:bg-primary text-primary-foreground"
                )}
                aria-label="Open chat"
                data-testid="button-chat-toggle"
              >
                <MessageCircle className="w-6 h-6" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open chat</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Chat Widget Window */}
        {isOpen && (
          <Card className={cn(
            "fixed z-50 shadow-xl",
            "bottom-0 left-0 right-0 top-0 w-full h-full rounded-none",
            "sm:bottom-4 sm:left-4 sm:right-auto sm:top-auto sm:w-80 sm:h-96 sm:rounded-lg",
            isMinimized && "!h-12 !top-auto bottom-4 left-4 right-auto w-80 rounded-lg"
          )}>
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                  <Bot className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">Steel City AI</CardTitle>
                <div className="flex items-center gap-2">
                  <ConnectionIndicator />
                  {adminOnline && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      Agent online
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={toggleMinimize}
                    aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                    data-testid="button-chat-minimize"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMinimized ? "Maximize chat" : "Minimize chat"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={closeChat}
                    aria-label="Close chat"
                    data-testid="button-chat-close"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close chat</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          {/* Content */}
          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-full">
              {showWelcomeForm ? (
                <WelcomeForm />
              ) : (
                <>
                  {/* Chat Status */}
                  {chatStatus === 'waiting' && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b">
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                        <Clock className="w-4 h-4" />
                        Waiting for an agent to join...
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Start a conversation with our team!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2 max-w-[85%]",
                              message.senderType === 'visitor' ? "ml-auto flex-row-reverse" : "",
                              message.senderType === 'system' ? "justify-center" : ""
                            )}
                          >
                            {message.senderType !== 'system' && (
                              <Avatar className="h-6 w-6 mt-1">
                                <AvatarFallback className="text-xs">
                                  {message.senderType === 'visitor' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "rounded-lg p-2 text-sm",
                              message.senderType === 'visitor' 
                                ? "bg-primary text-primary-foreground" 
                                : message.senderType === 'system'
                                ? "bg-muted text-muted-foreground italic text-center"
                                : "bg-muted"
                            )}>
                              <p>{message.content}</p>
                              <p className={cn(
                                "text-xs mt-1 opacity-70",
                                message.senderType === 'system' ? "hidden" : ""
                              )}>
                                {formatMessageTime(message.sentAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Typing indicator */}
                      {typingUsers.size > 0 && (
                        <div className="flex gap-2">
                          <Avatar className="h-6 w-6 mt-1">
                            <AvatarFallback className="text-xs">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-2 text-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inline Lead Capture Form */}
                      {isCapturingInfo && (
                        <WelcomeForm inline />
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  {(chatStatus === 'active' || (chatStatus === 'waiting' && !showWelcomeForm)) && (
                    <div className="p-3 border-t">
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
                          data-testid="input-chat-message"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
                          aria-label="Send message"
                          data-testid="button-send-message"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  )}

                  {chatStatus === 'waiting' && showWelcomeForm && (
                    <div className="p-3 border-t">
                      <div className="text-center text-sm text-muted-foreground">
                        Please wait while we connect you with an agent...
                      </div>
                    </div>
                  )}

                  {chatStatus === 'ended' && (
                    <div className="p-3 border-t">
                      <div className="text-center text-sm text-muted-foreground">
                        This chat session has ended.
                      </div>
                      <Button
                        onClick={() => {
                          setShowWelcomeForm(true);
                          setChatStatus('closed');
                          setMessages([]);
                          setSessionId(null);
                        }}
                        className="w-full mt-2"
                        size="sm"
                        data-testid="button-start-new-chat"
                      >
                        Start New Chat
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </>
    );
  }

  // Header mode - only render when isOpen is true
  // Uses same functionality as floating mode but positioned differently
  return isOpen ? (
    <Card className={cn(
      "fixed z-50 shadow-xl",
      "bottom-0 left-0 right-0 top-0 w-full h-full rounded-none",
      "sm:top-16 sm:right-4 sm:left-auto sm:bottom-auto sm:w-80 sm:h-96 sm:rounded-lg",
      isMinimized && "!h-12 !top-auto !bottom-4 !left-4 !right-auto w-80 rounded-lg"
    )}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary-foreground text-primary text-xs">
              <Bot className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm">Steel City AI</CardTitle>
            <div className="flex items-center gap-2">
              <ConnectionIndicator />
              {adminOnline && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Agent online
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleMinimize}
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                data-testid="button-chat-minimize"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMinimized ? "Maximize chat" : "Minimize chat"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={onToggle || toggleChat}
                aria-label="Close chat"
                data-testid="button-chat-close"
              >
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Close chat</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      {/* Full Chat Content for Header Mode (same as floating) */}
      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-full sm:h-80">
          {showWelcomeForm ? (
            <WelcomeForm />
          ) : (
            <>
              {/* Chat Status */}
              {chatStatus === 'waiting' && showWelcomeForm && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b">
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <Clock className="w-4 h-4" />
                    Waiting for an agent to join...
                  </div>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation with our team!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 max-w-[85%]",
                          message.senderType === 'visitor' ? "ml-auto flex-row-reverse" : "",
                          message.senderType === 'system' ? "justify-center" : ""
                        )}
                      >
                        {message.senderType !== 'system' && (
                          <Avatar className="h-6 w-6 mt-1">
                            <AvatarFallback className="text-xs">
                              {message.senderType === 'visitor' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "rounded-lg p-2 text-sm",
                          message.senderType === 'visitor' 
                            ? "bg-primary text-primary-foreground" 
                            : message.senderType === 'system'
                            ? "bg-muted text-muted-foreground italic text-center"
                            : "bg-muted"
                        )}>
                          <p>{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1 opacity-70",
                            message.senderType === 'system' ? "hidden" : ""
                          )}>
                            {formatMessageTime(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex gap-2">
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarFallback className="text-xs">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-2 text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Lead Capture Form */}
                  {isCapturingInfo && (
                    <WelcomeForm inline />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              {(chatStatus === 'active' || (chatStatus === 'waiting' && !showWelcomeForm)) && (
                <div className="p-3 border-t">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 text-sm"
                      disabled={connectionStatus !== 'connected'}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
                      aria-label="Send message"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {/* Start New Chat Button */}
              {(chatStatus === 'closed' || chatStatus === 'ended') && connectionStatus === 'connected' && (
                <div className="p-3 border-t">
                  <Button 
                    onClick={() => setShowWelcomeForm(true)} 
                    className="w-full"
                    data-testid="button-new-chat"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  ) : null;
}