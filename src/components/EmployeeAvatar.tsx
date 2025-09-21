import React from 'react';
import { generateAvatarColorClasses, getInitials } from '@/utils/avatarUtils';

interface Props {
  name: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const EmployeeAvatar: React.FC<Props> = ({ name, size = 'small', className }) => {
  const sizeClasses = size === 'large' ? 'h-10 w-10 text-base' : size === 'medium' ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs';
  const classes = generateAvatarColorClasses(name);
  return (
    <div className={`inline-flex items-center justify-center rounded-full ${sizeClasses} ${classes} ${className || ''}`.trim()} aria-label={`Avatar de ${name}`}>
      <span className="font-semibold select-none">{getInitials(name)}</span>
    </div>
  );
};

export default EmployeeAvatar;


