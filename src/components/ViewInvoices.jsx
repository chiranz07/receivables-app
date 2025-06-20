import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Search, MoreVertical, Download, Pencil, Trash2 } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { useAppContext } from '../context/AppContext';

const ConfirmDeleteModal = ({ item, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm border">
            <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Are you sure you want to delete invoice <span className="font-bold">{item?.invoiceNumber}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                <button type="button" onClick={onConfirm} className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition font-semibold shadow-sm text-xs">Delete</button>
            </div>
        </div>
    </div>
);

function ViewInvoices({ setPage }) {
    const { invoices, customers, entities, isLoading } = useAppContext();
    const [filters, setFilters] = useState({ status: '', customerId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const menuRef = useRef(null);
    const invoicesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/invoices`;

    useEffect(() => {
        const handleOutsideClick = (event) => { if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('[data-action-button]')) { setOpenMenuId(null); }};
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const processedInvoices = useMemo(() => {
        const customerMap = new Map(customers.map(c => [c.id, c.name]));
        return invoices.map(inv => ({
            ...inv,
            customerName: customerMap.get(inv.customerId) || 'N/A'
        }));
    }, [invoices, customers]);

    const filteredInvoices = useMemo(() => processedInvoices.filter(inv => {
        const searchMatch = searchTerm === '' || (inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) || (inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
        return searchMatch && (!filters.status || inv.status === filters.status) && (!filters.customerId || inv.customerId === filters.customerId);
    }), [processedInvoices, searchTerm, filters]);

    const updateInvoiceStatus = async (invoiceId, newStatus) => {
        try {
            await updateDoc(doc(db, invoicesCollectionPath, invoiceId), { status: newStatus });
            setOpenMenuId(null);
        }
        catch (err) { console.error("Error updating status: ", err); }
    };

    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        try {
            await deleteDoc(doc(db, invoicesCollectionPath, invoiceToDelete.id));
            setInvoiceToDelete(null);
        } catch (err) {
            console.error("Error deleting invoice: ", err);
        }
    };

    const getCustomerById = (id) => customers.find(c => c.id === id);
    const getEntityById = (id) => entities.find(e => e.id === id);

    if (isLoading) {
        return <p>Loading invoices...</p>;
    }

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
                    <thead className="border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Invoice #</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Type</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Customer</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Total</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Status</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Due Date</th>
                            <th className="p-3 font-semibold text-gray-500 text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(invoice => {
                            const isEditable = ['Draft', 'Proforma'].includes(invoice.status);
                            return (
                                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-mono text-xs text-gray-500">{invoice.invoiceNumber}</td>
                                    <td className="p-3 text-gray-500">{invoice.type}</td>
                                    <td className="p-3 text-gray-700">{invoice.customerName}</td>
                                    <td className="p-3 font-medium text-gray-700">₹{invoice.total?.toFixed(2)}</td>
                                    <td className="p-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : invoice.status === 'Invoiced' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800' }`}>{invoice.status}</span></td>
                                    <td className="p-3 text-gray-500">{invoice.dueDate}</td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setPage({ name: 'invoices/new', payload: invoice.id })}
                                                className={`p-1 ${isEditable ? 'text-gray-400 hover:text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
                                                title={isEditable ? 'Edit Invoice' : 'Cannot edit a sent or paid invoice'}
                                                disabled={!isEditable}
                                            >
                                                <Pencil size={14}/>
                                            </button>

                                            <button onClick={() => setInvoiceToDelete(invoice)} className="text-gray-400 hover:text-red-600 p-1" title="Delete Invoice">
                                                <Trash2 size={14}/>
                                            </button>

                                            <div className="relative" ref={openMenuId === invoice.id ? menuRef : null}>
                                                <button data-action-button="true" onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200">
                                                    <MoreVertical size={16}/>
                                                </button>
                                                {openMenuId === invoice.id && ( <div className="absolute right-0 mt-2 z-20 w-40 origin-top-right bg-white rounded-md shadow-lg border"><div className="py-1">
                                                    <PDFDownloadLink
                                                        document={<InvoicePDF invoice={invoice} customer={getCustomerById(invoice.customerId)} entity={getEntityById(invoice.entityId)} />}
                                                        fileName={`${invoice.invoiceNumber}.pdf`}
                                                        className="flex items-center menu-item"
                                                    >
                                                        {({ loading }) => loading ? 'Loading...' : <><Download size={14} className="mr-2"/>Download PDF</>}
                                                    </PDFDownloadLink>
                                                    <div className="border-t my-1"></div>
                                                    {invoice.status === 'Proforma' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Invoiced')} className="menu-item">Mark Invoiced</button>}
                                                    {invoice.status === 'Invoiced' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Sent')} className="menu-item">Mark Sent</button>}
                                                    {invoice.status === 'Draft' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Sent')} className="menu-item">Mark Sent</button>}
                                                    {invoice.status === 'Sent' && <button onClick={() => updateInvoiceStatus(invoice.id, 'Paid')} className="menu-item">Mark Paid</button>}
                                                </div></div>)}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {invoiceToDelete && <ConfirmDeleteModal item={invoiceToDelete} onConfirm={handleDeleteInvoice} onCancel={() => setInvoiceToDelete(null)} />}
        </div>
    );
}

export default ViewInvoices;