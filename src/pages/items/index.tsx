import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { Badge, Group } from "@mantine/core"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense, useMemo } from "react"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getItems from "src/items/queries/getItems"
dayjs.extend(isBetween)

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

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "How Much",
        accessorKey: "quantity",
      },
      {
        header: "Type",
        accessorKey: "itemTypes",
        cell: ({ row }) => (
          <Group>
            {row.original.itemTypes.map((itemType) => (
              <Badge variant="filled" key={itemType.name + row.original.id}>
                {itemType.name}
              </Badge>
            ))}
          </Group>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          const purchaseDate = dayjs(row.original.createdAt)
          const expirationDate = dayjs(purchaseDate).second(row.original.suggested_lifespan_seconds)

          const isBad = dayjs().isAfter(expirationDate)
          return (
            <Badge variant="filled" color={row.original.status === "BAD" ? "red" : "green"}>
              {row.original.status}
            </Badge>
          )
        },
      },
      {
        header: "Date Purchased",
        accessorKey: "createdAt",
        cell: (value) => dayjs(value.getValue()).format("MM/D"),
        filterFn: filterDates,
      },
    ],
    []
  )

  return (
    <div>
      <BroccoliTable
        {...{
          data: items,
          columns,
        }}
      />

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
