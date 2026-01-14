import AdminLayout from '@/Layouts/AdminLayout'
import React from 'react'
import Form from './Form'

function Color({color}) {
  return (
   <Form Data={color} Heading='color' link='admin.color.update' />
  )
}

export default Color
Color.layout = (page) => (
    <AdminLayout>{page}</AdminLayout>
)