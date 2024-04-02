import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import deleteItemType from "src/item-types/mutations/deleteItemType"
import getItemType from "src/item-types/queries/getItemType"

export const ItemType = () => {
  const router = useRouter()
  const itemTypeId = useParam("itemTypeId", "number")
  const [deleteItemTypeMutation] = useMutation(deleteItemType)
  const [itemType] = useQuery(getItemType, { id: itemTypeId })

  return (
    <>
      <Head>
        <title>ItemType {itemType.id}</title>
      </Head>

      <div>
        <h1>ItemType {itemType.id}</h1>
        <pre>{JSON.stringify(itemType, null, 2)}</pre>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteItemTypeMutation({ id: itemType.id })
              await router.push(Routes.ItemTypesPage())
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

const ShowItemTypePage = () => {
  return (
    <div>
      <p>
        <Link href={Routes.ItemTypesPage()}>ItemTypes</Link>
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <ItemType />
      </Suspense>
    </div>
  )
}

ShowItemTypePage.authenticate = true
ShowItemTypePage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowItemTypePage
