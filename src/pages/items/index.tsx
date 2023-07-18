import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { Table } from "@mantine/core"
import dayjs from "dayjs"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"
import getItems from "src/items/queries/getItems"

const ITEMS_PER_PAGE = 100

export const ItemsList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const { userId } = useSession()
  const [{ items, hasMore }] = usePaginatedQuery(getItems, {
    where: {
      userId: userId ?? 0,
    },
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
      <td>{item.itemTypes.map((type) => type.name).join(",")}</td>
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

ItemsPage.authenticate = { redirectTo: Routes.LoginPage() }
export default ItemsPage
