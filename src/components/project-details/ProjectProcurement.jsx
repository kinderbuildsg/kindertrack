
import React, { useState, useEffect } from "react";
import { ProcurementItem } from "@/entities/ProcurementItem";
import { Project } from "@/entities/Project";
import { UploadFile } from "@/integrations/Core";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Loader2, Image, RefreshCw, X, Link as LinkIcon, Save, ExternalLink } from "lucide-react";

// Currency Converter Component
const CurrencyConverter = ({ value, fromCurrency }) => {
  const [convertedValue, setConvertedValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const convertCurrency = async () => {
    if (fromCurrency === 'SGD') return;
    setIsLoading(true);
    setConvertedValue(null);
    try {
      const rateString = await InvokeLLM({
        prompt: `What is the current exchange rate from ${fromCurrency} to SGD? Please provide only the number.`,
        add_context_from_internet: true
      });
      const rate = parseFloat(rateString);
      if (!isNaN(rate)) {
        setConvertedValue((value * rate).toFixed(2));
      } else {
        setConvertedValue('Error');
      }
    } catch (e) {
      console.error(e);
      setConvertedValue('Error');
    }
    setIsLoading(false);
  };

  if (fromCurrency === 'SGD') return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button variant="ghost" size="sm" onClick={convertCurrency} disabled={isLoading} className="h-auto p-1 text-xs text-sky-600 hover:text-sky-800">
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
      </Button>
      {convertedValue && <span className="text-xs text-gray-600">~ S$ {convertedValue}</span>}
    </div>);

};

// Main Procurement Component
export default function ProjectProcurement({ project, items, onUpdate }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("proposal1");
  const [proposalLinks, setProposalLinks] = useState({ 1: '', 2: '', 3: '' });
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setFormData({ ...isEditing });
      setImagePreview(isEditing.image_url);
      // When editing an item, set the active tab to its proposal number
      setActiveTab(`proposal${isEditing.proposal_number}`);
    } else {
      resetForm();
    }
    
    setProposalLinks({
        1: project.proposal_1_link || '',
        2: project.proposal_2_link || '',
        3: project.proposal_3_link || '',
    });
  }, [isEditing, project]);

  const resetForm = (proposalNumber = 1) => {
    setFormData({
      project_id: project.id,
      proposal_number: proposalNumber,
      item_name: "",
      supplier_price: "",
      supplier_currency: "SGD",
      selling_price: "",
      notes: "",
      image_url: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(null);
  };

  const handleLinkChange = (proposalNumber, value) => {
    setProposalLinks(prev => ({ ...prev, [proposalNumber]: value }));
  };

  const handleSaveLinks = async () => {
    setIsSavingLinks(true);
    try {
        await Project.update(project.id, {
            proposal_1_link: proposalLinks[1],
            proposal_2_link: proposalLinks[2],
            proposal_3_link: proposalLinks[3],
        });
        onUpdate(); 
    } catch (error) {
        console.error("Error saving proposal links:", error);
        alert("Failed to save links.");
    }
    setIsSavingLinks(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let updatedFormData = { ...formData };

    // Convert to numbers
    updatedFormData.supplier_price = parseFloat(updatedFormData.supplier_price) || 0;
    updatedFormData.selling_price = parseFloat(updatedFormData.selling_price) || 0;

    try {
      if (imageFile) {
        const { file_url } = await UploadFile({ file: imageFile });
        updatedFormData.image_url = file_url;
      }

      if (isEditing) {
        await ProcurementItem.update(isEditing.id, updatedFormData);
      } else {
        await ProcurementItem.create(updatedFormData);
      }

      onUpdate();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving item:", error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await ProcurementItem.delete(itemId);
      onUpdate();
    }
  };

  const renderProposal = (proposalNumber) => {
    const proposalItems = items.filter((i) => i.proposal_number === proposalNumber);
    const totalSupplierCost = proposalItems.reduce((sum, i) => {
      // Simple sum, conversion is display-only
      if (i.supplier_currency === 'SGD') return sum + (i.supplier_price || 0);
      return sum; // For now, only summing SGD prices for accuracy.
    }, 0);
    const totalSellingPrice = proposalItems.reduce((sum, i) => sum + (i.selling_price || 0), 0);
    const profit = totalSellingPrice - totalSupplierCost;
    const margin = totalSellingPrice > 0 ? profit / totalSellingPrice * 100 : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {proposalItems.map((item) =>
          <Card key={item.id} className="flex flex-col">
              <CardContent className="pt-4 flex-grow">
                {item.image_url ?
              <img src={item.image_url} alt={item.item_name} className="w-full h-32 object-cover rounded-md mb-3" /> :

              <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
              }
                <h4 className="font-bold">{item.item_name}</h4>
                <p className="text-sm text-gray-500">{item.notes}</p>
              </CardContent>
              <CardFooter className="flex-col items-start text-sm pt-4 border-t">
                <div className="w-full flex justify-between">
                    <span>Supplier:</span>
                    <span className="font-semibold">
                        {item.supplier_price?.toLocaleString()} {item.supplier_currency}
                    </span>
                </div>
                <CurrencyConverter value={item.supplier_price} fromCurrency={item.supplier_currency} />
                 <div className="w-full flex justify-between mt-2">
                    <span>Selling:</span>
                    <span className="font-semibold text-green-600">
                        {item.selling_price?.toLocaleString()} SGD
                    </span>
                </div>
                <div className="flex gap-2 mt-4 self-end">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => {setIsEditing(item);setOpenDialog(true);}}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {proposalItems.length === 0 &&
        <p className="text-center py-8 text-gray-500">No items added to this proposal yet.</p>
        }

        <Card className="mt-6 bg-gray-50">
            <CardHeader>
                <CardTitle className="text-lg">Proposal {proposalNumber} Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Total Supplier Cost (SGD)</p>
                    <p className="text-xl font-bold">S$ {totalSupplierCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Note: Only SGD prices are summed up.</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Total Selling Price</p>
                    <p className="text-xl font-bold text-green-600">S$ {totalSellingPrice.toLocaleString()}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Estimated Profit</p>
                    <p className={`text-xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>S$ {profit.toLocaleString()}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Profit Margin</p>
                    <p className="text-xl font-bold">{margin.toFixed(1)}%</p>
                </div>
            </CardContent>
        </Card>
      </div>);

  };

  return (
    <>
      <Card className="mb-6 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-sky-500" />
                Proposal Links
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[1, 2, 3].map(num => (
                <div key={num} className="flex items-center gap-2">
                    <Label htmlFor={`proposal-link-${num}`} className="w-24 shrink-0">Proposal {num}</Label>
                    <Input
                        id={`proposal-link-${num}`}
                        placeholder="Paste Google Drive link here..."
                        value={proposalLinks[num] || ''}
                        onChange={(e) => handleLinkChange(num, e.target.value)}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!proposalLinks[num]}
                        onClick={() => window.open(proposalLinks[num], '_blank')}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            ))}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveLinks} disabled={isSavingLinks}>
                {isSavingLinks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Links
            </Button>
        </CardFooter>
      </Card>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="proposal1">Proposal 1</TabsTrigger>
                <TabsTrigger value="proposal2">Proposal 2</TabsTrigger>
                <TabsTrigger value="proposal3">Proposal 3</TabsTrigger>
              </TabsList>
              <DialogTrigger asChild>
                  <Button onClick={() => resetForm(parseInt(activeTab.replace('proposal', '')))}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                  </Button>
              </DialogTrigger>
          </div>
          <TabsContent value="proposal1">{renderProposal(1)}</TabsContent>
          <TabsContent value="proposal2">{renderProposal(2)}</TabsContent>
          <TabsContent value="proposal3">{renderProposal(3)}</TabsContent>
        </Tabs>

        <DialogContent className="bg-slate-50 p-6 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit" : "Add"} Procurement Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="proposal_number">Proposal</Label>
                   <Select value={String(formData.proposal_number || 1)} onValueChange={(v) => setFormData((f) => ({ ...f, proposal_number: parseInt(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="1">Proposal 1</SelectItem>
                          <SelectItem value="2">Proposal 2</SelectItem>
                          <SelectItem value="3">Proposal 3</SelectItem>
                      </SelectContent>
                   </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input id="item_name" value={formData.item_name || ''} onChange={(e) => setFormData((f) => ({ ...f, item_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="supplier_price">Supplier Price</Label>
                      <Input id="supplier_price" type="number" value={formData.supplier_price || ''} onChange={(e) => setFormData((f) => ({ ...f, supplier_price: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="supplier_currency">Currency</Label>
                       <Select value={formData.supplier_currency || 'SGD'} onValueChange={(v) => setFormData((f) => ({ ...f, supplier_currency: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="SGD">SGD</SelectItem>
                              <SelectItem value="CNY">CNY</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                       </Select>
                  </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price (SGD)</Label>
                  <Input id="selling_price" type="number" value={formData.selling_price || ''} onChange={(e) => setFormData((f) => ({ ...f, selling_price: e.target.value }))} />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes || ''} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} />
              </div>
               <div className="space-y-2">
                  <Label>Image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
                  {imagePreview &&
              <div className="relative w-32 h-32 mt-2">
                          <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-md" />
                           <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6 rounded-full" onClick={() => {setImageFile(null);setImagePreview(null);setFormData((f) => ({ ...f, image_url: null }));}}>
                               <X className="w-4 h-4" />
                           </Button>
                      </div>
              }
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
