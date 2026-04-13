// import Table from '@/Components/Admin/Table';
import AdminLayout from '@/Layouts/AdminLayout';
import React from 'react';
import { RiUserLine, RiUserAddLine, RiUser2Line, RiDeleteBin6Line, RiFile3Fill, RiFileEditLine, RiDeleteBin7Fill, RiInstagramFill } from 'react-icons/ri';
import { Link } from '@inertiajs/react';
import Table from '@/Components/Table'
import ImageViwer from '@/Components/Admin/ImageViwer';
import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/Utils/helper';
function Index({ users, userStats, table }) {
  const { auth } = usePage().props;
  const [Users, SetUsers] = React.useState(users.data);

  React.useEffect(() => {
    SetUsers(users.data);
  }, [users.data]);

  const statCards = [
    {
      title: 'Total Users',
      count: userStats.total,
      change: userStats.percent_change,
      icon: <RiUserLine />,
      iconBg: 'bg-blue-500/20 text-blue-500',
      note: 'Total Users',
    },
    {
      title: 'Active Users',
      count: userStats.recently_active_count,
      change: userStats.active_percentage,
      icon: <RiUserAddLine />,
      iconBg: 'bg-green-500/20 text-green-500',
      note: 'Last week analytics',
    },
    {
      title: 'Online Users',
      count: userStats.online_count,
      change: userStats.online_percentage,
      icon: <RiUser2Line />,
      iconBg: 'bg-purple-500/20 text-purple-500',
      note: 'Last week analytics',
    },
  ];

  return (
    <div className='px-5 py-7 flex flex-col gap-7.5'>
      <div className='grid grid-cols-4 flex-wrap w-full gap-5'>
        {statCards.map((card, idx) => (
          <div key={idx} className='p-5 flex col-span-1 justify-between flex-col gap-10 items-start shadow bg-accent rounded-2xl'>
            <div className='flex text-heading flex-col w-full'>
              <div className='flex items-center w-full justify-between'>
                <div className={`${card.iconBg} rounded-lg size-9 flex items-center justify-center`}>
                  {card.icon}
                </div>
                <span
                  className={`text-base mb-2 font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  ({card.change >= 0 ? '+' : ''}{card.change}%)
                </span>
              </div>


              <span className='text-2xl mt-2 font-medium font-primary'>{card.count}</span>

              {/* </div> */}
              <div className='flex w-full justify-between'>
                <span className='text-secondary mt-1 font-primary text-sm font-medium'>{card.title}</span>

              </div>
            </div>


          </div>
        ))}
      </div>
      <div className='w-full flex flex-col gap-5'>
        <Table 
          values={users} 
          className='w-full'
          bulk={table?.bulk}
          keywords={table?.keywords}
          searchRoute="users"
          onDataUpdate={SetUsers}
          paginationPerPage={table?.paginationPerPage}
          paginationList={table?.paginationList}
        >
          <Table.THead className='w-full'>
            <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
              <Table.TH className='w-1/20 font-medium'>
                <Table.TH.Checkbox />
              </Table.TH>
              <Table.TH className='w-1/20 font-medium'>Id</Table.TH>
              <Table.TH className='w-1/10 font-medium'>Image</Table.TH>
              <Table.TH className='w-1/5 font-medium'>User</Table.TH>
              <Table.TH className='w-3/10 font-medium'>Role</Table.TH>
              <Table.TH className='w-1/10 font-medium'>Active</Table.TH>
              {hasPermission(auth.user, 'user-write') && (
                <Table.TH className='w-1/5 font-medium'>Action</Table.TH>
              )}
            </Table.TR>
          </Table.THead>
          <Table.TBody className='w-full'>
            {Users && Users.map((User) => (
              <Table.TR className='w-full text-sm bg-permanent h-12 text-res' key={User.id}>
                <Table.TD className="">
                  <div className='relative w-fit flex items-center mx-auto'>
                    <Table.TD.Checkbox valueId={User.id} />

                  </div>
                </Table.TD>
                <Table.TD className='font-normal text-center text-base'>{User.id}</Table.TD>
                <Table.TD className='font-normal text-center text-base'>
                  <div className='w-full flex items-center justify-center'>{User.image ?
                    <ImageViwer image={User.image} className='max-w-6 max-h-6 h-6 rounded-full' />
                    :
                    <img src="/assets/image/profile-avatar.webp" className='size-6 rounded-full object-cover' alt="" />
                  }</div>
                </Table.TD>
                <Table.TD className='font-normal text-center text-base'>{User.name}</Table.TD>
                <Table.TD className='font-normal text-center text-base'>
                  {Array.isArray(User.user_role) && User.user_role.length > 0 ? (
                    <div className='w-full flex flex-wrap gap-x-1.5 gap-y-1 items-center justify-center'>
                      {User.user_role.map((role, index) => (
                        <span key={index} className="px-1.5 py-1 bg-primary font-medium capitalize text-white text-[10px] rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div>User Have Not Role</div>
                  )}
                </Table.TD>
                <Table.TD className=''>
                  <div className='w-full flex items-center justify-center'>
                    {User.active ?
                      <div className='bg-green-600/20 px-2 py-1 rounded-md text-green-700 text-[11px] font-medium flex text-center items-center justify-center'>Actiive</div>
                      :
                      <div className='bg-red-600/20 px-2 py-1 rounded-md text-red-700 text-[11px] font-medium flex text-center items-center justify-center'>Inactiive</div>
                    }
                  </div>
                </Table.TD>
                {hasPermission(auth.user, 'user-write') && (
                  <Table.TD className='flex'>
                    <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                      <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center cursor-pointer'>
                        <RiDeleteBin6Line className='w-3' />
                      </span>
                      <Link href={route('user.edit', { 'id': User.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                        <RiFileEditLine className='w-3' />
                      </Link>
                      <span className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center cursor-pointer'>
                        <RiFile3Fill className='w-3' />
                      </span>
                    </div>
                  </Table.TD>
                )}
              </Table.TR>
            ))}
          </Table.TBody>
        </Table>
      </div>
    </div>
  );
}

export default Index;

Index.layout = (page) => <AdminLayout>{page}</AdminLayout>;
