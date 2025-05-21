
import { 
  CreditCard, 
  PieChart, 
  Users, 
  Receipt, 
  Calculator, 
  Smartphone, 
  PartyPopper
} from 'lucide-react';

/**
 * Features Component for FriendSplit
 * 
 * Displays a fun, colorful grid of expense sharing app features.
 */


interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fade-in opacity-0">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-teal-100 to-emerald-100">
        <div className="text-teal-600">
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
      icon: <Users size={24} />,
      title: "Group Expenses",
      description: "Create friend groups for trips, roommates, or events. Track who paid what and who owes whom with ease."
    },
    {
      icon: <Calculator size={24} />,
      title: "Smart Splitting",
      description: "Split bills equally or customize amounts for each person. Perfect for when someone ordered extra appetizers!"
    },
    {
      icon: <Receipt size={24} />,
      title: "Expense History",
      description: "View your complete payment history with detailed records of all shared expenses and settlements."
    },
    {
      icon: <CreditCard size={24} />,
      title: "Easy Payments",
      description: "Settle debts instantly through the app with secure payment processing. No more 'I'll pay you later'!"
    },
    {
      icon: <PieChart size={24} />,
      title: "Expense Analytics",
      description: "See where your money goes with beautiful charts and spending analytics. Track group expenses over time."
    },
    {
      icon: <Smartphone size={24} />,
      title: "Mobile & Desktop",
      description: "Access FriendSplit on any device. Split bills on the go or manage expenses from your computer."
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-teal-50" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <PartyPopper className="h-8 w-8 text-teal-500" />
            <span>Why You'll Love FriendSplit</span>
          </h2>
          <p className="text-xl text-gray-600">Split expenses with friends without the awkward money talk!</p>
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
