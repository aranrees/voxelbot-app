import { useState } from "react";
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
  
  // Filtering state for Infomage Data tab
  const [dataFilter, setDataFilter] = useState<{
    type: "all" | "knowledge" | "instructions";
    sortBy: "recent" | "priority" | "active" | "type";
    status: "all" | "active" | "inactive";
  }>({
    type: "all",
    sortBy: "recent", 
    status: "all"
  });

  // Fetch documents
  const { data: allDocuments = [] } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
  });

  // Separate active and archived documents
  const documents = allDocuments.filter(doc => doc.isActive);
  const archivedDocuments = allDocuments.filter(doc => !doc.isActive);

  // Fetch file assets
  const { data: fileAssets = [] } = useQuery<FileAsset[]>({
    queryKey: ["/api/admin/files"],
  });

  // Fetch AI instructions
  const { data: aiInstructions = [] } = useQuery<AiInstruction[]>({
    queryKey: ["/api/admin/ai-instructions"],
  });

  // Fetch completed chats
  const { data: completedChats = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/completed-chats"],
  });

  // Fetch quick actions
  const { data: quickActions = [] } = useQuery<QuickAction[]>({
    queryKey: ["/api/admin/quick-actions"],
  });

  // Fetch standard responses
  const { data: standardResponses = [] } = useQuery<StandardResponse[]>({
    queryKey: ["/api/admin/standard-responses"],
  });

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
                Infomage Admin
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
        <Tabs defaultValue="infomage-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
            <TabsTrigger value="infomage-data" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Infomage Data</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Downloads</TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Quick Actions</TabsTrigger>
            <TabsTrigger value="standard-responses" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Standard Responses</TabsTrigger>
            <TabsTrigger value="chats" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Chat History</TabsTrigger>
          </TabsList>

          {/* Combined Infomage Data Tab - Knowledge + Instructions */}
          <TabsContent value="infomage-data" className="space-y-6">
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-type-filter">Type:</Label>
                  <Select value={dataFilter.type} onValueChange={(value: any) => setDataFilter({ ...dataFilter, type: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="knowledge">Knowledge Only</SelectItem>
                      <SelectItem value="instructions">Instructions Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-sort-filter">Sort by:</Label>
                  <Select value={dataFilter.sortBy} onValueChange={(value: any) => setDataFilter({ ...dataFilter, sortBy: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Updated</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="active">Active Status</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-status-filter">Status:</Label>
                  <Select value={dataFilter.status} onValueChange={(value: any) => setDataFilter({ ...dataFilter, status: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        resetDocumentForm();
                        setShowDocumentDialog(true);
                      }}
                      className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Dialog open={showInstructionDialog} onOpenChange={setShowInstructionDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        resetInstructionForm();
                        setShowInstructionDialog(true);
                      }}
                      className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Instruction
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-6">
              {(() => {
                // Combine documents and instructions into a single filtered list
                const knowledgeItems = documents
                  .filter(doc => dataFilter.status === "all" || (dataFilter.status === "active" ? doc.isActive : !doc.isActive))
                  .map(doc => ({ ...doc, itemType: "knowledge" as const, updatedAt: doc.updatedAt || doc.createdAt }));
                
                const instructionItems = aiInstructions
                  .filter(inst => dataFilter.status === "all" || (dataFilter.status === "active" ? inst.isActive : !inst.isActive))
                  .map(inst => ({ ...inst, itemType: "instructions" as const, updatedAt: inst.updatedAt || inst.createdAt }));
                
                let combinedItems = [...knowledgeItems, ...instructionItems];
                
                // Apply type filter
                if (dataFilter.type !== "all") {
                  combinedItems = combinedItems.filter(item => item.itemType === dataFilter.type);
                }
                
                // Apply sorting
                combinedItems.sort((a, b) => {
                  switch (dataFilter.sortBy) {
                    case "recent":
                      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
                    case "priority":
                      const aPriority = "priority" in a ? a.priority : 1;
                      const bPriority = "priority" in b ? b.priority : 1;
                      return bPriority - aPriority;
                    case "active":
                      return Number(b.isActive) - Number(a.isActive);
                    case "type":
                      return a.itemType.localeCompare(b.itemType);
                    default:
                      return 0;
                  }
                });
                
                return combinedItems.length > 0 ? combinedItems.map((item) => (
                  <Card key={`${item.itemType}-${item.id}`} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">
                            {item.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className={item.itemType === "knowledge" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
                              {item.itemType === "knowledge" ? "Knowledge" : "AI Instruction"}
                            </Badge>
                            {item.itemType === "knowledge" && (
                              <Badge variant="outline">{(item as any).type}</Badge>
                            )}
                            {item.itemType === "instructions" && (
                              <>
                                <Badge variant="outline">{(item as any).category || "general"}</Badge>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  Priority: {(item as any).priority}
                                </Badge>
                              </>
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => item.itemType === "knowledge" ? editDocument(item as any) : editInstruction(item as any)}
                            className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {item.itemType === "knowledge" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleDocumentArchiveMutation.mutate(item.id)}
                              disabled={toggleDocumentArchiveMutation.isPending}
                              className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteInstructionMutation.mutate(item.id)}
                              disabled={deleteInstructionMutation.isPending}
                              className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                        {item.itemType === "knowledge" ? (item as any).content : (item as any).instruction}
                      </p>
                      {item.itemType === "knowledge" && (item as any).tags && (item as any).tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(item as any).tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <CardContent className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No {dataFilter.type === "all" ? "data" : dataFilter.type} found with the current filters.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Knowledge Base Documents
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchivedDocuments(!showArchivedDocuments)}
                  className="border-gray-400 dark:border-gray-600"
                >
                  {showArchivedDocuments ? "Show Active" : "Show Archived"}
                </Button>
              </div>
              <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetDocumentForm} className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">
                      {editingDocument ? "Edit Document" : "Add New Document"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editingDocument) {
                      updateDocumentMutation.mutate({ id: editingDocument.id, data: documentForm });
                    } else {
                      createDocumentMutation.mutate(documentForm);
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={documentForm.title}
                        onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={documentForm.type}
                        onValueChange={(value: "product" | "instruction" | "faq" | "other") => setDocumentForm({ ...documentForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="instruction">Instruction</SelectItem>
                          <SelectItem value="faq">FAQ</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={documentForm.content}
                        onChange={(e) => setDocumentForm({ ...documentForm, content: e.target.value })}
                        rows={15}
                        className="min-h-[400px]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={documentForm.tags?.join(', ') || ''}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        placeholder="product, service, pricing"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={documentForm.isActive}
                        onCheckedChange={(checked) => setDocumentForm({ ...documentForm, isActive: checked })}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDocumentDialog(false)}
                        className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}
                        className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                      >
                        {editingDocument ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {!showArchivedDocuments ? (
                <>
                  {documents.map((document) => (
                    <Card key={document.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">
                              {document.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{document.type}</Badge>
                              {document.fileType === 'pdf' && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">PDF</Badge>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${document.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {document.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editDocument(document)}
                              className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleDocumentArchiveMutation.mutate(document.id)}
                              disabled={toggleDocumentArchiveMutation.isPending}
                              className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                          {document.content}
                        </p>
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {document.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {documents.length === 0 && (
                    <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                      <CardContent className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No documents yet. Add your first document to enhance the AI's knowledge base.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {archivedDocuments.map((archived) => (
                    <Card key={archived.id} className="border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center space-x-2">
                              <span>{archived.title}</span>
                              <Badge variant="secondary">Archived</Badge>
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{archived.type}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                Archived
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleDocumentArchiveMutation.mutate(archived.id)}
                              className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              disabled={toggleDocumentArchiveMutation.isPending}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                          {archived.content}
                        </p>
                        {archived.tags && archived.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {archived.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {archivedDocuments.length === 0 && (
                    <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                      <CardContent className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No archived documents. Deleted documents will appear here and can be restored.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

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
              <Dialog open={showInstructionDialog} onOpenChange={setShowInstructionDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetInstructionForm} className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add AI Instruction
                  </Button>
                </DialogTrigger>
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
                                {msg.role === 'user' ? 'User' : 'Infomage'} • {new Date(msg.timestamp).toLocaleTimeString()}
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

          <TabsContent value="standard-responses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Standard Responses
              </h3>
              <Dialog open={showStandardResponseDialog} onOpenChange={setShowStandardResponseDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetStandardResponseForm} className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Standard Response
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">
                      {editingStandardResponse ? "Edit Standard Response" : "Add Standard Response"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = {
                      ...standardResponseForm,
                      keywords: standardResponseForm.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
                    };
                    if (editingStandardResponse) {
                      updateStandardResponseMutation.mutate({ id: editingStandardResponse.id, data: formData });
                    } else {
                      createStandardResponseMutation.mutate(formData);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={standardResponseForm.title}
                        onChange={(e) => setStandardResponseForm({ ...standardResponseForm, title: e.target.value })}
                        placeholder="e.g., Pricing Information"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questionType">Question Type</Label>
                      <Select
                        value={standardResponseForm.questionType}
                        onValueChange={(value) => setStandardResponseForm({ ...standardResponseForm, questionType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="scheduling">Scheduling</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="response">Response</Label>
                      <Textarea
                        id="response"
                        value={standardResponseForm.response}
                        onChange={(e) => setStandardResponseForm({ ...standardResponseForm, response: e.target.value })}
                        placeholder="Enter the standard response text..."
                        required
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={standardResponseForm.keywords}
                        onChange={(e) => setStandardResponseForm({ ...standardResponseForm, keywords: e.target.value })}
                        placeholder="e.g., price, cost, pricing, fee"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority (1-10)</Label>
                        <Input
                          id="priority"
                          type="number"
                          min="1"
                          max="10"
                          value={standardResponseForm.priority}
                          onChange={(e) => setStandardResponseForm({ ...standardResponseForm, priority: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="isActive"
                          checked={standardResponseForm.isActive}
                          onCheckedChange={(checked) => setStandardResponseForm({ ...standardResponseForm, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowStandardResponseDialog(false)}
                        className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createStandardResponseMutation.isPending || updateStandardResponseMutation.isPending}
                        className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                      >
                        {editingStandardResponse ? "Update" : "Create"} Standard Response
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standardResponses.map((response) => (
                <Card key={response.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {response.title}
                        </CardTitle>
                        <div className="flex space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            response.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {response.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                            Priority: {response.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editStandardResponse(response)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteStandardResponseMutation.mutate(response.id)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                      {response.response.length > 100 ? `${response.response.substring(0, 100)}...` : response.response}
                    </p>
                    {response.keywords && response.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {response.keywords.slice(0, 3).map((keyword, index) => (
                          <span key={index} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            {keyword}
                          </span>
                        ))}
                        {response.keywords.length > 3 && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            +{response.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {standardResponses.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 col-span-full">
                  <CardContent className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No standard responses yet. Add pre-written responses for common questions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>


    </div>
  );
}