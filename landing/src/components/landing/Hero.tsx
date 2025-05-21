
import WaitlistForm from './WaitlistForm';

const Hero: React.FC = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-70"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Validate Your 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Business Ideas </span>
              in Minutes
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 animate-fade-in opacity-0 animation-delay-200">
              SparkedBy generates beautiful landing pages instantly to help you collect signups 
              and validate your ideas without building a full product.
            </p>
            
            <div className="mb-8 animate-fade-in opacity-0 animation-delay-400">
              <WaitlistForm />
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 animate-fade-in opacity-0 animation-delay-600">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-700">No coding required</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-700">Ready in 5 minutes</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-700">Data-driven insights</span>
              </div>
            </div>
          </div>
          
          {/* Hero image */}
          <div className="flex-1 w-full max-w-lg animate-fade-in opacity-0 animation-delay-800">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl transform rotate-3"></div>
              <div className="relative rounded-xl shadow-2xl transform -rotate-3 transition-transform hover:rotate-0 duration-500 overflow-hidden border border-gray-200 bg-white">
                {/* Mockup of landing page generator UI */}
                <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="w-64 h-6 bg-white/20 rounded-md"></div>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/20"></div>
                    <div className="w-6 h-6 rounded-full bg-white/20"></div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-10 w-3/4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded mb-6"></div>
                  
                  <div className="flex space-x-4 mb-6">
                    <div className="w-1/2 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                    </div>
                    <div className="w-1/2 space-y-2">
                      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-4 w-full bg-gray-100 rounded"></div>
                      <div className="h-4 w-full bg-gray-100 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                      <div className="h-8 w-full bg-blue-500 rounded-md mt-4"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-4">
                    <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-100 rounded-lg"></div>
                    <div className="h-24 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
