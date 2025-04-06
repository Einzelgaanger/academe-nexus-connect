
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in, or to login page after delay
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="text-center max-w-3xl px-6">
        <h1 className="text-5xl font-bold mb-6 text-indigo-900">Welcome to Stratizens</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your central hub for accessing course materials, participating in class discussions,
          and collaborating with your peers at Strathmore University.
        </p>
        
        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full md:w-auto px-8 py-6 text-lg"
            onClick={handleNavigateToLogin}
          >
            Get Started
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Course Materials" 
            description="Access all your notes, assignments, and past papers in one place." 
          />
          <FeatureCard 
            title="Class Collaboration" 
            description="Comment on materials and interact with classmates and lecturers." 
          />
          <FeatureCard 
            title="Points System" 
            description="Earn points for contributing valuable content to your class." 
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
    <h2 className="text-xl font-semibold mb-3 text-indigo-800">{title}</h2>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Index;
