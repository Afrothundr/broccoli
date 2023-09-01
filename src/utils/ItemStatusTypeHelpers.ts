import { ItemStatusType } from "@prisma/client"

export default function getItemStatusColor(status: ItemStatusType) {
  switch (status) {
    case ItemStatusType.BAD:
      return "red"
    case ItemStatusType.OLD:
      return "yellow"
    case ItemStatusType.FRESH:
      return "green"
    case ItemStatusType.EATEN:
      return "grey"
  }
}
