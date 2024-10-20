import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { useNavigate } from 'react-router-dom';

export default function JobPostingForm() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidateInput, setCandidateInput] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [candidateError, setCandidateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayDateString();

  const isDateValid = (dateString) => {
    if (!dateString) return false;
    
    const selectedDate = new Date(dateString + 'T00:00:00Z');
    const todayDate = new Date(today + 'T00:00:00Z');
    
    selectedDate.setUTCHours(0, 0, 0, 0);
    todayDate.setUTCHours(0, 0, 0, 0);
    
    return selectedDate > todayDate;
  };

  const handleEndDateChange = (e) => {
    const selectedDate = e.target.value;
    if (!isDateValid(selectedDate)) {
      setDateError('End date must be after today');
      setEndDate('');
    } else {
      setDateError('');
      setEndDate(selectedDate);
    }
  };

  const handleAddCandidate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!candidateInput) {
      setCandidateError('Email cannot be empty'); 
      return;
    }

    if (!emailRegex.test(candidateInput)) {
      setCandidateError('Invalid email format'); 
      return;
    }

    if (candidates.includes(candidateInput)) {
      setCandidateError('Candidate already added');
      return;
    }

  
    setCandidates([...candidates, candidateInput]);
    setCandidateInput('');
    setCandidateError(''); 
  };

  const handleRemoveCandidate = (candidate) => {
    setCandidates(candidates.filter(c => c !== candidate));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!endDate || !isDateValid(endDate)) {
      setDateError('Please select a valid end date (after today)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9999/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          experienceLevel,
          candidates,
          endDate
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setJobTitle('');
        setJobDescription('');
        setExperienceLevel('');
        setCandidates([]);
        setEndDate('');
        setDateError('');
       
        window.location.href = '/dashboard';
      } else {
        alert(data.message || 'Error creating job posting');
      }
    } catch (error) {
      console.error('Error creating job posting:', error);
      alert('Error creating job posting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center">
          <Label htmlFor="jobTitle" className="w-1/3 text-right mr-4">Job Title</Label>
          <Input
            id="jobTitle"
            placeholder="Enter Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-2/3"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-start">
          <Label htmlFor="jobDescription" className="w-1/3 text-right mr-4 mt-2">Job Description</Label>
          <Textarea
            id="jobDescription"
            placeholder="Enter Job Description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-2/3"
            rows={4}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center">
          <Label htmlFor="experienceLevel" className="w-1/3 text-right mr-4">Experience Level</Label>
          <Select 
            value={experienceLevel} 
            onValueChange={setExperienceLevel} 
            required
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-2/3">
              <SelectValue placeholder="Select Experience Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start">
          <Label htmlFor="addCandidate" className="w-1/3 text-right mr-4 mt-2">Add Candidate</Label>
          <div className="w-2/3">
            <div className="flex mb-2">
              <Input
                id="addCandidate"
                type="email"
                placeholder="xyz@gmail.com"
                value={candidateInput}
                onChange={(e) => {
                  setCandidateInput(e.target.value);
                  setCandidateError(''); 
                }}
                className="flex-grow"
                disabled={isSubmitting}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={handleAddCandidate}
                disabled={isSubmitting}
              >
                Add
              </Button>
            </div>
            {candidateError && (
              <p className="text-red-500 text-sm mt-1">{candidateError}</p> // Display candidate error
            )}
            <div className="flex flex-wrap gap-2">
              {candidates.map((candidate, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {candidate}
                  <button
                    type="button"
                    onClick={() => handleRemoveCandidate(candidate)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    disabled={isSubmitting}
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <Label htmlFor="endDate" className="w-1/3 text-right mr-4 mt-2">End Date</Label>
          <div className="w-2/3">
            <Input
              id="endDate"
              type="date"
              placeholder="Select a Date"
              value={endDate}
              onChange={handleEndDateChange}
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
              className="w-full"
              required
              disabled={isSubmitting}
            />
            {dateError && (
              <p className="text-red-500 text-sm mt-1">{dateError}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Wait...
              </span>
            ) : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
