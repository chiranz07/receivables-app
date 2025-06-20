import React from 'react';
import { Plus, FileText, Users, Briefcase, BarChart2 } from 'lucide-react';

function DashboardCard({ title, icon, onClick }) {
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#2a3f50] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
            <div className="bg-gray-100 rounded-full p-3 mb-2 inline-flex" style={{color: '#2a3f50'}}>{icon}</div>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
    );
}

function Dashboard({ setPage }) {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
            <p className="text-gray-500 mb-6 text-xs">Overview and quick actions.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <DashboardCard title="New Invoice" icon={<Plus size={20} />} onClick={() => setPage('invoices/new')} />
                <DashboardCard title="All Invoices" icon={<FileText size={20} />} onClick={() => setPage('invoices/view')} />
                <DashboardCard title="Customers" icon={<Users size={20} />} onClick={() => setPage('customers')} />
                <DashboardCard title="Entities" icon={<Briefcase size={20} />} onClick={() => setPage('entities')} />
                <DashboardCard title="Reports" icon={<BarChart2 size={20} />} onClick={() => setPage('reports')} />
            </div>
        </div>
    );
}

export default Dashboard;