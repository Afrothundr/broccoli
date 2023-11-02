import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import { FORM_ERROR, ItemTypeForm } from "src/item-types/components/ItemTypeForm"
import updateItemType from "src/item-types/mutations/updateItemType"
import getItemType from "src/item-types/queries/getItemType"
import { UpdateItemTypeSchema } from "src/item-types/schemas"

export const EditItemType = () => {
  const router = useRouter()
  const itemTypeId = useParam("itemTypeId", "number")
  const [itemType, { setQueryData }] = useQuery(
    getItemType,
    { id: itemTypeId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateItemTypeMutation] = useMutation(updateItemType)

  return (
    <>
      <Head>
        <title>Edit ItemType {itemType.id}</title>
      </Head>

      <div>
        <h1>Edit ItemType {itemType.id}</h1>
        <pre>{JSON.stringify(itemType, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ItemTypeForm
            submitText="Update ItemType"
            schema={UpdateItemTypeSchema}
            initialValues={itemType}
            onSubmit={async (values) => {
              try {
                const updated = await updateItemTypeMutation({
                  ...values,
                  id: itemType.id,
                })
                await setQueryData(updated)
                await router.push(Routes.ShowItemTypePage({ itemTypeId: updated.id }))
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

const EditItemTypePage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditItemType />
      </Suspense>

      <p>
        <Link href={Routes.ItemTypesPage()}>ItemTypes</Link>
      </p>
    </div>
  )
}

EditItemTypePage.authenticate = true
EditItemTypePage.getLayout = (page) => <Layout>{page}</Layout>

export default EditItemTypePage
