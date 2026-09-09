import React from 'react'
import { usePage } from '@inertiajs/react'
import { RiRecordCircleLine, RiSettings3Line } from 'react-icons/ri';
import SvgViewer from './SvgViewer';
import Sidebar from './Sidebar';

function AdminPanel() {
  const setting = usePage().props.setting;
  const isSvg = setting?.site?.light_logo?.value?.endsWith('.svg');
  return (
    <div className='w-full scroll-hidden bg-accent text-res overflow-y-auto flex flex-col pb-2 gap-2 h-full'>
      <div className='sticky top-0 left-0 justify-between bg-accent/95 backdrop-blur-md z-50 py-2 h-24 flex items-center px-5 border-b border-permanent/30'>
        <a href="/" className='flex items-center gap-3 font-semibold text-lg tracking-tight text-heading hover:text-primary transition-colors'>
          <div className='size-8 rounded-lg bg-gradient-to-tr from-primary to-[#9e95f5] flex items-center justify-center shadow-md shadow-primary/30 text-white font-bold text-base'>
            N
          </div>
          <span className='font-bold text-lg font-primary text-heading tracking-wide'>
            {setting?.site?.name?.value || 'NestifyTech'}
          </span>
        </a>
        <button className='text-secondary hover:text-primary transition-colors p-1.5 rounded-md hover:bg-dynamic/50'>
          <RiRecordCircleLine className='size-5' />
        </button>
      </div>
      <div className='flex flex-col w-full flex-1'>
        <Sidebar />
      </div>
    </div>
  )
}

export default AdminPanel