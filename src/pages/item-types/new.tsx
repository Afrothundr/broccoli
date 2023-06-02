import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateItemTypeSchema } from "src/item-types/schemas"
import createItemType from "src/item-types/mutations/createItemType"
import { ItemTypeForm, FORM_ERROR } from "src/item-types/components/ItemTypeForm"
import { Suspense } from "react"

const NewItemTypePage = () => {
  const router = useRouter()
  const [createItemTypeMutation] = useMutation(createItemType)

  return (
    <Layout title={"Create New ItemType"}>
      <h1>Create New ItemType</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ItemTypeForm
          submitText="Create ItemType"
          schema={CreateItemTypeSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            try {
              const itemType = await createItemTypeMutation(values)
              await router.push(Routes.ShowItemTypePage({ itemTypeId: itemType.id }))
            } catch (error: any) {
              console.error(error)
              return {
                [FORM_ERROR]: error.toString(),
              }
            }
          }}
        />
      </Suspense>
      <p>
        <Link href={Routes.ItemTypesPage()}>ItemTypes</Link>
      </p>
    </Layout>
  )
}

NewItemTypePage.authenticate = true

export default NewItemTypePage
