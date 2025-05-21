import { useState } from 'react';
import ExpenseCalculator from '../calculator/ExpenseCalculator';
import PaymentDetails from '../calculator/PaymentDetails';
import PaymentVisualization from '../calculator/PaymentVisualization';

interface Person {
  id: string;
  name: string;
}

interface Payment {
  from: string;
  to: string;
  amount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedWith: string[];
}

/**
 * Hero Component for FriendSplit
 * 
 * A fun, friendly hero section with an interactive expense splitting calculator
 * and payment details display.
 */
const Hero = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const handlePaymentsCalculated = (newPayments: Payment[], newPeople: Person[], newExpenses: Expense[]) => {
    setPayments(newPayments);
    setPeople(newPeople);
    setExpenses(newExpenses);
  };
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50 opacity-70"></div>
      
      {/* Fun decorative elements */}
      <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-yellow-200 opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-teal-300 opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-emerald-300 opacity-20 animate-pulse"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Split Expenses
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600"> Without the Drama </span>
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto animate-fade-in opacity-0 animation-delay-200">
            FriendSplit makes it easy to track shared expenses, settle debts, and keep friendships intact.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in opacity-0 animation-delay-300">
          {/* Left side - Expense Calculator */}
          <div className="lg:w-2/3">
            <ExpenseCalculator 
              showPaymentsInline={false}
              onPaymentsCalculated={handlePaymentsCalculated}
            />
          </div>
          
          {/* Right side - Payment Details */}
          <div className="lg:w-1/3 flex-shrink-0">
            <PaymentDetails 
              payments={payments}
              people={people}
            />
          </div>
        </div>
        
        {/* Payment Visualization - full width below calculator */}
        <div className="mt-10 animate-fade-in opacity-0 animation-delay-500">
          <PaymentVisualization 
            payments={payments}
            people={people}
            expenses={expenses}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
