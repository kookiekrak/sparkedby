import { useState, FormEvent, ChangeEvent } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * WaitlistForm Component
 * 
 * This component provides a waitlist signup form that connects to a backend API
 * to collect user email addresses.
 * 
 * Configuration:
 * - Set VITE_API_URL in .env file to configure the API endpoint
 * - Set VITE_COMPANY_NAME to customize success message
 */
const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('submitting');
    
    // Make actual API call to waitlist service
    try {
      const response = await fetch(import.meta.env.VITE_API_URL || 'http://localhost:3001/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }
      
      // Success handling
      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={status === 'submitting' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          className="absolute right-1 top-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-70"
        >
          {status === 'submitting' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            'Get Early Access'
          )}
        </button>
      </form>
      
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      )}
      
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mt-3 animate-fade-in">
          <p className="text-sm font-medium">
            Thanks for signing up! We'll notify you when {import.meta.env.VITE_COMPANY_NAME || 'SparkedBy'} is ready to help you create your first landing page.
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitlistForm;
