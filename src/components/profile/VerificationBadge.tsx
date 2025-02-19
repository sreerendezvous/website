import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationBadgeProps {
  status: 'pending' | 'approved';
  showTooltip?: boolean;
  className?: string;
}

export function VerificationBadge({ status, showTooltip = true, className = '' }: VerificationBadgeProps) {
  const [showInfo, setShowInfo] = React.useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          text: 'Verified',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/20'
        };
      default:
        return {
          icon: Clock,
          text: 'Pending',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full
          ${config.bgColor} ${config.textColor}
          border ${config.borderColor}
        `}
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm">{config.text}</span>
      </div>

      {showTooltip && showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-earth-800 border border-earth-700 shadow-lg z-10"
        >
          <div className="text-sm text-sand-300">
            {status === 'approved' ? (
              <>
                <p className="font-medium text-green-400 mb-1">Verified Profile</p>
                <p>This profile has been verified by our team.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-yellow-400 mb-1">Verification in Progress</p>
                <p>This profile is currently being reviewed by our team.</p>
              </>
            )}
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-earth-800 border-r border-b border-earth-700"></div>
        </motion.div>
      )}
    </div>
  );
}