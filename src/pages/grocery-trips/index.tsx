import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import { ActionIcon, Container, Indicator, Modal, Text, Tooltip } from "@mantine/core"
import { GroceryTrip } from "@prisma/client"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import {
  Column,
  ColumnDef,
  Table as ReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import Head from "next/head"
import Link from "next/link"
import router, { useRouter } from "next/router"
import { Suspense, useState } from "react"
import Layout from "src/core/layouts/Layout"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import styles from "src/styles/GroceryTripsPage.module.css"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

const ITEMS_PER_PAGE = 100
type GroceryTripWithAddedCount = GroceryTrip & {
  _count: {
    items: number
  }
}

export const GroceryTripsList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  const columnHelper = createColumnHelper<GroceryTripWithAddedCount>()

  const columns = [
    columnHelper.accessor((row) => row.createdAt, {
      id: "date",
      cell: (info) => dayjs(info.getValue()).format("M/D"),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("name", {
      cell: ({ row }) => (
        <Link
          href={Routes.ShowGroceryTripPage({
            groceryTripId: row.original.id,
          })}
        >
          <Text>{row.original.name}</Text>
        </Link>
      ),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("description", {
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor((row) => row._count.items, {
      id: "items",
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
    }),
  ]

  return (
    <div>
      <ul>
        {groceryTrips.map((groceryTrip) => (
          <li key={groceryTrip.id}>
            <Link
              href={Routes.ShowGroceryTripPage({
                groceryTripId: groceryTrip.id,
              })}
            >
              <Indicator
                inline
                label={groceryTrip._count.items}
                size={24}
                withBorder
                color="green"
                radius="md"
                offset={-8}
              >
                <Text>{groceryTrip.name}</Text>
              </Indicator>
            </Link>
          </li>
        ))}
      </ul>
      <Table
        {...{
          data: groceryTrips,
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

const GroceryTripsPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const user = useCurrentUser()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)

  return (
    <Layout>
      <Head>
        <title>GroceryTrips</title>
      </Head>

      <Container size="lg" className={styles.groceryTripsContainer}>
        <p>
          <Link href={Routes.NewGroceryTripPage()}>Create GroceryTrip</Link>
        </p>

        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripsList />
        </Suspense>
        <Tooltip label="Add new grocery trip" openDelay={500}>
          <ActionIcon
            className={styles.actionButton}
            color="green"
            size="xl"
            radius="xl"
            variant="filled"
            onClick={() => setModalOpened(true)}
          >
            <IconShoppingCartPlus />
          </ActionIcon>
        </Tooltip>
      </Container>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Create New Grocery Trip"
        transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
      >
        <GroceryTripForm
          submitText="save"
          schema={CreateGroceryTripSchema.omit({ userId: true })}
          onSubmit={async (values) => {
            try {
              const groceryTrip = await createGroceryTripMutation({
                ...values,
                userId: user?.id || 0,
              })
              await router.push(Routes.ShowGroceryTripPage({ groceryTripId: groceryTrip.id }))
            } catch (error: any) {
              console.error(error)
              return {
                [FORM_ERROR]: error.toString(),
              }
            }
          }}
        />
      </Modal>
    </Layout>
  )
}

function Table({
  data,
  columns,
}: {
  data: GroceryTripWithAddedCount[]
  columns: ColumnDef<GroceryTripWithAddedCount>[]
}) {
  const table = useReactTable({
    data,
    columns,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    //
    debugTable: true,
  })

  return (
    <div className="p-2">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getRowModel().rows.length} Rows</div>
      <pre>{JSON.stringify(table.getState().pagination, null, 2)}</pre>
    </div>
  )
}
function Filter({ column, table }: { column: Column<any, any>; table: ReactTable<any> }) {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id)

  const columnFilterValue = column.getFilterValue()

  return typeof firstValue === "number" ? (
    <div className="flex space-x-2">
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [e.target.value, old?.[1]])
        }
        placeholder={`Min`}
        className="w-24 border shadow rounded"
      />
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[1] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [old?.[0], e.target.value])
        }
        placeholder={`Max`}
        className="w-24 border shadow rounded"
      />
    </div>
  ) : (
    <input
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="w-36 border shadow rounded"
    />
  )
}

export default GroceryTripsPage
