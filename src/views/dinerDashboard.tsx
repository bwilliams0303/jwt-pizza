import React from 'react';
import { Link } from 'react-router-dom';
import View from './view';
import { pizzaService } from '../service/service';
import { Order, OrderHistory, Role, User } from '../service/pizzaService';
import { CloseIcon } from '../icons';
import Button from '../components/button';
import Alert from '../components/alert';
import { validateUser } from '../service/validateUser';

interface Props {
  user: User | null;
  setUser: (user: User) => void;
}

export default function DinerDashboard(props: Props) {
  const user = props.user || ({} as User);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [editName, setEditName] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editPassword, setEditPassword] = React.useState('');
  const [updateError, setUpdateError] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (user) {
        const r: OrderHistory = await pizzaService.getOrders(user);
        setOrders(r.orders);
      }
    })();
  }, [user]);

  function formatRole(role: { role: Role; objectId?: string }) {
    if (role.role === Role.Franchisee) {
      return `Franchisee on ${role.objectId}`;
    }

    return role.role;
  }

  // Let Escape close the edit dialog while it is open
  React.useEffect(() => {
    if (!isEditing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsEditing(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditing]);

  async function updateUser() {
    let updatedUser: User = {
      id: user.id,
      name: editName,
      email: editEmail,
      password: editPassword || undefined,
      roles: user.roles,
    };

    try {
      await pizzaService.updateUser(updatedUser);
    } catch (err: any) {
      // Keep the dialog open so the user can fix the problem and try again
      setUpdateError(err.message || 'Unable to update user');
      return;
    }

    setUpdateError('');
    setEditPassword('');
    props.setUser(updatedUser);
    setIsEditing(false);
  }

  function openEditDialog() {
    // Start each edit from the current user so abandoned changes are not carried over
    setEditName(user.name ?? '');
    setEditEmail(user.email ?? '');
    setEditPassword('');
    setUpdateError('');
    setIsEditing(true);
  }

  const validationErrors = validateUser({ name: editName, email: editEmail, password: editPassword });
  const canUpdate = validationErrors.length === 0;

  return (
    <View title="Your pizza kitchen">
      <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
        <div className="hs-tooltip inline-block">
          <img className="hs-tooltip-toggle relative inline-block size-[96px] rounded-full ring-2 ring-white hover:z-10" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" alt="Employee stock photo" />
        </div>
        <Button title="Edit" className="w-16 p-0" onPress={openEditDialog} />

        <div className="my-4 text-lg text-orange-200 text-start grid grid-cols-5 gap-2">
          <div className="font-semibold text-orange-400">name:</div> <div className="col-span-4">{user.name}</div>
          <div className="font-semibold text-orange-400">email:</div> <div className="col-span-4">{user.email}</div>
          <div className="font-semibold text-orange-400">role:</div>{' '}
          <div className="col-span-4">
            {user.roles &&
              user.roles.map((role, index) => (
                <span key={index}>
                  {index === 0 ? '' : ', '} {formatRole(role)}
                </span>
              ))}
          </div>
        </div>

        {orders?.length === 0 && (
          <div className="text-neutral-100">
            How have you lived this long without having a pizza?{' '}
            <Link className="text-orange-400 underline font-semibold" to="/menu">
              Buy one
            </Link>{' '}
            now!
          </div>
        )}
        {orders?.length > 0 && (
          <>
            <div className="text-neutral-100">Here is your history of all the good times.</div>
            <div className="bg-neutral-100 overflow-clip my-4">
              <div className="flex flex-col">
                <div className="-m-1.5 overflow-x-auto">
                  <div className="p-1.5 min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs sm:text-sm font-medium">
                              ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-start text-xs sm:text-sm font-medium">
                              Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-start text-xs sm:text-sm font-medium">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orders.map((order, index) => (
                            <tr key={index} className="hover:bg-gray-100">
                              <td className="px-6 py-4 whitespace-nowrap text-start text-xs sm:text-sm font-medium text-gray-800">{order.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-start text-xs sm:text-sm text-gray-800">{order.items.reduce((a, c) => a + c.price, 0).toLocaleString()} ₿</td>
                              <td className="px-6 py-4 whitespace-nowrap text-start text-xs sm:text-sm text-gray-800">{order.date.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-user-title" className="size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-black/50 pt-10">
          <div className="mt-7 sm:max-w-lg sm:w-full m-3 sm:mx-auto">
            <div className="w-full flex flex-col bg-white border shadow-sm rounded-xl">
              <div className="flex justify-between items-center py-3 px-4 border-b bg-slate-200 rounded-t-xl">
                <h3 id="edit-user-title" className="font-bold text-gray-800">
                  Edit user
                </h3>
                <button type="button" aria-label="Close" className="flex justify-center items-center size-7 text-sm font-semibold rounded-full border border-transparent text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none" onClick={() => setIsEditing(false)}>
                  <CloseIcon className="" />
                </button>
              </div>
              <div className="p-4 overflow-y-scroll max-h-52">
                <div className="my-4 text-lg text-start grid grid-cols-5 gap-2 items-center">
                  <label htmlFor="edit-user-name" className="font-semibold">
                    name:
                  </label>
                  <input id="edit-user-name" type="text" className="col-span-4 border border-gray-300 rounded-md p-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <label htmlFor="edit-user-email" className="font-semibold">
                    email:
                  </label>
                  <input id="edit-user-email" type="email" className="col-span-4 border border-gray-300 rounded-md p-1" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  <label htmlFor="edit-user-password" className="font-semibold">
                    password:
                  </label>
                  <input id="edit-user-password" type="password" autoComplete="new-password" className="col-span-4 border border-gray-300 rounded-md p-1" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                </div>
                {validationErrors.length > 0 && (
                  <ul className="text-sm text-gray-600">
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
                <Alert message={updateError} />
              </div>
              <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t bg-slate-200 rounded-b-xl">
                <button type="button" className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none" onClick={updateUser} disabled={!canUpdate}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </View>
  );
}
