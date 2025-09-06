import React from 'react';
import Modal from './Modal';
import { Button } from './button';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-400" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-400" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white';
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white';
      case 'info':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white';
      default:
        return 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white';
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 text-slate-200">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-300 mb-6 text-sm leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-slate-600/20 hover:bg-slate-600/30 text-white disabled:opacity-50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 ${getConfirmButtonStyle()} disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
