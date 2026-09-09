import React from 'react'

import AdminLayout from '@/Layouts/AdminLayout'
import Form from './Form'

function Setting({ type, name, colorPalettes = {} }) {
  return (
   <Form Data={type} name={name} colorPalettes={colorPalettes} />
  )
}

export default Setting

Setting.layout = (page) => <AdminLayout title="Setting">{page}</AdminLayout>