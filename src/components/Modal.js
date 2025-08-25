// =========================================================================
// FILE: src/components/Modal.js
// A reusable modal component for showing messages.
// =========================================================================
import React from 'react';

const Modal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
      <p className="mb-4 text-gray-700">{message}</p>
      <button
        onClick={onClose}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
      >
        Close
      </button>
    </div>
  </div>
);

export default Modal;
