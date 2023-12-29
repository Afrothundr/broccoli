import { Item, ItemStatusType, ItemType } from "@prisma/client"
import { itemUpdaterQueue } from "src/api/itemUpdaterQueue"

export async function queueItemUpdates(item?: Item, itemType?: ItemType) {
  if (item && itemType) {
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
