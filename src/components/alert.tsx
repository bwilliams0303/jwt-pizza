import React from 'react';

interface Props {
  message: string;
  className?: string;
}

export default function Alert(props: Props) {
  if (!props.message) {
    return null;
  }

  const finalClassName = `my-2 px-3 py-2 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 ${props.className ?? ''}`;
  return (
    <div role="alert" className={finalClassName}>
      {props.message}
    </div>
  );
}
