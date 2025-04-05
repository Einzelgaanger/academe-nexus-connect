
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, Book } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-strath-primary text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <GraduationCap className="mr-2 h-6 w-6" />
            <span className="text-xl font-bold">myStrath</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-strath-accent transition-colors">Home</Link>
            <Link to="/about" className="hover:text-strath-accent transition-colors">About</Link>
            <Link to="/academic-selection" className="hover:text-strath-accent transition-colors">Academic</Link>
          </nav>
          <Button asChild className="bg-strath-accent hover:bg-strath-accent/90 text-black">
            <Link to="/academic-selection">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-strath-primary to-strath-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">Welcome to myStrath</h1>
          <p className="text-xl max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your one-stop platform for accessing and sharing academic resources within Strathmore University.
          </p>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="bg-strath-accent hover:bg-strath-accent/90 text-black">
              <Link to="/academic-selection">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Use myStrath?</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="strath-card flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="h-16 w-16 bg-strath-light rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-strath-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Academic Resources</h3>
              <p className="text-gray-600">
                Access assignments, notes, and past papers all in one organized platform.
              </p>
            </div>
            
            <div className="strath-card flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="h-16 w-16 bg-strath-light rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-strath-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Collaboration</h3>
              <p className="text-gray-600">
                Share study materials with classmates and earn points for your contributions.
              </p>
            </div>
            
            <div className="strath-card flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="h-16 w-16 bg-strath-light rounded-full flex items-center justify-center mb-4">
                <Book className="h-8 w-8 text-strath-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Organized By Units</h3>
              <p className="text-gray-600">
                Find exactly what you need with content organized by specific academic units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-strath-light py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join your classmates on myStrath and start accessing your academic resources today.
          </p>
          <Button asChild size="lg" className="bg-strath-primary hover:bg-strath-primary/90">
            <Link to="/academic-selection">Select Your Academic Path</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-strath-dark text-white py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <GraduationCap className="mr-2 h-6 w-6" />
              <span className="text-xl font-bold">myStrath</span>
            </div>
            <div className="text-sm text-gray-300">
              &copy; {new Date().getFullYear()} myStrath. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
