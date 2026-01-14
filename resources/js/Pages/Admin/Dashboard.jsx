import AdminLayout from '@/Layouts/AdminLayout'
import React from 'react'

function Dashboard() {
  return (
    <div>
      
    </div>
  )
}

export default Dashboard
Dashboard.layout = (page) =>{
    return(
        <AdminLayout>{page}</AdminLayout>
    )
}