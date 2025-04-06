
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Content, Comment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserRank } from '../lib/ranks';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Home, BookOpen, FileText, Calendar, ThumbsUp, ThumbsDown, 
  MessageSquare, Download, User, ArrowLeft, Trash2, 
  ExternalLink, Badge, AlertTriangle
} from 'lucide-react';

const UnitContent = () => {
  const { unitName } = useParams<{ unitName: string }>();
  const { user, classInstance, updateUserPoints } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all');
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch content for this unit
  useEffect(() => {
    const fetchUnitContent = async () => {
      if (!user || !classInstance || !unitName) return;
      
      try {
        setLoading(true);
        
        // Fetch content with creators information and counts
        const { data, error } = await supabase
          .from('content')
          .select(`
            *,
            user:created_by(id, full_name, profile_picture, points, role),
            comments:comments(count),
            likes:likes(count)
          `)
          .eq('class_instance_id', classInstance.id)
          .eq('unit_name', unitName);
        
        if (error) throw error;
        
        // Fetch likes for the current user to determine if they've liked/disliked each content
        const { data: userLikes, error: likesError } = await supabase
          .from('likes')
          .select('content_id, is_like')
          .eq('user_id', user.id);
        
        if (likesError) throw likesError;
        
        // Process the data to include comment counts and like status
        const processedData = (data || []).map((content: any) => {
          const commentsCount = content.comments?.length || 0;
          const likes = content.likes?.filter((like: any) => like.is_like) || [];
          const dislikes = content.likes?.filter((like: any) => !like.is_like) || [];
          
          // Check if the current user has liked or disliked this content
          const userLike = userLikes?.find((like) => like.content_id === content.id);
          
          return {
            ...content,
            comments_count: commentsCount,
            likes_count: likes.length,
            dislikes_count: dislikes.length,
            liked_by_user: userLike ? userLike.is_like : false,
            disliked_by_user: userLike ? !userLike.is_like : false
          };
        });
        
        setContents(processedData);
      } catch (error) {
        console.error('Error fetching unit content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load unit content',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUnitContent();
  }, [unitName, user, classInstance]);

  // Fetch comments when a content is selected
  useEffect(() => {
    if (!selectedContent) return;
    
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:user_id(id, full_name, profile_picture, role)
          `)
          .eq('content_id', selectedContent.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load comments',
          variant: 'destructive',
        });
      } finally {
        setLoadingComments(false);
      }
    };
    
    fetchComments();
  }, [selectedContent]);

  const handleContentClick = (content: Content) => {
    setSelectedContent(content);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedContent(null);
  };

  const handleLike = async (contentId: number, isLike: boolean) => {
    if (!user) return;
    
    try {
      const contentToUpdate = contents.find(c => c.id === contentId);
      if (!contentToUpdate) return;
      
      // Check if the user has already liked or disliked this content
      const alreadyLiked = contentToUpdate.liked_by_user;
      const alreadyDisliked = contentToUpdate.disliked_by_user;
      
      // Define the operation: insert, update, or delete
      let operation;
      let isLikeValue = isLike;
      
      if (isLike && alreadyLiked) {
        // User clicked like again, remove the like
        operation = 'delete';
      } else if (!isLike && alreadyDisliked) {
        // User clicked dislike again, remove the dislike
        operation = 'delete';
      } else if (alreadyLiked || alreadyDisliked) {
        // User has already reacted but with a different reaction, update
        operation = 'update';
      } else {
        // User hasn't reacted yet, insert
        operation = 'insert';
      }
      
      let result;
      
      if (operation === 'insert') {
        result = await supabase
          .from('likes')
          .insert({
            content_id: contentId,
            user_id: user.id,
            is_like: isLikeValue
          });
      } else if (operation === 'update') {
        result = await supabase
          .from('likes')
          .update({ is_like: isLikeValue })
          .eq('content_id', contentId)
          .eq('user_id', user.id);
      } else {
        // Delete the reaction
        result = await supabase
          .from('likes')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', user.id);
      }
      
      if (result.error) throw result.error;
      
      // Update local state
      const updatedContents = contents.map(content => {
        if (content.id === contentId) {
          let likesCount = content.likes_count || 0;
          let dislikesCount = content.dislikes_count || 0;
          
          if (operation === 'insert') {
            if (isLike) likesCount++;
            else dislikesCount++;
          } else if (operation === 'update') {
            if (isLike) {
              likesCount++;
              dislikesCount--;
            } else {
              likesCount--;
              dislikesCount++;
            }
          } else {
            // Delete
            if (alreadyLiked) likesCount--;
            if (alreadyDisliked) dislikesCount--;
          }
          
          return {
            ...content,
            likes_count: likesCount,
            dislikes_count: dislikesCount,
            liked_by_user: operation === 'insert' ? isLike : operation === 'update' ? isLike : false,
            disliked_by_user: operation === 'insert' ? !isLike : operation === 'update' ? !isLike : false
          };
        }
        return content;
      });
      
      setContents(updatedContents);
      
      // Update selected content if it's the one being liked
      if (selectedContent && selectedContent.id === contentId) {
        setSelectedContent(updatedContents.find(c => c.id === contentId) || null);
      }
      
      // Update content creator's points if it's a new like
      if (operation === 'insert' && isLike && contentToUpdate.created_by !== user.id) {
        // Get the content creator's user data
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('id, points')
          .eq('id', contentToUpdate.created_by)
          .single();
        
        if (!creatorError && creatorData) {
          // Give 2 points to the creator for their content being liked
          const newPoints = (creatorData.points || 0) + 2;
          await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', creatorData.id);
            
          // Also update the created_by_points field in the content table
          await supabase
            .from('content')
            .update({ created_by_points: (contentToUpdate.created_by_points || 0) + 2 })
            .eq('id', contentId);
        }
      }
      
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !selectedContent || !commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      
      // Insert the comment
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content_id: selectedContent.id,
          user_id: user.id,
          text: commentText.trim()
        })
        .select(`
          *,
          user:user_id(id, full_name, profile_picture, role)
        `)
        .single();
      
      if (error) throw error;
      
      // Add the new comment to the comments array
      setComments([...comments, data]);
      
      // Increment comment count in the content
      const updatedContents = contents.map(content => {
        if (content.id === selectedContent.id) {
          return {
            ...content,
            comments_count: (content.comments_count || 0) + 1
          };
        }
        return content;
      });
      
      setContents(updatedContents);
      
      // Update selected content
      if (selectedContent) {
        setSelectedContent({
          ...selectedContent,
          comments_count: (selectedContent.comments_count || 0) + 1
        });
      }
      
      // Clear the comment input
      setCommentText('');
      
      // Award points to the commenter
      if (user) {
        updateUserPoints(1);
      }
      
      // Award points to the content creator if it's someone else
      if (selectedContent.created_by !== user.id) {
        // Get the content creator's user data
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('id, points')
          .eq('id', selectedContent.created_by)
          .single();
        
        if (!creatorError && creatorData) {
          // Give 1 point to the creator for their content being commented on
          const newPoints = (creatorData.points || 0) + 1;
          await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', creatorData.id);
            
          // Also update the created_by_points field in the content table
          await supabase
            .from('content')
            .update({ created_by_points: (selectedContent.created_by_points || 0) + 1 })
            .eq('id', selectedContent.id);
        }
      }
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully',
      });
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Remove the comment from the comments array
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // Decrement comment count in the content
      const updatedContents = contents.map(content => {
        if (content.id === selectedContent?.id) {
          return {
            ...content,
            comments_count: Math.max((content.comments_count || 0) - 1, 0)
          };
        }
        return content;
      });
      
      setContents(updatedContents);
      
      // Update selected content
      if (selectedContent) {
        setSelectedContent({
          ...selectedContent,
          comments_count: Math.max((selectedContent.comments_count || 0) - 1, 0)
        });
      }
      
      toast({
        title: 'Comment Deleted',
        description: 'Your comment has been deleted successfully',
      });
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (content: Content) => {
    if (!content.file_path) {
      toast({
        title: 'No File',
        description: 'This content does not have a downloadable file',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Get file from Supabase Storage
      const { data, error } = await supabase.storage
        .from('content-files')
        .download(content.file_path);
      
      if (error) throw error;
      
      // Create a download URL
      const url = URL.createObjectURL(data);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = content.file_path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: 'Your file download has begun',
      });
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    }
  };

  const filteredContents = activeTab === 'all' 
    ? contents 
    : contents.filter(content => content.content_type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{unitName}</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/upload" state={{ unitName }}>
              <FileText className="h-5 w-5 mr-2" />
              Upload Material
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Content list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>
                  {unitName} - {filteredContents.length} materials available
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="note">Notes</TabsTrigger>
                    <TabsTrigger value="assignment">Assignments</TabsTrigger>
                    <TabsTrigger value="pastPaper">Past Papers</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
              <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-6">Loading materials...</div>
                ) : filteredContents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No materials found</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link to="/upload" state={{ unitName }}>Upload Material</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredContents.map((content) => (
                      <div
                        key={content.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedContent?.id === content.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-card hover:bg-muted/50 border border-border'
                        }`}
                        onClick={() => handleContentClick(content)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium">{content.title}</h3>
                          <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                            {content.content_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{content.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{content.user?.full_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {content.likes_count || 0}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {content.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right content - Selected content and comments */}
          <div className="lg:col-span-2">
            {selectedContent ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl">{selectedContent.title}</CardTitle>
                        <CardDescription>
                          {selectedContent.content_type.charAt(0).toUpperCase() + selectedContent.content_type.slice(1)} - {format(new Date(selectedContent.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedContent.deadline && (
                          <div className="flex items-center text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {format(new Date(selectedContent.deadline), 'PP')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedContent.user?.profile_picture} />
                        <AvatarFallback>{selectedContent.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {selectedContent.user?.full_name}
                          {selectedContent.created_by_points && (
                            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded">
                              <Badge className="h-3 w-3 inline mr-1" />
                              {selectedContent.created_by_points} points earned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedContent.user?.role === 'super_admin' ? 'Super Admin' : 
                           selectedContent.user?.role === 'admin' ? 'Lecturer' : 'Student'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="whitespace-pre-line">{selectedContent.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedContent.file_path && (
                        <Button 
                          onClick={() => handleDownload(selectedContent)} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      )}

                      {selectedContent.url && (
                        <Button 
                          onClick={() => window.open(selectedContent.url, '_blank')} 
                          variant="outline"
                          className="flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open External Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant={selectedContent.liked_by_user ? "default" : "outline"} 
                        size="sm"
                        onClick={() => handleLike(selectedContent.id, true)}
                        className="flex items-center"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {selectedContent.likes_count || 0}
                      </Button>
                      <Button 
                        variant={selectedContent.disliked_by_user ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLike(selectedContent.id, false)}
                        className="flex items-center"
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        {selectedContent.dislikes_count || 0}
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-500">{selectedContent.comments_count || 0} comments</span>
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Comments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Comment input */}
                    <div className="flex space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profile_picture} />
                        <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full resize-none"
                          rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                          <Button 
                            onClick={handleSubmitComment} 
                            disabled={!commentText.trim() || submittingComment}
                            size="sm"
                          >
                            {submittingComment ? 'Posting...' : 'Post Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Comments list */}
                    {loadingComments ? (
                      <div className="text-center py-4">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user?.profile_picture} />
                              <AvatarFallback>{comment.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="font-medium mr-2">{comment.user?.full_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </div>
                                </div>
                                {(user?.id === comment.user_id || user?.role === 'super_admin' || user?.role === 'admin') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                  </Button>
                                )}
                              </div>
                              <div className="mt-1 text-sm">{comment.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Select a Material</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a material from the list to view its details, download files, and participate in discussions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnitContent;
