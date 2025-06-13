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
import { Moon, Sun, Send, Phone, Mail, MapPin, Clock, Download, Calendar, Mic, Heart, Settings, RotateCcw } from "lucide-react";
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
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [interfaceSize, setInterfaceSize] = useState<"normal" | "large" | "extra-large">("normal");
  
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
      setIsTyping(false);
      
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
      setMessage("");
    }
  };

  const handleQuickMessage = (quickMessage: string) => {
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

  const getSizeClasses = () => {
    switch (interfaceSize) {
      case "large":
        return {
          container: "max-w-6xl",
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
          container: "max-w-7xl",
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
          container: "max-w-4xl",
          text: "text-base",
          textSm: "text-sm",
          textXs: "text-xs",
          button: "h-10 px-4",
          input: "h-10",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Controls - Theme Toggle and Size Selector */}
      <div className="fixed top-6 right-6 z-50 flex items-center space-x-3">
        <Select value={interfaceSize} onValueChange={(value) => setInterfaceSize(value as "normal" | "large" | "extra-large")}>
          <Button variant="outline" className="shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 dark:border-gray-600">
            <Settings className={`${sizeClasses.icon} mr-2`} />
            <span className={sizeClasses.textSm}>
              {interfaceSize === "normal" ? "Normal" : 
               interfaceSize === "large" ? "Large" : "Extra Large"}
            </span>
          </Button>
          <SelectContent>
            <SelectItem value="normal">Normal Size</SelectItem>
            <SelectItem value="large">Large Size</SelectItem>
            <SelectItem value="extra-large">Extra Large Size</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="shadow-lg hover:shadow-xl transition-all duration-300 border-gray-300 dark:border-gray-600"
        >
          {theme === "dark" ? (
            <Sun className={`${sizeClasses.icon} text-gray-600 dark:text-gray-300`} />
          ) : (
            <Moon className={`${sizeClasses.icon} text-gray-600 dark:text-gray-300`} />
          )}
        </Button>
      </div>

      {/* Chat Container - Seamless with Shadow */}
      <Card className={`w-full ${sizeClasses.container} mx-auto shadow-2xl dark:shadow-gray-900/50 border-0 bg-white dark:bg-gray-800`}>
        {/* Chat Header */}
        <div className={`bg-white dark:bg-gray-800 ${sizeClasses.padding} text-black dark:text-white rounded-t-lg shadow-sm`}>
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
        <div className={`h-96 overflow-y-auto ${sizeClasses.padding} ${sizeClasses.spacing} bg-gray-50 dark:bg-gray-900`}>
          {messages.length === 0 && (
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Heart className={`${sizeClasses.icon} text-white dark:text-black`} />
              </div>
              <div className={`bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md ${sizeClasses.padding} shadow-lg max-w-xs`}>
                <p className={`text-gray-800 dark:text-gray-200 ${sizeClasses.text} leading-relaxed`}>
                  Welcome to Aran's all purpose home page. I'm not Aran. I'm just a silly little AI magician here to answer questions about Aran's products, services, designs, ideas, deep dark secrets, availability and contact information. You can ask me to list products and services currently on offer, request a meeting or to get in touch, or, if you know what you want to know about, just ask for that and I'll tell you what I have in my files that might be useful to you.
                </p>
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
                className={`rounded-2xl ${sizeClasses.padding} shadow-lg max-w-md ${
                  msg.role === "user"
                    ? "bg-black dark:bg-gray-700 text-white rounded-tr-md"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md"
                }`}
              >
                <p className={`${sizeClasses.text} leading-relaxed`}>{msg.content}</p>
                <span className={`${sizeClasses.textXs} mt-2 block ${
                  msg.role === "user" ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {formatTime(msg.timestamp)}
                </span>
                
                {/* Action Buttons for specific bot responses */}
                {msg.role === "assistant" && (
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
                    
                    {/* Standard action buttons */}
                    {(msg.content.toLowerCase().includes("download") || msg.content.toLowerCase().includes("contact") || msg.content.toLowerCase().includes("appointment")) && (
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
                          <Phone className="w-4 h-4 mr-2 text-gray-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium">Get Contact Information</p>
                            <p className="text-xs text-gray-500">Phone, email, and office details</p>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => setShowAppointmentModal(true)}
                        >
                          <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium">Schedule Consultation</p>
                            <p className="text-xs text-gray-500">Book a free 30-minute consultation</p>
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
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-black bg-opacity-10 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-black dark:text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 shadow-sm border border-gray-400 dark:border-gray-700">
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
        <CardContent className={`${sizeClasses.padding} bg-white dark:bg-gray-800 rounded-b-lg shadow-sm`}>
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${sizeClasses.input} pr-12 rounded-xl bg-gray-50 dark:bg-gray-700 border-0 shadow-inner ${sizeClasses.text}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sizeClasses.icon}`}
              >
                <Mic className={`${sizeClasses.icon} text-gray-400`} />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className={`${sizeClasses.button} bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              <Send className={sizeClasses.icon} />
            </Button>
          </form>
          
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className={`flex flex-wrap gap-2 mt-4 ${sizeClasses.spacing}`}>
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className={`${sizeClasses.textSm} rounded-full border-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-200`}
                  onClick={() => handleQuickMessage(action.message)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
