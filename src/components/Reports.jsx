import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const AgingReport = ({ invoices }) => {
    const agingData = useMemo(() => {
        const today = new Date();
        const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        invoices.forEach(inv => {
            const dueDate = new Date(inv.dueDate);
            if (isNaN(dueDate.getTime())) return;
            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            const total = inv.total || 0;
            if (diffDays <= 0) buckets.current += total;
            else if (diffDays <= 30) buckets['1-30'] += total;
            else if (diffDays <= 60) buckets['31-60'] += total;
            else if (diffDays <= 90) buckets['61-90'] += total;
            else buckets['90+'] += total;
        });
        return buckets;
    }, [invoices]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(agingData).map(([bucket, amount]) => (
                <div key={bucket} className="bg-gray-50 p-3 rounded-lg border text-center"><p className="text-xs text-gray-500 capitalize">{bucket === 'current' ? 'Current' : `${bucket} Days`}</p><p className="text-xl font-semibold text-gray-700 mt-1">₹{amount.toFixed(2)}</p></div>
            ))}
        </div>
    );
};

const InvoicesByGroup = ({ invoices, customers, entities, groupBy, groupNameMap, nameKey = 'name' }) => {
    const groupedData = useMemo(() => {
        return invoices.reduce((acc, invoice) => {
            const key = invoice[groupBy] || 'N/A';
            if (!acc[key]) { acc[key] = []; }
            acc[key].push(invoice);
            return acc;
        }, {});
    }, [invoices, groupBy]);

    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const entitiesMap = useMemo(() => new Map(entities.map(e => [e.id, e])), [entities]);

    return (
        <div className="space-y-6">
            {Object.keys(groupedData).sort().map(groupId => (
                <div key={groupId}>
                    <h3 className="text-md font-bold text-gray-700 mb-2 border-b pb-1">
                        {groupNameMap ? groupNameMap.get(groupId)?.[nameKey] : groupId}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="border-b-2 border-gray-100"><tr><th className="p-2 font-semibold text-gray-500 text-xs">Invoice #</th><th className="p-2 font-semibold text-gray-500 text-xs">Customer/Entity</th><th className="p-2 font-semibold text-gray-500 text-xs">Total</th><th className="p-2 font-semibold text-gray-500 text-xs">Status</th><th className="p-2 font-semibold text-gray-500 text-xs">Due Date</th></tr></thead>
                            <tbody>
                                {groupedData[groupId].map(invoice => (
                                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-2 font-mono text-xs text-gray-500">{invoice.invoiceNumber}</td>
                                        <td className="p-2 text-gray-600 text-xs">{groupBy === 'customerId' ? entitiesMap.get(invoice.entityId)?.name : customersMap.get(invoice.customerId)?.name}</td>
                                        <td className="p-2 font-medium text-gray-600">₹{invoice.total?.toFixed(2)}</td>
                                        <td className="p-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : invoice.status === 'Invoiced' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800' }`}>{invoice.status}</span></td>
                                        <td className="p-2 text-gray-500">{invoice.dueDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Reports = () => {
    const { invoices, customers, entities, isLoading } = useAppContext();
    const [activeTab, setActiveTab] = useState('aging');

    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const entitiesMap = useMemo(() => new Map(entities.map(e => [e.id, e])), [entities]);

    const TabButton = ({ tabName, currentTab, setTab, children }) => (
        <button
            onClick={() => setTab(tabName)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${currentTab === tabName ? 'text-white' : 'text-gray-500 hover:bg-gray-200'}`}
            style={{ backgroundColor: currentTab === tabName ? '#2a3f50' : 'transparent' }}
        >
            {children}
        </button>
    );

    const renderContent = () => {
        if (isLoading) return <p>Loading report data...</p>;
        switch(activeTab) {
            case 'aging': return <AgingReport invoices={invoices.filter(inv => ['Sent', 'Invoiced'].includes(inv.status))} />;
            case 'byCustomer': return <InvoicesByGroup invoices={invoices} customers={customers} entities={entities} groupBy="customerId" groupNameMap={customersMap} nameKey="name" />;
            case 'byEntity': return <InvoicesByGroup invoices={invoices} customers={customers} entities={entities} groupBy="entityId" groupNameMap={entitiesMap} nameKey="name" />;
            case 'byType': return <InvoicesByGroup invoices={invoices} customers={customers} entities={entities} groupBy="type" />;
            case 'byStatus': return <InvoicesByGroup invoices={invoices} customers={customers} entities={entities} groupBy="status" />;
            default: return null;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Reports</h2>
            <p className="text-gray-500 mb-4 text-xs">Detailed views of your receivables.</p>
            <div className="flex items-center gap-2 border-b mb-4">
                <TabButton tabName="aging" currentTab={activeTab} setTab={setActiveTab}>Aging</TabButton>
                <TabButton tabName="byCustomer" currentTab={activeTab} setTab={setActiveTab}>By Customer</TabButton>
                <TabButton tabName="byEntity" currentTab={activeTab} setTab={setActiveTab}>By Entity</TabButton>
                <TabButton tabName="byType" currentTab={activeTab} setTab={setActiveTab}>By Type</TabButton>
                <TabButton tabName="byStatus" currentTab={activeTab} setTab={setActiveTab}>By Status</TabButton>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

export default Reports;