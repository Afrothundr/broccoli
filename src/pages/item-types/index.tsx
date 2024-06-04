import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"
import getItemTypes from "src/item-types/queries/getItemTypes"

export const ItemTypesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { id: "asc" },
  })

  return (
    <div>
      <ul>
        {itemTypes.map((itemType) => (
          <li key={itemType.id}>
            <Link href={Routes.ShowItemTypePage({ itemTypeId: itemType.id })}>{itemType.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ItemTypesPage = () => {
  return (
    <Layout>
      <Head>
        <title>ItemTypes</title>
      </Head>

      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <ItemTypesList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default ItemTypesPage
