import React from 'react';

type DialogStatus = 'new' | 'in_progress' | 'closed';

interface DialogStatusBadgeProps {
  status: DialogStatus;
}

const DialogStatusBadge: React.FC<DialogStatusBadgeProps> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let label = '';

  switch (status) {
    case 'new':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      label = 'Новый';
      break;
    case 'in_progress':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'В работе';
      break;
    case 'closed':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Закрыт';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = 'Неизвестно';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};

export default DialogStatusBadge; 