import { useQuery } from "@blitzjs/rpc"
import type { ComboboxItemGroup } from "@mantine/core"
import type { ItemType } from "@prisma/client"
import React from "react"
import getItemTypes from "src/item-types/queries/getItemTypes"

export const UseItemTypeContext = React.createContext<ComboboxItemGroup[]>([])

export default function useItemTypes(): ItemType[] {
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  return itemTypes || []
}
