import { type Item, ItemStatusType, type ItemType } from "@prisma/client"
import { itemUpdaterQueue } from "src/api/itemUpdaterQueue"

export async function queueItemUpdates(item?: Item, itemType?: ItemType) {
  if (item && itemType && itemType.suggested_life_span_seconds > 0) {
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
