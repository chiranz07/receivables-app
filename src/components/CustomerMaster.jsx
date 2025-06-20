import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { Plus, X, Search } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { initialCustomerState, placeOfSupplyOptions } from '../constants';
import FormModal from './common/FormModal';

const CustomerFormModal = ({ customer, setCustomer, onClose, onSubmit, error }) => {
    const handleChange = (e) => setCustomer(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleAddressChange = (e) => setCustomer(prev => ({...prev, address: {...prev.address, [e.target.name]: e.target.value}}));

    return (
        <FormModal title="New Customer" error={error} onClose={onClose} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Customer Name*</label><input type="text" name="name" value={customer.name} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Place of Supply*</label><select name="placeOfSupply" value={customer.placeOfSupply} onChange={handleChange} className="form-input-modal" required><option value="">Select...</option>{placeOfSupplyOptions.map(o => <option key={o.code} value={o.name}>{o.code} - {o.name}</option>)}</select></div>
                <div><label className="form-label">Email*</label><input type="email" name="email" value={customer.email} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Phone*</label><input type="tel" name="phone" value={customer.phone} onChange={handleChange} className="form-input-modal" required /></div>
                <div className="md:col-span-2"><label className="form-label">GSTIN (Optional)</label><input type="text" name="gstin" value={customer.gstin} onChange={handleChange} className="form-input-modal" /></div>
            </div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Address</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="form-label">Address Line 1</label><input type="text" name="line1" value={customer.address.line1} onChange={handleAddressChange} className="form-input-modal" /></div><div className="md:col-span-2"><label className="form-label">Address Line 2</label><input type="text" name="line2" value={customer.address.line2} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">City</label><input type="text" name="city" value={customer.address.city} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">State</label><input type="text" name="state" value={customer.address.state} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Pincode</label><input type="text" name="pincode" value={customer.address.pincode} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Country</label><input type="text" name="country" value={customer.address.country} onChange={handleAddressChange} className="form-input-modal" /></div></div></div>
        </FormModal>
    );
};

function CustomerMaster() {
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(initialCustomerState);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const customersCollectionPath = `/artifacts/${appId}/users/${getUserId()}/customers`;

    useEffect(() => {
        const q = query(collection(db, customersCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => { console.error("Error fetching customers:", err); });
        return unsubscribe;
    }, [customersCollectionPath]);

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setError('');
        if (!currentCustomer.name || !currentCustomer.email) { setError("Please fill all required fields."); return; }
        if (customers.some(c => c.email.toLowerCase() === currentCustomer.email.toLowerCase())) { setError("A customer with this email already exists."); return; }
        try {
            await addDoc(collection(db, customersCollectionPath), currentCustomer);
            setShowModal(false);
        } catch (err) { console.error("Error adding customer: ", err); setError("Failed to add customer."); }
    };

    const filteredCustomers = customers.filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="text-xl font-bold text-gray-800">Customers</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full"/><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div>
                    <button onClick={() => { setCurrentCustomer(initialCustomerState); setShowModal(true); }} className="text-white px-3 py-1.5 rounded-md transition flex items-center justify-center shadow-sm text-xs" style={{backgroundColor: '#2a3f50'}}><Plus size={16} className="mr-1" /> New Customer</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-3 font-semibold text-gray-500 text-xs">Name</th><th className="p-3 font-semibold text-gray-500 text-xs">Contact</th><th className="p-3 font-semibold text-gray-500 text-xs">Place of Supply</th><th className="p-3 font-semibold text-gray-500 text-xs">GSTIN</th></tr></thead>
                    <tbody>{filteredCustomers.map(customer => (<tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-3 text-gray-700">{customer.name}</td><td className="p-3 text-gray-500 text-xs">{customer.email}<br/>{customer.phone}</td><td className="p-3 text-gray-500">{customer.placeOfSupply}</td><td className="p-3 text-gray-500 font-mono text-xs">{customer.gstin || 'N/A'}</td></tr>))}</tbody>
                </table>
            </div>
            {showModal && <CustomerFormModal customer={currentCustomer} setCustomer={setCurrentCustomer} onClose={() => setShowModal(false)} onSubmit={handleAddCustomer} error={error} />}
        </div>
    );
}

export default CustomerMaster;