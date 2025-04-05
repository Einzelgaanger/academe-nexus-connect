
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RankBadge } from '@/components/rank-badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Upload, Book, FileText, Award, TrendingUp, MessageSquare, Clock, FileUp } from 'lucide-react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user, classInstance } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    assignmentsUploaded: 0,
    notesUploaded: 0,
    pastPapersUploaded: 0,
    commentsPosted: 0,
    rank: 0
  });
  const [topUsers, setTopUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !classInstance) return;
      
      setLoading(true);
      try {
        // Fetch content stats for the user
        const { data: userContent, error: contentError } = await supabase
          .from('content')
          .select('content_type')
          .eq('created_by', user.id);
          
        if (contentError) throw contentError;
        
        // Calculate content type counts
        const assignmentsCount = userContent?.filter(c => c.content_type === 'assignment').length || 0;
        const notesCount = userContent?.filter(c => c.content_type === 'note').length || 0;
        const pastPapersCount = userContent?.filter(c => c.content_type === 'pastPaper').length || 0;
        
        // Fetch comment count
        const { count: commentsCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
          
        if (commentError) throw commentError;
        
        // Fetch top users by points from the same class instance
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('class_instance_id', classInstance.id)
          .order('points', { ascending: false })
          .limit(5);
          
        if (usersError) throw usersError;
        
        // Calculate user rank
        const { data: userRank, error: rankError } = await supabase
          .from('users')
          .select('*')
          .eq('class_instance_id', classInstance.id)
          .gte('points', user.points)
          .order('points', { ascending: false });
          
        if (rankError) throw rankError;
        
        const rank = userRank?.findIndex(u => u.id === user.id) + 1 || 0;
        
        // Update stats state
        setStats({
          totalUploads: userContent?.length || 0,
          assignmentsUploaded: assignmentsCount,
          notesUploaded: notesCount,
          pastPapersUploaded: pastPapersCount,
          commentsPosted: commentsCount || 0,
          rank: rank
        });
        
        setTopUsers(users || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Data Fetch Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, classInstance]);

  if (!user || !classInstance) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.full_name}!
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Your Points</CardTitle>
              <Award className="w-4 h-4 text-strath-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.points} points</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Rank {stats.rank} in your class
                </span>
              </div>
              <div className="mt-3">
                <RankBadge points={user.points} showPoints size="md" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
              <FileUp className="w-4 h-4 text-strath-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUploads}</div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="mr-1 w-3.5 h-3.5 text-blue-500" />
                  <span>{stats.assignmentsUploaded} Assignments</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Book className="mr-1 w-3.5 h-3.5 text-green-500" />
                  <span>{stats.notesUploaded} Notes</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="mr-1 w-3.5 h-3.5 text-orange-500" />
                  <span>{stats.pastPapersUploaded} Past Papers</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Comments Posted</CardTitle>
              <MessageSquare className="w-4 h-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.commentsPosted}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.commentsPosted > 0 
                  ? `That's +${(stats.commentsPosted * 0.1).toFixed(1)} points from comments!` 
                  : "Start earning points by commenting on content"}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>
                Students with the most points in your class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((topUser, index) => (
                  <div key={topUser.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-700' :
                        'bg-gray-200'
                      } text-white font-bold mr-3`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{topUser.full_name}</div>
                        <div className="text-xs text-muted-foreground">{topUser.admission_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <RankBadge points={topUser.points} size="sm" />
                      <div className="ml-2 font-semibold">{topUser.points}</div>
                    </div>
                  </div>
                ))}
                
                {topUsers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Units</CardTitle>
              <CardDescription>
                Quick access to your academic units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {classInstance.units.map((unit, index) => (
                  <Link key={index} to={`/unit/${encodeURIComponent(unit)}`}>
                    <Button 
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                    >
                      <Book className="mr-2 h-4 w-4 text-strath-primary" />
                      <div>
                        <div>{unit}</div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
