
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Content, Comment } from '@/types';
import { FileText, BookOpen, ClipboardList, Upload, Download, ThumbsUp, ThumbsDown, MessageSquare, Check, Trash2, Calendar, Clock, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const UnitContent = () => {
  const { unitName } = useParams<{ unitName: string }>();
  const { user, classInstance } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('assignments');
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'assignment' | 'note' | 'pastPaper'>('assignment');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDeadline, setUploadDeadline] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Comments state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Confirmation dialog
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mark as done dialog
  const [markAsDoneDialogOpen, setMarkAsDoneDialogOpen] = useState(false);
  const [contentToMarkAsDone, setContentToMarkAsDone] = useState<Content | null>(null);
  const [markingAsDone, setMarkingAsDone] = useState(false);
  
  useEffect(() => {
    fetchContents();
  }, [unitName, activeTab]);
  
  const fetchContents = async () => {
    if (!unitName || !classInstance) return;
    
    setLoading(true);
    try {
      // Fetch content for the specific unit and content type
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          created_by
        `)
        .eq('class_instance_id', classInstance.id)
        .eq('unit_name', decodeURIComponent(unitName))
        .eq('content_type', activeTab === 'assignments' ? 'assignment' : activeTab === 'notes' ? 'note' : 'pastPaper')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Fetch creator names and like counts
        const contentsWithCreators = await Promise.all(data.map(async (content) => {
          // Get creator info
          const { data: creatorData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', content.created_by)
            .single();
          
          // Get likes
          const { data: likesData } = await supabase
            .from('likes')
            .select('*')
            .eq('content_id', content.id);
          
          // Get comments count
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact' })
            .eq('content_id', content.id);
            
          return {
            ...content,
            creator_name: creatorData?.full_name || 'Unknown',
            likes: likesData || [],
            comments_count: commentsCount || 0
          };
        }));
        
        setContents(contentsWithCreators);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpload = async () => {
    if (!user || !classInstance || !unitName) return;
    
    if (!uploadTitle.trim()) {
      toast({
        title: "Upload Failed",
        description: "Please provide a title",
        variant: "destructive"
      });
      return;
    }
    
    if (uploadType !== 'assignment' && !uploadFile) {
      toast({
        title: "Upload Failed",
        description: "File is required for notes and past papers",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    try {
      let filePath = null;
      
      // Upload file if provided
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const path = `${classInstance.id}/${unitName}/${uploadType}s/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('content-files')
          .upload(path, uploadFile);
          
        if (uploadError) throw uploadError;
        
        filePath = path;
      }
      
      // Add content to database
      const { data, error } = await supabase
        .from('content')
        .insert([{
          title: uploadTitle,
          description: uploadDescription,
          content_type: uploadType,
          file_path: filePath,
          class_instance_id: classInstance.id,
          unit_name: decodeURIComponent(unitName),
          created_by: user.id,
          deadline: uploadType === 'assignment' && uploadDeadline ? uploadDeadline : null
        }]);
      
      if (error) throw error;
      
      // Update user points
      const pointsToAdd = 
        uploadType === 'assignment' ? 10 :
        uploadType === 'note' ? 30 :
        uploadType === 'pastPaper' ? 25 : 0;
      
      if (pointsToAdd > 0) {
        const { error: pointsError } = await supabase
          .from('users')
          .update({ points: user.points + pointsToAdd })
          .eq('id', user.id);
          
        if (pointsError) throw pointsError;
        
        // Update local user state
        localStorage.setItem('strathUser', JSON.stringify({
          ...user,
          points: user.points + pointsToAdd
        }));
      }
      
      toast({
        title: "Upload Successful",
        description: `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} uploaded successfully`,
      });
      
      setUploadDialogOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadDeadline('');
      
      // Refresh contents
      fetchContents();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };
  
  const openCommentDialog = async (content: Content) => {
    setSelectedContent(content);
    setCommentDialogOpen(true);
    await fetchComments(content.id);
  };
  
  const fetchComments = async (contentId: number) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        // Fetch user names for each comment
        const commentsWithNames = await Promise.all(data.map(async (comment) => {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', comment.user_id)
            .single();
            
          return {
            ...comment,
            user_name: userData?.full_name || 'Unknown'
          };
        }));
        
        setComments(commentsWithNames);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!selectedContent || !user || !newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content_id: selectedContent.id,
          user_id: user.id,
          text: newComment
        }]);
      
      if (error) throw error;
      
      // Add points for commenting (0.1 points per comment)
      const { error: pointsError } = await supabase
        .from('users')
        .update({ points: user.points + 0.1 })
        .eq('id', user.id);
        
      if (pointsError) throw pointsError;
      
      // Update local user state
      localStorage.setItem('strathUser', JSON.stringify({
        ...user,
        points: user.points + 0.1
      }));
      
      setNewComment('');
      
      // Refresh comments
      await fetchComments(selectedContent.id);
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Comment error:', error);
      toast({
        title: "Comment Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const handleLike = async (content: Content, isLike: boolean) => {
    if (!user) return;
    
    try {
      // Check if user has already liked/disliked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('content_id', content.id)
        .eq('user_id', user.id)
        .single();
      
      if (existingLike) {
        // If the action is the same, remove the like/dislike
        if ((existingLike.is_like && isLike) || (!existingLike.is_like && !isLike)) {
          // Remove like/dislike
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('id', existingLike.id);
            
          if (deleteError) throw deleteError;
          
          // Adjust points (undo +1 or -1)
          const pointsAdjustment = existingLike.is_like ? -1 : 1;
          const { error: creatorPointsError } = await supabase
            .from('users')
            .update({ points: (content.created_by_points || 0) + pointsAdjustment })
            .eq('id', content.created_by);
            
          if (creatorPointsError) throw creatorPointsError;
        } else {
          // Change like to dislike or vice versa
          const { error: updateError } = await supabase
            .from('likes')
            .update({ is_like: isLike })
            .eq('id', existingLike.id);
            
          if (updateError) throw updateError;
          
          // Adjust points (from +1 to -1 or vice versa = 2 point difference)
          const pointsAdjustment = isLike ? 2 : -2;
          const { error: creatorPointsError } = await supabase
            .from('users')
            .update({ points: (content.created_by_points || 0) + pointsAdjustment })
            .eq('id', content.created_by);
            
          if (creatorPointsError) throw creatorPointsError;
        }
      } else {
        // Add new like/dislike
        const { error: insertError } = await supabase
          .from('likes')
          .insert([{
            content_id: content.id,
            user_id: user.id,
            is_like: isLike
          }]);
          
        if (insertError) throw insertError;
        
        // Adjust creator's points
        const pointsAdjustment = isLike ? 1 : -1;
        const { error: creatorPointsError } = await supabase
          .from('users')
          .update({ points: (content.created_by_points || 0) + pointsAdjustment })
          .eq('id', content.created_by);
          
        if (creatorPointsError) throw creatorPointsError;
      }
      
      // Refresh contents
      fetchContents();
      
      toast({
        title: isLike ? "Liked" : "Disliked",
        description: `You have ${isLike ? 'liked' : 'disliked'} this content`,
      });
    } catch (error) {
      console.error('Like/dislike error:', error);
      toast({
        title: "Error",
        description: "Failed to process your action",
        variant: "destructive"
      });
    }
  };
  
  const openDeleteDialog = (content: Content) => {
    setContentToDelete(content);
    setConfirmDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!contentToDelete || !user) return;
    
    // Check if user has permission (creator, admin, or super_admin)
    if (contentToDelete.created_by !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this content",
        variant: "destructive"
      });
      return;
    }
    
    setDeleting(true);
    try {
      // Delete file if exists
      if (contentToDelete.file_path) {
        const { error: storageError } = await supabase.storage
          .from('content-files')
          .remove([contentToDelete.file_path]);
          
        if (storageError) throw storageError;
      }
      
      // Delete comments
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('content_id', contentToDelete.id);
        
      if (commentsError) throw commentsError;
      
      // Delete likes
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('content_id', contentToDelete.id);
        
      if (likesError) throw likesError;
      
      // Delete content
      const { error: contentError } = await supabase
        .from('content')
        .delete()
        .eq('id', contentToDelete.id);
        
      if (contentError) throw contentError;
      
      setConfirmDeleteDialogOpen(false);
      
      // Refresh contents
      fetchContents();
      
      toast({
        title: "Content Deleted",
        description: "The content has been successfully deleted",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };
  
  const openMarkAsDoneDialog = (content: Content) => {
    setContentToMarkAsDone(content);
    setMarkAsDoneDialogOpen(true);
  };
  
  const handleMarkAsDone = async () => {
    if (!contentToMarkAsDone) return;
    
    setMarkingAsDone(true);
    try {
      // In a real app, we would update the content status in the database
      // For this demo, we'll just show a success message
      
      setMarkAsDoneDialogOpen(false);
      
      toast({
        title: "Marked as Done",
        description: "The assignment has been marked as completed",
      });
    } catch (error) {
      console.error('Mark as done error:', error);
      toast({
        title: "Action Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setMarkingAsDone(false);
    }
  };
  
  const handleDownload = async (content: Content) => {
    if (!content.file_path) {
      toast({
        title: "Download Failed",
        description: "No file available for download",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from('content-files')
        .download(content.file_path);
        
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = content.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your file is being downloaded",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive"
      });
    }
  };
  
  // Format deadline time remaining
  const getTimeRemaining = (deadline: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (deadlineDate <= now) {
      return "Past due";
    }
    
    return formatDistanceToNow(deadlineDate, { addSuffix: true });
  };
  
  if (!unitName) return null;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{decodeURIComponent(unitName)}</h1>
            <p className="text-muted-foreground">
              Manage and access all your unit resources
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}</DialogTitle>
                <DialogDescription>
                  Share resources with your classmates and earn points
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex gap-3">
                  <Button 
                    variant={uploadType === 'assignment' ? 'default' : 'outline'} 
                    onClick={() => setUploadType('assignment')}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Assignment
                  </Button>
                  <Button 
                    variant={uploadType === 'note' ? 'default' : 'outline'} 
                    onClick={() => setUploadType('note')}
                    className="flex-1"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Note
                  </Button>
                  <Button 
                    variant={uploadType === 'pastPaper' ? 'default' : 'outline'} 
                    onClick={() => setUploadType('pastPaper')}
                    className="flex-1"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Past Paper
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter a title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Enter a description (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">File {uploadType !== 'assignment' && "(required)"}</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>
                
                {uploadType === 'assignment' && (
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline (optional)</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={uploadDeadline}
                      onChange={(e) => setUploadDeadline(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="bg-muted rounded-md p-3 text-sm">
                  <div className="font-medium mb-1">Points you'll earn:</div>
                  <div>
                    {uploadType === 'assignment' ? '+10 points' :
                     uploadType === 'note' ? '+30 points' :
                     uploadType === 'pastPaper' ? '+25 points' : ''}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="assignments" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assignments">
              <FileText className="mr-2 h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="notes">
              <BookOpen className="mr-2 h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="pastPapers">
              <ClipboardList className="mr-2 h-4 w-4" />
              Past Papers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments">
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {contents.length > 0 ? (
                contents.map((content) => (
                  <Card key={content.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{content.title}</CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>{content.creator_name}</span>
                        </div>
                      </div>
                      <CardDescription>
                        {content.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {content.deadline && (
                        <div className="flex items-center text-sm mb-3">
                          <Calendar className="h-4 w-4 mr-1 text-orange-500" />
                          <span>Due: {format(new Date(content.deadline), "PPP")}</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1 text-red-500" />
                          <span>{getTimeRemaining(content.deadline)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openMarkAsDoneDialog(content)}
                          >
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            Mark as Done
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openCommentDialog(content)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                            Comments
                            {content.comments_count > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                {content.comments_count}
                              </span>
                            )}
                          </Button>
                        </div>
                        
                        {content.file_path && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(content)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, true)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && like.is_like)
                            ? "text-green-500"
                            : ""
                          }
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => like.is_like).length || 0}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, false)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && !like.is_like)
                            ? "text-red-500"
                            : ""
                          }
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => !like.is_like).length || 0}
                        </Button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          {format(new Date(content.created_at), "PPP")}
                        </span>
                        
                        {(content.created_by === user?.id || 
                          user?.role === 'admin' || 
                          user?.role === 'super_admin') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(content)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 bg-muted/50 rounded-lg">
                  {loading ? (
                    <p className="text-muted-foreground">Loading assignments...</p>
                  ) : (
                    <>
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Assignments Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to upload an assignment for this unit
                      </p>
                      <Button
                        onClick={() => {
                          setUploadType('assignment');
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Assignment
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {contents.length > 0 ? (
                contents.map((content) => (
                  <Card key={content.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{content.title}</CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>{content.creator_name}</span>
                        </div>
                      </div>
                      <CardDescription>
                        {content.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openCommentDialog(content)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                          Comments
                          {content.comments_count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                              {content.comments_count}
                            </span>
                          )}
                        </Button>
                        
                        {content.file_path && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(content)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, true)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && like.is_like)
                            ? "text-green-500"
                            : ""
                          }
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => like.is_like).length || 0}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, false)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && !like.is_like)
                            ? "text-red-500"
                            : ""
                          }
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => !like.is_like).length || 0}
                        </Button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          {format(new Date(content.created_at), "PPP")}
                        </span>
                        
                        {(content.created_by === user?.id || 
                          user?.role === 'admin' || 
                          user?.role === 'super_admin') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(content)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 bg-muted/50 rounded-lg">
                  {loading ? (
                    <p className="text-muted-foreground">Loading notes...</p>
                  ) : (
                    <>
                      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Notes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to upload notes for this unit
                      </p>
                      <Button
                        onClick={() => {
                          setUploadType('note');
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Notes
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pastPapers">
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              {contents.length > 0 ? (
                contents.map((content) => (
                  <Card key={content.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{content.title}</CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>{content.creator_name}</span>
                        </div>
                      </div>
                      <CardDescription>
                        {content.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openCommentDialog(content)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                          Comments
                          {content.comments_count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                              {content.comments_count}
                            </span>
                          )}
                        </Button>
                        
                        {content.file_path && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(content)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, true)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && like.is_like)
                            ? "text-green-500"
                            : ""
                          }
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => like.is_like).length || 0}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLike(content, false)}
                          className={
                            content.likes?.some(like => like.user_id === user?.id && !like.is_like)
                            ? "text-red-500"
                            : ""
                          }
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {content.likes?.filter(like => !like.is_like).length || 0}
                        </Button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">
                          {format(new Date(content.created_at), "PPP")}
                        </span>
                        
                        {(content.created_by === user?.id || 
                          user?.role === 'admin' || 
                          user?.role === 'super_admin') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(content)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 bg-muted/50 rounded-lg">
                  {loading ? (
                    <p className="text-muted-foreground">Loading past papers...</p>
                  ) : (
                    <>
                      <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Past Papers Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to upload a past paper for this unit
                      </p>
                      <Button
                        onClick={() => {
                          setUploadType('pastPaper');
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Past Paper
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Discuss this content with your classmates
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-80 overflow-y-auto space-y-4 py-4">
            {loadingComments ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <AvatarInitials name={comment.user_name || ''} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No comments yet</p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-3 pt-2">
            <AvatarInitials name={user?.full_name || ''} size="sm" />
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? "Posting..." : "Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mark as Done Dialog */}
      <Dialog open={markAsDoneDialogOpen} onOpenChange={setMarkAsDoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Done</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this assignment as done?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMarkAsDoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsDone}
              disabled={markingAsDone}
            >
              {markingAsDone ? "Processing..." : "Mark as Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UnitContent;
