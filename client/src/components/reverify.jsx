import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Mail, Phone } from "lucide-react";

export default function Reverify() {
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phoneNo, setPhoneNo] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        
        const verificationResponse = await fetch('http://localhost:9999/verification-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const verificationData = await verificationResponse.json();

        
        if (verificationData.success && verificationData.verified) {
          navigate('/dashboard');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking access:', error);
        navigate('/dashboard'); 
      }
    };

    checkAccess();
  }, [navigate]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const response = await axios.post('http://localhost:9999/send-otp', {
        phone_no: phoneNo,
        company_email: companyEmail,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (response.data.success) {
        setIsOtpSent(true);
        setSuccessMessage('OTPs sent successfully. Please check your email and phone.');
        setClientId(response.data.clientId);
      }
    } catch (error) {
      setErrorMessage(error.response ? error.response.data.message : 'Error sending OTPs.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await axios.post('http://localhost:9999/verify-otp', {
        emailOTP: emailOtp,
        mobileOTP: phoneOtp,
        clientId: clientId,
      });

      if (response.data.success) {
        setSuccessMessage('OTPs verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = response.data.redirectUrl;
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error.response ? error.response.data.message : 'Error verifying OTPs.');
    } finally {
      setIsVerifying(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isOtpSent ? 'Verify Sign Up' : 'Verify Email and Phone Number'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6 text-center">
            {isOtpSent
              ? 'Enter the OTPs sent to your email and mobile'
              : 'Click below to become verified and create posts!'}
          </p>
          <div className="space-y-4">
            {isOtpSent && (
              <>
                <div className="flex items-center space-x-2">
                  <Mail className="text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter phone OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                  />
                </div>
              </>
            )}
            {!isOtpSent && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Sending...' : 'Send OTP'}
              </Button>
            )}
            {isOtpSent && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            )}
          </div>
          {errorMessage && <p className="text-red-500 text-center mt-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-center mt-4">{successMessage}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
