import React from 'react';
import TableHeader from './tableHeader';
import { User } from '../service/pizzaService';
import { TrashIcon } from '../icons';

const USER_HEADERS = ['Name', 'Email', 'Role', 'Action'];

interface Props {
  users: User[];
  more: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onFilter: (filter: string) => void;
  onDelete: (user: User) => void;
}

export default function UserTable(props: Props) {
  const filterRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-neutral-100 overflow-clip my-4">
      <div className="flex flex-col">
        <div className="-m-1.5 overflow-x-auto">
          <div className="p-1.5 min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <TableHeader headers={USER_HEADERS} />
                <tbody className="divide-y divide-gray-200">
                  {props.users.map((user, uindex) => (
                    <tr key={uindex} className="hover:bg-gray-100">
                      <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.name}</td>
                      <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.email}</td>
                      <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.roles?.map((r) => r.role).join(', ')}</td>
                      <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                        <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => props.onDelete(user)}>
                          <TrashIcon />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-1 py-1">
                      <input type="text" ref={filterRef} name="filterUser" placeholder="Name" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                      <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => props.onFilter(filterRef.current?.value ?? '')}>
                        Search
                      </button>
                    </td>
                    <td colSpan={3} className="text-end text-sm font-medium">
                      <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Previous page of users" onClick={() => props.onPageChange(props.page - 1)} disabled={props.page <= 0}>
                        Prev
                      </button>
                      <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Next page of users" onClick={() => props.onPageChange(props.page + 1)} disabled={!props.more}>
                        Next
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
