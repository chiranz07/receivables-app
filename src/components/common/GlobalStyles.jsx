import React from 'react';

const GlobalStyles = () => (
    <style>{`
        .form-label { display: block; margin-bottom: 0.25rem; font-size: 0.75rem; font-weight: 500; color: #4b5563; }
        .form-input-search { padding: 0.375rem 0.75rem; padding-left: 2.25rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: #f9fafb; width: 100%; font-size: 0.875rem; }
        .form-input-search:focus { background-color: white; outline: 2px solid transparent; outline-offset: 2px; border-color: #2a3f50; }
        .form-input-modal { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: #f9fafb; transition: all 0.2s; font-size: 0.875rem; }
        .form-input-modal:focus { background-color: white; outline: 2px solid transparent; outline-offset: 2px; border-color: #2a3f50; box-shadow: 0 0 0 1px #2a3f50; }
        .form-input-create { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: #ffffff; font-size: 0.875rem; }
        .form-input-create:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #2a3f50; }
        select.form-input-modal, select.form-input-create { appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpath d="M7 7l3-3 3 3m0 6l-3 3-3-3"/%3e%3c/svg%3e'); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1em; padding-right: 2.5rem; }
        .menu-item { display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; }
        .menu-item:hover { background-color: #f3f4f6; }
        .no-arrows::-webkit-outer-spin-button, .no-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-arrows { -moz-appearance: textfield; }
    `}</style>
);

export default GlobalStyles;