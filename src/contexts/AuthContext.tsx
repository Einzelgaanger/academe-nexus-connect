
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { User, AcademicSelection, ClassInstance } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  classInstance: ClassInstance | null;
  academicSelection: AcademicSelection | null;
  loading: boolean;
  login: (admissionNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAcademicSelection: (selection: AcademicSelection) => void;
  resetPassword: (admissionNumber: string, secretKey: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [classInstance, setClassInstance] = useState<ClassInstance | null>(null);
  const [academicSelection, setAcademicSelection] = useState<AcademicSelection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored session on mount
    const checkSession = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('strathUser');
        const storedClassInstance = localStorage.getItem('strathClassInstance');
        
        if (storedUser && storedClassInstance) {
          setUser(JSON.parse(storedUser));
          setClassInstance(JSON.parse(storedClassInstance));
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Session restoration error:', error);
        localStorage.removeItem('strathUser');
        localStorage.removeItem('strathClassInstance');
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (admissionNumber: string, password: string) => {
    setLoading(true);
    try {
      // First, get the academic selection
      if (!academicSelection) {
        toast({
          title: "Error",
          description: "Please select your academic details first",
          variant: "destructive"
        });
        return;
      }

      // Fetch class instance based on academic selection
      const { data: classInstances, error: classError } = await supabase
        .from('class_instances')
        .select('*')
        .eq('program', academicSelection.program)
        .eq('course', academicSelection.course)
        .eq('year', academicSelection.year)
        .eq('semester', academicSelection.semester)
        .eq('group_name', academicSelection.group)
        .single();

      if (classError || !classInstances) {
        toast({
          title: "Error",
          description: "Class not found",
          variant: "destructive"
        });
        return;
      }

      // Now check if the admission number belongs to this class or is an admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('admission_number', admissionNumber)
        .eq('class_instance_id', classInstances.id)
        .single();

      if (userError || !userData) {
        toast({
          title: "Invalid Credentials",
          description: "Admission number not found in this class",
          variant: "destructive"
        });
        return;
      }

      // Verify password (in a real app, this would be done server-side)
      // For demo purposes, we're checking against "stratizens#web" or whatever is stored
      const correctPassword = password === "stratizens#web" || password === userData.password_hash;
      
      if (!correctPassword) {
        toast({
          title: "Invalid Credentials",
          description: "Incorrect password",
          variant: "destructive"
        });
        return;
      }

      // Store user and class instance data
      setUser(userData);
      setClassInstance(classInstances);
      setIsLoggedIn(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('strathUser', JSON.stringify(userData));
      localStorage.setItem('strathClassInstance', JSON.stringify(classInstances));
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.full_name}!`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Clear stored data
      localStorage.removeItem('strathUser');
      localStorage.removeItem('strathClassInstance');
      
      // Reset state
      setUser(null);
      setClassInstance(null);
      setIsLoggedIn(false);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (admissionNumber: string, secretKey: string): Promise<boolean> => {
    try {
      // Check if secret key is correct
      if (secretKey !== "Reset123") {
        toast({
          title: "Reset Failed",
          description: "Invalid secret key",
          variant: "destructive"
        });
        return false;
      }

      // Get user by admission number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('admission_number', admissionNumber)
        .single();

      if (userError || !userData) {
        toast({
          title: "Reset Failed",
          description: "Admission number not found",
          variant: "destructive"
        });
        return false;
      }

      // Reset password to default
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: "stratizens#web",
          is_using_default_password: true
        })
        .eq('admission_number', admissionNumber);

      if (updateError) {
        toast({
          title: "Reset Failed",
          description: "Failed to reset password",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Password Reset",
        description: "Password has been reset to the default",
      });
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to change your password",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Verify current password
      const correctPassword = currentPassword === "stratizens#web" || currentPassword === user.password_hash;
      
      if (!correctPassword) {
        toast({
          title: "Password Change Failed",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        return false;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPassword,
          is_using_default_password: false
        })
        .eq('id', user.id);

      if (updateError) {
        toast({
          title: "Password Change Failed",
          description: "Failed to update password",
          variant: "destructive"
        });
        return false;
      }

      // Update local user data
      const updatedUser = {
        ...user,
        password_hash: newPassword,
        is_using_default_password: false
      };
      setUser(updatedUser);
      localStorage.setItem('strathUser', JSON.stringify(updatedUser));

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Password Change Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const value = {
    user,
    classInstance,
    academicSelection,
    loading,
    login,
    logout,
    setAcademicSelection,
    resetPassword,
    changePassword,
    isLoggedIn
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
