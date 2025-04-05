
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { KeyRound, Lock, User, GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, academicSelection, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // For reset password dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetAdmission, setResetAdmission] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  if (!academicSelection) {
    navigate('/academic-selection');
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admissionNumber || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter both admission number and password",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      await login(admissionNumber, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetAdmission || !secretKey) {
      toast({
        title: "Reset Failed",
        description: "Please enter both admission number and secret key",
        variant: "destructive"
      });
      return;
    }
    
    setResetLoading(true);
    try {
      const success = await resetPassword(resetAdmission, secretKey);
      if (success) {
        setResetDialogOpen(false);
        setResetAdmission('');
        setSecretKey('');
        toast({
          title: "Password Reset",
          description: "Your password has been reset to the default: stratizens#web",
        });
      }
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setResetLoading(false);
    }
  };
  
  const { program, course, year, semester, group } = academicSelection;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-strath-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <GraduationCap className="mr-2 h-6 w-6" />
          <span className="text-xl font-bold">myStrath</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Login to access your academic resources
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6 bg-muted rounded-md p-3">
                <h3 className="text-sm font-medium mb-2">Your Academic Details:</h3>
                <div className="text-sm">
                  <div><span className="font-medium">Program:</span> {program}</div>
                  <div><span className="font-medium">Course:</span> {course}</div>
                  <div><span className="font-medium">Year:</span> {year}</div>
                  <div><span className="font-medium">Semester:</span> {semester}</div>
                  <div><span className="font-medium">Group:</span> {group}</div>
                </div>
              </div>
              
              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="admission" className="text-sm font-medium">
                      Admission Number
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="admission"
                        placeholder="Enter your admission number"
                        className="pl-10"
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default password: stratizens#web
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm">
                      Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your admission number and the secret key to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="reset-admission" className="text-sm font-medium">
                          Admission Number
                        </label>
                        <Input
                          id="reset-admission"
                          placeholder="Enter your admission number"
                          value={resetAdmission}
                          onChange={(e) => setResetAdmission(e.target.value)}
                          disabled={resetLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="secret-key" className="text-sm font-medium">
                          Secret Key
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="secret-key"
                            type="password"
                            placeholder="Enter the secret key"
                            className="pl-10"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            disabled={resetLoading}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Contact your administrator if you don't know the secret key.
                        </p>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={resetLoading}
                        >
                          {resetLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-strath-dark text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-300">
            &copy; {new Date().getFullYear()} myStrath. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
