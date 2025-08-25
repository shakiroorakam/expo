// =========================================================================
// FILE: src/components/Spinner.js
// A reusable loading spinner component.
// =========================================================================
import React from 'react';

const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default Spinner;
