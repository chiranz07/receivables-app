import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Plus, X } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { gstRates } from '../constants';

const CreateInvoice = ({ setPage }) => {
    const [entities, setEntities] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoice, setInvoice] = useState({ type: 'Invoice', entityId: '', customerId: '', invoiceNumber: `INV-${Date.now()}`, invoiceDate: new Date().toISOString().slice(0, 10), dueDate: '', items: [{ description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0 }], });
    const [notification, setNotification] = useState(null);
    const [isGstApplicable, setIsGstApplicable] = useState(true);
    const [gstType, setGstType] = useState('IGST');

    const invoicesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/invoices`;

    useEffect(() => {
        const fetchDropdownData = async () => {
            const entitiesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/entities`;
            const customersCollectionPath = `/artifacts/${appId}/users/${getUserId()}/customers`;
            try {
                const [entitySnapshot, customerSnapshot] = await Promise.all([getDocs(collection(db, entitiesCollectionPath)), getDocs(collection(db, customersCollectionPath))]);
                setEntities(entitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setCustomers(customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) { console.error("Error fetching data: ", err); }
        };
        fetchDropdownData();
    }, [appId]);

    useEffect(() => {
        const entity = entities.find(e => e.id === invoice.entityId);
        const customer = customers.find(c => c.id === invoice.customerId);

        if (entity) {
            setIsGstApplicable(entity.isGstRegistered === 'Yes');
        } else {
            setIsGstApplicable(true);
        }

        if(entity && customer) { setGstType(entity.placeOfSupply === customer.placeOfSupply ? 'CGST/SGST' : 'IGST'); }
    }, [invoice.entityId, invoice.customerId, entities, customers]);

    const handleItemChange = (index, e) => {
        const items = [...invoice.items];
        items[index][e.target.name] = e.target.value;
        setInvoice(prev => ({ ...prev, items }));
    };

    const addItem = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0 }] }));
    const removeItem = (index) => setInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const calculateTotals = () => {
        const grossTotal = invoice.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate)), 0);
        const totalDiscount = invoice.items.reduce((acc, item) => acc + Number(item.discount || 0), 0);
        const taxableTotal = grossTotal - totalDiscount;
        const totalGst = isGstApplicable ? invoice.items.reduce((acc, item) => acc + (((Number(item.quantity) * Number(item.rate)) - Number(item.discount || 0)) * (Number(item.gstRate) / 100)), 0) : 0;
        const total = taxableTotal + totalGst;
        return { grossTotal, totalDiscount, taxableTotal, totalGst, total, igst: gstType === 'IGST' ? totalGst : 0, cgst: gstType === 'CGST/SGST' ? totalGst / 2 : 0, sgst: gstType === 'CGST/SGST' ? totalGst / 2 : 0 };
    };

    const totals = calculateTotals();

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveInvoice = async () => {
        if (!invoice.entityId || !invoice.customerId) { showNotification("Please select an entity and a customer.", "error"); return; }

        let status;
        if(invoice.type === 'Proforma') {
            status = 'Proforma';
        } else {
            status = 'Draft';
        }

        try {
            await addDoc(collection(db, invoicesCollectionPath), { ...invoice, status, ...totals, createdAt: new Date(), });
            showNotification(`Invoice saved as ${status}!`, "success");
            setTimeout(() => setPage('invoices/view'), 1500);
        } catch (err) { console.error("Error creating invoice: ", err); showNotification("Failed to save invoice.", "error"); }
    };

    const handleTypeChange = (e) => {
        setInvoice({...invoice, type: e.target.value });
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-6xl mx-auto">
            {notification && <div className={`p-3 mb-4 text-xs rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">New {invoice.type}</h2>
                <div className="flex space-x-2">
                    <button onClick={handleSaveInvoice} className="text-white px-4 py-1.5 rounded-md transition font-semibold shadow-sm text-xs" style={{backgroundColor: '#2a3f50'}}>Save</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="md:col-span-3">
                    <label className="form-label">Invoice Type</label>
                    <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center text-xs text-gray-700"><input type="radio" name="type" value="Invoice" checked={invoice.type === 'Invoice'} onChange={handleTypeChange} className="mr-2"/>Invoice</label>
                        <label className="flex items-center text-xs text-gray-700"><input type="radio" name="type" value="Proforma" checked={invoice.type === 'Proforma'} onChange={handleTypeChange} className="mr-2"/>Proforma Invoice</label>
                    </div>
                </div>
                <div><label className="form-label">Billing From (Entity)</label><select name="entityId" value={invoice.entityId} onChange={(e) => setInvoice({...invoice, entityId: e.target.value})} className="form-input-create" required><option value="">Select Entity</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div><label className="form-label">Billing To (Customer)</label><select name="customerId" value={invoice.customerId} onChange={(e) => setInvoice({...invoice, customerId: e.target.value})} className="form-input-create" required><option value="">Select Customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="form-label">Invoice Number</label><input type="text" value={invoice.invoiceNumber} className="form-input-create bg-gray-200" readOnly/></div>
                <div><label className="form-label">Invoice Date</label><input type="date" value={invoice.invoiceDate} onChange={(e) => setInvoice({...invoice, invoiceDate: e.target.value})} className="form-input-create" required/></div>
                <div><label className="form-label">Due Date</label><input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})} className="form-input-create" required/></div>
            </div>

            <div className="mb-4">
                <table className="w-full">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-2 text-left font-semibold text-gray-500 text-xs w-2/5">Description</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Qty</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Rate</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Discount</th>{isGstApplicable && <th className="p-2 text-center font-semibold text-gray-500 text-xs">GST %</th>}<th className="p-2 text-right font-semibold text-gray-500 text-xs">Amount</th><th className="p-2"></th></tr></thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100"><td className="p-1.5"><input type="text" name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} placeholder="Item Description" className="form-input-create w-full" required/></td><td className="p-1.5"><input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="form-input-create w-16 text-right" required/></td><td className="p-1.5"><input type="number" name="rate" value={item.rate} step="0.01" onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20 text-right" required/></td><td className="p-1.5"><input type="number" name="discount" value={item.discount} step="0.01" onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20 text-right no-arrows"/></td>{isGstApplicable && <td className="p-1.5"><select name="gstRate" value={item.gstRate} onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20"><option value="0">0%</option>{gstRates.slice(1).map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select></td>}<td className="p-1.5 text-right font-medium text-gray-700 w-24">₹{((Number(item.quantity) * Number(item.rate)) - Number(item.discount || 0)).toFixed(2)}</td><td className="p-1.5 text-center"><button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><X size={16}/></button></td></tr>
                        ))}
                    </tbody>
                </table>
                 <button type="button" onClick={addItem} className="mt-3 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition text-xs font-semibold flex items-center"><Plus size={14} className="mr-1"/> Add Line</button>
            </div>
            <div className="flex justify-end mt-6"><div className="w-full max-w-xs"><div className="flex justify-between items-center py-1"><span className="text-gray-500 text-xs">Gross Total:</span><span className="font-medium text-gray-700">₹{totals.grossTotal.toFixed(2)}</span></div><div className="flex justify-between items-center py-1"><span className="text-gray-500 text-xs">Discount:</span><span className="font-medium text-red-500">-₹{totals.totalDiscount.toFixed(2)}</span></div><div className="flex justify-between items-center py-1 border-t border-dashed mt-1 pt-1"><span className="text-gray-500 text-xs">Subtotal (Taxable):</span><span className="font-medium text-gray-700">₹{totals.taxableTotal.toFixed(2)}</span></div>
            {isGstApplicable && (gstType === 'IGST' ? <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">IGST:</span><span className="font-medium text-gray-700">₹{totals.igst.toFixed(2)}</span></div> : <> <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">CGST:</span><span className="font-medium text-gray-700">₹{totals.cgst.toFixed(2)}</span></div> <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">SGST:</span><span className="font-medium text-gray-700">₹{totals.sgst.toFixed(2)}</span></div> </>)}
            <div className="flex justify-between items-center py-1 border-t mt-1 pt-1"><span className="text-md font-bold text-gray-800">Total:</span><span className="text-md font-bold text-gray-800">₹{totals.total.toFixed(2)}</span></div></div></div>
        </div>
    );
}

export default CreateInvoice;