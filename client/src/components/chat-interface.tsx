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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle Button */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
      </Button>

      {/* Chat Container */}
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-gray-400 dark:border-gray-700">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-900 p-6 text-black dark:text-white rounded-t-lg border-b border-gray-400 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-black dark:text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Infomage</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">here to help</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Online</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-black bg-opacity-10 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-black dark:text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 shadow-sm border border-gray-400 dark:border-gray-700 max-w-xs">
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                  Welcome to Aran's all purpose home page. I'm not Aran. I'm just a silly little AI magician here to answer questions about Aran's products, services, designs, ideas, deep dark secrets, availability and contact information. You can ask me to list products and services currently on offer, request a meeting or to get in touch, or, if you know what you want to know about, just ask for that and I'll tell you what I have in my files that might be useful to you.
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">Just now</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-black bg-opacity-10 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-black dark:text-white" />
                </div>
              )}
              
              <div
                className={`rounded-2xl p-4 shadow-sm max-w-md ${
                  msg.role === "user"
                    ? "bg-black dark:bg-gray-700 text-white rounded-tr-md"
                    : "bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className={`text-xs mt-2 block ${
                  msg.role === "user" ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {formatTime(msg.timestamp)}
                </span>
                
                {/* Action Buttons for specific bot responses */}
                {msg.role === "assistant" && (
                  <div className="space-y-2 mt-3">
                    {/* Admin Dashboard Button */}
                    {(msg.content.toLowerCase().includes("admin dashboard") || msg.content.toLowerCase().includes("admin access")) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start h-auto p-3 border-gray-500 hover:border-gray-600"
                        onClick={() => window.open("/admin-login", "_blank")}
                      >
                        <Settings className="w-4 h-4 mr-2 text-gray-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Open Admin Dashboard</p>
                          <p className="text-xs text-gray-500">Access content management system</p>
                        </div>
                      </Button>
                    )}
                    
                    {/* Standard action buttons */}
                    {(msg.content.toLowerCase().includes("download") || msg.content.toLowerCase().includes("contact") || msg.content.toLowerCase().includes("appointment")) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start h-auto p-3"
                          onClick={handleDownloadPDF}
                        >
                          <Download className="w-4 h-4 mr-2 text-gray-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium">Download Service Guide</p>
                            <p className="text-xs text-gray-500">Complete overview of our offerings</p>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start h-auto p-3"
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
        <CardContent className="p-6 border-t border-gray-400 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="pr-10 rounded-xl bg-gray-50 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <Mic className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl shadow-md hover:shadow-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full"
              onClick={() => handleQuickMessage("Tell me about your services")}
            >
              Services Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full"
              onClick={() => handleQuickMessage("What are your pricing options?")}
            >
              Pricing
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full"
              onClick={() => handleQuickMessage("How can I contact support?")}
            >
              Support
            </Button>
          </div>
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
