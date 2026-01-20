import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Plus, Edit, Trash2, FileText, Brain, LogOut, MessageSquare, Zap, Heart, Upload, Download, Image, File, Calendar, Settings, RotateCcw } from "lucide-react";
import type { Document, AiInstruction, QuickAction, StandardResponse, InsertDocument, InsertAiInstruction, InsertQuickAction, InsertStandardResponse, FileAsset, InsertFileAsset } from "@shared/schema";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [showInstructionDialog, setShowInstructionDialog] = useState(false);
  const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
  const [showStandardResponseDialog, setShowStandardResponseDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingInstruction, setEditingInstruction] = useState<AiInstruction | null>(null);
  const [editingQuickAction, setEditingQuickAction] = useState<QuickAction | null>(null);
  const [editingStandardResponse, setEditingStandardResponse] = useState<StandardResponse | null>(null);

  const [quickActionForm, setQuickActionForm] = useState<{
    label: string;
    message: string;
    contextKeywords?: string[];
    contextType?: string;
    suggestionWeight?: number;
    isActive: boolean;
  }>({
    label: "",
    message: "",
    contextKeywords: [],
    contextType: "general",
    suggestionWeight: 5,
    isActive: true
  });



  const [standardResponseForm, setStandardResponseForm] = useState<{
    title: string;
    questionType: string;
    response: string;
    keywords: string;
    priority: number;
    isActive: boolean;
  }>({
    title: "",
    questionType: "general",
    response: "",
    keywords: "",
    priority: 1,
    isActive: true
  });

  const [documentForm, setDocumentForm] = useState<{
    title: string;
    content: string;
    type: "product" | "instruction" | "faq" | "other";
    tags: string[];
    isActive: boolean;
  }>({
    title: "",
    content: "",
    type: "product",
    tags: [],
    isActive: true
  });

  const [fileUploadForm, setFileUploadForm] = useState({
    title: "",
    description: "",
    tags: "",
    isPublic: true,
    file: null as File | null
  });

  const [instructionForm, setInstructionForm] = useState<{
    title: string;
    instruction: string;
    priority: number;
    category: "general" | "tone" | "behavior" | "knowledge" | "restrictions";
    isActive: boolean;
  }>({
    title: "",
    instruction: "",
    priority: 1,
    category: "general",
    isActive: true
  });


  const [showArchivedDocuments, setShowArchivedDocuments] = useState(false);
  
  // Filtering state for Data tab
  const [dataFilter, setDataFilter] = useState<{
    type: "all" | "knowledge" | "instructions";
    sortBy: "recent" | "priority" | "active" | "type";
    status: "all" | "active" | "inactive";
  }>({
    type: "all",
    sortBy: "recent", 
    status: "all"
  });

  // Button toggle states
  const [showDownloadButton, setShowDownloadButton] = useState(() => {
    const saved = localStorage.getItem('showDownloadButton');
    return saved !== null ? JSON.parse(saved) : false; // Default to false (disabled)
  });
  const [showContactButton, setShowContactButton] = useState(() => {
    const saved = localStorage.getItem('showContactButton');
    return saved !== null ? JSON.parse(saved) : true; // Default to true (enabled)
  });
  const [showCalendlyButton, setShowCalendlyButton] = useState(() => {
    const saved = localStorage.getItem('showCalendlyButton');
    return saved !== null ? JSON.parse(saved) : false; // Default to false (disabled)
  });
  const [calendlyUrl, setCalendlyUrl] = useState(() => {
    return localStorage.getItem('calendlyUrl') || '';
  });

  // Contact info form state
  const [contactForm, setContactForm] = useState({
    phone: "(555) 123-4567",
    email: "info@company.com",
    address: "123 Business St, Suite 100\nCity, State 12345",
    businessHours: "Mon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM"
  });

  // State for bot config
  const [currentBotConfig, setCurrentBotConfig] = useState<any>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configJsonText, setConfigJsonText] = useState("");

  // Fetch contact info
  const { data: contactInfoData } = useQuery<{
    phone: string;
    email: string;
    address: string;
    businessHours: string;
  }>({
    queryKey: ["/api/contact"],
    enabled: !!user,
  });

  // Update contact form when data loads
  useEffect(() => {
    if (contactInfoData) {
      setContactForm({
        phone: contactInfoData.phone || "(555) 123-4567",
        email: contactInfoData.email || "info@company.com",
        address: contactInfoData.address || "123 Business St, Suite 100\nCity, State 12345",
        businessHours: contactInfoData.businessHours || "Mon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM"
      });
    }
  }, [contactInfoData]);

  // Fetch documents
  const { data: allDocuments = [] } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Separate active and archived documents
  const documents = allDocuments.filter(doc => doc.isActive);
  const archivedDocuments = allDocuments.filter(doc => !doc.isActive);

  // Fetch file assets
  const { data: fileAssets = [] } = useQuery<FileAsset[]>({
    queryKey: ["/api/admin/files"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch AI instructions
  const { data: aiInstructions = [] } = useQuery<AiInstruction[]>({
    queryKey: ["/api/admin/ai-instructions"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch completed chats
  const { data: completedChats = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/completed-chats"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch quick actions
  const { data: quickActions = [] } = useQuery<QuickAction[]>({
    queryKey: ["/api/admin/quick-actions"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch standard responses
  const { data: standardResponses = [] } = useQuery<StandardResponse[]>({
    queryKey: ["/api/admin/standard-responses"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Query for current bot config
  const { data: botConfigData } = useQuery({
    queryKey: ["/api/bot-config"],
    enabled: !!user,
  });

  // Update currentBotConfig when data loads
  useEffect(() => {
    if (botConfigData) {
      setCurrentBotConfig(botConfigData);
    }
  }, [botConfigData]);

  // Query for config history
  const { data: configHistory, isLoading: configHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/bot-config/history"],
    enabled: !!user,
  });

  // Fetch waitlist signups
  const { data: waitlistData } = useQuery<{ signups: any[] }>({
    queryKey: ["/api/admin/waitlist"],
    enabled: !!user,
  });
  const waitlistSignups = waitlistData?.signups || [];

  // Mutation for uploading config
  const uploadConfigMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const config = JSON.parse(text);
      
      const response = await apiRequest("POST", "/api/bot-config/upload", {
        version: config.version,
        configJson: config
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config/history"] });
      setConfigFile(null);
      toast({
        title: "Success",
        description: "Bot configuration updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload configuration",
        variant: "destructive"
      });
    }
  });

  // Mutation for rollback
  const rollbackMutation = useMutation({
    mutationFn: async (configId: number) => {
      const response = await apiRequest("POST", `/api/bot-config/rollback/${configId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config/history"] });
      toast({
        title: "Success",
        description: "Rolled back to previous configuration"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rollback configuration",
        variant: "destructive"
      });
    }
  });

  // Bot config handler functions
  const handleDownloadConfig = () => {
    if (!currentBotConfig) {
      toast({
        title: "Error",
        description: "No configuration available to download",
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([JSON.stringify(currentBotConfig, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voxelbot-config-${currentBotConfig.version || "current"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfigFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfigFile(file);
    }
  };

  const handleUploadConfig = () => {
    if (configFile) {
      uploadConfigMutation.mutate(configFile);
    }
  };

  const handleRollback = (configId: number) => {
    if (confirm("Are you sure you want to rollback to this configuration version?")) {
      rollbackMutation.mutate(configId);
    }
  };

  // Mutation for saving edited config
  const saveEditedConfigMutation = useMutation({
    mutationFn: async (editedJson: string) => {
      const parsed = JSON.parse(editedJson);
      
      const response = await apiRequest("POST", "/api/bot-config/upload", {
        version: parsed.version,
        configJson: parsed
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot-config/history"] });
      setIsEditingConfig(false);
      toast({
        title: "Success",
        description: "Configuration updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid JSON or failed to save",
        variant: "destructive"
      });
    }
  });

  const handleEditConfig = () => {
    if (currentBotConfig) {
      setConfigJsonText(JSON.stringify(currentBotConfig, null, 2));
      setIsEditingConfig(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingConfig(false);
    setConfigJsonText("");
  };

  const handleSaveEdit = () => {
    try {
      JSON.parse(configJsonText);
      saveEditedConfigMutation.mutate(configJsonText);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please fix JSON syntax errors before saving",
        variant: "destructive"
      });
    }
  };

  // Document mutations
  const createDocumentMutation = useMutation({
    mutationFn: async (data: InsertDocument) => {
      const response = await apiRequest("POST", "/api/admin/documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setShowDocumentDialog(false);
      resetDocumentForm();
      toast({ title: "Success", description: "Document created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create document", variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDocument> }) => {
      const response = await apiRequest("PUT", `/api/admin/documents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setShowDocumentDialog(false);
      resetDocumentForm();
      toast({ title: "Success", description: "Document updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    },
  });

  const toggleDocumentArchiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/documents/${id}/toggle-archive`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Success", description: data.message });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to toggle document archive", variant: "destructive" });
    },
  });

  const restoreDocumentMutation = useMutation({
    mutationFn: async (archivedId: number) => {
      const response = await apiRequest("POST", `/api/admin/documents/archived/${archivedId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents/archived"] });
      toast({ title: "Success", description: "Document restored successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore document", variant: "destructive" });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/admin/files/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      setShowFileUploadDialog(false);
      setFileUploadForm({ title: "", description: "", tags: "", isPublic: true, file: null });
      toast({ 
        title: "Success", 
        description: `File "${data.title}" uploaded successfully! Available for client download.` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/files/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      toast({ title: "Success", description: "File deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    },
  });

  // AI Instruction mutations
  const createInstructionMutation = useMutation({
    mutationFn: async (data: InsertAiInstruction) => {
      const response = await apiRequest("POST", "/api/admin/ai-instructions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-instructions"] });
      setShowInstructionDialog(false);
      resetInstructionForm();
      toast({ title: "Success", description: "AI Instruction created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create AI instruction", variant: "destructive" });
    },
  });

  const updateInstructionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAiInstruction> }) => {
      const response = await apiRequest("PUT", `/api/admin/ai-instructions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-instructions"] });
      setShowInstructionDialog(false);
      resetInstructionForm();
      toast({ title: "Success", description: "AI Instruction updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update AI instruction", variant: "destructive" });
    },
  });

  const deleteInstructionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/ai-instructions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-instructions"] });
      toast({ title: "Success", description: "AI Instruction deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete AI instruction", variant: "destructive" });
    },
  });

  // Quick Action mutations
  const createQuickActionMutation = useMutation({
    mutationFn: async (data: InsertQuickAction) => {
      const response = await apiRequest("POST", "/api/admin/quick-actions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-actions"] });
      setShowQuickActionDialog(false);
      resetQuickActionForm();
      toast({ title: "Success", description: "Quick Action created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create quick action", variant: "destructive" });
    },
  });

  const updateQuickActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertQuickAction> }) => {
      const response = await apiRequest("PUT", `/api/admin/quick-actions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-actions"] });
      setShowQuickActionDialog(false);
      resetQuickActionForm();
      toast({ title: "Success", description: "Quick Action updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update quick action", variant: "destructive" });
    },
  });

  const deleteQuickActionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/quick-actions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-actions"] });
      toast({ title: "Success", description: "Quick Action deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quick action", variant: "destructive" });
    },
  });

  // Contact Info mutation
  const updateContactInfoMutation = useMutation({
    mutationFn: async (data: { phone: string; email: string; address: string; businessHours: string }) => {
      const response = await apiRequest("PUT", "/api/admin/contact", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({ title: "Success", description: "Contact information updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contact information", variant: "destructive" });
    },
  });

  // Standard Response mutations
  const createStandardResponseMutation = useMutation({
    mutationFn: async (data: InsertStandardResponse) => {
      const response = await apiRequest("POST", "/api/admin/standard-responses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standard-responses"] });
      setShowStandardResponseDialog(false);
      resetStandardResponseForm();
      toast({ title: "Success", description: "Standard Response created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create standard response", variant: "destructive" });
    },
  });

  const updateStandardResponseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertStandardResponse> }) => {
      const response = await apiRequest("PUT", `/api/admin/standard-responses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standard-responses"] });
      setShowStandardResponseDialog(false);
      resetStandardResponseForm();
      toast({ title: "Success", description: "Standard Response updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update standard response", variant: "destructive" });
    },
  });

  const deleteStandardResponseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/standard-responses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/standard-responses"] });
      toast({ title: "Success", description: "Standard Response deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete standard response", variant: "destructive" });
    },
  });

  // Helper functions
  const resetDocumentForm = () => {
    setDocumentForm({
      title: "",
      content: "",
      type: "product",
      tags: [],
      isActive: true
    });
    setEditingDocument(null);
  };

  const resetInstructionForm = () => {
    setInstructionForm({
      title: "",
      instruction: "",
      priority: 1,
      category: "general",
      isActive: true
    });
    setEditingInstruction(null);
  };

  const editDocument = (document: Document) => {
    setDocumentForm({
      title: document.title,
      content: document.content,
      type: document.type as "product" | "instruction" | "faq" | "other",
      tags: document.tags || [],
      isActive: document.isActive
    });
    setEditingDocument(document);
    setShowDocumentDialog(true);
  };

  const editInstruction = (instruction: AiInstruction) => {
    setInstructionForm({
      title: instruction.title,
      instruction: instruction.instruction,
      priority: instruction.priority,
      category: (instruction.category || "general") as "general" | "tone" | "behavior" | "knowledge" | "restrictions",
      isActive: instruction.isActive
    });
    setEditingInstruction(instruction);
    setShowInstructionDialog(true);
  };

  const resetQuickActionForm = () => {
    setQuickActionForm({
      label: "",
      message: "",
      contextKeywords: [],
      contextType: "general",
      suggestionWeight: 5,
      isActive: true
    });
    setEditingQuickAction(null);
  };

  const editQuickAction = (action: QuickAction) => {
    setQuickActionForm({
      label: action.label,
      message: action.message,
      contextKeywords: action.contextKeywords || [],
      contextType: action.contextType || "general",
      suggestionWeight: action.suggestionWeight || 5,
      isActive: action.isActive
    });
    setEditingQuickAction(action);
    setShowQuickActionDialog(true);
  };



  const resetStandardResponseForm = () => {
    setStandardResponseForm({
      title: "",
      questionType: "general",
      response: "",
      keywords: "",
      priority: 1,
      isActive: true
    });
    setEditingStandardResponse(null);
  };

  const editStandardResponse = (response: StandardResponse) => {
    setStandardResponseForm({
      title: response.title,
      questionType: response.questionType,
      response: response.response,
      keywords: response.keywords?.join(', ') || "",
      priority: response.priority,
      isActive: response.isActive
    });
    setEditingStandardResponse(response);
    setShowStandardResponseDialog(true);
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setDocumentForm({ ...documentForm, tags });
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploadForm.file || !fileUploadForm.title) {
      toast({ title: "Error", description: "Please select a file and enter a title", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileUploadForm.file);
    formData.append('title', fileUploadForm.title);
    formData.append('description', fileUploadForm.description);
    formData.append('tags', fileUploadForm.tags);
    formData.append('isPublic', fileUploadForm.isPublic.toString());

    uploadFileMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-400 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Patavox Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/", "_blank")}
                className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                View Chat
              </Button>
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">Settings</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const currentPassword = formData.get('currentPassword') as string;
                    const newPassword = formData.get('newPassword') as string;
                    const confirmPassword = formData.get('confirmPassword') as string;
                    
                    if (newPassword !== confirmPassword) {
                      toast({
                        title: "Password mismatch",
                        description: "New passwords do not match",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (newPassword.length < 6) {
                      toast({
                        title: "Password too short",
                        description: "Password must be at least 6 characters",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    try {
                      const response = await apiRequest('POST', '/api/admin/change-password', {
                        currentPassword,
                        newPassword
                      });
                      
                      toast({
                        title: "Password changed",
                        description: "Your password has been updated successfully",
                      });
                      e.currentTarget.reset();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to change password",
                        variant: "destructive",
                      });
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        className="border-gray-400 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        className="border-gray-400 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="border-gray-400 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="submit"
                        className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                      >
                        Change Password
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                size="sm"
                className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="bot-config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
            <TabsTrigger value="bot-config" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Bot Config</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Downloads</TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Quick Actions</TabsTrigger>
            <TabsTrigger value="contact-info" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Contact Info</TabsTrigger>
            <TabsTrigger value="waitlist" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Waitlist</TabsTrigger>
            <TabsTrigger value="chats" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Chat History</TabsTrigger>
          </TabsList>

          {/* File Downloads Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Client Download Files
              </h3>
              <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">
                      Upload File for Client Downloads
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="file-title">Title</Label>
                      <Input
                        id="file-title"
                        value={fileUploadForm.title}
                        onChange={(e) => setFileUploadForm({ ...fileUploadForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="file-description">Description</Label>
                      <Textarea
                        id="file-description"
                        value={fileUploadForm.description}
                        onChange={(e) => setFileUploadForm({ ...fileUploadForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="file-tags">Tags (comma-separated)</Label>
                      <Input
                        id="file-tags"
                        value={fileUploadForm.tags}
                        onChange={(e) => setFileUploadForm({ ...fileUploadForm, tags: e.target.value })}
                        placeholder="manual, guide, brochure"
                      />
                    </div>
                    <div>
                      <Label htmlFor="file">File (PDF, Images)</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                        onChange={(e) => setFileUploadForm({ ...fileUploadForm, file: e.target.files?.[0] || null })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-public"
                        checked={fileUploadForm.isPublic}
                        onCheckedChange={(checked) => setFileUploadForm({ ...fileUploadForm, isPublic: checked })}
                      />
                      <Label htmlFor="is-public">Public download (visible to clients)</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFileUploadDialog(false)}
                        className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={uploadFileMutation.isPending}
                        className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                      >
                        {uploadFileMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fileAssets.map((file) => (
                <Card key={file.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {file.fileType === 'image' ? (
                            <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          ) : file.fileType === 'pdf' ? (
                            <FileText className="w-5 h-5 text-red-600" />
                          ) : (
                            <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {file.title}
                          </CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(file.fileSize / 1024)}KB • {file.downloadCount} downloads
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {file.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>{file.originalName}</span>
                      <span className={file.isPublic ? "text-green-600" : "text-yellow-600"}>
                        {file.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {fileAssets.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 col-span-full">
                  <CardContent className="text-center py-8">
                    <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No files uploaded yet. Add files for clients to download.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                AI Instructions
              </h3>
              <Button 
                onClick={() => {
                  resetInstructionForm();
                  setShowInstructionDialog(true);
                }} 
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add AI Instruction
              </Button>
            </div>

            <div className="grid gap-6">
              {aiInstructions.map((instruction) => (
                <Card key={instruction.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          {instruction.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{instruction.category}</Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Priority {instruction.priority}
                          </Badge>
                          <span className={`text-xs px-2 py-1 rounded ${instruction.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {instruction.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editInstruction(instruction)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInstructionMutation.mutate(instruction.id)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {instruction.instruction}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {aiInstructions.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No AI instructions yet. Add instructions to guide the AI's behavior and responses.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Waitlist Signups
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {waitlistSignups.length} signups
              </div>
            </div>

            {waitlistSignups.length > 0 ? (
              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interest</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {waitlistSignups.map((signup: any) => (
                          <tr key={signup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{signup.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              <a href={`mailto:${signup.email}`} className="text-blue-600 hover:underline">{signup.email}</a>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                {signup.position}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {signup.interestPrompt || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(signup.createdAt).toLocaleDateString()} {new Date(signup.createdAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                <CardContent className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No waitlist signups yet. Share your waitlist form to start collecting signups.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chats" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Completed Chat Sessions
              </h3>
            </div>

            <div className="grid gap-6">
              {completedChats.map((chat) => (
                <Card key={chat.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">
                          Chat Session {chat.sessionId.split('-').pop()}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{chat.messageCount} messages</span>
                          <span>{Math.round(chat.durationMs / 1000 / 60)} minutes</span>
                          <span>{new Date(chat.startTime).toLocaleDateString()} {new Date(chat.startTime).toLocaleTimeString()}</span>
                          <span className={`px-2 py-1 rounded text-xs ${chat.isNotified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {chat.isNotified ? 'Reviewed' : 'New'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const transcript = JSON.parse(chat.transcript);
                            const formattedTranscript = transcript.map((msg: any) => 
                              `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.role.toUpperCase()}: ${msg.content}`
                            ).join('\n\n');
                            
                            const blob = new Blob([formattedTranscript], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `chat-transcript-${chat.sessionId}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!chat.isNotified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await apiRequest("POST", `/api/admin/completed-chats/${chat.sessionId}/notify`);
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/completed-chats"] });
                                toast({ title: "Success", description: "Chat marked as reviewed" });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to mark as reviewed", variant: "destructive" });
                              }
                            }}
                            className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Chat Transcript</h4>
                      <div className="space-y-3">
                        {JSON.parse(chat.transcript).map((msg: any, index: number) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                              msg.role === 'user' 
                                ? 'bg-black text-white dark:bg-white dark:text-black' 
                                : 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-500'
                            }`}>
                              <div className="text-xs opacity-70 mb-1">
                                {msg.role === 'user' ? 'User' : 'VoxelBot'} • {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {completedChats.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No completed chat sessions yet. Chat transcripts will appear here after 10 minutes of inactivity.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Quick Action Buttons
              </h3>
              <Dialog open={showQuickActionDialog} onOpenChange={setShowQuickActionDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetQuickActionForm} className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quick Action
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">
                      {editingQuickAction ? "Edit Quick Action" : "Add New Quick Action"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editingQuickAction) {
                      updateQuickActionMutation.mutate({ id: editingQuickAction.id, data: quickActionForm });
                    } else {
                      createQuickActionMutation.mutate(quickActionForm);
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="action-label">Button Label</Label>
                      <Input
                        id="action-label"
                        value={quickActionForm.label}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, label: e.target.value })}
                        placeholder="Schedule Meeting"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="action-message">Message to Send</Label>
                      <Textarea
                        id="action-message"
                        value={quickActionForm.message}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, message: e.target.value })}
                        rows={3}
                        placeholder="I'd like to schedule a meeting..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="context-keywords">Context Keywords (comma-separated)</Label>
                      <Input
                        id="context-keywords"
                        value={quickActionForm.contextKeywords?.join(', ') || ''}
                        onChange={(e) => setQuickActionForm({ 
                          ...quickActionForm, 
                          contextKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                        })}
                        placeholder="meeting, appointment, schedule, calendar"
                      />
                      <p className="text-xs text-gray-500 mt-1">Keywords that trigger this suggestion</p>
                    </div>
                    <div>
                      <Label htmlFor="context-type">Context Type</Label>
                      <Select 
                        value={quickActionForm.contextType || 'general'} 
                        onValueChange={(value) => setQuickActionForm({ ...quickActionForm, contextType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select context type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="request">Request</SelectItem>
                          <SelectItem value="problem">Problem</SelectItem>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="scheduling">Scheduling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="suggestion-weight">Suggestion Weight (1-10)</Label>
                      <Input
                        id="suggestion-weight"
                        type="number"
                        min="1"
                        max="10"
                        value={quickActionForm.suggestionWeight || 5}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, suggestionWeight: parseInt(e.target.value) || 5 })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Higher weights appear more often in suggestions</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="action-active"
                        checked={quickActionForm.isActive}
                        onCheckedChange={(checked) => setQuickActionForm({ ...quickActionForm, isActive: checked })}
                      />
                      <Label htmlFor="action-active">Active</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowQuickActionDialog(false)}
                        className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createQuickActionMutation.isPending || updateQuickActionMutation.isPending}
                        className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                      >
                        {editingQuickAction ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Card key={action.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {action.label}
                        </CardTitle>
                        <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${action.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {action.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editQuickAction(action)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteQuickActionMutation.mutate(action.id)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                      {action.message}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Context:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          action.contextType === 'scheduling' ? 'bg-blue-100 text-blue-800' :
                          action.contextType === 'pricing' ? 'bg-green-100 text-green-800' :
                          action.contextType === 'problem' ? 'bg-red-100 text-red-800' :
                          action.contextType === 'question' ? 'bg-purple-100 text-purple-800' :
                          action.contextType === 'request' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.contextType || 'general'}
                        </span>
                        <span className="font-medium text-gray-600 dark:text-gray-400 ml-2">Weight:</span>
                        <span className="text-gray-700 dark:text-gray-300">{action.suggestionWeight || 5}/10</span>
                      </div>
                      {action.contextKeywords && action.contextKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">Keywords:</span>
                          {action.contextKeywords.slice(0, 3).map((keyword, index) => (
                            <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              {keyword}
                            </span>
                          ))}
                          {action.contextKeywords.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">+{action.contextKeywords.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {quickActions.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 col-span-full">
                  <CardContent className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No quick actions yet. Add buttons to help users quickly send common messages.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>


          <TabsContent value="contact-info" className="space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Contact Information Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Update the contact information that appears when customers click "Get Contact Information" in the chat.
              </p>
              
              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-800 dark:text-gray-200">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateContactInfoMutation.mutate(contactForm);
                  }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact-phone">Phone Number</Label>
                          <Input
                            id="contact-phone"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                            className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-email">Email Address</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="info@company.com"
                            className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="contact-address">Address</Label>
                        <Textarea
                          id="contact-address"
                          value={contactForm.address}
                          onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                          placeholder="123 Business St, Suite 100&#10;City, State 12345"
                          rows={2}
                          className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-hours">Business Hours</Label>
                        <Textarea
                          id="contact-hours"
                          value={contactForm.businessHours}
                          onChange={(e) => setContactForm({ ...contactForm, businessHours: e.target.value })}
                          placeholder="Mon-Fri: 9:00 AM - 6:00 PM&#10;Sat: 10:00 AM - 4:00 PM"
                          rows={2}
                          className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          type="submit"
                          disabled={updateContactInfoMutation.isPending}
                          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                        >
                          {updateContactInfoMutation.isPending ? "Saving..." : "Save Contact Info"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 mt-6">
                <CardHeader>
                  <CardTitle className="text-gray-800 dark:text-gray-200">Chat Button Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Download Service Guide Button</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Shows "Download Service Guide" button when AI mentions downloads
                          </p>
                        </div>
                        <Switch
                          checked={showDownloadButton}
                          onCheckedChange={(checked) => {
                            setShowDownloadButton(checked);
                            localStorage.setItem('showDownloadButton', JSON.stringify(checked));
                          }}
                          className="ml-4"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Get Contact Information Button</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Shows "Get Contact Information" button when AI mentions contact details
                          </p>
                        </div>
                        <Switch
                          checked={showContactButton}
                          onCheckedChange={(checked) => {
                            setShowContactButton(checked);
                            localStorage.setItem('showContactButton', JSON.stringify(checked));
                          }}
                          className="ml-4"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">Schedule a Meeting Button (Calendly)</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Shows "Schedule a Meeting" button when AI mentions scheduling, meeting, or appointment
                          </p>
                        </div>
                        <Switch
                          checked={showCalendlyButton}
                          onCheckedChange={(checked) => {
                            setShowCalendlyButton(checked);
                            localStorage.setItem('showCalendlyButton', JSON.stringify(checked));
                          }}
                          className="ml-4"
                        />
                      </div>
                    </div>

                    {showCalendlyButton && (
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <Label htmlFor="calendly-url" className="text-gray-800 dark:text-gray-200">Calendly URL</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                            Enter your Calendly scheduling link (e.g., https://calendly.com/your-username)
                          </p>
                          <Input
                            id="calendly-url"
                            value={calendlyUrl}
                            onChange={(e) => {
                              setCalendlyUrl(e.target.value);
                              localStorage.setItem('calendlyUrl', e.target.value);
                            }}
                            placeholder="https://calendly.com/your-username"
                            className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        {calendlyUrl && (
                          <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300">Calendly integration active</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Tip:</strong> Turn off download buttons if you have no files to offer. Manage downloadable files in the Downloads tab.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bot-config" className="space-y-6">
            <div className="max-w-4xl">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Bot Configuration Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upload a new JSON configuration file to update VoxelBot's behavior, knowledge base, and responses. 
                Download the current config to edit locally.
              </p>
              
              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-800 dark:text-gray-200">Current Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditingConfig ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Version</Label>
                          <Input 
                            value={currentBotConfig?.version || "No config loaded"}
                            readOnly
                            className="border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <Label>Last Updated</Label>
                          <Input 
                            value={currentBotConfig?.lastUpdated ? new Date(currentBotConfig.lastUpdated).toLocaleString() : "N/A"}
                            readOnly
                            className="border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          onClick={handleDownloadConfig}
                          variant="outline"
                          className="border-gray-400 dark:border-gray-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Current Config
                        </Button>
                        
                        <Button 
                          onClick={handleEditConfig}
                          variant="outline"
                          className="border-gray-400 dark:border-gray-600"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Config
                        </Button>
                      </div>
                      
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-4">
                        <Label htmlFor="config-upload">Upload New Configuration</Label>
                        <Input
                          id="config-upload"
                          type="file"
                          accept=".json"
                          onChange={handleConfigFileChange}
                          className="border-gray-400 dark:border-gray-600 mt-2"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Upload a JSON file to replace the current bot configuration. The bot will use the new config immediately.
                        </p>
                        
                        {configFile && (
                          <div className="mt-4">
                            <Button 
                              onClick={handleUploadConfig}
                              disabled={uploadConfigMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {uploadConfigMutation.isPending ? "Uploading..." : "Upload & Activate Config"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Edit Configuration JSON</Label>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Make changes and click Save to update
                          </div>
                        </div>
                        <Textarea
                          value={configJsonText}
                          onChange={(e) => setConfigJsonText(e.target.value)}
                          className="font-mono text-sm border-gray-400 dark:border-gray-600 min-h-[500px]"
                          placeholder="Edit JSON configuration..."
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          onClick={handleSaveEdit}
                          disabled={saveEditedConfigMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {saveEditedConfigMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        
                        <Button 
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="border-gray-400 dark:border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Changes will be validated and applied immediately. Invalid JSON will not be saved.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 mt-6">
                <CardHeader>
                  <CardTitle className="text-gray-800 dark:text-gray-200">Configuration History</CardTitle>
                </CardHeader>
                <CardContent>
                  {configHistoryLoading ? (
                    <div className="text-center py-4">Loading history...</div>
                  ) : configHistory && configHistory.length > 0 ? (
                    <div className="space-y-2">
                      {configHistory.map((config: any) => (
                        <div 
                          key={config.id}
                          className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded"
                        >
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              Version {config.version}
                              {config.isActive && (
                                <Badge className="ml-2 bg-green-600">Active</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Uploaded {new Date(config.uploadedAt).toLocaleString()} by {config.uploadedBy}
                            </div>
                          </div>
                          {!config.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRollback(config.id)}
                              disabled={rollbackMutation.isPending}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                      No configuration history found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* AI Instruction Dialog - mounted at top level so it's always accessible */}
      <Dialog open={showInstructionDialog} onOpenChange={setShowInstructionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              {editingInstruction ? "Edit AI Instruction" : "Add New AI Instruction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingInstruction) {
              updateInstructionMutation.mutate({ id: editingInstruction.id, data: instructionForm });
            } else {
              createInstructionMutation.mutate(instructionForm);
            }
          }} className="space-y-4">
            <div>
              <Label htmlFor="instruction-title">Title</Label>
              <Input
                id="instruction-title"
                value={instructionForm.title}
                onChange={(e) => setInstructionForm({ ...instructionForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="instruction-category">Category</Label>
              <Select
                value={instructionForm.category}
                onValueChange={(value) => setInstructionForm({ ...instructionForm, category: value as "general" | "tone" | "behavior" | "knowledge" | "restrictions" | "welcome" | "greeting" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="tone">Tone & Style</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="restrictions">Restrictions</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="greeting">Greeting (Auto-loads when page opens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instruction-priority">Priority (1-10)</Label>
              <Input
                id="instruction-priority"
                type="number"
                min="1"
                max="10"
                value={instructionForm.priority}
                onChange={(e) => setInstructionForm({ ...instructionForm, priority: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="instruction-content">Instruction</Label>
              <Textarea
                id="instruction-content"
                value={instructionForm.instruction}
                onChange={(e) => setInstructionForm({ ...instructionForm, instruction: e.target.value })}
                rows={8}
                className="min-h-[200px]"
                placeholder="Enter detailed instructions for the AI assistant..."
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="instruction-active"
                checked={instructionForm.isActive}
                onCheckedChange={(checked) => setInstructionForm({ ...instructionForm, isActive: checked })}
              />
              <Label htmlFor="instruction-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInstructionDialog(false)}
                className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInstructionMutation.isPending || updateInstructionMutation.isPending}
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
              >
                {editingInstruction ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}