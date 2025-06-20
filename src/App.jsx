import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from './api/firebase';
import { useAppContext } from './context/AppContext';

// Import modularized components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EntityManagement from './components/EntityManagement';
import CustomerMaster from './components/CustomerMaster';
import CreateInvoice from './components/CreateInvoice';
import ViewInvoices from './components/ViewInvoices';
import Reports from './components/Reports';

// Import common components
import PageLoader from './components/common/PageLoader';
import GlobalStyles from './components/common/GlobalStyles';

export default function App() {
    // Page state is now an object { name: string, payload?: any }
    const [page, setPage] = useState({ name: 'dashboard' });
    const [isAuthReady, setIsAuthReady] = useState(false);
    const { isLoading: isAppContextLoading } = useAppContext();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthReady(true);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error during sign-in:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const renderPage = () => {
        // Show a loader if auth isn't ready or the main app context is still loading data
        if (!isAuthReady || isAppContextLoading) {
            return <PageLoader />;
        }

        switch (page.name) {
            case 'dashboard': return <Dashboard setPage={setPage} />;
            case 'entities': return <EntityManagement />;
            case 'customers': return <CustomerMaster />;
            // Pass the invoice ID (payload) to the CreateInvoice component for editing
            case 'invoices/new': return <CreateInvoice setPage={setPage} invoiceId={page.payload} />;
            case 'invoices/view': return <ViewInvoices setPage={setPage} />;
            case 'reports': return <Reports />;
            default: return <Dashboard setPage={setPage} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans antialiased text-sm">
            <Sidebar setPage={setPage} currentPage={page.name} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">{renderPage()}</main>
            </div>
            <GlobalStyles />
        </div>
    );
}