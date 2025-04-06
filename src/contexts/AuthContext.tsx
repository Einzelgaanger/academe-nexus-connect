
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, ClassInstance, AuthContextType } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app and makes auth object available
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [classInstance, setClassInstance] = useState<ClassInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedClassInstance = localStorage.getItem('classInstance');

    if (storedUser && storedClassInstance) {
      setUser(JSON.parse(storedUser));
      setClassInstance(JSON.parse(storedClassInstance));
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (admissionNumber: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      // Fetch user with the provided admission number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('admission_number', admissionNumber)
        .single();

      if (userError) {
        return { success: false, message: 'Invalid admission number or password' };
      }

      // Simple password check (in a real app, use proper bcrypt comparison here)
      // Note: This is just for demo, in a real app we would use a backend service with bcrypt
      // We're comparing hashed passwords directly here because we're using pre-hashed passwords in our demo
      if (userData.password_hash !== password) {
        return { success: false, message: 'Invalid admission number or password' };
      }

      // Fetch the class instance associated with the user
      const { data: classInstanceData, error: classInstanceError } = await supabase
        .from('class_instances')
        .select('*')
        .eq('id', userData.class_instance_id)
        .single();

      if (classInstanceError) {
        return { success: false, message: 'Failed to load class information' };
      }

      // Parse the students JSON field
      if (typeof classInstanceData.students === 'string') {
        classInstanceData.students = JSON.parse(classInstanceData.students);
      }

      // Store user and class instance in state and localStorage
      setUser(userData as User);
      setClassInstance(classInstanceData as ClassInstance);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('classInstance', JSON.stringify(classInstanceData));

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Clear user data from state and localStorage
      setUser(null);
      setClassInstance(null);
      localStorage.removeItem('user');
      localStorage.removeItem('classInstance');
      
      // Redirect to login page
      navigate('/login');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'There was an error logging out.',
        variant: 'destructive',
      });
    }
  };

  // Update user points
  const updateUserPoints = async (points: number) => {
    if (!user) return;

    try {
      const newPoints = (user.points || 0) + points;
      
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setUser({
        ...user,
        points: newPoints
      });
      
      // Update in localStorage
      localStorage.setItem('user', JSON.stringify({
        ...user,
        points: newPoints
      }));
    } catch (error) {
      console.error('Error updating points:', error);
      toast({
        title: 'Error',
        description: 'Failed to update points',
        variant: 'destructive',
      });
    }
  };

  // Context values to provide
  const value = {
    user,
    classInstance,
    loading,
    login,
    logout,
    updateUserPoints
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
