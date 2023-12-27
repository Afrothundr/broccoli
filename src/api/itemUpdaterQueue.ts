import { ItemStatusType } from "@prisma/client"
import axios from "axios"

export default async function itemUpdaterQueue({
  ids,
  status,
  delay,
}: {
  ids: number[]
  status: ItemStatusType
  delay: number
}) {
  return await axios({
    method: "post",
    url: "/items/update",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_SCHEDULER_API_KEY,
    },
    data: {
      ids,
      status,
      delay,
    },
    withCredentials: false,
    baseURL: process.env.NEXT_PUBLIC_SCHEDULER_API_URL,
  })
}
