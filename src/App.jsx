import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from './api/firebase';

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
    const [page, setPage] = useState('dashboard');
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthReady(true);
            } else {
                try {
                    // It's assumed __initial_auth_token is a global variable
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                    // The onAuthStateChanged listener will handle setting isAuthReady to true
                } catch (error) {
                    console.error("Error during sign-in:", error);
                    // Handle auth failure if necessary
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const renderPage = () => {
        if (!isAuthReady) {
            return <PageLoader />;
        }
        switch (page) {
            case 'dashboard': return <Dashboard setPage={setPage} />;
            case 'entities': return <EntityManagement />;
            case 'customers': return <CustomerMaster />;
            case 'invoices/new': return <CreateInvoice setPage={setPage} />;
            case 'invoices/view': return <ViewInvoices />;
            case 'reports': return <Reports />;
            default: return <Dashboard setPage={setPage} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans antialiased text-sm">
            <Sidebar setPage={setPage} currentPage={page} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">{renderPage()}</main>
            </div>
            <GlobalStyles />
        </div>
    );
}