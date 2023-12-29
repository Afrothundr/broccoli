import axios from "axios"

export async function processImageQueue({
  receiptId,
  url,
  delay = 0,
}: {
  receiptId: number
  url: string
  delay?: number
}) {
  return await axios({
    method: "post",
    url: "/receipts/process",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_SCHEDULER_API_KEY,
    },
    data: {
      receiptId,
      url,
      delay,
    },
    withCredentials: false,
    baseURL: process.env.NEXT_PUBLIC_SCHEDULER_API_URL,
  })
}
