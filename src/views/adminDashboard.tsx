import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import Alert from '../components/alert';
import TableHeader from '../components/tableHeader';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';
import { TrashIcon } from '../icons';

// Number of rows shown per page in the Franchises and Users tables
const FRANCHISE_PAGE_SIZE = 3;
const USER_PAGE_SIZE = 10;

const FRANCHISE_HEADERS = ['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action'];
const USER_HEADERS = ['Name', 'Email', 'Role', 'Action'];

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({ franchises: [], more: false });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const filterFranchiseRef = React.useRef<HTMLInputElement>(null);
  const [userList, setUserList] = React.useState<UserList>({ users: [], more: false });
  const [userPage, setUserPage] = React.useState(0);
  const [userFilter, setUserFilter] = React.useState('');
  const filterUserRef = React.useRef<HTMLInputElement>(null);
  const [userError, setUserError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, FRANCHISE_PAGE_SIZE, '*'));
    })();
  }, [props.user, franchisePage]);

  const loadUsers = React.useCallback(async () => {
    if (Role.isRole(props.user, Role.Admin)) {
      setUserList(await pizzaService.getUsers(userPage, USER_PAGE_SIZE, `*${userFilter}*`));
    }
  }, [props.user, userPage, userFilter]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  async function closeFranchise(franchise: Franchise) {
    navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
  }

  async function deleteUser(user: User) {
    try {
      await pizzaService.deleteUser(user);
    } catch (err: any) {
      setUserError(err.message || 'Unable to delete user');
      return;
    }

    setUserError('');
    await loadUsers();
  }

  function filterUsers() {
    setUserPage(0);
    setUserFilter(filterUserRef.current?.value ?? '');
  }

  async function filterFranchises() {
    setFranchiseList(await pizzaService.getFranchises(franchisePage, FRANCHISE_PAGE_SIZE, `*${filterFranchiseRef.current?.value}*`));
  }

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Franchises</h3>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <TableHeader headers={FRANCHISE_HEADERS} />
                      {franchiseList.franchises.map((franchise, findex) => {
                        return (
                          <tbody key={findex} className="divide-y divide-gray-200">
                            <tr className="border-neutral-500 border-t-2">
                              <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">{franchise.name}</td>
                              <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800" colSpan={3}>
                                {franchise.admins?.map((o) => o.name).join(', ')}
                              </td>
                              <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800" onClick={() => closeFranchise(franchise)}>
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
                                    <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => closeStore(franchise, store)}>
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
                            <input type="text" ref={filterFranchiseRef} name="filterFranchise" placeholder="Filter franchises" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                            <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterFranchises}>
                              Submit
                            </button>
                          </td>
                          <td colSpan={4} className="text-end text-sm font-medium">
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 " aria-label="Previous page of franchises" onClick={() => setFranchisePage(franchisePage - 1)} disabled={franchisePage <= 0}>
                              «
                            </button>
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Next page of franchises" onClick={() => setFranchisePage(franchisePage + 1)} disabled={!franchiseList.more}>
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
        </div>
        <div>
          <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
        </div>

        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Users</h3>
          <Alert message={userError} />
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <TableHeader headers={USER_HEADERS} />
                      <tbody className="divide-y divide-gray-200">
                        {userList.users.map((user, uindex) => (
                          <tr key={uindex} className="hover:bg-gray-100">
                            <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.name}</td>
                            <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.email}</td>
                            <td className="text-start px-2 py-1 whitespace-nowrap text-sm text-gray-800">{user.roles?.map((r) => r.role).join(', ')}</td>
                            <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                              <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => deleteUser(user)}>
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
                            <input type="text" ref={filterUserRef} name="filterUser" placeholder="Name" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                            <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterUsers}>
                              Search
                            </button>
                          </td>
                          <td colSpan={3} className="text-end text-sm font-medium">
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Previous page of users" onClick={() => setUserPage(userPage - 1)} disabled={userPage <= 0}>
                              Prev
                            </button>
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" aria-label="Next page of users" onClick={() => setUserPage(userPage + 1)} disabled={!userList.more}>
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
        </div>
      </View>
    );
  }

  return response;
}
