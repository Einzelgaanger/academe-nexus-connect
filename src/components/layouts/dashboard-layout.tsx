
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { RankBadge } from '@/components/rank-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X, Home, FileText, BookOpen, GraduationCap, Settings, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, classInstance, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  if (!user || !classInstance) {
    navigate('/login');
    return null;
  }

  const units = classInstance.units || [];

  const isUnitPage = (unit: string) => {
    return location.pathname.includes(`/unit/${encodeURIComponent(unit)}`);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex flex-col items-center gap-3">
        <AvatarInitials name={user.full_name} size="lg" />
        <div className="text-center">
          <div className="font-bold text-lg text-sidebar-foreground">{user.full_name}</div>
          <div className="text-sidebar-foreground text-opacity-80 text-sm">
            {user.admission_number}
          </div>
          <div className="mt-2">
            <RankBadge points={user.points} showPoints className="bg-opacity-20" />
          </div>
        </div>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setIsMobileNavOpen(false)}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          
          <div className="mt-4 mb-2 px-2">
            <h3 className="text-xs font-semibold text-sidebar-foreground text-opacity-70 uppercase tracking-wider">
              Units
            </h3>
          </div>
          
          {units.map((unit, index) => (
            <Link
              key={index}
              to={`/unit/${encodeURIComponent(unit)}`}
              className={`sidebar-link ${isUnitPage(unit) ? 'active' : ''}`}
              onClick={() => setIsMobileNavOpen(false)}
            >
              <BookOpen size={18} />
              <span>{unit}</span>
            </Link>
          ))}
          
          <div className="mt-4 mb-2 px-2">
            <h3 className="text-xs font-semibold text-sidebar-foreground text-opacity-70 uppercase tracking-wider">
              Account
            </h3>
          </div>
          
          <Link
            to="/profile"
            className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setIsMobileNavOpen(false)}
          >
            <User size={18} />
            <span>Profile</span>
          </Link>
        </nav>
      </div>
      
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full bg-sidebar-accent text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
          onClick={logout}
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
        
        <div className="mt-4 text-center text-sidebar-foreground text-opacity-70 text-xs">
          <p>Logged in as</p>
          <p className="font-medium">{user.full_name}</p>
          <p>{user.admission_number}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-sidebar fixed inset-y-0 z-50">
        {renderSidebarContent()}
      </aside>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-strath-primary text-white w-full fixed top-0 z-40">
        <div className="flex items-center">
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-strath-primary hover:bg-opacity-80">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground">
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-xl font-bold">myStrath</h1>
        <div className="w-8"></div> {/* Spacer to center the title */}
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
