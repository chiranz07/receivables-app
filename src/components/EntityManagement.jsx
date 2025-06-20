import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, X, Search, Pencil, Trash2 } from 'lucide-react';
import { db, appId, getUserId } from '../api/firebase';
import { initialEntityState, placeOfSupplyOptions } from '../constants';
import FormModal from './common/FormModal';
import { useAppContext } from '../context/AppContext';
import SearchableDropdown from './common/SearchableDropdown'; // Import the new component

const EntityFormModal = ({ entity, setEntity, onClose, onSubmit, error, isEditing }) => {
    const handleChange = (e) => setEntity(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleAddressChange = (e) => setEntity(prev => ({...prev, address: {...prev.address, [e.target.name]: e.target.value}}));

    const handleGstinChange = (e) => {
        const gstin = e.target.value.toUpperCase();
        let newState = { ...entity, gstin };
        if (gstin.length >= 12) { newState.pan = gstin.substring(2, 12); }
        if (gstin.length >= 2) {
            const stateCode = gstin.substring(0, 2);
            const placeOfSupply = placeOfSupplyOptions.find(opt => opt.code === stateCode);
            if (placeOfSupply) { newState.placeOfSupply = placeOfSupply.name; }
        }
        setEntity(newState);
    };

    return (
        <FormModal title={isEditing ? "Edit Entity" : "New Entity"} error={error} onClose={onClose} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Entity Name*</label><input type="text" name="name" value={entity.name} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">GST Registered?*</label><select name="isGstRegistered" value={entity.isGstRegistered} onChange={handleChange} className="form-input-modal"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                {entity.isGstRegistered === 'Yes' ? (
                    <>
                        <div><label className="form-label">GSTIN*</label><input type="text" name="gstin" value={entity.gstin} onChange={handleGstinChange} className="form-input-modal" maxLength="15" required /></div>
                        <div><label className="form-label">PAN*</label><input type="text" name="pan" value={entity.pan} onChange={handleChange} className="form-input-modal" required /></div>
                    </>
                ) : (
                    <div><label className="form-label">PAN*</label><input type="text" name="pan" value={entity.pan} onChange={handleChange} className="form-input-modal" required /></div>
                )}
                <div><label className="form-label">Place of Supply*</label><SearchableDropdown options={placeOfSupplyOptions} value={entity.placeOfSupply} onChange={(value) => setEntity({...entity, placeOfSupply: value})} /></div>
                <div><label className="form-label">Email*</label><input type="email" name="email" value={entity.email} onChange={handleChange} className="form-input-modal" required /></div>
                <div><label className="form-label">Phone*</label><input type="tel" name="phone" value={entity.phone} onChange={handleChange} className="form-input-modal" required /></div>
            </div>
            <div className="border-t pt-4 mt-4"><h4 className="text-md font-semibold text-gray-700 mb-3">Address</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className="form-label">Address Line 1</label><input type="text" name="line1" value={entity.address.line1} onChange={handleAddressChange} className="form-input-modal" /></div><div className="md:col-span-2"><label className="form-label">Address Line 2</label><input type="text" name="line2" value={entity.address.line2} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">City</label><input type="text" name="city" value={entity.address.city} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">State</label><input type="text" name="state" value={entity.address.state} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Pincode</label><input type="text" name="pincode" value={entity.address.pincode} onChange={handleAddressChange} className="form-input-modal" /></div><div><label className="form-label">Country</label><input type="text" name="country" value={entity.address.country} onChange={handleAddressChange} className="form-input-modal" /></div></div></div>
        </FormModal>
    );
};

const ConfirmDeleteModal = ({ item, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm border">
            <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Are you sure you want to delete <span className="font-bold">{item?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-200 transition font-semibold text-xs">Cancel</button>
                <button type="button" onClick={onConfirm} className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition font-semibold shadow-sm text-xs">Delete</button>
            </div>
        </div>
    </div>
);


function EntityManagement() {
    const { entities, isLoading } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [currentEntity, setCurrentEntity] = useState(initialEntityState);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState(null);

    const entitiesCollectionPath = `/artifacts/${appId}/users/${getUserId()}/entities`;

    const handleOpenModalForCreate = () => {
        setIsEditing(false);
        setCurrentEntity(initialEntityState);
        setShowModal(true);
        setError('');
    };

    const handleOpenModalForEdit = (entity) => {
        setIsEditing(true);
        setCurrentEntity(entity);
        setShowModal(true);
        setError('');
    };

    const handleSaveEntity = async (e) => {
        e.preventDefault();
        setError('');
        if (!currentEntity.name || !currentEntity.pan) { setError("Please fill all required fields."); return; }
        if (currentEntity.isGstRegistered === 'Yes' && !currentEntity.gstin) { setError("Please fill GSTIN."); return; }

        try {
            if (isEditing) {
                const entityRef = doc(db, entitiesCollectionPath, currentEntity.id);
                await updateDoc(entityRef, currentEntity);
            } else {
                if (entities.some(ent => ent.name.toLowerCase() === currentEntity.name.toLowerCase())) { setError("An entity with this name already exists."); return; }
                await addDoc(collection(db, entitiesCollectionPath), currentEntity);
            }
            setShowModal(false);
        } catch (err) { console.error("Error saving entity: ", err); setError("Failed to save entity."); }
    };

    const openDeleteConfirm = (entity) => {
        setEntityToDelete(entity);
    };

    const handleDeleteEntity = async () => {
        if (!entityToDelete) return;
        try {
            await deleteDoc(doc(db, entitiesCollectionPath, entityToDelete.id));
            setEntityToDelete(null);
        } catch (err) {
            console.error("Error deleting entity: ", err);
        }
    };

    const filteredEntities = entities.filter(entity => entity.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return <p>Loading entities...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="text-xl font-bold text-gray-800">Entities</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input-search w-full" /><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div>
                    <button onClick={handleOpenModalForCreate} className="text-white px-3 py-1.5 rounded-md transition flex items-center justify-center shadow-sm text-xs" style={{backgroundColor: '#2a3f50'}}><Plus size={16} className="mr-1" /> New Entity</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="border-b-2 border-gray-200"><tr><th className="p-3 font-semibold text-gray-500 text-xs">Name</th><th className="p-3 font-semibold text-gray-500 text-xs">GST Registered</th><th className="p-3 font-semibold text-gray-500 text-xs">GSTIN</th><th className="p-3 font-semibold text-gray-500 text-xs">PAN</th><th className="p-3 font-semibold text-gray-500 text-xs">Actions</th></tr></thead>
                    <tbody>{filteredEntities.map(entity => (<tr key={entity.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-3 text-gray-700">{entity.name}</td><td className="p-3 text-gray-500">{entity.isGstRegistered}</td><td className="p-3 text-gray-500 font-mono text-xs">{entity.gstin}</td><td className="p-3 text-gray-500 font-mono text-xs">{entity.pan}</td><td className="p-3"><div className="flex items-center space-x-2"><button onClick={() => handleOpenModalForEdit(entity)} className="text-gray-400 hover:text-blue-600 p-1"><Pencil size={14}/></button><button onClick={() => openDeleteConfirm(entity)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={14}/></button></div></td></tr>))}</tbody>
                </table>
            </div>
            {showModal && <EntityFormModal entity={currentEntity} setEntity={setCurrentEntity} onClose={() => setShowModal(false)} onSubmit={handleSaveEntity} error={error} isEditing={isEditing} />}
            {entityToDelete && <ConfirmDeleteModal item={entityToDelete} onConfirm={handleDeleteEntity} onCancel={() => setEntityToDelete(null)} />}
        </div>
    );
}

export default EntityManagement;