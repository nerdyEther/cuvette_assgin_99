import React, { useState } from 'react';
import { User, Phone, Building2, Mail, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.jpg'; 

export default function CompanyRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone_no: '',
    company_name: '',
    company_email: '',
    employee_size: ''
  });
  const [errors, setErrors] = useState({}); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const regex = /^\+\d+$/; 
    return regex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

   
    if (!validateEmail(formData.company_email)) {
      newErrors.company_email = 'Invalid email format';
    }

    
    if (!validatePhoneNumber(formData.phone_no)) {
      newErrors.phone_no = 'Phone number must start with "+" and contain only numbers';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true); 

    try {
      const response = await fetch('http://localhost:9999/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        
        navigate('/verifysignup', { state: { clientId: data.clientId } });
      } else {
        alert('Failed to register company: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while registering');
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={logo} alt="Cuvette Logo" className="h-10 w-auto" /> 
          </div>
          <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2 flex flex-col justify-center space-y-6">
            <p className="text-xl text-gray-500 text-center">
              At Cuvette, we aim to simplify the hiring process for companies and job seekers alike. Join us and experience a streamlined approach to recruitment.
            </p>
          </div>

          <div className="lg:w-1/2">
            <div className="bg-white shadow-md rounded-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-2">Sign Up</h2>
              <p className="text-gray-500 text-center mb-6">Create an account to start your hiring journey with us.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="pl-10"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone_no" className="sr-only">Phone no.</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="phone_no"
                      name="phone_no"
                      type="tel"
                      required
                      className={`pl-10 ${errors.phone_no ? 'border-red-500' : ''}`}
                      placeholder="Phone no. (with country code)"
                      value={formData.phone_no}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phone_no && <p className="text-red-500 text-xs">{errors.phone_no}</p>}
                </div>

                <div>
                  <Label htmlFor="company_name" className="sr-only">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      required
                      className="pl-10"
                      placeholder="Company Name"
                      value={formData.company_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_email" className="sr-only">Company Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="company_email"
                      name="company_email"
                      type="email"
                      required
                      className={`pl-10 ${errors.company_email ? 'border-red-500' : ''}`}
                      placeholder="Company Email"
                      value={formData.company_email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.company_email && <p className="text-red-500 text-xs">{errors.company_email}</p>}
                </div>

                <div>
                  <Label htmlFor="employee_size" className="sr-only">Employee Size</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="employee_size"
                      name="employee_size"
                      type="number"
                      required
                      className="pl-10"
                      placeholder="Employee Size"
                      value={formData.employee_size}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <p className="text-xs text-center text-gray-500">
                  By clicking on proceed you will accept our{' '}
                  <a href="#terms" className="text-blue-600 hover:underline">Terms</a> &{' '}
                  <a href="#conditions" className="text-blue-600 hover:underline">Conditions</a>
                </p>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600" 
                  disabled={isSubmitting} 
                >
                  {isSubmitting ? 'Wait...' : 'Proceed'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
