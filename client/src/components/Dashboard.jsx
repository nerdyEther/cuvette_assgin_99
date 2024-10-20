import React, { useState, useEffect } from 'react';
import { Home, ChevronDown, Briefcase, Calendar, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import JobPostingForm from './job-posting';

import logo from '../assets/images/logo.jpg';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showJobPostingForm, setShowJobPostingForm] = useState(false);
  const [jobPostings, setJobPostings] = useState([]);
  const navigate = useNavigate();

  const handleCreateInterview = async () => {
    try {
      const response = await fetch('http://localhost:9999/verification-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      const data = await response.json();
  
   
      console.log('Verification status response:', data);
  
      if (data.success) {
        if (data.verified) {
          console.log('User is verified. Showing job posting form.');
          setShowJobPostingForm(true);
        } else {
          console.log('User is not verified. Redirecting to verification page.');
          toast.error('Please verify your account before creating an interview.', {
            duration: 4000,
            position: 'top-center',
          });
          navigate('/reverify'); 
        }
      } else {
        console.error('Verification status check failed:', data.message);
        toast.error('Failed to check verification status. Please try again later.');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast.error('An error occurred. Please try again later.');
    }
  };

  const handleHomeClick = () => {
    setShowJobPostingForm(false);
    navigate('/dashboard');
  };


  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        const response = await fetch('http://localhost:9999/job-postings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setJobPostings(data.jobPostings);
        }
      } catch (error) {
        console.error('Error fetching job postings:', error);
        toast.error('Failed to fetch job postings. Please try again later.');
      }
    };

    fetchJobPostings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
        
            <img src={logo} alt="Logo" className="h-8" /> 
          </div>
          <div className="flex items-center space-x-4">
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <span>{user?.name || 'User'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

    
      <div className="flex-1 flex">
    
        <nav className="w-16 bg-white border-r border-gray-200">
          <div className="h-16 flex items-center justify-center">
            <Button
              variant="ghost"
              className="w-12 h-12 p-2 hover:bg-gray-100 transition-colors"
              onClick={handleHomeClick}
              title="Go to Dashboard"
            >
              <Home className="h-6 w-6 text-gray-500" />
            </Button>
          </div>
        </nav>

      
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {!showJobPostingForm ? (
              <>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={handleCreateInterview}
                >
                  Create Interview
                </Button>

                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-4">Job Postings</h2>
                  {jobPostings.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {jobPostings.map((posting) => (
                        <div key={posting._id} className="bg-white shadow-md rounded-lg overflow-hidden">
                          <div className="p-4">
                            <h3 className="text-xl font-semibold mb-2">{posting.jobTitle}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{posting.jobDescription}</p>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <Briefcase className="w-4 h-4 mr-2" />
                              <span>Experience: {posting.experienceLevel}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>End Date: {new Date(posting.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No job postings</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new job posting.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Create New Interview</h2>
                <JobPostingForm />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}