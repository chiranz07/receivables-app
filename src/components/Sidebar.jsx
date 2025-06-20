import React, { useState } from 'react';
import { Home, FileText, Users, Briefcase, BarChart2, ChevronDown } from 'lucide-react';

function Sidebar({ setPage, currentPage }) {
    const [isInvoiceMenuOpen, setInvoiceMenuOpen] = useState(true);

    const NavLink = ({ page, icon, children, isSubmenu = false }) => {
        const isActive = currentPage === page || (isInvoiceMenuOpen && (currentPage === 'invoices/new' || currentPage === 'invoices/view') && (page === 'invoices/new' || page === 'invoices/view'));
        const baseClasses = "flex items-center w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors duration-200";
        const activeClasses = "text-white";
        const inactiveClasses = "text-gray-500 hover:bg-gray-100 hover:text-gray-800";
        const submenuClasses = isSubmenu ? 'pl-10' : '';

        return (
            <button
                onClick={() => setPage(page)}
                className={`${baseClasses} ${isActive && currentPage === page ? activeClasses : inactiveClasses} ${submenuClasses}`}
                style={{ backgroundColor: isActive && currentPage === page ? '#2a3f50' : 'transparent' }}
            >
                {icon && <span className="mr-2">{icon}</span>}
                {children}
            </button>
        );
    };

    return (
        <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                <svg className="h-7 w-7" style={{ color: '#2a3f50' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1 className="text-xl font-bold text-gray-800 ml-2">Receivables</h1>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
                <NavLink page="dashboard" icon={<Home size={16} />}>Dashboard</NavLink>
                <NavLink page="entities" icon={<Briefcase size={16} />}>Entities</NavLink>
                <NavLink page="customers" icon={<Users size={16} />}>Customers</NavLink>
                <div>
                    <button onClick={() => setInvoiceMenuOpen(!isInvoiceMenuOpen)} className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-left text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none">
                        <span className="flex items-center"><FileText size={16} className="mr-2" /> Invoices</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isInvoiceMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isInvoiceMenuOpen && (
                        <div className="mt-1 space-y-1">
                            <NavLink page="invoices/new" isSubmenu={true}>Create Invoice</NavLink>
                            <NavLink page="invoices/view" isSubmenu={true}>View Invoices</NavLink>
                        </div>
                    )}
                </div>
                <NavLink page="reports" icon={<BarChart2 size={16} />}>Reports</NavLink>
            </nav>
            <div className="px-4 py-3 border-t border-gray-200"><p className="text-xs text-gray-400 text-center">&copy; 2025</p></div>
        </aside>
    );
}

export default Sidebar;