import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import Alert from '../components/alert';
import FranchiseTable from '../components/franchiseTable';
import UserTable from '../components/userTable';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';

// Number of rows shown per page in the Franchises and Users tables
const FRANCHISE_PAGE_SIZE = 3;
const USER_PAGE_SIZE = 10;

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({ franchises: [], more: false });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const [userList, setUserList] = React.useState<UserList>({ users: [], more: false });
  const [userPage, setUserPage] = React.useState(0);
  const [userFilter, setUserFilter] = React.useState('');
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

  function filterUsers(filter: string) {
    setUserPage(0);
    setUserFilter(filter);
  }

  async function filterFranchises(filter: string) {
    setFranchiseList(await pizzaService.getFranchises(franchisePage, FRANCHISE_PAGE_SIZE, `*${filter}*`));
  }

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Franchises</h3>
          <FranchiseTable franchises={franchiseList.franchises} more={franchiseList.more} page={franchisePage} onPageChange={setFranchisePage} onFilter={filterFranchises} onCloseFranchise={closeFranchise} onCloseStore={closeStore} />
        </div>
        <div>
          <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
        </div>

        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Users</h3>
          <Alert message={userError} />
          <UserTable users={userList.users} more={userList.more} page={userPage} onPageChange={setUserPage} onFilter={filterUsers} onDelete={deleteUser} />
        </div>
      </View>
    );
  }

  return response;
}
