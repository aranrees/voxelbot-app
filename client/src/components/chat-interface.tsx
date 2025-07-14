import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Send, Phone, Mail, MapPin, Clock, Download, Calendar, Heart, Settings, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { QuickAction } from "@shared/schema";

interface ChatMessage {
  id: number;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  businessHours: string;
}

export function ChatInterface() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [interfaceSize, setInterfaceSize] = useState<"normal" | "large" | "extra-large">("normal");
  const [chatWidth, setChatWidth] = useState<"narrow" | "normal" | "wide" | "extra-wide">("normal");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "bonkers">("light");
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: ""
  });

  // Fetch messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/messages"],
  });

  // Fetch contact info
  const { data: contactInfo } = useQuery<ContactInfo>({
    queryKey: ["/api/contact"],
  });

  // Fetch quick actions
  const { data: quickActions = [] } = useQuery<QuickAction[]>({
    queryKey: ["/api/quick-actions"],
  });

  // Fetch welcome message
  const { data: welcomeData } = useQuery<{ message: string }>({
    queryKey: ["/api/welcome-message"],
  });

  // Fetch greeting message
  const { data: greetingData } = useQuery<{ message: string }>({
    queryKey: ["/api/greeting-message"],
  });

  // Fetch smart suggestions based on conversation context
  const { data: smartSuggestions = [] } = useQuery<Array<QuickAction & {relevanceScore: number, reason: string}>>({
    queryKey: ["/api/smart-suggestions"],
    enabled: messages.length > 0, // Only fetch if there are messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content,
        role: "user"
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/smart-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      setIsTyping(false);
      updateActivity();
      
      // Check if the response contains an admin link
      if (data.adminLink) {
        setTimeout(() => {
          window.open(data.adminLink, '_blank');
        }, 1000);
      }
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset chat mutation
  const resetChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/messages");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setShowResetConfirm(false);
      toast({
        title: "Chat Reset",
        description: "Chat history has been cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: typeof appointmentForm) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your appointment has been scheduled! We'll contact you soon to confirm.",
      });
      setShowAppointmentModal(false);
      setAppointmentForm({
        name: "",
        email: "",
        phone: "",
        preferredDate: "",
        preferredTime: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize chat session and add greeting message
  useEffect(() => {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setChatSessionId(sessionId);
    const now = new Date();
    setLastActivity(now);
    startInactivityTimer();
  }, []);

  // Add greeting message when it loads and there are no messages
  useEffect(() => {
    if (greetingData?.message && greetingData.message.trim() && messages.length === 0 && chatSessionId) {
      // Create greeting message directly via API
      const addGreeting = async () => {
        try {
          await apiRequest("POST", "/api/greeting", {
            sessionId: chatSessionId,
            content: greetingData.message
          });
          // Refetch messages to include the greeting
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        } catch (error) {
          console.error("Failed to add greeting message:", error);
        }
      };
      
      addGreeting();
    }
  }, [greetingData, messages.length, chatSessionId]);

  const startInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new 10-minute inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      handleChatCompletion();
    }, 10 * 60 * 1000); // 10 minutes
  };

  // Activity tracking and inactivity detection
  const updateActivity = () => {
    const now = new Date();
    setLastActivity(now);
    startInactivityTimer();
  };

  const handleChatCompletion = async () => {
    if (!messages || messages.length === 0) return;
    
    // Send chat transcript
    try {
      await apiRequest("POST", "/api/chat/complete", {
        sessionId: chatSessionId,
        messages,
        startTime: messages[0]?.timestamp,
        endTime: lastActivity,
        duration: lastActivity.getTime() - new Date(messages[0]?.timestamp).getTime()
      });
    } catch (error) {
      console.error("Failed to log chat completion:", error);
    }
    
    // Reset chat
    await resetChatMutation.mutateAsync();
    
    // Generate new session ID
    const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setChatSessionId(newSessionId);
    updateActivity();
  };

  // Track user interaction
  const trackUserActivity = () => {
    updateActivity();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      trackUserActivity();
      sendMessageMutation.mutate(message.trim());
      setMessage("");
    }
  };

  const handleQuickMessage = (quickMessage: string) => {
    trackUserActivity();
    setMessage(quickMessage);
    sendMessageMutation.mutate(quickMessage);
    setMessage("");
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch("/api/download/service-guide");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "service-guide.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Service guide downloaded successfully!",
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download service guide. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointmentMutation.mutate(appointmentForm);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const generateRandomColor = () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500',
      'bg-lime-500', 'bg-emerald-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getBonkersColors = () => ({
    background: generateRandomColor(),
    chatBg: generateRandomColor(),
    headerBg: generateRandomColor(),
    messageBg: generateRandomColor(),
    userMessageBg: generateRandomColor(),
    buttonBg: generateRandomColor(),
    inputBg: generateRandomColor()
  });

  const bonkersColors = themeMode === "bonkers" ? getBonkersColors() : null;

  const handleThemeChange = (newTheme: "light" | "dark" | "bonkers") => {
    setThemeMode(newTheme);
    if (newTheme === "light") {
      setTheme("light");
    } else if (newTheme === "dark") {
      setTheme("dark");
    } else {
      setTheme("light"); // Use light as base for bonkers mode
    }
  };

  const getWidthClass = () => {
    switch (chatWidth) {
      case "narrow":
        return "max-w-md";
      case "wide":
        return "max-w-4xl";
      case "extra-wide":
        return "max-w-6xl";
      default:
        return "max-w-2xl";
    }
  };

  const getMessageBubbleWidth = () => {
    switch (chatWidth) {
      case "narrow":
        return "max-w-xs";
      case "wide":
        return "max-w-lg";
      case "extra-wide":
        return "max-w-2xl";
      default:
        return "max-w-md";
    }
  };

  const getSizeClasses = () => {
    switch (interfaceSize) {
      case "large":
        return {
          text: "text-lg",
          textSm: "text-base",
          textXs: "text-sm",
          button: "h-12 px-6 text-lg",
          input: "h-12 text-lg",
          spacing: "space-y-6",
          padding: "p-6",
          icon: "w-6 h-6",
          heading: "text-3xl",
          subheading: "text-xl"
        };
      case "extra-large":
        return {
          text: "text-xl",
          textSm: "text-lg",
          textXs: "text-base",
          button: "h-14 px-8 text-xl",
          input: "h-14 text-xl",
          spacing: "space-y-8",
          padding: "p-8",
          icon: "w-7 h-7",
          heading: "text-4xl",
          subheading: "text-2xl"
        };
      default:
        return {
          text: "text-base",
          textSm: "text-sm",
          textXs: "text-xs",
          button: "h-10 px-4",
          input: "h-10 text-base",
          spacing: "space-y-4",
          padding: "p-4",
          icon: "w-5 h-5",
          heading: "text-2xl",
          subheading: "text-lg"
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`min-h-screen ${bonkersColors ? bonkersColors.background : 'bg-gray-50 dark:bg-gray-900'} flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
      {/* Chat Container - Seamless with Shadow */}
      <Card className={`w-full ${getWidthClass()} mx-auto shadow-2xl dark:shadow-gray-900/50 border-0 ${bonkersColors ? bonkersColors.chatBg : 'bg-white dark:bg-gray-800'}`}>
        {/* Chat Header */}
        <div className={`${bonkersColors ? bonkersColors.headerBg : 'bg-white dark:bg-gray-800'} ${sizeClasses.padding} text-black dark:text-white rounded-t-lg shadow-sm`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg`}>
              <Heart className={`${sizeClasses.icon} text-white dark:text-black`} />
            </div>
            <div className="flex-1">
              <h2 className={`${sizeClasses.heading} font-semibold`}>Infomage</h2>
              <p className={`text-gray-600 dark:text-gray-300 ${sizeClasses.textSm}`}>here to help</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`${sizeClasses.textXs} text-gray-600 dark:text-gray-300`}>Online</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/admin', '_blank')}
                className={`text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 ${sizeClasses.textXs}`}
              >
                Login
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className={`text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${sizeClasses.button}`}
              >
                <RotateCcw className={sizeClasses.icon} />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className={`h-[42rem] overflow-y-auto ${sizeClasses.padding} ${sizeClasses.spacing} bg-gray-50 dark:bg-gray-900`}>
          {messages.length === 0 && (
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Heart className={`${sizeClasses.icon} text-white dark:text-black`} />
              </div>
              <div className={`${bonkersColors ? bonkersColors.messageBg : 'bg-white dark:bg-gray-800'} rounded-2xl rounded-tl-md ${sizeClasses.padding} shadow-lg ${getMessageBubbleWidth()}`}>
                <div className={`text-gray-800 dark:text-gray-200 ${sizeClasses.text} leading-relaxed prose prose-sm dark:prose-invert max-w-none`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{welcomeData?.message || ""}</ReactMarkdown>
                </div>
                <span className={`${sizeClasses.textXs} text-gray-500 dark:text-gray-400 mt-2 block`}>Just now</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-4 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className={`w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Heart className={`${sizeClasses.icon} text-white dark:text-black`} />
                </div>
              )}
              
              <div
                className={`rounded-2xl ${sizeClasses.padding} shadow-lg ${getMessageBubbleWidth()} ${
                  msg.role === "user"
                    ? `${bonkersColors ? bonkersColors.userMessageBg : 'bg-black dark:bg-gray-700'} text-white rounded-tr-md`
                    : `${bonkersColors ? bonkersColors.messageBg : 'bg-white dark:bg-gray-800'} text-gray-800 dark:text-gray-200 rounded-tl-md`
                }`}
              >
                <div className={`${sizeClasses.text} leading-relaxed prose prose-sm dark:prose-invert max-w-none`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
                <span className={`${sizeClasses.textXs} mt-2 block ${
                  msg.role === "user" ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {formatTime(msg.timestamp)}
                </span>
                
                {/* Action Buttons for specific bot responses - exclude first message (greeting) */}
                {msg.role === "assistant" && msg.id !== messages[0]?.id && (
                  <div className={`${sizeClasses.spacing} mt-3`}>
                    {/* Admin Dashboard Button */}
                    {(msg.content.toLowerCase().includes("admin dashboard") || msg.content.toLowerCase().includes("admin access")) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full justify-start h-auto ${sizeClasses.padding} border-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-200`}
                        onClick={() => window.open("/admin-login", "_blank")}
                      >
                        <Settings className={`${sizeClasses.icon} mr-2 text-gray-600 dark:text-gray-300`} />
                        <div className="text-left">
                          <p className={`${sizeClasses.textSm} font-medium`}>Open Admin Dashboard</p>
                          <p className={`${sizeClasses.textXs} text-gray-500 dark:text-gray-400`}>Access content management system</p>
                        </div>
                      </Button>
                    )}
                    
                    {/* Standard action buttons - removed meeting scheduling */}
                    {(msg.content.toLowerCase().includes("download") || msg.content.toLowerCase().includes("contact")) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-full justify-start h-auto ${sizeClasses.padding} border-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-200`}
                          onClick={handleDownloadPDF}
                        >
                          <Download className={`${sizeClasses.icon} mr-2 text-gray-600 dark:text-gray-300`} />
                          <div className="text-left">
                            <p className={`${sizeClasses.textSm} font-medium`}>Download Service Guide</p>
                            <p className={`${sizeClasses.textXs} text-gray-500 dark:text-gray-400`}>Complete overview of our offerings</p>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-full justify-start h-auto ${sizeClasses.padding} border-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-200`}
                          onClick={() => setShowContactModal(true)}
                        >
                          <Phone className={`${sizeClasses.icon} mr-2 text-gray-600 dark:text-gray-300`} />
                          <div className="text-left">
                            <p className={`${sizeClasses.textSm} font-medium`}>Get Contact Information</p>
                            <p className={`${sizeClasses.textXs} text-gray-500 dark:text-gray-400`}>Phone, email, and office details</p>
                          </div>
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Heart className={`${sizeClasses.icon} text-white dark:text-black`} />
              </div>
              <div className={`${bonkersColors ? bonkersColors.messageBg : 'bg-white dark:bg-gray-800'} rounded-2xl rounded-tl-md ${sizeClasses.padding} shadow-lg ${getMessageBubbleWidth()}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <CardContent className={`${sizeClasses.padding} ${bonkersColors ? bonkersColors.inputBg : 'bg-white dark:bg-gray-800'} rounded-b-lg shadow-sm`}>
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${sizeClasses.input} rounded-xl ${bonkersColors ? bonkersColors.buttonBg : 'bg-gray-50 dark:bg-gray-700'} border-0 shadow-inner text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
                style={{ fontSize: interfaceSize === 'extra-large' ? '1.25rem' : interfaceSize === 'large' ? '1.125rem' : '1rem' }}
              />

            </div>
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className={`${sizeClasses.button} ${bonkersColors ? bonkersColors.buttonBg : 'bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'} rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              <Send className={sizeClasses.icon} />
            </Button>
          </form>
          
          {/* Quick Actions - Smart suggestions first, then general actions, limited to 3 total */}
          {(() => {
            // Combine smart suggestions and general actions, prioritizing smart suggestions
            const smartActions = smartSuggestions.map(suggestion => ({
              ...suggestion,
              isSmartSuggestion: true
            }));
            
            const generalActions = quickActions.filter(action => 
              !smartSuggestions.some(smart => smart.id === action.id)
            ).map(action => ({
              ...action,
              isSmartSuggestion: false
            }));
            
            // Take up to 3 actions total, prioritizing smart suggestions
            const displayActions = [...smartActions, ...generalActions].slice(0, 3);
            
            return displayActions.length > 0 ? (
              <div className={`mt-4`}>
                {smartActions.length > 0 && (
                  <div className={`${sizeClasses.textXs} text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1`}>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Suggestions based on your conversation
                  </div>
                )}
                <div className={`flex flex-wrap items-center gap-2`}>
                  {displayActions.map((action) => (
                    <Button
                      key={action.isSmartSuggestion ? `smart-${action.id}` : action.id}
                      variant="outline"
                      size="sm"
                      className={`${sizeClasses.textSm} rounded-full ${
                        action.isSmartSuggestion 
                          ? `border border-blue-200 dark:border-blue-800 ${bonkersColors ? bonkersColors.buttonBg : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'} text-blue-700 dark:text-blue-300`
                          : `border-0 ${bonkersColors ? bonkersColors.buttonBg : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`
                      } shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0`}
                      onClick={() => handleQuickMessage(action.message)}
                      title={action.isSmartSuggestion && 'relevanceScore' in action ? `Relevance: ${(action as any).relevanceScore}% - ${(action as any).reason}` : undefined}
                    >
                      {action.isSmartSuggestion ? '✨ ' : ''}{action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </CardContent>
      </Card>

      {/* Controls Section */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
        {/* Chat Width Control */}
        <div className="flex flex-col items-center space-y-2">
          <Label className={`${sizeClasses.textSm} font-medium text-gray-700 dark:text-gray-300`}>
            Chat Width
          </Label>
          <Select value={chatWidth} onValueChange={(value) => setChatWidth(value as "narrow" | "normal" | "wide" | "extra-wide")}>
            <SelectTrigger className="w-32 shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 dark:border-gray-600">
              <span className={sizeClasses.textSm}>
                {chatWidth === "narrow" ? "Narrow" : 
                 chatWidth === "wide" ? "Wide" : 
                 chatWidth === "extra-wide" ? "Extra Wide" : "Normal"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="narrow">Narrow</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="extra-wide">Extra Wide</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Text Size Control */}
        <div className="flex flex-col items-center space-y-2">
          <Label className={`${sizeClasses.textSm} font-medium text-gray-700 dark:text-gray-300`}>
            Text Size
          </Label>
          <Select value={interfaceSize} onValueChange={(value) => setInterfaceSize(value as "normal" | "large" | "extra-large")}>
            <SelectTrigger className="w-32 shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 dark:border-gray-600">
              <span className={sizeClasses.textSm}>
                {interfaceSize === "normal" ? "Normal" : 
                 interfaceSize === "large" ? "Large" : "Extra Large"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Theme Selector */}
        <div className="flex flex-col items-center space-y-2">
          <Label className={`${sizeClasses.textSm} font-medium text-gray-700 dark:text-gray-300`}>
            Theme
          </Label>
          <Select value={themeMode} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-32 shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 dark:border-gray-600">
              <span className={sizeClasses.textSm}>
                {themeMode === "light" ? "Light" : 
                 themeMode === "dark" ? "Dark" : "Bonkers"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="bonkers">Bonkers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
          </DialogHeader>
          {contactInfo && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{contactInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{contactInfo.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium">Business Hours</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{contactInfo.businessHours}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Modal */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Consultation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAppointmentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={appointmentForm.name}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={appointmentForm.email}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={appointmentForm.phone}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={appointmentForm.preferredDate}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, preferredDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Select 
                required 
                value={appointmentForm.preferredTime}
                onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, preferredTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                className="h-20 resize-none"
                value={appointmentForm.message}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Chat Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to clear all chat messages? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => resetChatMutation.mutate()}
              disabled={resetChatMutation.isPending}
              className="bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {resetChatMutation.isPending ? "Resetting..." : "Reset Chat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
