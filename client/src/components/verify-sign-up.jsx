import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Mail, Phone, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.jpg'; 

export default function VerifySignUp() {
  const [emailOTP, setEmailOTP] = useState('');
  const [mobileOTP, setMobileOTP] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); 
  
  const location = useLocation();
  const navigate = useNavigate();
  const clientId = location.state?.clientId;

  useEffect(() => {
    
    if (!clientId) {
      
      navigate('/register'); 
    }
  }, [clientId, navigate]);

  const handleVerify = async () => {
    if (!emailOTP || !mobileOTP) {
      alert('Please enter both OTPs');
      return;
    }

    setIsVerifying(true); 
    try {
      const response = await fetch('http://localhost:9999/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, emailOTP, mobileOTP })
      });

      const data = await response.json();

      if (data.success) {
        setEmailVerified(true);
        setMobileVerified(true);
        alert('Verification successful!');
        navigate(data.redirectUrl);
      } else {
        alert('Verification failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying OTPs:', error);
      alert('An error occurred while verifying OTPs');
    } finally {
      setIsVerifying(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src={logo} alt="Cuvette Logo" className="h-10 w-auto" /> {/* Logo replacement */}
          <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-center gap-12">
          <div className="lg:w-1/2 max-w-md">
            <p className="text-xl text-gray-500">
              Please enter the OTPs sent to your email and mobile number to complete the verification process.
            </p>
          </div>

          <div className="lg:w-1/2 max-w-md">
            <div className="bg-white shadow-md rounded-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-2">Verify Sign Up</h2>
              <p className="text-gray-500 text-center mb-6">Enter the OTPs sent to your email and mobile</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailOTP" className="sr-only">Email OTP</Label>
                  <div className="relative mb-2">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="emailOTP"
                      type="text"
                      placeholder="Email OTP"
                      value={emailOTP}
                      onChange={(e) => setEmailOTP(e.target.value)}
                      className="pl-10"
                      disabled={emailVerified}
                    />
                    {emailVerified && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobileOTP" className="sr-only">Mobile OTP</Label>
                  <div className="relative mb-2">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      id="mobileOTP"
                      type="text"
                      placeholder="Mobile OTP"
                      value={mobileOTP}
                      onChange={(e) => setMobileOTP(e.target.value)}
                      className="pl-10"
                      disabled={mobileVerified}
                    />
                    {mobileVerified && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleVerify}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={emailVerified && mobileVerified || isVerifying} // Disable button when verifying
                >
                  {isVerifying ? 'Verifying...' : 'Verify'} 
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
