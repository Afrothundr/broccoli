import { ItemStatusType } from "@prisma/client"

export function getItemStatusColor(status: ItemStatusType) {
  switch (status) {
    case ItemStatusType.BAD:
      return "red"
    case ItemStatusType.OLD:
      return "yellow"
    case ItemStatusType.FRESH:
      return "green"
    case ItemStatusType.EATEN:
      return "rgba(22, 105, 21, 1)"
    case ItemStatusType.DISCARDED:
      return "gray"
  }
}
