import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PayrollForm({ payrollId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(!!payrollId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    month_year: format(new Date(), 'yyyy-MM-01'),
    employee_name: '',
    base_salary: 0,
    overtime_hours: 0,
    overtime_rate: 15,
    levy: 0,
    rental: 0,
    cpf_contribution: 0,
    other_deductions: 0,
    allowances: 0,
    notes: ''
  });

  useEffect(() => {
    if (payrollId) {
      loadPayroll();
    }
  }, [payrollId]);

  const loadPayroll = async () => {
    try {
      const data = await base44.entities.ManpowerPayroll.read(payrollId);
      setFormData(data);
    } catch (error) {
      console.error('Failed to load payroll:', error);
      toast.error('Failed to load payroll record');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = () => {
    const overtime_pay = formData.overtime_hours * formData.overtime_rate;
    const cpf_amount = (formData.base_salary + overtime_pay) * (formData.cpf_contribution / 100);
    const gross_pay = formData.base_salary + overtime_pay + formData.allowances;
    const total_deductions = formData.levy + formData.rental + cpf_amount + formData.other_deductions;
    const net_pay = gross_pay - total_deductions;

    return {
      overtime_pay: Math.round(overtime_pay * 100) / 100,
      cpf_amount: Math.round(cpf_amount * 100) / 100,
      gross_pay: Math.round(gross_pay * 100) / 100,
      total_deductions: Math.round(total_deductions * 100) / 100,
      net_pay: Math.round(net_pay * 100) / 100
    };
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'month_year' ? value : (isNaN(value) ? 0 : parseFloat(value))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const calculations = calculatePayroll();
      const payload = { ...formData, ...calculations };

      if (payrollId) {
        await base44.entities.ManpowerPayroll.update(payrollId, payload);
        toast.success('✅ Payroll updated');
      } else {
        await base44.entities.ManpowerPayroll.create(payload);
        toast.success('✅ Payroll record created');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save payroll:', error);
      toast.error('Failed to save payroll record');
    } finally {
      setSaving(false);
    }
  };

  const calculations = calculatePayroll();

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>Enter employee details and payroll period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Month & Year</Label>
              <Input
                type="date"
                value={formData.month_year}
                onChange={(e) => handleChange('month_year', e.target.value)}
              />
            </div>
            <div>
              <Label>Employee Name</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) => handleChange('employee_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salary & Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Base Salary (SGD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => handleChange('base_salary', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Allowances (SGD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.allowances}
                onChange={(e) => handleChange('allowances', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Overtime Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.overtime_hours}
                onChange={(e) => handleChange('overtime_hours', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>OT Rate (SGD/hour)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.overtime_rate}
                onChange={(e) => handleChange('overtime_rate', e.target.value)}
                placeholder="15"
              />
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">OT Pay: SGD {calculations.overtime_pay.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Foreign Worker Levy (SGD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.levy}
                onChange={(e) => handleChange('levy', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Rental/Accommodation (SGD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.rental}
                onChange={(e) => handleChange('rental', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>CPF Contribution (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cpf_contribution}
                onChange={(e) => handleChange('cpf_contribution', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Other Deductions (SGD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.other_deductions}
                onChange={(e) => handleChange('other_deductions', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900">CPF Amount: SGD {calculations.cpf_amount.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Gross Pay:</span>
              <span className="text-gray-900 font-semibold">SGD {calculations.gross_pay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total Deductions:</span>
              <span className="text-red-600 font-semibold">-SGD {calculations.total_deductions.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-bold text-base">Net Pay:</span>
              <span className="text-green-600 font-bold text-base">SGD {calculations.net_pay.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any additional notes..."
            className="min-h-20"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Payroll Record
            </>
          )}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}