import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { Search, MoreVertical } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';

function ViewInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', customerId: '' });
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const invoicesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/invoices`;
    const customersCollectionPath = `/artifacts/${appId}/users/${getUserId()}/customers`;

    useEffect(() => {
        const handleOutsideClick = (event) => { if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('[data-action-button]')) { setOpenMenuId(null); }};
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, invoicesCollectionPath));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const customerSnapshot = await getDocs(collection(db, customersCollectionPath));
            const customerMap = new Map(customerSnapshot.docs.map(doc => [doc.id, doc.data()]));
            const entitySnapshot = await getDocs(collection(db, `/artifacts/${appId}/users/${getUserId()}/entities`));
            const entityMap = new Map(entitySnapshot.docs.map(doc => [doc.id, doc.data()]));
            setInvoices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), customerName: customerMap.get(doc.data().customerId)?.name || 'N/A', entityName: entityMap.get(doc.data().entityId)?.name || 'N/A' })));
            setCustomers(customerSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            setIsLoading(false);
        }, (err) => { console.error("Error fetching invoices:", err); setIsLoading(false); });
        return () => unsubscribe();
    }, [invoicesCollectionPath, customersCollectionPath]);

    const filteredInvoices = invoices.filter(inv => {
        const searchMatch = searchTerm === '' || (inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) || (inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
        return searchMatch && (!filters.status || inv.status === filters.status) && (!filters.customerId || inv.customerId === filters.customerId);
    });

    const updateInvoiceStatus = async (invoiceId, newStatus) => {
        try { await updateDoc(doc(db, invoicesCollectionPath, invoiceId), { status: newStatus }); setOpenMenuId(null); }
        catch (err) { console.error("Error updating status: ", err); }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Invoices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full" /><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div>
                <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="form-input-create"><option value="">All Statuses</option><option value="Proforma">Proforma</option><option value="Draft">Draft</option><option value="Invoiced">Invoiced</option><option value="Sent">Sent</option><option value="Paid">Paid</option></select>
                <select value={filters.customerId} onChange={(e) => setFilters({...filters, customerId: e.target.value})} className="form-input-create"><option value="">All Customers</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-3 font-semibold text-gray-500 text-xs">Invoice #</th><th className="p-3 font-semibold text-gray-500 text-xs">Type</th><th className="p-3 font-semibold text-gray-500 text-xs">Customer</th><th className="p-3 font-semibold text-gray-500 text-xs">Total</th><th className="p-3 font-semibold text-gray-500 text-xs">Status</th><th className="p-3 font-semibold text-gray-500 text-xs">Due Date</th><th className="p-3"></th></tr></thead>
                    <tbody>
                        {filteredInvoices.map(invoice => (
                            <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 font-mono text-xs text-gray-500">{invoice.invoiceNumber}</td>
                                <td className="p-3 text-gray-500">{invoice.type}</td>
                                <td className="p-3 text-gray-700">{invoice.customerName}</td><td className="p-3 font-medium text-gray-700">₹{invoice.total?.toFixed(2)}</td>
                                <td className="p-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : invoice.status === 'Invoiced' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800' }`}>{invoice.status}</span></td>
                                <td className="p-3 text-gray-500">{invoice.dueDate}</td>
                                <td className="p-3 text-right">
                                    <div className="relative" ref={openMenuId === invoice.id ? menuRef : null}>
                                        <button data-action-button="true" onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"><MoreVertical size={16}/></button>
                                        {openMenuId === invoice.id && ( <div className="absolute right-0 mt-2 z-20 w-32 origin-top-right bg-white rounded-md shadow-lg border"><div className="py-1">
                                            {invoice.status === 'Proforma' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Invoiced')} className="menu-item">Mark Invoiced</button>}
                                            {invoice.status === 'Invoiced' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Sent')} className="menu-item">Mark Sent</button>}
                                            {invoice.status === 'Draft' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Sent')} className="menu-item">Mark Sent</button>}
                                            {invoice.status === 'Sent' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Paid')} className="menu-item">Mark Paid</button>}
                                        </div></div>)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ViewInvoices;