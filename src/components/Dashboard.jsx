import React, { useMemo } from 'react';
import { Plus, FileText, Users, Briefcase, BarChart2, DollarSign, AlertTriangle, CalendarClock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

// A more stylized card for key statistics
function DashboardStatCard({ title, value, icon, note, color = '#2a3f50' }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gray-100 rounded-lg p-3 mr-4" style={{ color }}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
            </div>
        </div>
    );
}

// A generic container for our charts
function ChartContainer({ title, children }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
            <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function QuickActionCard({ title, icon, onClick }) {
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#2a3f50] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center h-full">
            <div className="bg-gray-100 rounded-full p-3 mb-2 inline-flex" style={{color: '#2a3f50'}}>{icon}</div>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
    );
}


function Dashboard({ setPage }) {
    const { invoices, entities, isLoading } = useAppContext();

    const { stats, monthlyRevenue, amountByStatus, amountByEntity, amountByType } = useMemo(() => {
        if (isLoading || invoices.length === 0) {
            return {
                stats: { totalReceivables: 0, overdueCount: 0, dueNext30Days: 0 },
                monthlyRevenue: [],
                amountByStatus: [],
                amountByEntity: [],
                amountByType: [],
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalReceivables = 0;
        let overdueCount = 0;
        let dueNext30Days = 0;

        const revenueByMonth = {};
        const statusAggregates = {};
        const entityAggregates = {};
        const typeAggregates = {};

        const entityMap = new Map(entities.map(e => [e.id, e.name]));

        invoices.forEach(inv => {
            const total = inv.total || 0;
            const status = inv.status || 'Draft';
            const type = inv.type || 'Invoice';
            const entityName = entityMap.get(inv.entityId) || 'Unknown';

            // Aggregate totals and counts for charts
            const updateAggregates = (agg, key) => {
                if (!agg[key]) agg[key] = { amount: 0, count: 0 };
                agg[key].amount += total;
                agg[key].count += 1;
            };

            updateAggregates(entityAggregates, entityName);
            updateAggregates(statusAggregates, status);
            updateAggregates(typeAggregates, type);

            if (status !== 'Paid') {
                totalReceivables += total;
                const dueDate = new Date(inv.dueDate);
                if (!isNaN(dueDate.getTime())) {
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) overdueCount++;
                    else if (diffDays <= 30) dueNext30Days += total;
                }
            } else {
                const paidDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date();
                const monthKey = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
                if (!revenueByMonth[monthKey]) revenueByMonth[monthKey] = { amount: 0, count: 0 };
                revenueByMonth[monthKey].amount += total;
                revenueByMonth[monthKey].count += 1;
            }
        });

        const sortedMonthlyRevenue = Object.keys(revenueByMonth).sort()
            .map(key => {
                const [year, month] = key.split('-');
                const date = new Date(year, month - 1);
                return {
                    name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
                    Revenue: parseFloat(revenueByMonth[key].amount.toFixed(2)),
                    Count: revenueByMonth[key].count,
                };
            });

        const mapAggregates = (agg) => Object.entries(agg).map(([name, data]) => ({ name, Amount: data.amount, Count: data.count }));

        return {
            stats: { totalReceivables, overdueCount, dueNext30Days },
            monthlyRevenue: sortedMonthlyRevenue,
            amountByStatus: mapAggregates(statusAggregates),
            amountByEntity: mapAggregates(entityAggregates),
            amountByType: mapAggregates(typeAggregates),
        };
    }, [invoices, entities, isLoading]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
    const tooltipFormatter = (value, name, props) => [`₹${value.toLocaleString('en-IN')} (${props.payload.Count} invoices)`, name];

    if (isLoading) {
        return <p>Loading dashboard...</p>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardStatCard title="Total Receivables" value={`₹${stats.totalReceivables.toLocaleString('en-IN')}`} icon={<DollarSign size={24} />} note="Across all unpaid invoices" />
                <DashboardStatCard title="Overdue Invoices" value={stats.overdueCount} icon={<AlertTriangle size={24} />} note="Invoices past their due date" color="#d9534f" />
                <DashboardStatCard title="Amount Due Soon" value={`₹${stats.dueNext30Days.toLocaleString('en-IN')}`} icon={<CalendarClock size={24} />} note="Invoices due in next 30 days" color="#5bc0de" />
            </div>

            <div className="space-y-6">
                <ChartContainer title="Monthly Revenue (from Paid Invoices)">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                            <Tooltip cursor={{fill: 'rgba(240, 240, 240, 0.5)'}} formatter={(value, name, props) => [`₹${value.toLocaleString('en-IN')} from ${props.payload.Count} invoices`, 'Revenue']} />
                            <Bar dataKey="Revenue" fill="#2a3f50" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <ChartContainer title="Amount by Invoice Status">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={amountByStatus} dataKey="Amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                                    {amountByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={tooltipFormatter} />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                     <ChartContainer title="Amount by Entity">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={amountByEntity} dataKey="Amount" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
                                    {amountByEntity.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} /> )}
                                </Pie>
                                <Tooltip formatter={tooltipFormatter} />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                     <ChartContainer title="Amount by Invoice Type">
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={amountByType} dataKey="Amount" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
                                    {amountByType.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} /> )}
                                </Pie>
                                <Tooltip formatter={tooltipFormatter} />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>

            <div className="mt-8">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                     <QuickActionCard title="New Invoice" icon={<Plus size={20} />} onClick={() => setPage({ name: 'invoices/new' })} />
                     <QuickActionCard title="All Invoices" icon={<FileText size={20} />} onClick={() => setPage({ name: 'invoices/view' })} />
                     <QuickActionCard title="Customers" icon={<Users size={20} />} onClick={() => setPage({ name: 'customers' })} />
                     <QuickActionCard title="Entities" icon={<Briefcase size={20} />} onClick={() => setPage({ name: 'entities' })} />
                     <QuickActionCard title="Reports" icon={<BarChart2 size={20} />} onClick={() => setPage({ name: 'reports' })} />
                 </div>
            </div>
        </div>
    );
}

export default Dashboard;