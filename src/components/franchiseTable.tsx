import React from 'react';
import TableHeader from './tableHeader';
import { Franchise, Store } from '../service/pizzaService';
import { TrashIcon } from '../icons';

const FRANCHISE_HEADERS = ['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action'];

interface Props {
  franchises: Franchise[];
  more: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onFilter: (filter: string) => void;
  onCloseFranchise: (franchise: Franchise) => void;
  onCloseStore: (franchise: Franchise, store: Store) => void;
}

export default function FranchiseTable(props: Props) {
  const filterRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-neutral-100 overflow-clip my-4">
      <div className="flex flex-col">
        <div className="-m-1.5 overflow-x-auto">
          <div className="p-1.5 min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <TableHeader headers={FRANCHISE_HEADERS} />
                {props.franchises.map((franchise, findex) => {
                  return (
                    <tbody key={findex} className="divide-y divide-gray-200">
                      <tr className="border-neutral-500 border-t-2">
                        <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">{franchise.name}</td>
                        <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800" colSpan={3}>
                          {franchise.admins?.map((o) => o.name).join(', ')}
                        </td>
                        <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                          <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800" onClick={() => props.onCloseFranchise(franchise)}>
                            <TrashIcon />
                            Close
                          </button>
                        </td>
                      </tr>

                      {franchise.stores.map((store, sindex) => {
                        return (
                          <tr key={sindex} className="bg-neutral-100">
                            <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800" colSpan={3}>
                              {store.name}
                            </td>
                            <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">{store.totalRevenue?.toLocaleString()} ₿</td>
                            <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                              <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => props.onCloseStore(franchise, store)}>
                                <TrashIcon />
                                Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
                <tfoot>
                  <tr>
                    <td className="px-1 py-1">
                      <input type="text" ref={filterRef} name="filterFranchise" placeholder="Filter franchises" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                      <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => props.onFilter(filterRef.current?.value ?? '')}>
                        Submit
                      </button>
                    </td>
                    <td colSpan={4} className="text-end text-sm font-medium">
                      <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 " aria-label="Previous page of franchises" onClick={() => props.onPageChange(props.page - 1)} disabled={props.page <= 0}>
                        «
                      </button>
                      <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Next page of franchises" onClick={() => props.onPageChange(props.page + 1)} disabled={!props.more}>
                        »
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
