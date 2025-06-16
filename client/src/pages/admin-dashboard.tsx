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
  const [showPdfUploadDialog, setShowPdfUploadDialog] = useState(false);
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

  const [pdfUploadForm, setPdfUploadForm] = useState({
    title: "",
    type: "product" as const,
    tags: "",
    file: null as File | null
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

  const uploadPdfMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/documents/upload-pdf", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setShowPdfUploadDialog(false);
      setPdfUploadForm({ title: "", type: "product", tags: "", file: null });
      toast({ 
        title: "Success", 
        description: `PDF "${data.title}" uploaded successfully! ${data.pageCount} pages, ${Math.round(data.extractedTextLength / 1024)}KB text extracted.` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload PDF", variant: "destructive" });
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

  const handlePdfUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUploadForm.file || !pdfUploadForm.title) {
      toast({ title: "Error", description: "Please select a PDF file and enter a title", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('pdf', pdfUploadForm.file);
    formData.append('title', pdfUploadForm.title);
    formData.append('type', pdfUploadForm.type);
    formData.append('tags', pdfUploadForm.tags);

    uploadPdfMutation.mutate(formData);
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
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
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
            <TabsTrigger value="documents" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Documents</TabsTrigger>
            <TabsTrigger value="instructions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">AI Instructions</TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Quick Actions</TabsTrigger>
            <TabsTrigger value="availability" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Availability</TabsTrigger>
            <TabsTrigger value="standard-responses" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Standard Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Knowledge Base Documents
              </h3>
              <div className="flex space-x-2">
                <Dialog open={showPdfUploadDialog} onOpenChange={setShowPdfUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Upload PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600">
                    <DialogHeader>
                      <DialogTitle className="text-gray-800 dark:text-gray-200">
                        Upload PDF Document
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePdfUpload} className="space-y-4">
                      <div>
                        <Label htmlFor="pdf-title">Title</Label>
                        <Input
                          id="pdf-title"
                          value={pdfUploadForm.title}
                          onChange={(e) => setPdfUploadForm({ ...pdfUploadForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pdf-type">Type</Label>
                        <Select
                          value={pdfUploadForm.type}
                          onValueChange={(value) => setPdfUploadForm({ ...pdfUploadForm, type: value as any })}
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
                        <Label htmlFor="pdf-tags">Tags (comma-separated)</Label>
                        <Input
                          id="pdf-tags"
                          value={pdfUploadForm.tags}
                          onChange={(e) => setPdfUploadForm({ ...pdfUploadForm, tags: e.target.value })}
                          placeholder="product, service, manual"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pdf-file">PDF File</Label>
                        <Input
                          id="pdf-file"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setPdfUploadForm({ ...pdfUploadForm, file: e.target.files?.[0] || null })}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPdfUploadDialog(false)}
                          className="border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={uploadPdfMutation.isPending}
                          className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
                        >
                          {uploadPdfMutation.isPending ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
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
                          {document.fileType === 'pdf' && (
                            <Badge variant="outline" className="text-xs">PDF</Badge>
                          )}
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
                          onClick={() => {
                            setEditingDocument(document);
                            setDocumentForm({
                              title: document.title,
                              content: document.content,
                              type: document.type,
                              tags: document.tags || [],
                              isActive: document.isActive
                            });
                            setShowDocumentDialog(true);
                          }}
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

          {/* Additional tab content would go here */}
          <TabsContent value="instructions" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                AI Instructions functionality will be available in the next update.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Quick Actions functionality will be available in the next update.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Availability management will be available in the next update.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="standard-responses" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Standard Responses functionality will be available in the next update.
              </p>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}