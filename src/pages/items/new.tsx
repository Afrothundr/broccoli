import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateItemSchema } from "src/items/schemas"
import createItem from "src/items/mutations/createItem"
import { ItemForm, FORM_ERROR } from "src/items/components/ItemForm"
import { Suspense } from "react"

const NewItemPage = () => {
  const router = useRouter()
  const [createItemMutation] = useMutation(createItem)

  return (
    <Layout title={"Create New Item"}>
      <h1>Create New Item</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ItemForm
          submitText="Create Item"
          schema={CreateItemSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            console.log(values, "values")
            try {
              const item = await createItemMutation(values)
              await router.push(Routes.ShowItemPage({ itemId: item.id }))
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
        <Link href={Routes.ItemsPage()}>Items</Link>
      </p>
    </Layout>
  )
}

NewItemPage.authenticate = true

export default NewItemPage
