import React from 'react'

import AdminLayout from '@/Layouts/AdminLayout'
import Form from './Form'

function Index({ site }) {
  

  return (
   <Form Data={site} Heading='Site' link='admin.site.setting.update' />
  )
}

export default Index

Index.layout = (page) => <AdminLayout>{page}</AdminLayout>