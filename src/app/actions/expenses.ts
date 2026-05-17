'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFarmExpenses(farmId: string, limit?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return []
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit || 50)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function getExpensesByDateRange(farmId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return []
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('farm_id', farmId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function addExpense(formData: {
  farmId: string
  category: 'seeds' | 'fertilizers' | 'pesticides' | 'labor' | 'equipment' | 'other'
  itemName: string
  quantity: number
  unit: string
  cost: number
  date: string
  receiptUrl?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', formData.farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    throw new Error('Farm not found or access denied')
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      farm_id: formData.farmId,
      category: formData.category,
      item_name: formData.itemName,
      quantity: formData.quantity,
      unit: formData.unit,
      cost: formData.cost,
      date: formData.date,
      receipt_url: formData.receiptUrl,
      notes: formData.notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to add expense')
  }

  revalidatePath('/dashboard')
  return data
}

export async function getFarmSales(farmId: string, limit?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return []
  }

  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit || 50)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function addSale(formData: {
  farmId: string
  cropName: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalAmount: number
  buyerInfo?: {
    name?: string
    contact?: string
  }
  saleDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', formData.farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    throw new Error('Farm not found or access denied')
  }

  const { data, error } = await supabase
    .from('sales')
    .insert({
      farm_id: formData.farmId,
      crop_name: formData.cropName,
      quantity: formData.quantity,
      unit: formData.unit,
      price_per_unit: formData.pricePerUnit,
      total_amount: formData.totalAmount,
      buyer_info: formData.buyerInfo,
      sale_date: formData.saleDate,
    })
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to add sale')
  }

  revalidatePath('/dashboard')
  return data
}

export async function getFinancialSummary(farmId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return null
  }

  // Get expenses
  let expensesQuery = supabase
    .from('expenses')
    .select('*')
    .eq('farm_id', farmId)

  if (startDate && endDate) {
    expensesQuery = expensesQuery
      .gte('date', startDate)
      .lte('date', endDate)
  }

  const { data: expenses, error: expensesError } = await expensesQuery

  if (expensesError) {
    console.error('Expenses Error:', expensesError)
  }

  // Get sales
  let salesQuery = supabase
    .from('sales')
    .select('*')
    .eq('farm_id', farmId)

  if (startDate && endDate) {
    salesQuery = salesQuery
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
  }

  const { data: sales, error: salesError } = await salesQuery

  if (salesError) {
    console.error('Sales Error:', salesError)
  }

  // Calculate totals
  const totalExpenses = (expenses || []).reduce((sum, expense) => sum + (expense.cost || 0), 0)
  const totalRevenue = (sales || []).reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Group expenses by category
  const expensesByCategory = (expenses || []).reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + (expense.cost || 0)
    return acc
  }, {} as Record<string, number>)

  return {
    totalExpenses,
    totalRevenue,
    netProfit,
    profitMargin,
    expensesByCategory,
    expenseCount: expenses?.length || 0,
    salesCount: sales?.length || 0,
  }
}