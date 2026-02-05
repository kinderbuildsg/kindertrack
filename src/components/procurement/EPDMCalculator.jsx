import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download } from 'lucide-react';

const SUPPLIERS = {
  epdm: [
    { name: 'Solfex', country: 'China' },
    { name: 'Miroad', country: 'China' }
  ],
  general: [
    { name: 'ZZRSPLAY', country: 'China' },
    { name: 'HUABAO', country: 'China' }
  ]
};

const EPDM_GRADES = {
  'Standard': { costPerSqm: 45, density: 'Regular' },
  'Premium': { costPerSqm: 65, density: 'High' },
  'Heavy Duty': { costPerSqm: 85, density: 'Extra High' }
};

const SAFETY_THRESHOLDS = {
  'Toddlers (0-3)': 400,
  'Preschool (3-6)': 600,
  'School Age (6-12)': 900,
  'Teenagers': 1200
};

export default function EPDMCalculator() {
  const [areas, setAreas] = useState([{ id: 1, length: '', width: '', height: '', ageGroup: 'Preschool (3-6)', grade: 'Standard' }]);
  const [nextId, setNextId] = useState(2);
  const [selectedSupplier, setSelectedSupplier] = useState('Solfex');

  const calculateArea = (length, width) => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    return (l * w).toFixed(2);
  };

  const calculateDepth = (height, ageGroup) => {
    const h = parseFloat(height) || 0;
    const requiredDepth = SAFETY_THRESHOLDS[ageGroup] || 600;
    const calculatedDepth = Math.ceil((requiredDepth / 25.4) * 10) / 10; // Convert mm to inches and round
    return Math.max(calculatedDepth, h).toFixed(2);
  };

  const calculateQuantity = (area, depth) => {
    const a = parseFloat(area) || 0;
    const d = parseFloat(depth) || 0;
    return (a * d / 100).toFixed(2); // Assuming thickness in inches
  };

  const calculateCost = (area, grade) => {
    const a = parseFloat(area) || 0;
    const cost = EPDM_GRADES[grade]?.costPerSqm || 45;
    return (a * cost).toFixed(2);
  };

  const addArea = () => {
    setAreas([...areas, { id: nextId, length: '', width: '', height: '', ageGroup: 'Preschool (3-6)', grade: 'Standard' }]);
    setNextId(nextId + 1);
  };

  const removeArea = (id) => {
    setAreas(areas.filter(a => a.id !== id));
  };

  const updateArea = (id, field, value) => {
    setAreas(areas.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const totalArea = areas.reduce((sum, a) => sum + parseFloat(calculateArea(a.length, a.width) || 0), 0).toFixed(2);
  const totalCost = areas.reduce((sum, a) => sum + parseFloat(calculateCost(calculateArea(a.length, a.width), a.grade) || 0), 0).toFixed(2);
  const totalQuantity = areas.reduce((sum, a) => {
    const area = calculateArea(a.length, a.width);
    const depth = calculateDepth(a.height, a.ageGroup);
    return sum + parseFloat(calculateQuantity(area, depth) || 0);
  }, 0).toFixed(2);

  const downloadQuote = () => {
    let text = `EPDM SURFACING QUOTE\n`;
    text += `Supplier: ${selectedSupplier}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += `AREAS:\n`;
    areas.forEach((a, i) => {
      const area = calculateArea(a.length, a.width);
      const depth = calculateDepth(a.height, a.ageGroup);
      const qty = calculateQuantity(area, depth);
      const cost = calculateCost(area, a.grade);
      text += `\nArea ${i + 1}:\n`;
      text += `  Dimensions: ${a.length}m × ${a.width}m = ${area} m²\n`;
      text += `  Height/Fall: ${a.height}m | Age Group: ${a.ageGroup}\n`;
      text += `  Required Depth: ${depth}"\n`;
      text += `  Grade: ${a.grade} | Quantity: ${qty} bags\n`;
      text += `  Cost: $${cost}\n`;
    });
    text += `\nTOTAL:\n`;
    text += `  Total Area: ${totalArea} m²\n`;
    text += `  Total Quantity: ${totalQuantity} bags\n`;
    text += `  Total Cost: $${totalCost}\n`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epdm-quote-${Date.now()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">EPDM Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIERS.epdm.map(s => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name} ({s.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Area:</span>
              <span className="font-semibold">{totalArea} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Quantity:</span>
              <span className="font-semibold">{totalQuantity} bags</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total Cost:</span>
              <span className="font-bold text-green-600">${totalCost}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>EPDM Areas</CardTitle>
          <Button onClick={addArea} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Area
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areas.map((area, idx) => {
              const areaValue = calculateArea(area.length, area.width);
              const depth = calculateDepth(area.height, area.ageGroup);
              const qty = calculateQuantity(areaValue, depth);
              const cost = calculateCost(areaValue, area.grade);

              return (
                <div key={area.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Area {idx + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeArea(area.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Length (m)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 10"
                        value={area.length}
                        onChange={(e) => updateArea(area.id, 'length', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width (m)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 8"
                        value={area.width}
                        onChange={(e) => updateArea(area.id, 'width', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Fall Height (m)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2"
                        value={area.height}
                        onChange={(e) => updateArea(area.id, 'height', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Age Group</Label>
                      <Select value={area.ageGroup} onValueChange={(v) => updateArea(area.id, 'ageGroup', v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(SAFETY_THRESHOLDS).map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">EPDM Grade</Label>
                      <Select value={area.grade} onValueChange={(v) => updateArea(area.id, 'grade', v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(EPDM_GRADES).map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Area</p>
                      <p className="font-semibold">{areaValue} m²</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Req. Depth</p>
                      <p className="font-semibold">{depth}"</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Quantity</p>
                      <p className="font-semibold">{qty} bags</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Cost</p>
                      <p className="font-semibold text-green-600">${cost}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={downloadQuote} className="w-full" variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Download Quote
      </Button>
    </div>
  );
}