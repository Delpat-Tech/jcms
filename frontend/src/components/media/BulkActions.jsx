import React from 'react';
import { Download, Trash2, Move, X } from 'lucide-react';

const BulkActions = ({ selectedCount, onDownload, onDelete, onMove, onClear }) => {
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={onMove}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              <Move className="w-4 h-4" />
              <span>Move</span>
            </button>
            
            <button
              onClick={onDelete}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
        
        <button
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;