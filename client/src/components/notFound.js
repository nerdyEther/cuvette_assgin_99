

import React from 'react';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-700">404 - Page Not Found</h1>
        <p className="mt-4 text-gray-500">Sorry, the page you are looking for does not exist.</p>
        <a href="/" className="mt-6 inline-block text-blue-500 hover:underline">Go Back Home</a>
      </div>
    </div>
  );
};

export default NotFound;
