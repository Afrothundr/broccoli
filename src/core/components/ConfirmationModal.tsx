import { Button, Group, Modal, Space, Text, Title } from "@mantine/core"

type ConfirmationModalProps = {
  onModalClose: () => void
  onConfirmation: () => void
  copy: string
  title: string
}

export const ConfirmationModal = ({
  onModalClose,
  onConfirmation,
  copy,
  title,
}: ConfirmationModalProps): JSX.Element => {
  return (
    <Modal
      opened={true}
      onClose={onModalClose}
      title={<Title order={3}>{title}</Title>}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
    >
      <Text>{copy}</Text>
      <Space h="md" />
      <Group>
        <Button onClick={onConfirmation}>Yes</Button>
        <Button variant="default" onClick={onModalClose}>
          Cancel
        </Button>
      </Group>
    </Modal>
  )
}
