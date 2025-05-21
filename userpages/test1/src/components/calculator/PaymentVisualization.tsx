import { useEffect, useRef } from 'react';
import { CreditCard, Info } from 'lucide-react';

interface Person {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  sharedWith: string[];
}

interface Payment {
  from: string;
  to: string;
  amount: number;
}

interface Balance {
  id: string;
  name: string;
  value: number;
}

interface RawTransaction {
  from: string;
  to: string;
  amount: number;
  description: string;
}

interface PaymentVisualizationProps {
  payments: Payment[];
  people: Person[];
  expenses: Expense[];
}

const PaymentVisualization = ({ payments, people, expenses }: PaymentVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate raw transactions (before optimization)
  const calculateRawTransactions = (): RawTransaction[] => {
    if (!expenses.length) return [];
    
    const transactions: RawTransaction[] = [];
    
    expenses.forEach(expense => {
      const { amount, paidBy, sharedWith, description } = expense;
      if (sharedWith.length === 0) return;
      
      // Amount per person
      const splitAmount = amount / sharedWith.length;
      
      // For each person who shared the expense (except the payer)
      sharedWith.forEach(personId => {
        if (personId !== paidBy) {
          transactions.push({
            from: personId,
            to: paidBy,
            amount: splitAmount,
            description
          });
        }
      });
    });
    
    return transactions;
  };

  // Calculate how many transactions were eliminated by the optimization
  const getOptimizationSavings = (): { 
    beforeCount: number, 
    afterCount: number, 
    savingsPercent: number 
  } => {
    const rawTransactions = calculateRawTransactions();
    const beforeCount = rawTransactions.length;
    const afterCount = payments.length;
    const savingsPercent = beforeCount > 0 
      ? Math.round(((beforeCount - afterCount) / beforeCount) * 100) 
      : 0;
    
    return { beforeCount, afterCount, savingsPercent };
  };

  // Calculate individual balances (who owes what in total)
  const calculateBalances = (): Balance[] => {
    const balances: Record<string, number> = {};
    
    // Initialize balances
    people.forEach(person => {
      balances[person.id] = 0;
    });
    
    // Calculate each expense's contribution to balances
    expenses.forEach(expense => {
      const { amount, paidBy, sharedWith } = expense;
      if (sharedWith.length === 0) return;
      
      // The person who paid gets credit
      balances[paidBy] += amount;
      
      // Each person who shares the expense gets debited
      const splitAmount = amount / sharedWith.length;
      sharedWith.forEach(personId => {
        balances[personId] -= splitAmount;
      });
    });
    
    return people.map(person => ({
      id: person.id,
      name: person.name,
      value: balances[person.id]
    }));
  };

  // Draw the payment visualization
  useEffect(() => {
    if (!canvasRef.current || people.length < 2 || !payments.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate positions for each person in a circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    const positions: Record<string, { x: number, y: number }> = {};
    const colors: Record<string, string> = {};
    const balances = calculateBalances();
    
    // Color palette
    const positiveColor = '#34D399'; // Green
    const negativeColor = '#F87171'; // Red
    const neutralColor = '#9CA3AF'; // Gray
    
    // Assign positions and colors
    people.forEach((person, index) => {
      const angle = (2 * Math.PI * index) / people.length - Math.PI / 2;
      positions[person.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
      
      // Find balance for this person
      const balance = balances.find(b => b.id === person.id);
      if (balance) {
        if (balance.value > 0.01) {
          colors[person.id] = positiveColor; // Creditor
        } else if (balance.value < -0.01) {
          colors[person.id] = negativeColor; // Debtor
        } else {
          colors[person.id] = neutralColor; // Neutral
        }
      } else {
        colors[person.id] = neutralColor;
      }
    });
    
    // Draw connections (payments)
    ctx.lineWidth = 2;
    
    payments.forEach(payment => {
      const fromPos = positions[payment.from];
      const toPos = positions[payment.to];
      
      if (fromPos && toPos) {
        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.strokeStyle = '#10B981'; // Teal color
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
        ctx.beginPath();
        ctx.moveTo(toPos.x, toPos.y);
        ctx.lineTo(
          toPos.x - 10 * Math.cos(angle - Math.PI / 6),
          toPos.y - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toPos.x - 10 * Math.cos(angle + Math.PI / 6),
          toPos.y - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#10B981';
        ctx.fill();
        
        // Draw amount text
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(midX, midY, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#4B5563';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`$${payment.amount.toFixed(0)}`, midX, midY);
      }
    });
    
    // Draw person nodes
    people.forEach(person => {
      const pos = positions[person.id];
      if (pos) {
        // Draw circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = colors[person.id];
        ctx.fill();
        
        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(person.name.charAt(0).toUpperCase(), pos.x, pos.y);
        
        // Draw person name below circle
        ctx.fillStyle = '#1F2937';
        ctx.font = '12px Arial';
        ctx.fillText(person.name, pos.x, pos.y + 35);
      }
    });
  }, [people, payments, expenses]);

  const { beforeCount, afterCount, savingsPercent } = getOptimizationSavings();

  // Generate explanation text
  const generateExplanation = (): string => {
    if (!payments.length) return '';
    
    const balances = calculateBalances();
    const creditors = balances.filter(b => b.value > 0.01);
    const debtors = balances.filter(b => b.value < -0.01);
    
    if (creditors.length === 0 || debtors.length === 0) return '';
    
    let explanation = `Without optimization, there would be ${beforeCount} separate transactions. `;
    explanation += `With optimization, we've reduced it to ${afterCount} transactions (${savingsPercent}% fewer transfers).`;
    
    return explanation;
  };

  // If there's no data, show placeholder
  if (!payments.length || !people.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-teal-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Payment Optimization</h2>
        </div>
        
        <div className="text-gray-500 italic">
          Add some expenses and people to see the payment visualization.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="text-teal-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Payment Optimization</h2>
        </div>
        
        <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
          {savingsPercent}% fewer transactions
        </div>
      </div>
      
      {/* Explanation */}
      <div className="mb-6 flex gap-2 bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
        <Info size={18} className="flex-shrink-0 mt-0.5" />
        <div>{generateExplanation()}</div>
      </div>
      
      {/* Visualization canvas */}
      <div className="h-64 w-full">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        ></canvas>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex gap-x-6 justify-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span>Gets paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span>Owes money</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>Neutral</span>
        </div>
      </div>
      
      {/* Optimization details */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Info size={18} />
          How FriendSplit Optimizes Your Payments
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Before Optimization:</h4>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600 mb-2">
                Without optimization, each expense creates separate transactions:
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {calculateRawTransactions().map((transaction, index) => (
                  <div 
                    key={index} 
                    className="text-xs p-1.5 bg-gray-50 border border-gray-100 rounded flex justify-between items-center"
                  >
                    <span className="font-medium">{people.find(p => p.id === transaction.from)?.name}</span>
                    <span className="text-gray-400 mx-1">pays</span>
                    <span className="font-medium">{people.find(p => p.id === transaction.to)?.name}</span>
                    <span className="text-blue-500 font-semibold ml-1">${transaction.amount.toFixed(2)}</span>
                    <span className="text-gray-400 ml-2 italic">({transaction.description})</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-red-50 p-2 rounded-lg text-sm">
                <span className="font-medium text-red-600">Problem:</span> {calculateRawTransactions().length} separate transactions!
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">After Optimization:</h4>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-600 mb-2">
                FriendSplit calculates net balances and creates the minimum number of transactions:
              </p>
              <div className="space-y-2">
                {payments.map((payment, index) => {
                  const fromPerson = people.find(p => p.id === payment.from);
                  const toPerson = people.find(p => p.id === payment.to);
                  return (
                    <div 
                      key={index} 
                      className="text-sm p-2 bg-teal-50 border border-teal-100 rounded flex justify-between items-center"
                    >
                      <span className="font-medium">{fromPerson?.name}</span>
                      <div className="flex items-center gap-1 text-teal-600">
                        <span>pays</span>
                        <span className="font-bold">${payment.amount.toFixed(2)}</span>
                        <span>to</span>
                      </div>
                      <span className="font-medium">{toPerson?.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 bg-green-50 p-2 rounded-lg text-sm">
                <span className="font-medium text-green-600">Result:</span> Only {payments.length} optimized transactions!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVisualization;
