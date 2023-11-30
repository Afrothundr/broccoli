import { Table as MantineTable, NumberInput, Select, Table, Text } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import {
  Column,
  ColumnDef,
  Table as ReactTable,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo } from "react"
import { filterDates, fuzzyFilter } from "../utils"

type TableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  handleRowSelection?: (e: any) => void
  rowSelection?: Record<number, boolean>
}

function BroccoliTable<T>({ data, columns, rowSelection = {}, handleRowSelection }: TableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      date: filterDates,
    },
    state: {
      rowSelection,
    },
    enableRowSelection: !!handleRowSelection,
    onRowSelectionChange: handleRowSelection,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    debugTable: false,
  })

  return (
    <MantineTable>
      <Table.Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <Table.Th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <>
                      {header.column.getCanFilter() ? (
                        <div>
                          <Filter column={header.column} table={table} />
                        </div>
                      ) : (
                        <Text>
                          {" "}
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Text>
                      )}
                    </>
                  )}
                </Table.Th>
              )
            })}
          </Table.Tr>
        ))}
      </Table.Thead>
      <Table.Tbody>
        {table.getRowModel().rows.map((row) => {
          return (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                )
              })}
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </MantineTable>
  )
}

function Filter({ column, table }: { column: Column<any, any>; table: ReactTable<any> }) {
  const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id)
  const columnFilterValue = column.getFilterValue()
  const uniqueValues = column.getFacetedUniqueValues()

  const sortedUniqueValues = useMemo(
    () => (typeof firstValue === "number" ? [] : Array.from(uniqueValues.keys()).sort()),
    [uniqueValues, firstValue]
  )
  const placeholder = column.columnDef.header?.toString()

  if (typeof firstValue === "number") {
    return (
      <NumberInput
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(value) => column.setFilterValue((old: [number, number]) => [value, old?.[1]])}
        placeholder={placeholder}
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
        placeholder={placeholder}
      />
    )
  }

  const formattedValues = sortedUniqueValues.map((val) => {
    if (Array.isArray(val)) {
      return (val[0]?.name as string) || ""
    }
    return val as string
  })
  const uniqueFormattedValues = [...new Set(formattedValues)]
  return (
    <Select
      value={(columnFilterValue ?? "") as string}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={placeholder}
      searchable
      clearable
      nothingFoundMessage="No options"
      data={uniqueFormattedValues}
    />
  )
}

export default BroccoliTable
