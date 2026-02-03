import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle2, Clock } from "lucide-react";

export default function CommissionWidget({ user }) {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({ pending: 0, paid: 0, total: 0 });

  useEffect(() => {
    if (user) {
      loadCommissions();
    }
  }, [user]);

  const loadCommissions = async () => {
    try {
      const data = await base44.entities.SalesCommission.filter(
        { salesperson_email: user.email },
        "-created_date"
      );
      setCommissions(data);

      // Calculate stats
      const pending = data.filter(c => c.payment_status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const paid = data.filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const total = data.reduce((sum, c) => sum + c.commission_amount, 0);

      setStats({ pending, paid, total });
    } catch (error) {
      console.error("Error loading commissions:", error);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          My Commissions
        </CardTitle>
        <CardDescription>5% commission on closed deals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ${stats.total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Total Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              ${stats.pending.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${stats.paid.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Paid</p>
          </div>
        </div>

        {commissions.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commissions.slice(0, 5).map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    ${commission.commission_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {commission.commission_type === 'deposit' ? 'Deposit' : 'Final'} Payment
                  </p>
                </div>
                <Badge
                  variant={commission.payment_status === 'paid' ? 'default' : 'secondary'}
                  className={commission.payment_status === 'paid' ? 'bg-green-600' : 'bg-amber-500'}
                >
                  {commission.payment_status === 'paid' ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {commissions.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No commissions yet. Close deals to start earning!
          </p>
        )}
      </CardContent>
    </Card>
  );
}