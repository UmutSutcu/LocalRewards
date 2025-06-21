import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000,
}) => {
  const Icon = iconMap[type];

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg 
      animate-slide-up ${colorMap[type]}
    `}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${iconColorMap[type]}`} />
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
