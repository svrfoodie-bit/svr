import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useKeyboardSave from '../hooks/useKeyboardSave';
import { salesOrderService, PAYMENT_TYPES } from '../services/salesOrderService';
import { customerService } from '../services/customerService';
import { FINISHED_GRADES } from '../services/processingBatchService';
import { finishedGoodsStockService } from '../services/finishedGoodsStockService';
import { gradeService } from '../services/gradeService';
import { showFallbackError } from '../utils/errorHandling';

const SalesOrderEntry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [stockLevels, setStockLevels] = useState({});
  const [availableGrades, setAvailableGrades] = useState(FINISHED_GRADES);
  const [gradePrices, setGradePrices] = useState({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    paymentType: 'Cash',
    remarks: '',
  });

  const [lineItems, setLineItems] = useState([
    { grade: 'Full Kaju', quantity: '', rate: '' },
  ]);

  useEffect(() => {
    loadActiveCustomers();
    loadStockLevels();
    loadGradePrices();
  }, []);

  const loadActiveCustomers = async () => {
    try {
      const data = await customerService.getActive();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const loadStockLevels = async () => {
    try {
      const summary = await finishedGoodsStockService.getStockSummary();
      const stockMap = {};
      const gradeSet = new Set(FINISHED_GRADES);

      summary.forEach(item => {
        const grade = item.grade;
        if (!grade) return;
        stockMap[grade] = parseFloat(item.currentStock) || 0;
      });

      setStockLevels(stockMap);
      setAvailableGrades(Array.from(gradeSet));
    } catch (error) {
      toast.error('Failed to load finished stock');
    }
  };

  const loadGradePrices = async () => {
    try {
      const data = await gradeService.getAll();
      const priceMap = {};

      data.forEach((grade) => {
        priceMap[grade.grade] = {
          pricePerKg: parseFloat(grade.pricePerKg) || 0,
          minPrice: parseFloat(grade.minPrice) || 0,
          maxPrice: parseFloat(grade.maxPrice) || 0,
        };
      });

      setGradePrices(priceMap);
      setLineItems(prev => prev.map(item => ({
        ...item,
        rate: item.rate || (priceMap[item.grade]?.pricePerKg ? String(priceMap[item.grade].pricePerKg) : ''),
      })));
    } catch (error) {
      toast.error('Failed to load grade prices');
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = parseInt(e.target.value);
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...lineItems];
    newLineItems[index][field] = value;
    if (field === 'grade') {
      const standardRate = gradePrices[value]?.pricePerKg;
      newLineItems[index].rate = standardRate ? String(standardRate) : '';
    }
    setLineItems(newLineItems);
  };

  const addLineItem = () => {
    const defaultGrade = availableGrades[0] || 'Full Kaju';
    const standardRate = gradePrices[defaultGrade]?.pricePerKg;
    setLineItems([...lineItems, { grade: defaultGrade, quantity: '', rate: standardRate ? String(standardRate) : '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const newLineItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newLineItems);
    } else {
      toast.error('At least one line item is required');
    }
  };

  const calculateLineAmount = (quantity, rate) => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return qty * rt;
  };

  const calculateOrderTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + calculateLineAmount(item.quantity, item.rate);
    }, 0);
  };

  const getRateWarning = (item) => {
    const rate = parseFloat(item.rate) || 0;
    const price = gradePrices[item.grade];
    if (!price || rate <= 0) return '';
    if (price.minPrice > 0 && rate < price.minPrice) {
      return `Below suggested minimum ₹${price.minPrice.toLocaleString('en-IN')}/KG`;
    }
    if (price.maxPrice > 0 && rate > price.maxPrice) {
      return `Above suggested maximum ₹${price.maxPrice.toLocaleString('en-IN')}/KG`;
    }
    return '';
  };

  const orderTotal = calculateOrderTotal();

  const validateLineItems = () => {
    // Check for empty fields
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        toast.error(`Line ${i + 1}: Quantity is required and must be greater than zero`);
        return false;
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        toast.error(`Line ${i + 1}: Rate is required and must be greater than zero`);
        return false;
      }
      const warning = getRateWarning(item);
      if (warning) {
        toast.error(`Line ${i + 1}: ${warning}`);
        return false;
      }
    }

    // Check stock availability
    const gradeQtyMap = {};
    lineItems.forEach(item => {
      const grade = item.grade;
      const qty = parseFloat(item.quantity);
      gradeQtyMap[grade] = (gradeQtyMap[grade] || 0) + qty;
    });

    for (const grade in gradeQtyMap) {
      const required = gradeQtyMap[grade];
      const available = stockLevels[grade] || 0;

      if (required > available) {
        toast.error(`Insufficient stock for ${grade}. Available: ${available} KG, Required: ${required} KG. Add finished stock or choose another grade.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate customer selection
      if (!formData.customerId) {
        toast.error('Please select a customer');
        setLoading(false);
        return;
      }

      // Validate line items
      if (!validateLineItems()) {
        setLoading(false);
        return;
      }

      // Validate order total
      if (orderTotal === 0) {
        toast.error('Order total cannot be zero');
        setLoading(false);
        return;
      }

      const orderData = {
        ...formData,
        lineItems: lineItems.map(item => ({
          grade: item.grade,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
        })),
      };

      await salesOrderService.create(orderData);
      toast.success('Sales order created successfully');
      navigate('/sales-orders');
    } catch (error) {
      showFallbackError(error, 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  useKeyboardSave(handleSubmit);
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New Sales Order</h1>
        <p className="text-sm text-gray-600 mt-1">Create a new customer order</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={handleCustomerChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.type})
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No active customers found. Please add a customer first.</p>
              )}
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                required
              >
                {PAYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Cash/UPI = Full payment. Credit/Cheque = Payment later.
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Order Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-semibold"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-xl"
              >
                {/* Grade */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.grade}
                    onChange={(e) => handleLineItemChange(index, 'grade', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                    required
                  >
                    {availableGrades.map(grade => (
                      <option key={grade} value={grade}>
                        {grade} (Stock: {stockLevels[grade] || 0} KG)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Quantity (KG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Rate */}
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Rate (₹/KG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
                    placeholder="0.00"
                    required
                  />
                  {gradePrices[item.grade] && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Standard: ₹{gradePrices[item.grade].pricePerKg.toLocaleString('en-IN')}/KG{' '}
                      Range: ₹{gradePrices[item.grade].minPrice.toLocaleString('en-IN')} - ₹{gradePrices[item.grade].maxPrice.toLocaleString('en-IN')}
                    </p>
                  )}
                  {getRateWarning(item) && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {getRateWarning(item)}
                    </p>
                  )}
                </div>

                {/* Line Amount */}
                <div className="col-span-10 md:col-span-1 flex items-end">
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Amount</label>
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700 text-center">
                      ₹{calculateLineAmount(item.quantity, item.rate).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="col-span-2 md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="w-full p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Total */}
          <div className="mt-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Order Total:</span>
              <span className="text-2xl font-bold text-primary-600">₹{orderTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Important:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Order number will be auto-generated (SO-2024-001, etc.)</li>
                <li>• Stock will be reduced automatically when order is saved</li>
                <li>• Cannot exceed available stock for any grade</li>
                <li>• Cash/UPI orders are marked as fully paid immediately</li>
                <li>• Credit/Cheque orders can be paid later from order list</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || customers.length === 0}
            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold shadow-soft hover:shadow-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Create Order</span>
                <span className="hidden md:inline text-xs opacity-60 font-normal ml-1">Ctrl+S</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales-orders')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all flex items-center gap-2"
          >
            <X size={20} />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesOrderEntry;
