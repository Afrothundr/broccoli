import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import getItems from "src/items/queries/getItems"
import { Table } from "@mantine/core"
import dayjs from "dayjs"

const ITEMS_PER_PAGE = 100

export const ItemsList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ items, hasMore }] = usePaginatedQuery(getItems, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })
  // const ItemsTable = useReactTable()
  const rows = items.map((item) => (
    <tr key={item.id}>
      <td>{item.name}</td>
      <td>{item.quantity}</td>
      <td>{item.itemType.name}</td>
      <td>{item.status}</td>
      <td>{dayjs(item.createdAt).format("M/D")}</td>
    </tr>
  ))

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th>How Much</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date Purchased</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
      {/* <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={Routes.ShowItemPage({ itemId: item.id })}>{item.name}</Link>
          </li>
        ))}
      </ul> */}
      {/* {items.length > 0 && <ItemsTable />} */}

      <button disabled={page === 0} onClick={goToPreviousPage}>
        Previous
      </button>
      <button disabled={!hasMore} onClick={goToNextPage}>
        Next
      </button>
    </div>
  )
}

const ItemsPage = () => {
  return (
    <Layout>
      <Head>
        <title>Items</title>
      </Head>

      <div>
        <p>
          <Link href={Routes.NewItemPage()}>Create Item</Link>
        </p>

        <Suspense fallback={<div>Loading...</div>}>
          <ItemsList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default ItemsPage
function useReactTable() {
  throw new Error("Function not implemented.")
}
