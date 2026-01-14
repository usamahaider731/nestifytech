import React from 'react'
import AdminLayout from '@/Layouts/AdminLayout';
import Table from '@/Components/Table';
function Show() {
  return (
    <div className='w-11/12 mx-auto'>
      <Table>
        <Table.THead>
          <Table.TR>
            <Table.TH className='w-1/5'></Table.TH>
          </Table.TR>
        </Table.THead>
      </Table>
    </div>
  )
}

export default Show
Show.layout=(view)=>(
    <AdminLayout>
        {view}
    </AdminLayout>
)