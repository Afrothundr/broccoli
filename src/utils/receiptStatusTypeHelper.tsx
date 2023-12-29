import { ReceiptStatus } from "@prisma/client"
import { IconCircleCheck, IconFileAlert, IconLoader } from "@tabler/icons-react"

export function getReceiptStatusColor(status: ReceiptStatus) {
  switch (status) {
    case ReceiptStatus.ERROR:
      return "red"
    case ReceiptStatus.PROCESSING:
      return "yellow"
    case ReceiptStatus.IMPORTED:
      return "blue"
  }
}

export function getReceiptStatusLabel(status: ReceiptStatus) {
  switch (status) {
    case ReceiptStatus.ERROR:
      return <IconFileAlert />
    case ReceiptStatus.PROCESSING:
      return <IconLoader />
    case ReceiptStatus.IMPORTED:
      return <IconCircleCheck size={"xs"} />
  }
}
