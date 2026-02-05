import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Upload, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierQuotingForm({ project }) {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [analyzedItems, setAnalyzedItems] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingProvider, setShippingProvider] = useState('supplier');
  const [exchangeRate, setExchangeRate] = useState({ USD: 1.35, CNY: 0.21 });
  const [showSummary, setShowSummary] = useState(false);

  const SUPPLIERS = [
    { id: 'greenscape', name: 'Greenscape Systems (China)' },
    { id: 'lappset', name: 'Lappset Group (Finland)' },
    { id: 'kompan', name: 'KOMPAN (Denmark)' },
    { id: 'europlay', name: 'Europlay (Germany)' },
    { id: 'custom', name: 'Other / Custom' }
  ];

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setUploadedImages(prev => [...prev, ...urls]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload images');
    }
  };

  const handleAnalyzeImages = async () => {
    if (!uploadedImages.length) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzePlaygroundImages', {
        imageUrls: uploadedImages
      });

      if (response.items) {
        setAnalyzedItems(response.items);
        const initialPrices = {};
        response.items.forEach((item, idx) => {
          initialPrices[idx] = { quantity: item.quantity, unitPrice: '', currency: 'USD' };
        });
        setItemPrices(initialPrices);
        toast.success('Images analyzed! List extracted.');
      }
    } catch (error) {
      toast.error('Failed to analyze images');
      console.error(error);
    }
    setIsAnalyzing(false);
  };

  const handleRemoveImage = (idx) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const convertToSGD = (amount, currency) => {
    if (currency === 'SGD') return amount;
    return parseFloat((amount * exchangeRate[currency]).toFixed(2));
  };

  const getTotalCost = () => {
    let total = 0;
    Object.values(itemPrices).forEach(price => {
      const sgdPrice = convertToSGD(parseFloat(price.unitPrice) || 0, price.currency);
      total += sgdPrice * (price.quantity || 1);
    });
    return total + parseFloat(shippingCost || 0);
  };

  return (
    <div className="space-y-6">
      {/* Supplier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your supplier..." />
            </SelectTrigger>
            <SelectContent>
              {SUPPLIERS.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Playground Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="font-medium">Click to upload or drag images</span>
                <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
              </div>
            </label>
          </div>

          {uploadedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{uploadedImages.length} image(s) uploaded</p>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`upload-${idx}`} className="w-full h-24 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAnalyzeImages}
            disabled={isAnalyzing || !uploadedImages.length}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Images & Extract Materials'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analyzed Items with Pricing */}
      {analyzedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material List & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {analyzedItems.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                      {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Qty: {item.quantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={itemPrices[idx]?.unitPrice || ''}
                        onChange={(e) => setItemPrices(prev => ({
                          ...prev,
                          [idx]: { ...prev[idx], unitPrice: e.target.value }
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Currency</Label>
                      <Select
                        value={itemPrices[idx]?.currency || 'USD'}
                        onValueChange={(v) => setItemPrices(prev => ({
                          ...prev,
                          [idx]: { ...prev[idx], currency: v }
                        }))}
                      >
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">SGD Total</Label>
                      <div className="bg-gray-50 border rounded px-2 py-1 text-sm font-medium">
                        ${(convertToSGD(parseFloat(itemPrices[idx]?.unitPrice) || 0, itemPrices[idx]?.currency) * (itemPrices[idx]?.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Cost */}
      {analyzedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select value={shippingProvider} onValueChange={setShippingProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier (FOB)</SelectItem>
                    <SelectItem value="3pl">3rd Party Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Shipping Cost (SGD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {analyzedItems.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Cost Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Materials Cost</p>
                <p className="text-2xl font-bold text-green-700">
                  ${(getTotalCost() - parseFloat(shippingCost || 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shipping</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${parseFloat(shippingCost || 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">Total Project Costing</p>
              <p className="text-3xl font-bold text-green-700">
                ${getTotalCost().toFixed(2)} SGD
              </p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Save as Procurement Quote
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}