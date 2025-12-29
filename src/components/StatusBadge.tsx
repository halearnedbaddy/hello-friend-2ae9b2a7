import React from 'react';
import { Clock, CheckCircle, Truck, AlertTriangle, XCircle, Package } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  colors: string;
}> = {
  pending: {
    label: 'Awaiting Acceptance',
    icon: Clock,
    colors: 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    colors: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100',
  },
  shipped: {
    label: 'In Transit',
    icon: Truck,
    colors: 'bg-violet-50 text-violet-700 border-violet-200 shadow-violet-100',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    colors: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100',
  },
  dispute: {
    label: 'Dispute Open',
    icon: AlertTriangle,
    colors: 'bg-red-50 text-red-700 border-red-200 shadow-red-100',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    colors: 'bg-gray-50 text-gray-600 border-gray-200 shadow-gray-100',
  },
  delivered: {
    label: 'Delivered',
    icon: Package,
    colors: 'bg-teal-50 text-teal-700 border-teal-200 shadow-teal-100',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    icon: Package,
    colors: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-null-full border shadow-sm
        transition-all duration-200 hover:shadow-md
        ${config.colors}
        ${sizeClasses[size]}
      `}
    >
      <Icon size={iconSizes[size]} className="flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
