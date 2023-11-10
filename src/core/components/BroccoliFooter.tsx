import { Button, Group, NumberInput, Select, Text } from "@mantine/core"
import {
  IconArrowBarToLeft,
  IconArrowBarToRight,
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
} from "@tabler/icons-react"

type BroccoliFooterProps = {
  goToNextPage: () => void
  goToPreviousPage: () => void
  hasMore: boolean
  itemsPerPage: number
  page: number
  totalCount: number
  setItemsPerPage: (items: number) => void
  setPage: (page: number) => void
}

export const BroccoliFooter = ({
  goToNextPage,
  goToPreviousPage,
  hasMore,
  itemsPerPage,
  page,
  setItemsPerPage,
  setPage,
  totalCount,
}: BroccoliFooterProps) => {
  return (
    <Group justify="space-between" mt="md">
      <Group>
        <Button variant="subtle" radius="xl" onClick={() => setPage(0)} disabled={page === 0}>
          <IconArrowBarToLeft />
        </Button>
        <Button
          variant="subtle"
          radius="xl"
          onClick={() => goToPreviousPage()}
          disabled={page === 0}
        >
          <IconArrowNarrowLeft />
        </Button>
        <Button variant="subtle" radius="xl" onClick={() => goToNextPage()} disabled={!hasMore}>
          <IconArrowNarrowRight />
        </Button>
        <Button
          variant="subtle"
          radius="xl"
          onClick={() => setPage(Math.ceil(totalCount / itemsPerPage) - 1)}
          disabled={!hasMore}
        >
          <IconArrowBarToRight />
        </Button>
      </Group>
      <Group>
        <Text>
          Page <strong>{page + 1}</strong>
        </Text>

        <Text className="flex items-center gap-1">| Go to page:</Text>
        <NumberInput
          min={1}
          disabled={!hasMore}
          defaultValue={page + 1}
          onChange={(value) => {
            const page = parseInt(value.toString())
            return setPage(page - 1)
          }}
        />
      </Group>
      <Select
        placeholder={`${itemsPerPage} Items Per Page`}
        value={itemsPerPage.toString()}
        data={[10, 20, 30, 40, 50].map((pageSize) => ({
          label: `Show ${pageSize}`,
          value: pageSize.toString(),
        }))}
        onChange={(value) => {
          setItemsPerPage(Number(value))
        }}
      />
    </Group>
  )
}
