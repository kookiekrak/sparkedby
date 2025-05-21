import WaitlistForm from './WaitlistForm';
import { Mail } from 'lucide-react';

/**
 * EmailSignup Component
 * 
 * A standalone component for email signup, to be displayed below the calculator
 */
const EmailSignup = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-2 bg-teal-100 rounded-full mb-4">
            <Mail className="text-teal-600" size={24} />
          </div>
          
          <h2 className="text-3xl font-bold mb-3 text-gray-800">
            Get Early Access
          </h2>
          
          <p className="text-xl text-gray-600 mb-8">
            Join our waitlist to be the first to try the full FriendSplit app with more features,
            mobile access, and the ability to share.
          </p>
          
          <div className="max-w-md mx-auto">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmailSignup;
