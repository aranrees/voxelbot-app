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
import { Moon, Sun, Plus, Edit, Trash2, FileText, Brain, LogOut, MessageSquare, Zap, Heart } from "lucide-react";
import type { Document, AiInstruction, QuickAction, Availability, StandardResponse, InsertDocument, InsertAiInstruction, InsertQuickAction, InsertAvailability, InsertStandardResponse } from "@shared/schema";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showInstructionDialog, setShowInstructionDialog] = useState(false);
  const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showStandardResponseDialog, setShowStandardResponseDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingInstruction, setEditingInstruction] = useState<AiInstruction | null>(null);
  const [editingQuickAction, setEditingQuickAction] = useState<QuickAction | null>(null);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
  const [editingStandardResponse, setEditingStandardResponse] = useState<StandardResponse | null>(null);
  
  const [documentForm, setDocumentForm] = useState<InsertDocument>({
    title: "",
    content: "",
    type: "product",
    tags: [],
    isActive: true
  });
  
  const [instructionForm, setInstructionForm] = useState<InsertAiInstruction>({
    title: "",
    instruction: "",
    priority: 5,
    isActive: true
  });

  const [quickActionForm, setQuickActionForm] = useState<InsertQuickAction>({
    label: "",
    message: "",
    order: 1,
    isActive: true
  });

  const [availabilityForm, setAvailabilityForm] = useState<InsertAvailability>({
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: true,
    note: ""
  });

  const [standardResponseForm, setStandardResponseForm] = useState<InsertStandardResponse>({
    title: "",
    questionType: "general",
    response: "",
    keywords: [],
    isActive: true,
    priority: 5
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
  });

  // Fetch AI instructions
  const { data: aiInstructions = [] } = useQuery<AiInstruction[]>({
    queryKey: ["/api/admin/ai-instructions"],
  });

  // Fetch quick actions
  const { data: quickActions = [] } = useQuery<QuickAction[]>({
    queryKey: ["/api/admin/quick-actions"],
  });

  // Fetch availability
  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/admin/availability"],
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

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Success", description: "Document deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    },
  });

  // AI instruction mutations
  const createInstructionMutation = useMutation({
    mutationFn: async (data: InsertAiInstruction) => {
      const response = await apiRequest("POST", "/api/admin/ai-instructions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-instructions"] });
      setShowInstructionDialog(false);
      resetInstructionForm();
      toast({ title: "Success", description: "AI instruction created successfully!" });
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
      toast({ title: "Success", description: "AI instruction updated successfully!" });
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
      toast({ title: "Success", description: "AI instruction deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete AI instruction", variant: "destructive" });
    },
  });

  // Quick action mutations
  const createQuickActionMutation = useMutation({
    mutationFn: async (data: InsertQuickAction) => {
      const response = await apiRequest("POST", "/api/admin/quick-actions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quick-actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      setShowQuickActionDialog(false);
      resetQuickActionForm();
      toast({ title: "Success", description: "Quick action created successfully!" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      setShowQuickActionDialog(false);
      resetQuickActionForm();
      toast({ title: "Success", description: "Quick action updated successfully!" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      toast({ title: "Success", description: "Quick action deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quick action", variant: "destructive" });
    },
  });

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
      priority: 5,
      isActive: true
    });
    setEditingInstruction(null);
  };

  const resetQuickActionForm = () => {
    setQuickActionForm({
      label: "",
      message: "",
      order: 1,
      isActive: true
    });
    setEditingQuickAction(null);
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data: documentForm });
    } else {
      createDocumentMutation.mutate(documentForm);
    }
  };

  const handleInstructionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInstruction) {
      updateInstructionMutation.mutate({ id: editingInstruction.id, data: instructionForm });
    } else {
      createInstructionMutation.mutate(instructionForm);
    }
  };

  const handleQuickActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuickAction) {
      updateQuickActionMutation.mutate({ id: editingQuickAction.id, data: quickActionForm });
    } else {
      createQuickActionMutation.mutate(quickActionForm);
    }
  };

  const editDocument = (document: Document) => {
    setEditingDocument(document);
    setDocumentForm({
      title: document.title,
      content: document.content,
      type: document.type,
      tags: document.tags || [],
      isActive: document.isActive
    });
    setShowDocumentDialog(true);
  };

  const editInstruction = (instruction: AiInstruction) => {
    setEditingInstruction(instruction);
    setInstructionForm({
      title: instruction.title,
      instruction: instruction.instruction,
      priority: instruction.priority,
      isActive: instruction.isActive
    });
    setShowInstructionDialog(true);
  };

  const editQuickAction = (action: QuickAction) => {
    setEditingQuickAction(action);
    setQuickActionForm({
      label: action.label,
      message: action.message,
      order: action.order,
      isActive: action.isActive
    });
    setShowQuickActionDialog(true);
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setDocumentForm({ ...documentForm, tags });
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI chatbot's knowledge base and behavior
          </p>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
            <TabsTrigger value="documents" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Documents</TabsTrigger>
            <TabsTrigger value="instructions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">AI Instructions</TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Knowledge Base Documents
              </h3>
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
                  <form onSubmit={handleDocumentSubmit} className="space-y-4">
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
                        onValueChange={(value) => setDocumentForm({ ...documentForm, type: value })}
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
                        rows={8}
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
              {documents.map((document) => (
                <Card key={document.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                          <FileText className="w-5 h-5" />
                          <span>{document.title}</span>
                          <Badge variant={document.isActive ? "default" : "secondary"} className={document.isActive ? "bg-black text-white dark:bg-white dark:text-black" : ""}>
                            {document.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {document.type}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editDocument(document)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocumentMutation.mutate(document.id)}
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
                    Add Instruction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                  <DialogHeader>
                    <DialogTitle className="text-gray-800 dark:text-gray-200">
                      {editingInstruction ? "Edit AI Instruction" : "Add New AI Instruction"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInstructionSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="inst-title">Title</Label>
                      <Input
                        id="inst-title"
                        value={instructionForm.title}
                        onChange={(e) => setInstructionForm({ ...instructionForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="inst-content">Instruction</Label>
                      <Textarea
                        id="inst-content"
                        value={instructionForm.instruction}
                        onChange={(e) => setInstructionForm({ ...instructionForm, instruction: e.target.value })}
                        rows={6}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority (1-10, higher is more important)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="10"
                        value={instructionForm.priority}
                        onChange={(e) => setInstructionForm({ ...instructionForm, priority: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="inst-active"
                        checked={instructionForm.isActive}
                        onCheckedChange={(checked) => setInstructionForm({ ...instructionForm, isActive: checked })}
                      />
                      <Label htmlFor="inst-active">Active</Label>
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
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                          <Brain className="w-5 h-5" />
                          <span>{instruction.title}</span>
                          <Badge variant={instruction.isActive ? "default" : "secondary"} className={instruction.isActive ? "bg-black text-white dark:bg-white dark:text-black" : ""}>
                            {instruction.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="border-gray-400 dark:border-gray-600">
                            Priority: {instruction.priority}
                          </Badge>
                        </CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editInstruction(instruction)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInstructionMutation.mutate(instruction.id)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">
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
                      No AI instructions yet. Add instructions to customize the AI's behavior.
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
                      {editingQuickAction ? "Edit Quick Action" : "Add Quick Action"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleQuickActionSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">Button Label</Label>
                      <Input
                        id="label"
                        value={quickActionForm.label}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, label: e.target.value })}
                        placeholder="e.g., Product Info"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message to Send</Label>
                      <Textarea
                        id="message"
                        value={quickActionForm.message}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, message: e.target.value })}
                        placeholder="e.g., Can you tell me about your products and services?"
                        required
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        type="number"
                        min="1"
                        value={quickActionForm.order}
                        onChange={(e) => setQuickActionForm({ ...quickActionForm, order: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={quickActionForm.isActive}
                        onCheckedChange={(checked) => setQuickActionForm({ ...quickActionForm, isActive: checked })}
                      />
                      <Label htmlFor="active">Active</Label>
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
                        {editingQuickAction ? "Update" : "Create"} Quick Action
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {quickActions.map((action) => (
                <Card key={action.id} className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        <CardTitle className="text-lg text-gray-800 dark:text-gray-200">{action.label}</CardTitle>
                        <Badge variant={action.isActive ? "default" : "secondary"} className={action.isActive ? "bg-black text-white dark:bg-white dark:text-black" : ""}>
                          {action.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => editQuickAction(action)}
                          size="sm"
                          variant="outline"
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteQuickActionMutation.mutate(action.id)}
                          size="sm"
                          variant="outline"
                          disabled={deleteQuickActionMutation.isPending}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Message:</strong> {action.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      Order: {action.order} | Created: {new Date(action.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {quickActions.length === 0 && (
                <Card className="border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <CardContent className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No quick actions yet. Add quick action buttons to help users start conversations.
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