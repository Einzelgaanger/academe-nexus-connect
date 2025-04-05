
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { RankBadge } from '@/components/rank-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, Save, User } from 'lucide-react';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  if (!user) return null;
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation don't match",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      
      if (success) {
        setPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Change password error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                View your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                <AvatarInitials name={user.full_name} size="xl" />
                <div className="text-center">
                  <h2 className="text-xl font-bold">{user.full_name}</h2>
                  <p className="text-muted-foreground">{user.admission_number}</p>
                  <div className="mt-2">
                    <RankBadge points={user.points} showPoints size="md" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      value={user.full_name} 
                      readOnly 
                      className="pl-10 bg-muted" 
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Admission Number</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      value={user.admission_number} 
                      readOnly 
                      className="pl-10 bg-muted" 
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Role</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                      readOnly 
                      className="pl-10 bg-muted" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      type="password" 
                      value="••••••••" 
                      readOnly 
                      className="pl-10 bg-muted" 
                    />
                  </div>
                  {user.is_using_default_password && (
                    <p className="text-xs text-orange-500 mt-1">
                      You are using the default password. Please change it for security.
                    </p>
                  )}
                </div>
                
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Update your password to keep your account secure
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            className="pl-10 pr-10"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="pl-10 pr-10"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm your new password"
                            className="pl-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? (
                            "Updating..."
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
