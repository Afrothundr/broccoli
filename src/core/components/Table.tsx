import { Input, Table as MantineTable, NumberInput, Text } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import {
  Column,
  ColumnDef,
  Table as ReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { filterDates, fuzzyFilter } from "../utils"

type TableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
}

function BroccoliTable<T>({ data, columns }: TableProps<T>) {
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
    <MantineTable>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <div>
                      <Text>
                        {" "}
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Text>

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
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </MantineTable>
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

export default BroccoliTable
