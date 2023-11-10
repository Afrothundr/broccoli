import { ComboboxItemGroup } from "@mantine/core"
import { ItemType } from "@prisma/client"

export const ItemTypeGrouper = (itemTypes: ItemType[]) => {
  const itemTypesGrouped = {}

  itemTypes.forEach((type) => {
    if (itemTypesGrouped[type.category]) {
      itemTypesGrouped[type.category].items.push({
        label: type.name,
        value: type.id.toString(),
      })
    } else {
      itemTypesGrouped[type.category] = {
        group: type.category,
        items: [
          {
            label: type.name,
            value: type.id.toString(),
          },
        ],
      }
    }
  })
  return Object.values(itemTypesGrouped) as unknown as ComboboxItemGroup[]
}
