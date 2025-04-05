
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AcademicSelection as AcademicSelectionType } from '@/types';
import { ArrowRight, Check, GraduationCap, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const AcademicSelection = () => {
  const navigate = useNavigate();
  const { setAcademicSelection } = useAuth();
  
  const [programs, setPrograms] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch initial programs
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_instances')
          .select('program')
          .order('program');
        
        if (error) throw error;
        
        const uniquePrograms = Array.from(new Set(data.map(item => item.program)));
        setPrograms(uniquePrograms);
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast({
          title: "Error",
          description: "Failed to load academic programs",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrograms();
  }, []);

  // Fetch courses when program changes
  useEffect(() => {
    if (!selectedProgram) {
      setCourses([]);
      return;
    }
    
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_instances')
          .select('course')
          .eq('program', selectedProgram)
          .order('course');
        
        if (error) throw error;
        
        const uniqueCourses = Array.from(new Set(data.map(item => item.course)));
        setCourses(uniqueCourses);
        
        // Reset dependent selections
        setSelectedCourse('');
        setSelectedYear(null);
        setSelectedSemester('');
        setSelectedGroup('');
        setYears([]);
        setSemesters([]);
        setGroups([]);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [selectedProgram]);

  // Fetch years when course changes
  useEffect(() => {
    if (!selectedProgram || !selectedCourse) {
      setYears([]);
      return;
    }
    
    const fetchYears = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_instances')
          .select('year')
          .eq('program', selectedProgram)
          .eq('course', selectedCourse)
          .order('year');
        
        if (error) throw error;
        
        const uniqueYears = Array.from(new Set(data.map(item => item.year)));
        setYears(uniqueYears);
        
        // Reset dependent selections
        setSelectedYear(null);
        setSelectedSemester('');
        setSelectedGroup('');
        setSemesters([]);
        setGroups([]);
      } catch (error) {
        console.error('Error fetching years:', error);
        toast({
          title: "Error",
          description: "Failed to load years",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchYears();
  }, [selectedProgram, selectedCourse]);

  // Fetch semesters when year changes
  useEffect(() => {
    if (!selectedProgram || !selectedCourse || !selectedYear) {
      setSemesters([]);
      return;
    }
    
    const fetchSemesters = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_instances')
          .select('semester')
          .eq('program', selectedProgram)
          .eq('course', selectedCourse)
          .eq('year', selectedYear)
          .order('semester');
        
        if (error) throw error;
        
        const uniqueSemesters = Array.from(new Set(data.map(item => item.semester)));
        setSemesters(uniqueSemesters);
        
        // Reset dependent selections
        setSelectedSemester('');
        setSelectedGroup('');
        setGroups([]);
      } catch (error) {
        console.error('Error fetching semesters:', error);
        toast({
          title: "Error",
          description: "Failed to load semesters",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSemesters();
  }, [selectedProgram, selectedCourse, selectedYear]);

  // Fetch groups when semester changes
  useEffect(() => {
    if (!selectedProgram || !selectedCourse || !selectedYear || !selectedSemester) {
      setGroups([]);
      return;
    }
    
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_instances')
          .select('group_name')
          .eq('program', selectedProgram)
          .eq('course', selectedCourse)
          .eq('year', selectedYear)
          .eq('semester', selectedSemester)
          .order('group_name');
        
        if (error) throw error;
        
        const uniqueGroups = Array.from(new Set(data.map(item => item.group_name)));
        setGroups(uniqueGroups);
        
        // Reset dependent selection
        setSelectedGroup('');
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [selectedProgram, selectedCourse, selectedYear, selectedSemester]);

  const isSelectionComplete = () => {
    return (
      selectedProgram &&
      selectedCourse &&
      selectedYear !== null &&
      selectedSemester &&
      selectedGroup
    );
  };

  const handleContinue = () => {
    if (!isSelectionComplete()) {
      toast({
        title: "Incomplete Selection",
        description: "Please complete your academic selection",
        variant: "destructive"
      });
      return;
    }
    
    const selection: AcademicSelectionType = {
      program: selectedProgram,
      course: selectedCourse,
      year: selectedYear!,
      semester: selectedSemester,
      group: selectedGroup
    };
    
    setAcademicSelection(selection);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-strath-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <GraduationCap className="mr-2 h-6 w-6" />
          <span className="text-xl font-bold">myStrath</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <School className="mr-2 h-6 w-6 text-strath-primary" />
              Academic Selection
            </CardTitle>
            <CardDescription>
              Please select your academic details to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Program</label>
                <Select
                  disabled={loading || programs.length === 0}
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select
                  disabled={loading || !selectedProgram || courses.length === 0}
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select
                  disabled={loading || !selectedCourse || years.length === 0}
                  value={selectedYear?.toString() || ''}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Select
                  disabled={loading || selectedYear === null || semesters.length === 0}
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester} value={semester}>
                        Semester {semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <Select
                  disabled={loading || !selectedSemester || groups.length === 0}
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        Group {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleContinue} 
                  disabled={!isSelectionComplete() || loading}
                  className="w-full"
                >
                  Continue to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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

export default AcademicSelection;
