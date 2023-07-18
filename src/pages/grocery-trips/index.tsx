import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Input,
  Modal,
  NumberInput,
  Tooltip,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { GroceryTrip } from "@prisma/client"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import { rankItem } from "@tanstack/match-sorter-utils"
import {
  Column,
  ColumnDef,
  FilterFn,
  Table as ReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import { FORM_ERROR } from "final-form"
import Head from "next/head"
import Link from "next/link"
import router, { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import Layout from "src/core/layouts/Layout"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import styles from "src/styles/GroceryTripsPage.module.css"
dayjs.extend(isBetween)

type GroceryTripWithAddedCount = GroceryTrip & {
  _count: {
    items: number
  }
}

export const GroceryTripsList = () => {
  const router = useRouter()
  const { userId } = useSession()
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { id: "asc" },
    where: {
      userId: userId ?? undefined,
    },
    skip: itemsPerPage * page,
    take: itemsPerPage,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })
  const setPage = (pageNumber: number) => router.push({ query: { page: pageNumber } })

  const columns: ColumnDef<GroceryTripWithAddedCount, any>[] = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: (value) => dayjs(value.getValue()).format("MM/D"),
        filterFn: filterDates,
      },
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            href={Routes.ShowGroceryTripPage({
              groceryTripId: row.original.id,
            })}
          >
            <Anchor>{row.original.name}</Anchor>
          </Link>
        ),
      },
      {
        Header: "Description",
        accessorKey: "description",
      },
      {
        Header: "Items",
        accessorKey: "_count.items",
      },
    ],
    []
  )

  return (
    <div>
      <Table
        {...{
          data: groceryTrips,
          columns,
        }}
      />
      <Group mt="sm">
        <Button variant="subtle" radius="xl" onClick={() => setPage(0)} disabled={page === 0}>
          {"<<"}
        </Button>
        <Button
          variant="subtle"
          radius="xl"
          onClick={() => goToPreviousPage()}
          disabled={page === 0}
        >
          {"<"}
        </Button>
        <Button variant="subtle" radius="xl" onClick={() => goToNextPage()} disabled={!hasMore}>
          {">"}
        </Button>
        <Button
          variant="subtle"
          radius="xl"
          // onClick={() => setPage(table.getPageCount() - 1)}
          disabled={!hasMore}
        >
          {">>"}
        </Button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>{page + 1}</strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={page + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              return setPage(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </Group>
    </div>
  )
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const filterDates: FilterFn<any> = (row, columnId, value, addMeta) => {
  const date = dayjs(row.getValue(columnId))
  const [start, end] = value as Date[]
  //If one filter defined and date is null filter it
  if ((start || end) && !date) return false
  if (start && !end) {
    return dayjs(start).isBefore(date)
  } else if (!start && end) {
    return dayjs(end).isAfter(date)
  } else if (start && end) {
    return date.isBetween(start, end, "day")
  } else return true
}

const GroceryTripsPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const { userId } = useSession()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)

  return (
    <Layout>
      <Head>
        <title>Grocery Trips</title>
      </Head>

      <Container size="lg" className={styles.groceryTripsContainer}>
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
                userId: userId ?? 0,
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
    filterFns: {
      fuzzy: fuzzyFilter,
      date: filterDates,
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  })

  return (
    <Container ml="xs">
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
    </Container>
  )
}
function Filter({ column, table }: { column: Column<any, any>; table: ReactTable<any> }) {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id)
  const columnFilterValue = column.getFilterValue()

  if (typeof firstValue === "number") {
    return (
      <NumberInput
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(value) => column.setFilterValue((old: [number, number]) => [value, old?.[1]])}
        placeholder={`Min`}
        min={0}
      />
    )
  }
  if (firstValue instanceof Date) {
    const dateValues = (columnFilterValue as Date[]) ?? [null, null]
    const value1 = dateValues[0] || null
    const value2 = dateValues[1] || null
    return (
      <DatePickerInput
        type="range"
        value={[value1, value2]}
        onChange={(date) => column.setFilterValue(date || undefined)}
        placeholder="Search..."
      />
    )
  }
  return (
    <Input
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
    />
  )
}

export default GroceryTripsPage
