import { ActionIcon, rem, Tooltip } from "@mantine/core"
import { IconCameraPlus } from "@tabler/icons-react"

export const FloatingUploadButton = ({ handleClick }: { handleClick: () => void }) => {
  return (
    <div className="fixed bottom-[2rem] right-[2rem]">
      <Tooltip label="Add new receipt">
        <ActionIcon
          onClick={handleClick}
          size="xxl"
          radius="xxl"
          aria-label="Add new receipt"
          className="padding-2"
        >
          <IconCameraPlus style={{ width: rem(32), height: rem(32) }} />
        </ActionIcon>
      </Tooltip>
    </div>
  )
}
