import React from 'react'
import Sidenav from './Sidenav'
import { usePage } from '@inertiajs/react'
import { RiSettingsLine } from 'react-icons/ri';
import SvgViewer from './SvgViewer';

function AdminPanel() {
  const setting = usePage().props.setting;
  const isSvg = setting?.site?.light_logo?.value?.endsWith('.svg');
  return (
    <div className='w-full scroll-hidden bg-accent text-res overflow-y-auto h-full flex flex-col py-3 gap-3'>
      <div className='sticky top-0 left-0 justify-between bg-accent z-50 h-20 flex items-center px-[22px_16px]'>

        <a href="/" className=' font-medium text-xl font-roboto'>
          {isSvg ? (
            <SvgViewer
              src={`/storage/uploads/image/${setting.site.light_logo.value}`}
              className="w-4/5 fill-primary text-res"
            />
          ) : (
            <img
              src={`/storage/uploads/image/${setting.site.light_logo.value}`}
              alt="Logo"
              className="w-4/5"
            />
          )}
        </a>
        <RiSettingsLine className='h-4 w-4' />
      </div>
      <div className='flex flex-col w-full h-[-webkit-fill-available]'>
        <Sidenav />
      </div>
    </div>
  )
}

export default AdminPanel