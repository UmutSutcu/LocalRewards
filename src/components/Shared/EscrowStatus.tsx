import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { EscrowData } from '../../services/escrowService';
import Card from '../Shared/Card';

interface EscrowStatusProps {
  escrowData: EscrowData | null;
  className?: string;
}

export default function EscrowStatus({ escrowData, className = '' }: EscrowStatusProps) {
  if (!escrowData) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-sm text-amber-600">No escrow found</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (escrowData.status) {
      case 'locked':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'released':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (escrowData.status) {
      case 'locked':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'released':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (escrowData.status) {
      case 'locked':
        return 'Funds Secured in Escrow';
      case 'released':
        return 'Payment Released';
      case 'cancelled':
        return 'Escrow Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusDescription = () => {
    switch (escrowData.status) {
      case 'locked':
        return escrowData.freelancerAddress 
          ? `${escrowData.amount} ${escrowData.currency} locked for freelancer`
          : `${escrowData.amount} ${escrowData.currency} locked, awaiting freelancer assignment`;
      case 'released':
        return `${escrowData.amount} ${escrowData.currency} released to freelancer${escrowData.releasedAt ? ` on ${escrowData.releasedAt.toLocaleDateString()}` : ''}`;
      case 'cancelled':
        return `${escrowData.amount} ${escrowData.currency} refunded to employer`;
      default:
        return 'Status unknown';
    }
  };

  return (
    <Card className={`p-4 border-l-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{getStatusText()}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {escrowData.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{getStatusDescription()}</p>
          
          {/* Escrow Details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Amount:</span> {escrowData.amount} {escrowData.currency}
            </div>
            <div>
              <span className="font-medium">Created:</span> {escrowData.createdAt.toLocaleDateString()}
            </div>
            {escrowData.freelancerAddress && (
              <div className="col-span-2">
                <span className="font-medium">Freelancer:</span> {escrowData.freelancerAddress.substring(0, 8)}...
              </div>
            )}
          </div>

          {/* Security Indicators */}
          <div className="mt-3 flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1 text-green-600">
              <Shield className="w-3 h-3" />
              <span>Smart Contract Protected</span>
            </div>
            {escrowData.status === 'locked' && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Clock className="w-3 h-3" />
                <span>Awaiting Completion</span>
              </div>
            )}
            {escrowData.status === 'released' && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>Payment Processed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
