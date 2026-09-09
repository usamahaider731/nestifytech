import React, { use } from 'react'
import Checkbox from './Checkbox';
import { RiDeleteBin3Fill, RiDeleteBin4Line, RiDeleteBin6Line, RiDeleteBin7Fill, RiFile3Fill, RiFileEditLine } from 'react-icons/ri';
import { Link } from '@inertiajs/react';
import Table from '@/Components/Table'
function Table({ user = '' }) {
  return (
    <div className='w-full'>
      <Table className='w-full'>
        <Table.THead className='w-full'>
          <Table.TR className='w-full text-heading uppercase text-sm h-14 bg-accent'>
            <th className='w-1/20 font-medium'></th>
            <th className='w-1/20 font-medium'>Id</th>
            <th className='w-1/10 font-medium'>Image</th>
            <th className='w-1/5 font-medium'>User</th>
            <th className='w-3/10 font-medium'>Role</th>
            <th className='w-1/10 font-medium'>Active</th>
            <th className='w-1/5 font-medium'>Action</th>
          </Table.TR>
        </Table.THead>
        <tbody className='w-full'>
          {user.data && user.data.map((User) => (
            <tr className='w-full text-sm bg-permanent h-12 text-res' key={User.id}>
              <td className="">
                <div className='relative w-fit flex items-center mx-auto'>
                  <Checkbox />
                </div>
              </td>
              <td className='font-normal text-center text-base'>{User.id}</td>
              <td className='font-normal text-center text-base'>
                <div className='w-full flex items-center justify-center'>{User.image ?
                  <img src={route('thumb.image', { filename: User.image.name, height: '100', width: '100', extension: 'jpg' })} className='size-7.5 rounded-full object-cover' alt="" />
                  :
                  <img src="/assets/image/profile-avatar.webp" className='size-7.5 rounded-full object-cover' alt="" />
                }</div>
              </td>
              <td className='font-normal text-center text-base'>{User.name}</td>
              <td className='font-normal text-center text-base'>
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
              </td>
              <td className=''>
                <div className='w-full flex items-center justify-center'>
                  {User.active ?
                    <div className='bg-green-500 size-4.5 rounded-full animate-pulse'></div>
                    :
                    <div className='bg-red-500 size-4.5 rounded-full animate-pulse'></div>
                  }
                </div>
              </td>
              <td className='flex'>
                <div className='w-full flex h-12 my-auto  items-center gap-3 justify-center'>
                  <span className='h-6.5 w-6.5 rounded-full bg-red-500 text-white text-sm flex text-center items-center justify-center'>
                    <RiDeleteBin6Line className='w-3' />
                  </span>
                  <Link href={route('user.edit', { 'id': User.id })} className='h-6.5 w-6.5 rounded-full bg-primary text-white text-sm flex text-center items-center justify-center'>
                    <RiFileEditLine className='w-3' />
                  </Link>
                  <span className='h-6.5 w-6.5 rounded-full bg-secondary text-white text-sm flex text-center items-center justify-center'>
                    <RiFile3Fill className='w-3' />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
export default Table
