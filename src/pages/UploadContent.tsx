
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Upload, FileText, Link as LinkIcon, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

const UploadContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, classInstance, updateUserPoints } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitName, setUnitName] = useState(location.state?.unitName || '');
  const [contentType, setContentType] = useState<'note' | 'assignment' | 'pastPaper'>('note');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Additional state for file upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Reset preview when file changes
  useEffect(() => {
    if (file) {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !classInstance) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload content',
        variant: 'destructive',
      });
      return;
    }
    
    if (!title || !description || !unitName || !contentType) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (!file && !externalUrl) {
      toast({
        title: 'Missing Content',
        description: 'Please upload a file or provide an external URL',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      let filePath = null;
      
      // Upload file if provided
      if (file) {
        // Generate a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const fullPath = `${user.id}/${fileName}`;
        
        // Set up upload with progress tracking
        const uploadTask = async () => {
          // Perform upload
          const { data, error } = await supabase.storage
            .from('content-files')
            .upload(fullPath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) throw error;
          return data;
        };
        
        // Track progress manually since onUploadProgress isn't available
        setUploadProgress(10); // Start progress
        
        const data = await uploadTask();
        
        setUploadProgress(100); // Complete progress
        
        filePath = fullPath;
      }
      
      // Insert content record
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          title,
          description,
          content_type: contentType,
          file_path: filePath,
          url: externalUrl || null,
          class_instance_id: classInstance.id,
          unit_name: unitName,
          created_by: user.id,
          deadline: deadline?.toISOString() || null,
        })
        .select()
        .single();
      
      if (contentError) throw contentError;
      
      // Award points to the user for uploading content
      const pointsToAward = 5; // 5 points for uploading content
      await updateUserPoints(pointsToAward);
      
      toast({
        title: 'Success',
        description: 'Content uploaded successfully!',
      });
      
      // Navigate to the unit page
      navigate(`/unit/${encodeURIComponent(unitName)}`);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload content',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || !classInstance) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Upload Course Material</h1>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Material</CardTitle>
            <CardDescription>
              Share notes, assignments, or past papers with your classmates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about this material"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unitName} onValueChange={setUnitName} required>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {classInstance.units.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select 
                    value={contentType} 
                    onValueChange={(value) => setContentType(value as 'note' | 'assignment' | 'pastPaper')} 
                    required
                  >
                    <SelectTrigger id="contentType">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="pastPaper">Past Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Optional deadline for assignments */}
              {contentType === 'assignment' && (
                <div className="space-y-2">
                  <Label>Deadline (Optional)</Label>
                  <div className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !date && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select a deadline"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={date}
                          onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setDeadline(selectedDate);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Content (Choose One)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Upload File</span>
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer ${
                          isUploading ? "pointer-events-none opacity-50" : ""
                        }`}
                        onClick={() => document.getElementById("fileInput")?.click()}
                      >
                        <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          {file 
                            ? `Selected: ${file.name}`
                            : "Click to select or drag and drop"
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Supports PDF, Word, images, and ZIP files (max 50MB)
                        </p>
                        <input
                          id="fileInput"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                        />
                      </div>
                      
                      {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {filePreview && (
                        <div className="mt-2">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-h-40 max-w-full mx-auto rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">External URL</span>
                    </div>
                    <Input
                      placeholder="https://example.com/resource"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      disabled={!!file || isUploading}
                    />
                    <p className="text-xs text-gray-400">
                      You can link to Google Drive, OneDrive, or other resource URLs
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading || !title || !description || !unitName || !contentType || (!file && !externalUrl)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Material
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default UploadContent;
