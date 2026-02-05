import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Download, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PayrollForm from '../components/payroll/PayrollForm';

export default function ManpowerPayroll() {
  const [user, setUser] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin' && currentUser.job_role !== 'director') {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);

      const data = await base44.entities.ManpowerPayroll.filter({});
      const filtered = data.filter(p => p.month_year.startsWith(selectedMonth));
      setPayrolls(filtered);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    try {
      await base44.entities.ManpowerPayroll.delete(id);
      toast.success('✅ Record deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingId(null);
    loadData();
  };

  const totalGrossPay = payrolls.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
  const totalNetPay = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.total_deductions || 0), 0);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You do not have permission to access this page. Only admins and directors can manage payroll.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manpower Payroll</h1>
            <p className="text-gray-600 mt-2">Manage monthly employee payroll and deductions</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setIsFormOpen(true);
            }}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Payroll Record
          </Button>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium">Filter by Month:</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = format(date, 'yyyy-MM');
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {format(date, 'MMMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gross Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">SGD {totalGrossPay.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{payrolls.length} employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">SGD {totalDeductions.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Levy, CPF, Rental, etc</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Net Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">SGD {totalNetPay.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">After all deductions</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              {format(new Date(selectedMonth), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payrolls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No payroll records for this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Employee</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Base Salary</th>
                      <th className="text-right p-3 font-semibold text-gray-700">OT Pay</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Gross</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Deductions</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Net Pay</th>
                      <th className="p-3 font-semibold text-gray-700">Status</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map(payroll => (
                      <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{payroll.employee_name}</td>
                        <td className="p-3 text-right text-gray-900">{payroll.base_salary.toFixed(2)}</td>
                        <td className="p-3 text-right text-blue-600 font-medium">{(payroll.overtime_pay || 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">{(payroll.gross_pay || 0).toFixed(2)}</td>
                        <td className="p-3 text-right text-red-600">{(payroll.total_deductions || 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-green-600">{(payroll.net_pay || 0).toFixed(2)}</td>
                        <td className="p-3">
                          <Badge variant={payroll.payment_status === 'paid' ? 'default' : 'outline'}>
                            {payroll.payment_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setEditingId(payroll.id);
                                setIsFormOpen(true);
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(payroll.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Payroll Record' : 'Create Payroll Record'}
            </DialogTitle>
          </DialogHeader>
          <PayrollForm
            payrollId={editingId}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}