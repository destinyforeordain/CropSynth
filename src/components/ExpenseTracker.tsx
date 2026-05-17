"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ExpenseTrackerProps {
  farmId: string;
}

interface Expense {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  unit: string;
  cost: number;
  date: string;
  notes?: string;
}

interface Sale {
  id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  buyer_info?: {
    name?: string;
    contact?: string;
  };
  sale_date: string;
}

const EXPENSE_CATEGORIES = [
  { value: "seeds", label: "Seeds", icon: "🌱" },
  { value: "fertilizers", label: "Fertilizers", icon: "🧪" },
  { value: "pesticides", label: "Pesticides", icon: "🚿" },
  { value: "labor", label: "Labor", icon: "👷" },
  { value: "equipment", label: "Equipment", icon: "🚜" },
  { value: "other", label: "Other", icon: "📦" },
];

export function ExpenseTracker({ farmId }: ExpenseTrackerProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "sales">("expenses");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    itemName: "",
    quantity: "",
    unit: "",
    cost: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const [saleForm, setSaleForm] = useState({
    cropName: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
    buyerName: "",
    buyerContact: "",
    saleDate: new Date().toISOString().split('T')[0],
  });

  // Fetch data on component mount and when farmId changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [expensesResponse, salesResponse] = await Promise.all([
          supabase
            .from('expenses')
            .select('*')
            .eq('farm_id', farmId)
            .order('date', { ascending: false })
            .limit(20),
          supabase
            .from('sales')
            .select('*')
            .eq('farm_id', farmId)
            .order('sale_date', { ascending: false })
            .limit(20)
        ]);

        if (expensesResponse.error) throw expensesResponse.error;
        if (salesResponse.error) throw salesResponse.error;

        setExpenses(expensesResponse.data || []);
        setSales(salesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchData();
    }
  }, [farmId, supabase]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseForm.category || !expenseForm.itemName || !expenseForm.cost) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          farm_id: farmId,
          category: expenseForm.category,
          item_name: expenseForm.itemName,
          quantity: expenseForm.quantity ? parseFloat(expenseForm.quantity) : null,
          unit: expenseForm.unit || null,
          cost: parseFloat(expenseForm.cost),
          date: expenseForm.date,
          notes: expenseForm.notes || null,
        });

      if (error) throw error;

      toast.success("Expense logged successfully! 💰");

      // Reset form
      setExpenseForm({
        category: "",
        itemName: "",
        quantity: "",
        unit: "",
        cost: "",
        date: new Date().toISOString().split('T')[0],
        notes: "",
      });
      setShowExpenseForm(false);

      // Refresh expenses
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(20);

      if (!fetchError && data) {
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to log expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saleForm.cropName || !saleForm.quantity || !saleForm.pricePerUnit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const quantity = parseFloat(saleForm.quantity);
      const pricePerUnit = parseFloat(saleForm.pricePerUnit);
      const totalAmount = quantity * pricePerUnit;

      const { error } = await supabase
        .from('sales')
        .insert({
          farm_id: farmId,
          crop_name: saleForm.cropName,
          quantity,
          unit: saleForm.unit || 'kg',
          price_per_unit: pricePerUnit,
          total_amount: totalAmount,
          buyer_info: {
            name: saleForm.buyerName || null,
            contact: saleForm.buyerContact || null,
          },
          sale_date: saleForm.saleDate,
        });

      if (error) throw error;

      toast.success("Sale recorded successfully! 💰");

      // Reset form
      setSaleForm({
        cropName: "",
        quantity: "",
        unit: "",
        pricePerUnit: "",
        buyerName: "",
        buyerContact: "",
        saleDate: new Date().toISOString().split('T')[0],
      });
      setShowSaleForm(false);

      // Refresh sales
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('farm_id', farmId)
        .order('sale_date', { ascending: false })
        .limit(20);

      if (!fetchError && data) {
        setSales(data);
      }
    } catch (error) {
      console.error("Error recording sale:", error);
      toast.error("Failed to record sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
    return cat?.icon || "📦";
  };

  // Calculate financial summary
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.cost, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{totalExpenses}</p>
            </div>
            <div className="text-3xl">💸</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{totalRevenue}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{netProfit}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Profit Margin</p>
              <p className={`text-2xl font-bold ${
                profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === "expenses"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>💸</span>
              <span>Expenses</span>
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === "sales"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>💰</span>
              <span>Sales</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "expenses" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                  <p className="text-sm text-gray-600">Track your farming expenses</p>
                </div>
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {showExpenseForm ? "Cancel" : "Add Expense"}
                </button>
              </div>

              {/* Add Expense Form */}
              {showExpenseForm && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Expense</h4>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={expenseForm.itemName}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, itemName: e.target.value }))}
                          placeholder="e.g., Urea Fertilizer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={expenseForm.quantity}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={expenseForm.unit}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="kg, bags, liters"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={expenseForm.cost}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, cost: e.target.value }))}
                          placeholder="500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this expense..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={2}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Adding..." : "Add Expense"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExpenseForm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Expenses List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading expenses...</p>
                  </div>
                ) : expenses && expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <div key={expense.id} className="bg-white border rounded-lg p-4 hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{expense.item_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{expense.category}</p>
                            <p className="text-xs text-gray-500">
                              {expense.quantity} {expense.unit} • {new Date(expense.date).toLocaleDateString()}
                            </p>
                            {expense.notes && (
                              <p className="text-sm text-gray-600 mt-1">{expense.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">₹{expense.cost}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💸</div>
                    <p className="text-gray-500">No expenses recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
                  <p className="text-sm text-gray-600">Track your crop sales and revenue</p>
                </div>
                <button
                  onClick={() => setShowSaleForm(!showSaleForm)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {showSaleForm ? "Cancel" : "Record Sale"}
                </button>
              </div>

              {/* Add Sale Form */}
              {showSaleForm && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Record New Sale</h4>
                  <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Crop Name *
                        </label>
                        <input
                          type="text"
                          value={saleForm.cropName}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, cropName: e.target.value }))}
                          placeholder="e.g., Rice, Coconut"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sale Date *
                        </label>
                        <input
                          type="date"
                          value={saleForm.saleDate}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, saleDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={saleForm.quantity}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={saleForm.unit}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="kg, bags, tons"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price per Unit (₹) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={saleForm.pricePerUnit}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                          placeholder="25"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buyer Name
                        </label>
                        <input
                          type="text"
                          value={saleForm.buyerName}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, buyerName: e.target.value }))}
                          placeholder="Buyer's name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buyer Contact
                        </label>
                        <input
                          type="text"
                          value={saleForm.buyerContact}
                          onChange={(e) => setSaleForm(prev => ({ ...prev, buyerContact: e.target.value }))}
                          placeholder="Phone or email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {saleForm.quantity && saleForm.pricePerUnit && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                          Total Amount: <span className="font-bold text-lg">
                            ₹{(parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerUnit)).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Recording..." : "Record Sale"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaleForm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sales List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading sales...</p>
                  </div>
                ) : sales && sales.length > 0 ? (
                  sales.map((sale) => (
                    <div key={sale.id} className="bg-white border rounded-lg p-4 hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">🌾</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{sale.crop_name}</h4>
                            <p className="text-sm text-gray-600">
                              {sale.quantity} {sale.unit} @ ₹{sale.price_per_unit}/{sale.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(sale.sale_date).toLocaleDateString()}
                            </p>
                            {sale.buyer_info?.name && (
                              <p className="text-sm text-gray-600 mt-1">
                                Buyer: {sale.buyer_info.name}
                                {sale.buyer_info.contact && ` (${sale.buyer_info.contact})`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{sale.total_amount}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💰</div>
                    <p className="text-gray-500">No sales recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}