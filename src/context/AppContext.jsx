import React, { useState, useEffect, createContext, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId, getUserId } from '../api/firebase';

// Create the context
export const AppContext = createContext();

// Create a custom hook for easy access to the context
export const useAppContext = () => {
    return useContext(AppContext);
};

// Create the Provider component
export const AppProvider = ({ children }) => {
    const [entities, setEntities] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = getUserId(); // Assuming getUserId() is stable or app re-mounts on user change

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        };

        const paths = {
            entities: `/artifacts/${appId}/users/${userId}/entities`,
            customers: `/artifacts/${appId}/users/${userId}/customers`,
            invoices: `/artifacts/${appId}/users/${userId}/invoices`,
        };

        const unsubscribes = [];
        let loadingStates = { entities: true, customers: true, invoices: true };

        const checkLoading = () => {
            if (!loadingStates.entities && !loadingStates.customers && !loadingStates.invoices) {
                setIsLoading(false);
            }
        };

        // Fetch Entities
        const entitiesQuery = query(collection(db, paths.entities));
        unsubscribes.push(onSnapshot(entitiesQuery, (snapshot) => {
            setEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            loadingStates.entities = false;
            checkLoading();
        }, (err) => { console.error("Error fetching entities:", err); loadingStates.entities = false; checkLoading(); }));

        // Fetch Customers
        const customersQuery = query(collection(db, paths.customers));
        unsubscribes.push(onSnapshot(customersQuery, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            loadingStates.customers = false;
            checkLoading();
        }, (err) => { console.error("Error fetching customers:", err); loadingStates.customers = false; checkLoading(); }));

        // Fetch Invoices
        const invoicesQuery = query(collection(db, paths.invoices));
        unsubscribes.push(onSnapshot(invoicesQuery, (snapshot) => {
            setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            loadingStates.invoices = false;
            checkLoading();
        }, (err) => { console.error("Error fetching invoices:", err); loadingStates.invoices = false; checkLoading(); }));

        // Cleanup function
        return () => unsubscribes.forEach(unsub => unsub());

    }, [userId]);

    const value = {
        entities,
        customers,
        invoices,
        isLoading,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};