import { Badge, NumberFormatter, Tooltip } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { getItemStatusColor } from "src/utils/ItemStatusTypeHelpers"

type ItemStatusBadgeProps = {
  status: ItemStatusType
  percentConsumed: number
}

export const ItemStatusBadge = ({ status, percentConsumed }: ItemStatusBadgeProps) => {
  return (
    <Tooltip label={`Status: ${status.toLowerCase()}`}>
      <Badge variant="light" color={getItemStatusColor(status)}>
        <NumberFormatter suffix="%" value={percentConsumed} />
      </Badge>
    </Tooltip>
  )
}
