import { CreditCard, Receipt, ArrowRight } from 'lucide-react';

interface Person {
  id: string;
  name: string;
}

interface Payment {
  from: string;
  to: string;
  amount: number;
}

interface PaymentDetailsProps {
  payments: Payment[];
  people: Person[];
}

const PaymentDetails = ({ payments, people }: PaymentDetailsProps) => {
  if (payments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="text-teal-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
        </div>
        
        <div className="text-gray-500 italic">
          Add some expenses and people to see the optimized payment plan here.
        </div>
      </div>
    );
  }

  const getPersonNameById = (id: string): string => {
    return people.find(p => p.id === id)?.name || '';
  };

  // Calculate totals for additional insights
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const uniquePayers = new Set(payments.map(p => p.from)).size;
  const uniqueReceivers = new Set(payments.map(p => p.to)).size;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="text-teal-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Optimized Payments</h2>
        </div>
        <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded font-medium text-sm">
          {payments.length} Transaction{payments.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        {payments.map((payment, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="min-w-[30px] h-[30px] flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <span className="font-medium text-gray-800">{getPersonNameById(payment.from)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500">
              <ArrowRight size={16} />
              <span className="font-bold text-teal-600">${payment.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex-1 text-right">
              <span className="font-medium text-gray-800">{getPersonNameById(payment.to)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Payment Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-teal-50 p-3 rounded-lg">
          <div className="text-teal-700 font-bold text-xl">${totalAmount.toFixed(2)}</div>
          <div className="text-gray-600 text-sm">Total</div>
        </div>
        <div className="bg-teal-50 p-3 rounded-lg">
          <div className="text-teal-700 font-bold text-xl">{uniquePayers}</div>
          <div className="text-gray-600 text-sm">Payers</div>
        </div>
        <div className="bg-teal-50 p-3 rounded-lg">
          <div className="text-teal-700 font-bold text-xl">{uniqueReceivers}</div>
          <div className="text-gray-600 text-sm">Receivers</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
