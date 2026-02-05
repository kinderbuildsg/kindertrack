import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Loader2, Image, RefreshCw, X } from "lucide-react";
import SupplierInvoiceTracker from "../procurement/SupplierInvoiceTracker";

// Currency Converter Component
const CurrencyConverter = ({ value, fromCurrency, onConverted }) => {
  const [convertedValue, setConvertedValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const convertCurrency = async () => {
    if (fromCurrency === 'SGD') return;
    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `What is the current exchange rate from ${fromCurrency} to SGD? Please provide only the number.`,
        add_context_from_internet: true
      });
      const rate = parseFloat(result);
      if (!isNaN(rate)) {
        const converted = parseFloat((value * rate).toFixed(2));
        setConvertedValue(converted);
        onConverted?.(converted);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  if (fromCurrency === 'SGD') return null;

  return (
    <Button variant="ghost" size="sm" onClick={convertCurrency} disabled={isLoading} className="h-auto p-1 text-xs text-sky-600">
      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
      {convertedValue && <span className="ml-1">≈ S${convertedValue}</span>}
    </Button>
  );
};

export default function ProjectProcurement({ project, onUpdate }) {
  const [items, setItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadItems();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadItems = async () => {
    try {
      const fetchedItems = await base44.entities.ProcurementItem.filter({ project_id: project.id });
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const resetForm = () => {
    setFormData({});
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(null);
    setItemType(null);
  };

  const openAddDialog = (type) => {
    resetForm();
    setItemType(type);
    if (type === 'playground') {
      setFormData({ item_type: 'playground', supplier_currency: 'USD' });
    } else if (type === 'fitness') {
      setFormData({ item_type: 'fitness', supplier_currency: 'RMB' });
    } else if (type === 'epdm') {
      setFormData({ item_type: 'epdm', area_sqm: '', cost_per_sqm: 47, selling_price_per_sqm: '' });
    } else if (type === 'misc') {
      setFormData({ item_type: 'misc', supplier_currency: 'SGD' });
    }
    setOpenDialog(true);
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
    try {
      let uploadedImageUrl = formData.image_url;
      if (imageFile) {
        const upload = await base44.integrations.Core.UploadFile({ file: imageFile });
        uploadedImageUrl = upload.file_url;
      }

      const dataToSave = {
        ...formData,
        project_id: project.id,
        image_url: uploadedImageUrl,
        proposal_number: formData.item_type === 'playground' ? 1 : formData.item_type === 'fitness' ? 1 : 2
      };

      if (isEditing) {
        await base44.entities.ProcurementItem.update(isEditing.id, dataToSave);
      } else {
        await base44.entities.ProcurementItem.create(dataToSave);
      }

      setOpenDialog(false);
      resetForm();
      loadItems();
      onUpdate?.();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item");
    }
    setIsSaving(false);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Delete this item?")) {
      await base44.entities.ProcurementItem.delete(itemId);
      loadItems();
      onUpdate?.();
    }
  };

  const handleEdit = (item) => {
    setIsEditing(item);
    setItemType(item.item_type);
    setFormData(item);
    setImagePreview(item.image_url);
    setOpenDialog(true);
  };

  const playgroundItems = items.filter(i => i.item_type === 'playground');
  const fitnessItems = items.filter(i => i.item_type === 'fitness');
  const epdmItems = items.filter(i => i.item_type === 'epdm');
  const miscItems = items.filter(i => i.item_type === 'misc');

  const calculatePlaygroundCost = (item) => {
    if (item.supplier_currency === 'SGD') return item.supplier_price || 0;
    return (item.supplier_price || 0) * (item.converted_sgd || 1);
  };

  const calculateEpdmCost = (item) => {
    return (item.area_sqm || 0) * (item.cost_per_sqm || 47);
  };

  const calculateEpdmSelling = (item) => {
    return (item.area_sqm || 0) * (item.selling_price_per_sqm || 0);
  };

  const totalPlaygroundCost = playgroundItems.reduce((sum, item) => sum + calculatePlaygroundCost(item), 0);
  const totalPlaygroundSelling = playgroundItems.reduce((sum, item) => sum + (item.selling_price || 0), 0);
  const totalFitnessCost = fitnessItems.reduce((sum, item) => sum + calculatePlaygroundCost(item), 0);
  const totalFitnessSelling = fitnessItems.reduce((sum, item) => sum + (item.selling_price || 0), 0);
  const totalEpdmCost = epdmItems.reduce((sum, item) => sum + calculateEpdmCost(item), 0);
  const totalEpdmSelling = epdmItems.reduce((sum, item) => sum + calculateEpdmSelling(item), 0);
  const totalMiscCost = miscItems.reduce((sum, item) => sum + (item.supplier_price || 0), 0);
  const totalMiscSelling = miscItems.reduce((sum, item) => sum + (item.selling_price || 0), 0);

  const grandTotalCost = totalPlaygroundCost + totalFitnessCost + totalEpdmCost + totalMiscCost;
  const grandTotalSelling = totalPlaygroundSelling + totalFitnessSelling + totalEpdmSelling + totalMiscSelling;

  return (
    <div className="space-y-6">
      {/* Invoice Tracker */}
      <SupplierInvoiceTracker project={project} onUpdate={onUpdate} />

      {/* Playground Set Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="flex items-center justify-between">
            <span>🎪 Playground Set</span>
            <Button size="sm" onClick={() => openAddDialog('playground')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {playgroundItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No playground items added yet</p>
          ) : (
            <div className="space-y-4">
              {playgroundItems.map(item => (
                <Card key={item.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.item_name} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{item.item_name}</p>
                          <p className="text-xs text-gray-500">{item.notes}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost Price</p>
                        <p className="font-semibold">S${calculatePlaygroundCost(item).toLocaleString()}</p>
                        {item.supplier_currency !== 'SGD' && (
                          <p className="text-xs text-gray-400">${item.supplier_price} {item.supplier_currency}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Selling Price</p>
                        <p className="font-semibold text-green-600">S${(item.selling_price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-purple-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="text-lg font-bold text-purple-700">S${totalPlaygroundCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Selling</p>
                      <p className="text-lg font-bold text-green-600">S${totalPlaygroundSelling.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-lg font-bold text-blue-600">S${(totalPlaygroundSelling - totalPlaygroundCost).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fitness Equipment Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardTitle className="flex items-center justify-between">
            <span>💪 Fitness Equipment</span>
            <Button size="sm" onClick={() => openAddDialog('fitness')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {fitnessItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No fitness items added yet</p>
          ) : (
            <div className="space-y-4">
              {fitnessItems.map(item => (
                <Card key={item.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.item_name} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{item.item_name}</p>
                          <p className="text-xs text-gray-500">{item.notes}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost Price</p>
                        <p className="font-semibold">S${calculatePlaygroundCost(item).toLocaleString()}</p>
                        {item.supplier_currency !== 'SGD' && (
                          <p className="text-xs text-gray-400">¥{item.supplier_price} {item.supplier_currency}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Selling Price</p>
                        <p className="font-semibold text-green-600">S${(item.selling_price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-orange-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="text-lg font-bold text-orange-700">S${totalFitnessCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Selling</p>
                      <p className="text-lg font-bold text-green-600">S${totalFitnessSelling.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-lg font-bold text-blue-600">S${(totalFitnessSelling - totalFitnessCost).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EPDM Flooring Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
          <CardTitle className="flex items-center justify-between">
            <span>🏃 EPDM Flooring</span>
            <Button size="sm" onClick={() => openAddDialog('epdm')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Area
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {epdmItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No EPDM areas added yet</p>
          ) : (
            <div className="space-y-4">
              {epdmItems.map(item => (
                <Card key={item.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-semibold">{item.item_name}</p>
                        <p className="text-sm text-gray-600">{item.area_sqm} m²</p>
                        <p className="text-xs text-gray-500">{item.notes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost (${item.cost_per_sqm}/m²)</p>
                        <p className="font-semibold">S${calculateEpdmCost(item).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Selling (${item.selling_price_per_sqm}/m²)</p>
                        <p className="font-semibold text-green-600">S${calculateEpdmSelling(item).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-red-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="text-lg font-bold text-red-700">S${totalEpdmCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Selling</p>
                      <p className="text-lg font-bold text-green-600">S${totalEpdmSelling.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-lg font-bold text-blue-600">S${(totalEpdmSelling - totalEpdmCost).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Miscellaneous Costing */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="flex items-center justify-between">
            <span>📋 Miscellaneous Costing</span>
            <Button size="sm" onClick={() => openAddDialog('misc')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {miscItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No miscellaneous items added yet</p>
          ) : (
            <div className="space-y-4">
              {miscItems.map(item => (
                <Card key={item.id} className="border-l-4 border-l-slate-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="font-semibold">{item.item_name}</p>
                        <p className="text-xs text-gray-500">{item.notes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost Price</p>
                        <p className="font-semibold">S${(item.supplier_price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Selling Price</p>
                        <p className="font-semibold text-green-600">S${(item.selling_price || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {miscItems.length > 0 && (
                <Card className="bg-slate-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Total Cost</p>
                        <p className="text-lg font-bold text-slate-700">S${totalMiscCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Selling</p>
                        <p className="text-lg font-bold text-green-600">S${totalMiscSelling.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit</p>
                        <p className="text-lg font-bold text-blue-600">S${(totalMiscSelling - totalMiscCost).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grand Total */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm opacity-80">Total Cost Price</p>
              <p className="text-3xl font-bold">S${grandTotalCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Selling Price</p>
              <p className="text-3xl font-bold text-green-400">S${grandTotalSelling.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Profit</p>
              <p className="text-3xl font-bold text-blue-300">S${(grandTotalSelling - grandTotalCost).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit' : 'Add'} {itemType === 'playground' ? 'Playground Set' : itemType === 'fitness' ? 'Fitness Equipment' : itemType === 'epdm' ? 'EPDM Area' : 'Miscellaneous Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {itemType === 'epdm' ? (
              <>
                <div className="space-y-2">
                  <Label>Area Name</Label>
                  <Input value={formData.item_name || ''} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} placeholder="e.g. Main Play Area" />
                </div>

                <div className="space-y-2">
                  <Label>Area (m²)</Label>
                  <Input type="number" step="0.1" value={formData.area_sqm || ''} onChange={(e) => setFormData({ ...formData, area_sqm: parseFloat(e.target.value) })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price ($/m²)</Label>
                    <Input type="number" step="0.01" value={formData.cost_per_sqm || 47} onChange={(e) => setFormData({ ...formData, cost_per_sqm: parseFloat(e.target.value) })} />
                    <p className="text-xs text-gray-500">Default: $47/m²</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price ($/m²)</Label>
                    <Input type="number" step="0.01" value={formData.selling_price_per_sqm || ''} onChange={(e) => setFormData({ ...formData, selling_price_per_sqm: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." />
                </div>
              </>
            ) : itemType === 'misc' ? (
              <>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={formData.item_name || ''} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} placeholder="e.g. Installation, Labour, Permits" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price (SGD)</Label>
                    <Input type="number" step="0.01" value={formData.supplier_price || ''} onChange={(e) => setFormData({ ...formData, supplier_price: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (SGD)</Label>
                    <Input type="number" step="0.01" value={formData.selling_price || ''} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Description of miscellaneous cost..." />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={formData.item_name || ''} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} placeholder="e.g. Swing Set, Climbing Wall" />
                </div>

                <div className="space-y-2">
                  <Label>Upload Image</Label>
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  {imagePreview && (
                    <div className="relative w-32 h-32">
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded" />
                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier Price</Label>
                    <Input type="number" step="0.01" value={formData.supplier_price || ''} onChange={(e) => setFormData({ ...formData, supplier_price: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.supplier_currency || 'USD'} onValueChange={(v) => setFormData({ ...formData, supplier_currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RMB">RMB</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.supplier_currency !== 'SGD' && (
                  <CurrencyConverter value={formData.supplier_price} fromCurrency={formData.supplier_currency} onConverted={(v) => setFormData({ ...formData, converted_sgd: v })} />
                )}

                <div className="space-y-2">
                  <Label>Selling Price (SGD)</Label>
                  <Input type="number" step="0.01" value={formData.selling_price || ''} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}