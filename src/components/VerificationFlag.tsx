import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { VerificationPopup } from './VerificationPopup';

interface VerificationFlagProps {
  field: string;
  value: string;
  recordId: string;
  isVerified?: boolean;
  onVerify: (field: string) => void;
  onFlag: (field: string) => void;
}

export const VerificationFlag: React.FC<VerificationFlagProps> = ({
  field,
  value,
  recordId,
  isVerified,
  onVerify,
  onFlag
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [action, setAction] = useState<'verify' | 'flag' | null>(null);

  const handleAction = (type: 'verify' | 'flag') => {
    setAction(type);
    setShowPopup(true);
    if (type === 'verify') {
      onVerify(field);
    } else {
      onFlag(field);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="flex-1">{value}</span>
      <div className="flex items-center gap-2">
        <span
          onClick={() => handleAction('verify')}
          className={`cursor-pointer opacity-0 group-hover:opacity-100 transition-all ${
            isVerified ? 'text-green-500' : 'text-green-500/30 hover:text-green-500'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
        </span>
        <span
          onClick={() => handleAction('flag')}
          className="cursor-pointer opacity-0 group-hover:opacity-100 text-red-500/30 hover:text-red-500 transition-all"
        >
          <AlertCircle className="w-4 h-4" />
        </span>
      </div>

      {showPopup && (
        <VerificationPopup
          action={action}
          recordId={recordId}
          fieldName={field}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};