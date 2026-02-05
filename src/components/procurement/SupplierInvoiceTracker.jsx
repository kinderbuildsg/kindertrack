import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Loader2, FileText, Download, X } from "lucide-react";
import { format } from "date-fns";

export default function SupplierInvoiceTracker({ project, onUpdate }) {
  const [invoices, setInvoices] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    supplier_name: "",
    invoice_number: "",
    invoice_type: "pi",
    invoice_amount: "",
    currency: "USD",
    invoice_date: "",
    payment_date: "",
    delivery_date: "",
    payment_status: "pending",
    notes: ""
  });
  const [invoiceFile, setInvoiceFile] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [project.id]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.SupplierInvoice.filter({ project_id: project.id }, "-created_date", 100);
      setInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_name: "",
      invoice_number: "",
      invoice_type: "pi",
      invoice_amount: "",
      currency: "USD",
      invoice_date: "",
      payment_date: "",
      delivery_date: "",
      payment_status: "pending",
      notes: ""
    });
    setInvoiceFile(null);
    setIsEditing(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
    }
  };

  const handleSave = async () => {
    if (!formData.supplier_name || !formData.invoice_type || !formData.invoice_amount) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      let updatedData = {
        ...formData,
        project_id: project.id,
        invoice_amount: parseFloat(formData.invoice_amount)
      };

      // Upload invoice file if provided
      if (invoiceFile) {
        const upload = await base44.integrations.Core.UploadFile({ file: invoiceFile });
        updatedData.invoice_url = upload.file_url;
      }

      if (isEditing) {
        // For edit, only update if we have a new file
        if (!invoiceFile) {
          delete updatedData.invoice_url;
        }
        await base44.entities.SupplierInvoice.update(isEditing.id, updatedData);
      } else {
        if (!invoiceFile) {
          alert("Please upload an invoice/PI file");
          setIsSaving(false);
          return;
        }
        await base44.entities.SupplierInvoice.create(updatedData);
      }

      await loadInvoices();
      setOpenDialog(false);
      resetForm();
      onUpdate?.();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice");
    }
    setIsSaving(false);
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await base44.entities.SupplierInvoice.delete(invoiceId);
        await loadInvoices();
        onUpdate?.();
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const handleEdit = (invoice) => {
    setFormData({
      supplier_name: invoice.supplier_name,
      invoice_number: invoice.invoice_number,
      invoice_type: invoice.invoice_type,
      invoice_amount: invoice.invoice_amount,
      currency: invoice.currency,
      invoice_date: invoice.invoice_date,
      payment_date: invoice.payment_date,
      delivery_date: invoice.delivery_date,
      payment_status: invoice.payment_status,
      notes: invoice.notes
    });
    setIsEditing(invoice);
    setOpenDialog(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supplier Invoices & PIs</CardTitle>
          <Button onClick={() => { resetForm(); setOpenDialog(true); }} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Invoice / PI
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No invoices uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="border">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                      <div>
                        <Label className="text-xs text-gray-500">Supplier</Label>
                        <p className="font-semibold">{invoice.supplier_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {invoice.invoice_type.toUpperCase()} #{invoice.invoice_number}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Amount</Label>
                        <p className="font-semibold">{invoice.currency} {invoice.invoice_amount?.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          invoice.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </div>
                      <div className="text-xs">
                        <Label className="text-gray-500">Dates</Label>
                        {invoice.invoice_date && <p className="text-gray-600">Invoice: {format(new Date(invoice.invoice_date), 'dd MMM')}</p>}
                        {invoice.payment_date && <p className="text-gray-600">Paid: {format(new Date(invoice.payment_date), 'dd MMM')}</p>}
                        {invoice.delivery_date && <p className="text-gray-600">Delivered: {format(new Date(invoice.delivery_date), 'dd MMM')}</p>}
                      </div>
                      <div className="text-xs">
                        {invoice.notes && (
                          <>
                            <Label className="text-gray-500">Notes</Label>
                            <p className="text-gray-600 line-clamp-2">{invoice.notes}</p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(invoice.invoice_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit" : "Add"} Invoice / PI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input 
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                  placeholder="e.g., ABC Supplies Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_type">Document Type *</Label>
                <Select value={formData.invoice_type} onValueChange={(v) => setFormData({...formData, invoice_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pi">Proforma Invoice (PI)</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice / PI Number</Label>
                <Input 
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                  placeholder="e.g., INV-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_amount">Amount *</Label>
                <Input 
                  id="invoice_amount"
                  type="number"
                  step="0.01"
                  value={formData.invoice_amount}
                  onChange={(e) => setFormData({...formData, invoice_amount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date</Label>
                <Input 
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input 
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input 
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select value={formData.payment_status} onValueChange={(v) => setFormData({...formData, payment_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes..."
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_file">Invoice / PI File {!isEditing && "*"}</Label>
              <Input 
                id="invoice_file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {isEditing && <p className="text-xs text-gray-500">Leave blank to keep existing file</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}