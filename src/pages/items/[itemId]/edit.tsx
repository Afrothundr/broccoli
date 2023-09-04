import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import updateItem from "src/items/mutations/updateItem"
import getItem from "src/items/queries/getItem"
import { UpdateItemSchema } from "src/items/schemas"
import { FORM_ERROR, ItemForm } from "src/pages/items/components/ItemForm"

export const EditItem = () => {
  const router = useRouter()
  const itemId = useParam("itemId", "number")
  const [item, { setQueryData }] = useQuery(
    getItem,
    { id: itemId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateItemMutation] = useMutation(updateItem)

  return (
    <>
      <Head>
        <title>Edit Item {item.id}</title>
      </Head>

      <div>
        <h1>Edit Item {item.id}</h1>
        <pre>{JSON.stringify(item, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ItemForm
            submitText="Update Item"
            schema={UpdateItemSchema}
            initialValues={item}
            onSubmit={async (values) => {
              try {
                const updated = await updateItemMutation({
                  id: item.id,
                  ...values,
                })
                await setQueryData(updated)
                await router.push(Routes.ShowItemPage({ itemId: updated.id }))
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }}
          />
        </Suspense>
      </div>
    </>
  )
}

const EditItemPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditItem />
      </Suspense>

      <p>
        <Link href={Routes.ItemsPage()}>Items</Link>
      </p>
    </div>
  )
}

EditItemPage.authenticate = true
EditItemPage.getLayout = (page) => <Layout>{page}</Layout>

export default EditItemPage
