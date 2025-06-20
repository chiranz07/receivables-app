import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { Plus, X, Search } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { initialEntityState, placeOfSupplyOptions } from '../constants';
import FormModal from './common/FormModal';

const EntityFormModal = ({ entity, setEntity, onClose, onSubmit, error }) => {
    const handleChange = (e) => setEntity(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleAddressChange = (e) => setEntity(prev => ({...prev, address: {...prev.address, [e.target.name]: e.target.value}}));

    return (
        <FormModal title="New Entity" error={error} onClose={onClose} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Entity Name*</label><input type="text" name="name" value={entity.name} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">GST Registered?*</label><select name="isGstRegistered" value={entity.isGstRegistered} onChange={handleChange} className="form-input-modal"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                {entity.isGstRegistered === 'Yes' && <>
                    <div><label className="form-label">GSTIN*</label><input type="text" name="gstin" value={entity.gstin} onChange={handleChange} className="form-input-modal" required /></div>
                    <div><label className="form-label">PAN*</label><input type="text" name="pan" value={entity.pan} onChange={handleChange} className="form-input-modal" required /></div>
                </>}
                <div><label className="form-label">Place of Supply*</label><select name="placeOfSupply" value={entity.placeOfSupply} onChange={handleChange} className="form-input-modal" required><option value="">Select...</option>{placeOfSupplyOptions.map(o => <option key={o.code} value={o.name}>{o.code} - {o.name}</option>)}</select></div>
                <div><label className="form-label">Email*</label><input type="email" name="email" value={entity.email} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Phone*</label><input type="tel" name="phone" value={entity.phone} onChange={handleChange} className="form-input-modal" required /></div>
            </div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Address</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="form-label">Address Line 1</label><input type="text" name="line1" value={entity.address.line1} onChange={handleAddressChange} className="form-input-modal" /></div><div className="md:col-span-2"><label className="form-label">Address Line 2</label><input type="text" name="line2" value={entity.address.line2} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">City</label><input type="text" name="city" value={entity.address.city} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">State</label><input type="text" name="state" value={entity.address.state} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Pincode</label><input type="text" name="pincode" value={entity.address.pincode} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Country</label><input type="text" name="country" value={entity.address.country} onChange={handleAddressChange} className="form-input-modal" /></div></div></div>
        </FormModal>
    );
};

function EntityManagement() {
    const [entities, setEntities] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentEntity, setCurrentEntity] = useState(initialEntityState);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const entitiesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/entities`;

    useEffect(() => {
        const q = query(collection(db, entitiesCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEntities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => { console.error("Error fetching entities:", err); });
        return unsubscribe;
    }, [entitiesCollectionPath]);

    const handleAddEntity = async (e) => {
        e.preventDefault();
        setError('');
        if (!currentEntity.name || (currentEntity.isGstRegistered === 'Yes' && !currentEntity.gstin)) { setError("Please fill all required fields."); return; }
        if (entities.some(ent => ent.name.toLowerCase() === currentEntity.name.toLowerCase())) { setError("An entity with this name already exists."); return; }
        try {
            await addDoc(collection(db, entitiesCollectionPath), currentEntity);
            setShowModal(false);
        } catch (err) { console.error("Error adding entity: ", err); setError("Failed to add entity."); }
    };

    const filteredEntities = entities.filter(entity => entity.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="text-xl font-bold text-gray-800">Entities</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full" /><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div>
                    <button onClick={() => { setCurrentEntity(initialEntityState); setShowModal(true); }} className="text-white px-3 py-1.5 rounded-md transition flex items-center justify-center shadow-sm text-xs" style={{backgroundColor: '#2a3f50'}}><Plus size={16} className="mr-1" /> New Entity</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-3 font-semibold text-gray-500 text-xs">Name</th><th className="p-3 font-semibold text-gray-500 text-xs">GST Registered</th><th className="p-3 font-semibold text-gray-500 text-xs">GSTIN</th><th className="p-3 font-semibold text-gray-500 text-xs">PAN</th></tr></thead>
                    <tbody>{filteredEntities.map(entity => (<tr key={entity.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-3 text-gray-700">{entity.name}</td><td className="p-3 text-gray-500">{entity.isGstRegistered}</td><td className="p-3 text-gray-500 font-mono text-xs">{entity.gstin}</td><td className="p-3 text-gray-500 font-mono text-xs">{entity.pan}</td></tr>))}</tbody>
                </table>
            </div>
            {showModal && <EntityFormModal entity={currentEntity} setEntity={setCurrentEntity} onClose={() => setShowModal(false)} onSubmit={handleAddEntity} error={error} />}
        </div>
    );
}

export default EntityManagement;