import React from 'react'

import AdminLayout from '@/Layouts/AdminLayout'
import Form from './Form'

function Setting({ type, name }) {
  

  return (
   <Form Data={type} name={name} />
  )
}

export default Setting

Setting.layout = (page) => <AdminLayout>{page}</AdminLayout>