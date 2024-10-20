import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [contactInfo, setContactInfo] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const isEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const isValidPhoneNumber = (value) => {
   
    return /^\+\d+$/.test(value); 
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    
    if (!isEmail(contactInfo) && !isValidPhoneNumber(contactInfo)) {
      setError('Please enter a valid email address or phone number.');
      return;
    }

    try {
      const response = await fetch('http://localhost:9999/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isEmail(contactInfo) ? { company_email: contactInfo } : { phone_no: contactInfo })
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsOtpSent(true);
        setClientId(data.clientId);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:9999/verify-login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          loginOTP: otp
        }),
      });

      const data = await response.json();

      if (data.success) {
      
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    }
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to Cuvette
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              The #1 way to get Internships, Jobs.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={isOtpSent ? handleVerifyOTP : handleSendOTP}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="input-field" className="block text-sm font-medium text-gray-700">
                  {isOtpSent ? 'Enter OTP' : 'Enter Email or Phone Number '}
                </Label>
                <Input
                  id="input-field"
                  name={isOtpSent ? 'otp' : 'contact'}
                  type={isOtpSent ? 'text' : 'text'}
                  autoComplete="off"
                  required
                  className="mt-1 block w-full rounded-md"
                  placeholder={isOtpSent ? 'Enter OTP' : 'Enter your email or phone number (with country code)'}
                  value={isOtpSent ? otp : contactInfo}
                  onChange={(e) => isOtpSent ? setOtp(e.target.value) : setContactInfo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className={`w-full ${(isOtpSent ? otp : contactInfo) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                disabled={!(isOtpSent ? otp : contactInfo)}
              >
                {isOtpSent ? 'Login' : 'Send OTP'}
              </Button>
              {!isOtpSent && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleSignUp}
                >
                  Sign up
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Cuvette. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
