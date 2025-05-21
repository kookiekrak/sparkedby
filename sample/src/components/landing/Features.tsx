
import { 
  Zap, 
  BarChart3, 
  Shield, 
  Users, 
  Layers, 
  Smartphone 
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fade-in opacity-0">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: "Instant Page Generation",
      description: "Create beautiful, conversion-optimized landing pages in minutes with our intuitive page builder — no coding required."
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Signup Analytics",
      description: "Track visitor behavior and signup conversions with real-time analytics to validate your business idea before building."
    },
    {
      icon: <Shield size={24} />,
      title: "Custom Domains",
      description: "Connect your own domain or use our free subdomain to create a professional online presence for your idea."
    },
    {
      icon: <Users size={24} />,
      title: "Audience Insights",
      description: "Collect and analyze user feedback directly through your landing page to refine your value proposition."
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
