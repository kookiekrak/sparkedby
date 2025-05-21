import { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, Trash2, Calculator } from 'lucide-react';

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

interface ExpenseCalculatorProps {
  showPaymentsInline?: boolean;
  onPaymentsCalculated?: (payments: Payment[], people: Person[], expenses: Expense[]) => void;
}

const ExpenseCalculator = ({ 
  showPaymentsInline = true, 
  onPaymentsCalculated = () => {} 
}: ExpenseCalculatorProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showSampleData, setShowSampleData] = useState(true);

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: crypto.randomUUID(),
        name: newPersonName.trim()
      };
      setPeople([...people, newPerson]);
      setNewPersonName('');
    }
  };

  const removePerson = (id: string) => {
    setPeople(people.filter(person => person.id !== id));
    setExpenses(expenses.filter(expense => 
      expense.paidBy !== id && !expense.sharedWith.includes(id)
    ));
  };

  const addExpense = () => {
    // Get the first person or use empty string if no people exist
    const firstPersonId = people[0]?.id || '';
    
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      paidBy: firstPersonId,
      // Make sure payer is always included in sharedWith
      sharedWith: firstPersonId ? [firstPersonId] : []
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(expenses.map(expense => {
      if (expense.id === id) {
        // Create updated expense
        const updatedExpense = { ...expense, [field]: value };
        
        // If we're changing the payer, make sure they're included in sharedWith
        if (field === 'paidBy') {
          const paidBy = value as string;
          if (!updatedExpense.sharedWith.includes(paidBy)) {
            updatedExpense.sharedWith = [...updatedExpense.sharedWith, paidBy];
          }
        }
        
        return updatedExpense;
      }
      return expense;
    }));
  };

  const toggleExpenseShare = (expenseId: string, personId: string) => {
    setExpenses(expenses.map(expense => {
      if (expense.id === expenseId) {
        // If this is the person who paid, they must always be included in sharing
        // so we don't allow toggling them off
        if (personId === expense.paidBy) {
          return expense;
        }
        
        // Otherwise, toggle as normal
        const sharedWith = expense.sharedWith.includes(personId)
          ? expense.sharedWith.filter(id => id !== personId)
          : [...expense.sharedWith, personId];
        return { ...expense, sharedWith };
      }
      return expense;
    }));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const calculatePayments = () => {
    // Calculate net balances for each person
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
    
    // Create optimized payments
    const debtors = people
      .filter(person => balances[person.id] < -0.01) // People who owe money (negative balance)
      .map(person => ({ 
        id: person.id, 
        amount: Math.abs(balances[person.id])
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount, descending
      
    const creditors = people
      .filter(person => balances[person.id] > 0.01) // People who are owed money (positive balance)
      .map(person => ({ 
        id: person.id, 
        amount: balances[person.id]
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount, descending
    
    const optimizedPayments: Payment[] = [];
    
    // While there are still debtors and creditors
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      
      // Calculate payment amount (minimum of what's owed and what's due)
      const paymentAmount = Math.min(debtor.amount, creditor.amount);
      
      // Round to 2 decimal places for currency
      const roundedAmount = Math.round(paymentAmount * 100) / 100;
      
      if (roundedAmount > 0) {
        optimizedPayments.push({
          from: debtor.id,
          to: creditor.id,
          amount: roundedAmount
        });
      }
      
      // Update balances
      debtor.amount -= paymentAmount;
      creditor.amount -= paymentAmount;
      
      // Remove settled debtors/creditors
      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }
    
    setPayments(optimizedPayments);
  };

  const loadSampleData = () => {
    const samplePeople: Person[] = [
      { id: '1', name: 'Sarah' },
      { id: '2', name: 'Ben' },
      { id: '3', name: 'Valerie' }
    ];
    
    const sampleExpenses: Expense[] = [
      { 
        id: '1', 
        description: 'Dinner', 
        amount: 120, 
        paidBy: '1', 
        sharedWith: ['1', '2', '3'] 
      },
      { 
        id: '2', 
        description: 'Uber', 
        amount: 35, 
        paidBy: '2', 
        sharedWith: ['1', '2'] 
      },
      { 
        id: '3', 
        description: 'Groceries', 
        amount: 65.50, 
        paidBy: '3', 
        sharedWith: ['2', '3'] 
      }
    ];
    
    setPeople(samplePeople);
    setExpenses(sampleExpenses);
    setShowSampleData(false);
  };

  // Run calculation whenever expenses or people change
  useEffect(() => {
    if (expenses.length > 0 && people.length > 0) {
      calculatePayments();
    } else {
      setPayments([]);
    }
    
    // Notify parent component if provided
    if (onPaymentsCalculated) {
      onPaymentsCalculated(payments, [...people], [...expenses]);
    }
  }, [expenses, people, payments, onPaymentsCalculated]);

  const getPersonNameById = (id: string): string => {
    return people.find(p => p.id === id)?.name || '';
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <Calculator className="text-teal-500" size={24} />
          Expense Splitter
        </h2>
        
        {showSampleData && (
          <button
            onClick={loadSampleData}
            className="mb-4 bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200 transition-colors"
          >
            Load Sample Data
          </button>
        )}
      </div>
      
      {/* People Management */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">People</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Add a person..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          />
          <button 
            onClick={addPerson}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusCircle size={20} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {people.map(person => (
            <div 
              key={person.id}
              className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-lg"
            >
              <span>{person.name}</span>
              <button 
                onClick={() => removePerson(person.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Expenses */}
      {people.length >= 2 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold text-gray-700">Expenses</h3>
            <button 
              onClick={addExpense}
              className="bg-teal-100 text-teal-700 px-3 py-1 rounded-lg hover:bg-teal-200 transition-colors flex items-center gap-1"
            >
              <PlusCircle size={16} /> Add Expense
            </button>
          </div>
          
          {expenses.length === 0 && (
            <p className="text-gray-500 italic">No expenses yet. Add one to get started!</p>
          )}
          
          <div className="space-y-4">
            {expenses.map(expense => (
              <div key={expense.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-grow min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                      placeholder="e.g., Dinner, Movie tickets..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        <DollarSign size={16} />
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expense.amount || ''}
                        onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  
                  <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid by</label>
                    <select
                      value={expense.paidBy}
                      onChange={(e) => updateExpense(expense.id, 'paidBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {people.map(person => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end mb-1">
                    <button 
                      onClick={() => removeExpense(expense.id)}
                      className="text-red-500 hover:text-red-700 py-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Split with</label>
                  <div className="flex flex-wrap gap-2">
                    {/* Person who paid for the expense */}
                    <div className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white flex items-center gap-1">
                      <span>{getPersonNameById(expense.paidBy)}</span>
                      <span className="text-xs">(paid)</span>
                    </div>
                    
                    {/* People who might share the expense (excluding payer) */}
                    {people
                      .filter(person => person.id !== expense.paidBy)
                      .map(person => (
                        <div
                          key={person.id}
                          onClick={() => toggleExpenseShare(expense.id, person.id)}
                          className={`
                            cursor-pointer px-3 py-1 rounded-full text-sm transition-colors
                            ${expense.sharedWith.includes(person.id) 
                              ? 'bg-teal-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                          `}
                        >
                          {person.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Results - Only show if showPaymentsInline is true */}
      {showPaymentsInline && payments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3 text-gray-700">Payments</h3>
          
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
            <h4 className="font-medium text-teal-800 mb-2">Optimized Payment Plan</h4>
            
            {payments.map((payment, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded-md">
                <span className="font-medium text-gray-800">{getPersonNameById(payment.from)}</span> pays{' '}
                <span className="font-medium text-gray-800">{getPersonNameById(payment.to)}</span>{' '}
                <span className="font-medium text-teal-700">${payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCalculator;
