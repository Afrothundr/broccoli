import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import deleteItems from "src/items/mutations/deleteItems"
import getItem from "src/items/queries/getItem"

export const Item = () => {
  const router = useRouter()
  const itemId = useParam("itemId", "number")
  const [deleteItemMutation] = useMutation(deleteItems)
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
              await deleteItemMutation({ ids: [item.id] })
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
