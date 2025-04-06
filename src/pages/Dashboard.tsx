
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserRank, getPointsToNextRank } from '../lib/ranks';
import { Announcement } from '../types';
import { FileText, BookOpen, ClipboardList, User, LogOut, Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, classInstance, logout } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user || !classInstance) return;

      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*, user:created_by(full_name, profile_picture)')
          .eq('class_instance_id', classInstance.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load announcements',
          variant: 'destructive',
        });
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, [user, classInstance]);

  if (!user || !classInstance) {
    return <div>Loading...</div>;
  }

  const userRank = getUserRank(user.points || 0);
  const { nextRank, pointsNeeded } = getPointsToNextRank(user.points || 0);
  const RankIcon = userRank.Icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Stratizens</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/profile">
                <User className="h-5 w-5 mr-2" />
                Profile
              </Link>
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Welcome, {user.full_name}</CardTitle>
              <CardDescription>
                {classInstance.university} - {classInstance.course}, Year {classInstance.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <RankIcon className="h-6 w-6 text-primary" />
                <span className="font-medium">{userRank.name}</span>
                <span className="text-sm text-gray-500">({user.points || 0} points)</span>
              </div>
              {nextRank && (
                <p className="text-sm text-gray-600">
                  Earn {pointsNeeded} more points to reach {nextRank.name}!
                </p>
              )}
            </CardContent>
            <CardFooter>
              {user.role === 'student' && (
                <Button variant="outline" asChild className="w-full">
                  <Link to="/upload">Upload Content</Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Announcements</CardTitle>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingAnnouncements ? (
                <p>Loading announcements...</p>
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-b pb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        {announcement.user?.full_name} - {format(new Date(announcement.created_at), 'PPp')}
                      </p>
                      <p>{announcement.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No announcements yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Units */}
        <Tabs defaultValue="units" className="mb-6">
          <TabsList>
            <TabsTrigger value="units">
              <BookOpen className="h-4 w-4 mr-2" />
              Course Units
            </TabsTrigger>
            <TabsTrigger value="all">
              <FileText className="h-4 w-4 mr-2" />
              Recent Materials
            </TabsTrigger>
          </TabsList>
          <TabsContent value="units" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classInstance.units.map((unit) => (
                <Card key={unit}>
                  <CardHeader>
                    <CardTitle className="text-lg">{unit}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Access notes, assignments, and past papers</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/unit/${encodeURIComponent(unit)}`}>View Materials</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <RecentMaterials classInstanceId={classInstance.id} />
          </TabsContent>
        </Tabs>

        {/* Class Members */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              <User className="h-5 w-5 inline mr-2" />
              Class Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Lecturers</h3>
                <ul className="space-y-1">
                  <li>{classInstance.super_admin_name} (Super Admin)</li>
                  <li>{classInstance.admin_name} (Admin)</li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Students ({classInstance.students?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                  {classInstance.students?.slice(0, 15).map((student, index) => (
                    <div key={index} className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {student.name}
                    </div>
                  ))}
                  {(classInstance.students?.length || 0) > 15 && (
                    <div className="text-sm text-gray-500">
                      + {(classInstance.students?.length || 0) - 15} more students
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Component for displaying recent materials
const RecentMaterials = ({ classInstanceId }: { classInstanceId: number }) => {
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('content')
          .select('*, user:created_by(full_name)')
          .eq('class_instance_id', classInstanceId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentMaterials(data || []);
      } catch (error) {
        console.error('Error fetching recent materials:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recent materials',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMaterials();
  }, [classInstanceId]);

  if (loading) return <p>Loading recent materials...</p>;

  return (
    <div className="space-y-4">
      {recentMaterials.length > 0 ? (
        recentMaterials.map((material: any) => (
          <Card key={material.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <CardDescription>
                    {material.user?.full_name} - {format(new Date(material.created_at), 'PP')}
                  </CardDescription>
                </div>
                <div className="bg-secondary px-2 py-1 rounded text-xs font-medium">
                  {material.content_type}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{material.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" size="sm">
                <Link to={`/unit/${encodeURIComponent(material.unit_name)}`}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View in {material.unit_name}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <p>No materials uploaded yet.</p>
      )}
    </div>
  );
};

export default Dashboard;
