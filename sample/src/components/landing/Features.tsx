
import { 
  Zap, 
  BarChart3, 
  Shield, 
  Users, 
  Layers, 
  Smartphone 
} from 'lucide-react';

/**
 * Features Component
 * 
 * Displays a grid of product or service features.
 * 
 * Configuration:
 * - Customize the features array to highlight your product's benefits
 * - Set VITE_PRIMARY_COLOR and VITE_SECONDARY_COLOR for styling
 */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fade-in opacity-0">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" 
           style={{ background: `linear-gradient(to bottom right, ${import.meta.env.VITE_PRIMARY_COLOR || '#3b82f6'}20, ${import.meta.env.VITE_SECONDARY_COLOR || '#a855f7'}20)` }}>
        <div style={{ color: import.meta.env.VITE_PRIMARY_COLOR || '#3b82f6' }}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: "Feature One",
      description: "Describe a key feature of your product or service here. Focus on the benefits it provides to your users."
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Feature Two",
      description: "Highlight another important feature here. Explain how it solves a problem or adds value for your customers."
    },
    {
      icon: <Shield size={24} />,
      title: "Feature Three",
      description: "Showcase a third feature that makes your offering unique. What separates you from the competition?"
    },
    {
      icon: <Users size={24} />,
      title: "Feature Four",
      description: "Add details about another key benefit or feature that will resonate with your target audience."
    },
    {
      icon: <Layers size={24} />,
      title: "Flexible Templates",
      description: "Choose from dozens of industry-specific templates designed to showcase your unique business idea effectively."
    },
    {
      icon: <Smartphone size={24} />,
      title: "Mobile Optimization",
      description: "Every landing page is fully responsive and looks perfect on all devices, from desktops to smartphones."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Validate Ideas
            </span>
            {" "}Without Building Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate professional landing pages in minutes to collect signups and validate your business idea before investing time and resources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="animate-fade-in opacity-0" 
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
            >
              <FeatureCard 
                icon={feature.icon} 
                title={feature.title} 
                description={feature.description} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
