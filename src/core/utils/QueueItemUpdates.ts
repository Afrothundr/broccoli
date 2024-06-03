import { Item, ItemStatusType, ItemType } from "@prisma/client"
import { itemUpdaterQueue } from "src/api/itemUpdaterQueue"
import { NON_PERISHABLE_TYPE } from "../types"

export async function queueItemUpdates(item?: Item, itemType?: ItemType) {
  if (item && itemType && itemType.name !== NON_PERISHABLE_TYPE) {
    const triggerTimeInMilliseconds = Number(itemType.suggested_life_span_seconds) * 1000
    await Promise.all([
      itemUpdaterQueue({
        ids: [item.id],
        status: ItemStatusType.BAD,
        delay: triggerTimeInMilliseconds,
      }),
      itemUpdaterQueue({
        ids: [item.id],
        status: ItemStatusType.OLD,
        delay: triggerTimeInMilliseconds * (2 / 3),
      }),
    ])
  }
}
