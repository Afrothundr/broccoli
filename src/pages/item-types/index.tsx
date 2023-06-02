import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import getItemTypes from "src/item-types/queries/getItemTypes"

const ITEMS_PER_PAGE = 100

export const ItemTypesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ itemTypes, hasMore }] = usePaginatedQuery(getItemTypes, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  return (
    <div>
      <ul>
        {itemTypes.map((itemType) => (
          <li key={itemType.id}>
            <Link href={Routes.ShowItemTypePage({ itemTypeId: itemType.id })}>{itemType.name}</Link>
          </li>
        ))}
      </ul>

      <button disabled={page === 0} onClick={goToPreviousPage}>
        Previous
      </button>
      <button disabled={!hasMore} onClick={goToNextPage}>
        Next
      </button>
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
        <p>
          <Link href={Routes.NewItemTypePage()}>Create ItemType</Link>
        </p>

        <Suspense fallback={<div>Loading...</div>}>
          <ItemTypesList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default ItemTypesPage
