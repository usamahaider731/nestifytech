import AdminPanel from '@/Components/Admin/AdminPanel'
import Header from '@/Components/Admin/Header'
import React from 'react'
import { ToastContainer } from 'react-toastify'

function AdminLayout({children}) {
    return (
        <div className='flex w-full h-full min-h-screen bg-bg'>
            <div className='w-65 h-screen sticky top-0 left-0'>
                <AdminPanel />
            </div>
            <div className='h-full w-[calc(100%-260px)]'>
            <Header />
            {children}
            </div>
            <ToastContainer
                position="top-right"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark" />

        </div>
    )
}

export default AdminLayout
