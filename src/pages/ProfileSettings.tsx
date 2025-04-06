
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserRank, getPointsToNextRank } from '../lib/ranks';
import { ArrowLeft, Upload, User, Mail, Phone, Shield, Key, Save, Medal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      
      // Get profile picture URL if available
      if (user.profile_picture) {
        const getProfilePictureUrl = async () => {
          try {
            const { data } = await supabase.storage
              .from('profile-pictures')
              .getPublicUrl(user.profile_picture);
              
            if (data) {
              setProfilePictureUrl(data.publicUrl);
            }
          } catch (error) {
            console.error('Error getting profile picture URL:', error);
          }
        };
        
        getProfilePictureUrl();
      }
    }
  }, [user]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      let profilePicturePath = user.profile_picture;
      
      // Upload new profile picture if selected
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profilePicture, {
            cacheControl: '3600',
            upsert: true,
          });
        
        if (error) throw error;
        profilePicturePath = fileName;
      }
      
      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          email,
          phone,
          profile_picture: profilePicturePath,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local user object
      const updatedUser = {
        ...user,
        full_name: fullName,
        email,
        phone,
        profile_picture: profilePicturePath,
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'New password and confirmation do not match',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      // For demo purposes, we're just simulating a password change
      // In a real app, you would verify the current password and update with a proper hashed password
      
      // Update user with new password hash
      // This is only a simulation - in a real app you would do proper password hashing server-side
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', // Demo hash
          is_using_default_password: false,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully',
      });
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Password Change Failed',
        description: 'Failed to change your password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const userRank = getUserRank(user.points || 0);
  const { nextRank, pointsNeeded } = getPointsToNextRank(user.points || 0);
  const RankIcon = userRank.Icon;
  
  // Calculate progress to next rank
  let progressPercentage = 0;
  if (nextRank) {
    const currentRankThreshold = userRank.threshold;
    const nextRankThreshold = nextRank.threshold;
    const userPoints = user.points || 0;
    
    progressPercentage = ((userPoints - currentRankThreshold) / (nextRankThreshold - currentRankThreshold)) * 100;
  } else {
    // User is at max rank
    progressPercentage = 100;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>View and update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePictureUrl} />
                  <AvatarFallback className="text-2xl">{user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" onClick={() => document.getElementById('profilePicture')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Change Picture
                  </Button>
                  <input
                    id="profilePicture"
                    type="file"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                  />
                </div>
              </div>
              
              {/* User Details Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Lecturer' : 'Student'}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">
                    <Key className="h-4 w-4 inline mr-2" />
                    Admission Number
                  </Label>
                  <Input
                    id="admissionNumber"
                    value={user.admission_number}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Rank Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Medal className="h-5 w-5 inline mr-2" />
                Rank & Points
              </CardTitle>
              <CardDescription>Your current rank and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <RankIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{userRank.name}</h3>
                  <p className="text-sm text-gray-500">{user.points || 0} points earned</p>
                </div>
              </div>
              
              {nextRank ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {nextRank.name}</span>
                    <span>{pointsNeeded} points needed</span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 p-3 rounded-md">
                  Congratulations! You've reached the highest rank: {userRank.name}
                </div>
              )}
              
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">How to Earn Points</h4>
                <ul className="text-sm space-y-1">
                  <li>• Upload course materials: +5 points</li>
                  <li>• Comment on materials: +1 point</li>
                  <li>• Receive likes on your materials: +2 points per like</li>
                  <li>• Receive comments on your materials: +1 point per comment</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Logout Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => logout()} className="w-full max-w-xs">
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
