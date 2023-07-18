import { rankItem } from "@tanstack/match-sorter-utils"
import { FilterFn } from "@tanstack/react-table"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
dayjs.extend(isBetween)

export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

export const filterDates: FilterFn<any> = (row, columnId, value, addMeta) => {
  const date = dayjs(row.getValue(columnId))
  const [start, end] = value as Date[]

  let timeSyncedStart
  let timeSyncedEnd
  //If one filter defined and date is null filter it
  if ((start || end) && !date) return false
  if (start && !end) {
    timeSyncedStart = dayjs(start).startOf("day")
    return dayjs(timeSyncedStart).isBefore(date)
  } else if (!start && end) {
    timeSyncedEnd = dayjs(end).endOf("day")
    return dayjs(timeSyncedEnd).isAfter(date)
  } else if (start && end) {
    timeSyncedStart = dayjs(start).startOf("day")
    timeSyncedEnd = dayjs(end).endOf("day")
    return date.isBetween(timeSyncedStart, timeSyncedEnd)
  } else return true
}
