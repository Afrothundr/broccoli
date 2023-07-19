import { CronJob } from "cron"
import db, { ItemStatusType } from "db"

export const createItemStatusUpdate = ({
  itemId,
  status,
  triggerTime,
}: {
  itemId: number
  triggerTime: {
    seconds?: string
    minutes?: string
    hours?: string
    dayOfTheMonth?: string
    month?: string
    dayOfWeek?: string
  }
  status: ItemStatusType
}) => {
  const {
    seconds = "*",
    minutes = "*",
    hours = "*",
    dayOfTheMonth = "*",
    month = "*",
    dayOfWeek = "*",
  } = triggerTime
  return new CronJob(
    `${seconds} ${minutes} ${hours} ${dayOfTheMonth} ${month} ${dayOfWeek}`,
    function () {
      console.log("DB update started")
      updateItemStatusInDB(itemId, status).catch((err) => console.error(err))
    },
    () => console.log(`item ${itemId} updated`),
    false
  )
}

const updateItemStatusInDB = async (id: number, status: ItemStatusType) => {
  console.log(id, "cron")
  console.log(status, "cron")
  await db.item.update({ where: { id }, data: { status } })
}
