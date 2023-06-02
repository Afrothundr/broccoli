import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useQuery, useMutation } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getItem from "src/items/queries/getItem"
import deleteItem from "src/items/mutations/deleteItem"

export const Item = () => {
  const router = useRouter()
  const itemId = useParam("itemId", "number")
  const [deleteItemMutation] = useMutation(deleteItem)
  const [item] = useQuery(getItem, { id: itemId })

  return (
    <>
      <Head>
        <title>Item {item.id}</title>
      </Head>

      <div>
        <h1>Item {item.id}</h1>
        <pre>{JSON.stringify(item, null, 2)}</pre>

        <Link href={Routes.EditItemPage({ itemId: item.id })}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteItemMutation({ id: item.id })
              await router.push(Routes.ItemsPage())
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}

const ShowItemPage = () => {
  return (
    <div>
      <p>
        <Link href={Routes.ItemsPage()}>Items</Link>
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <Item />
      </Suspense>
    </div>
  )
}

ShowItemPage.authenticate = true
ShowItemPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowItemPage
