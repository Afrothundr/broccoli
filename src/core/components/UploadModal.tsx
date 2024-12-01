import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { Modal, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import deleteGroceryTrip from "src/grocery-trips/mutations/deleteGroceryTrip"
import { ImageUpload } from "./ImageUpload"

export const UploadModal = ({ onModalClose }: { onModalClose: () => void }) => {
  const [groceryTripId, setGroceryTripId] = useState(0)
  const { userId } = useSession()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)
  const [deleteGroceryTripMutation] = useMutation(deleteGroceryTrip)
  const router = useRouter()

  useEffect(() => {
    const createGroceryTrip = async (userId: number): Promise<void> => {
      try {
        const groceryTrip = await createGroceryTripMutation({
          name: `${dayjs().format("dddd")} grocery trip`,
          createdAt: dayjs().toDate(),
          userId: userId,
        })
        await setGroceryTripId(groceryTrip.id)
      } catch (error: unknown) {
        console.error(error)
      }
    }
    if (userId) void createGroceryTrip(userId)
    return () => {}
  }, [userId, createGroceryTripMutation])

  const handleSuccess = async () => {
    notifications.show({
      color: "green",
      title: "Success",
      message: "Receipts(s) uploaded!",
    })
    await router.push(Routes.ShowGroceryTripPage({ groceryTripId }))
  }
  const handleClose = async () => {
    await deleteGroceryTripMutation({ id: groceryTripId })
    onModalClose()
  }
  return (
    <Modal
      opened={true}
      onClose={handleClose}
      title={<Title order={3}>Add New Receipt</Title>}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
    >
      <div className="container mx-auto px-4 py-8 border-solid border-2 border-sky-500">
        <ImageUpload style="button" groceryTripId={groceryTripId} onSuccess={handleSuccess} />
      </div>
    </Modal>
  )
}
