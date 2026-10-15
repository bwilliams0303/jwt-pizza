import React from 'react';

interface Props {
  headers: string[];
}

export default function TableHeader(props: Props) {
  return (
    <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
      <tr>
        {props.headers.map((header, index) => (
          <th key={index} scope="col" className="px-6 py-3 text-center text-xs font-medium">
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
