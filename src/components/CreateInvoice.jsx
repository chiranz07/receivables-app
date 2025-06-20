import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, X } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { gstRates } from '../constants';
import { useAppContext } from '../context/AppContext';

const CreateInvoice = ({ setPage, invoiceId }) => {
    const { entities, customers, invoices } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);

    // --- UPDATED: gstRate now defaults to 18 ---
    const initialInvoiceState = {
        type: 'Invoice',
        entityId: '',
        customerId: '',
        partner: '',
        paymentTerms: 30,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        items: [{ description: '', quantity: 1, rate: 0, discount: 0, gstRate: 18 }],
    };

    const [invoice, setInvoice] = useState(initialInvoiceState);
    const [notification, setNotification] = useState(null);
    const [isGstApplicable, setIsGstApplicable] = useState(true);
    const [gstType, setGstType] = useState('IGST');

    const invoicesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/invoices`;

    const formatIndianCurrency = (num) => {
        const value = Number(num);
        if (isNaN(value)) return '0.00';
        return value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    useEffect(() => {
        if (invoiceId && invoices.length > 0) {
            const existingInvoice = invoices.find(inv => inv.id === invoiceId);
            if (existingInvoice) {
                setIsEditing(true);
                setInvoice(prev => ({ ...initialInvoiceState, ...existingInvoice }));
            }
        } else {
            setIsEditing(false);
            setInvoice(initialInvoiceState);
        }
    }, [invoiceId, invoices]);

    useEffect(() => {
        if (invoice.invoiceDate && invoice.paymentTerms >= 0) {
            const date = new Date(invoice.invoiceDate);
            date.setDate(date.getDate() + parseInt(invoice.paymentTerms, 10));
            const newDueDate = date.toISOString().slice(0, 10);
            setInvoice(prev => ({ ...prev, dueDate: newDueDate }));
        }
    }, [invoice.invoiceDate, invoice.paymentTerms]);

    useEffect(() => {
        const entity = entities.find(e => e.id === invoice.entityId);
        const customer = customers.find(c => c.id === invoice.customerId);

        if (entity) {
            setIsGstApplicable(entity.isGstRegistered === 'Yes');
            if (entity.isGstRegistered === 'No') {
                setInvoice(prev => ({ ...prev, type: 'Invoice' }));
            }
        } else {
            setIsGstApplicable(true);
        }

        if(entity && customer) { setGstType(entity.placeOfSupply === customer.placeOfSupply ? 'CGST/SGST' : 'IGST'); }
    }, [invoice.entityId, invoice.customerId, entities, customers]);

    const handleInvoiceDataChange = (e) => {
        setInvoice(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleItemChange = (index, e) => {
        const items = [...invoice.items];
        items[index][e.target.name] = e.target.value;
        setInvoice(prev => ({ ...prev, items }));
    };

    // --- UPDATED: gstRate now defaults to 18 when adding a new line ---
    const addItem = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, rate: 0, discount: 0, gstRate: 18 }] }));
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

        const finalInvoiceData = { ...invoice, ...totals };

        try {
            if (isEditing) {
                const invoiceRef = doc(db, invoicesCollectionPath, invoice.id);
                await updateDoc(invoiceRef, finalInvoiceData);
                showNotification("Invoice updated successfully!", "success");
            } else {
                let status = (invoice.type === 'Proforma') ? 'Proforma' : 'Draft';
                await addDoc(collection(db, invoicesCollectionPath), { ...finalInvoiceData, status, createdAt: new Date() });
                showNotification(`Invoice saved as ${status}!`, "success");
            }
            setTimeout(() => setPage({ name: 'invoices/view' }), 1500);
        } catch (err) { console.error("Error saving invoice: ", err); showNotification("Failed to save invoice.", "error"); }
    };

    const selectedEntity = entities.find(e => e.id === invoice.entityId);
    const isProformaDisabled = selectedEntity && selectedEntity.isGstRegistered === 'No';

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-6xl mx-auto">
            {notification && <div className={`p-3 mb-4 text-xs rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">{isEditing ? `Edit ${invoice.type}` : `New ${invoice.type}`}</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setPage({ name: 'invoices/view' })} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                    <button onClick={handleSaveInvoice} className="text-white px-4 py-1.5 rounded-md transition font-semibold shadow-sm text-xs" style={{backgroundColor: '#2a3f50'}}>Save Changes</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="md:col-span-2">
                    <label className="form-label">Invoice Type</label>
                    <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center text-xs text-gray-700"><input type="radio" name="type" value="Invoice" checked={invoice.type === 'Invoice'} onChange={handleInvoiceDataChange} className="mr-2"/>Invoice</label>
                        <label className={`flex items-center text-xs text-gray-700 ${isProformaDisabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                            <input type="radio" name="type" value="Proforma" checked={invoice.type === 'Proforma'} onChange={handleInvoiceDataChange} className="mr-2" disabled={isProformaDisabled} />
                            Proforma Invoice
                        </label>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="form-label">Partner</label>
                    <select name="partner" value={invoice.partner} onChange={handleInvoiceDataChange} className="form-input-create" required>
                        <option value="">Select Partner</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                    </select>
                </div>

                <div><label className="form-label">Billing From (Entity)</label><select name="entityId" value={invoice.entityId} onChange={handleInvoiceDataChange} className="form-input-create" required><option value="">Select Entity</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div><label className="form-label">Billing To (Customer)</label><select name="customerId" value={invoice.customerId} onChange={handleInvoiceDataChange} className="form-input-create" required><option value="">Select Customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>

                <div><label className="form-label">Invoice Date</label><input type="date" name="invoiceDate" value={invoice.invoiceDate} onChange={handleInvoiceDataChange} className="form-input-create" required/></div>
                <div><label className="form-label">Payment Terms (days)</label><input type="number" name="paymentTerms" value={invoice.paymentTerms} onChange={handleInvoiceDataChange} className="form-input-create no-arrows" required/></div>
                <div><label className="form-label">Due Date</label><input type="date" name="dueDate" value={invoice.dueDate} className="form-input-create bg-gray-200" readOnly/></div>

                <div className="md:col-span-3"><label className="form-label">Invoice Number</label><input type="text" name="invoiceNumber" value={invoice.invoiceNumber} className="form-input-create bg-gray-200" readOnly/></div>
            </div>

            <div className="mb-4">
                <table className="w-full">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-2 text-left font-semibold text-gray-500 text-xs w-2/5">Description</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Qty</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Rate</th><th className="p-2 text-right font-semibold text-gray-500 text-xs">Discount</th>{isGstApplicable && <th className="p-2 text-center font-semibold text-gray-500 text-xs">GST %</th>}<th className="p-2 text-right font-semibold text-gray-500 text-xs">Amount</th><th className="p-2"></th></tr></thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="p-1.5"><input type="text" name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} placeholder="Item Description" className="form-input-create w-full" required/></td>
                                <td className="p-1.5"><input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="form-input-create w-16 text-right no-arrows" required/></td>
                                <td className="p-1.5"><input type="number" name="rate" value={item.rate} step="0.01" onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20 text-right no-arrows" required/></td>
                                <td className="p-1.5"><input type="number" name="discount" value={item.discount} step="0.01" onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20 text-right no-arrows"/></td>
                                {isGstApplicable && <td className="p-1.5"><select name="gstRate" value={item.gstRate} onChange={(e) => handleItemChange(index, e)} className="form-input-create w-20"><option value="0">0%</option>{gstRates.slice(1).map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select></td>}
                                <td className="p-1.5 text-right font-medium text-gray-700 w-24">₹{formatIndianCurrency((Number(item.quantity) * Number(item.rate)) - Number(item.discount || 0))}</td>
                                <td className="p-1.5 text-center"><button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><X size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <button type="button" onClick={addItem} className="mt-3 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition text-xs font-semibold flex items-center"><Plus size={14} className="mr-1"/> Add Line</button>
            </div>

            <div className="flex justify-end mt-6">
                <div className="w-full max-w-xs">
                    <div className="flex justify-between items-center py-1"><span className="text-gray-500 text-xs">Gross Total:</span><span className="font-medium text-gray-700">₹{formatIndianCurrency(totals.grossTotal)}</span></div>
                    <div className="flex justify-between items-center py-1"><span className="text-gray-500 text-xs">Discount:</span><span className="font-medium text-red-500">-₹{formatIndianCurrency(totals.totalDiscount)}</span></div>
                    <div className="flex justify-between items-center py-1 border-t border-dashed mt-1 pt-1"><span className="text-gray-500 text-xs">Subtotal (Taxable):</span><span className="font-medium text-gray-700">₹{formatIndianCurrency(totals.taxableTotal)}</span></div>

                    {isGstApplicable && (gstType === 'IGST' ?
                        <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">IGST:</span><span className="font-medium text-gray-700">₹{formatIndianCurrency(totals.igst)}</span></div>
                        : <>
                            <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">CGST:</span><span className="font-medium text-gray-700">₹{formatIndianCurrency(totals.cgst)}</span></div>
                            <div className="flex justify-between items-center py-0.5"><span className="text-gray-500 text-xs">SGST:</span><span className="font-medium text-gray-700">₹{formatIndianCurrency(totals.sgst)}</span></div>
                        </>
                    )}

                    <div className="flex justify-between items-center py-1 border-t mt-1 pt-1"><span className="text-md font-bold text-gray-800">Total:</span><span className="text-md font-bold text-gray-800">₹{formatIndianCurrency(totals.total)}</span></div>
                </div>
            </div>
        </div>
    );
}

export default CreateInvoice;   