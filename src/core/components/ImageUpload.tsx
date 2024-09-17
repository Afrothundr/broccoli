import { useMutation } from "@blitzjs/rpc"
import { Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconCamera } from "@tabler/icons-react"
import pRetry from "p-retry"
import { processImageQueue } from "src/api/processImageQueue"
import createReceipt from "src/receipts/mutations/createReceipt"
import uploadStyles from "src/styles/UploadButton.module.css"
import { UploadButton, UploadDropzone } from "./UploadThing"

export const ImageUpload = ({
  groceryTripId,
  refetch,
  checkReceiptStatus,
  onSuccess,
  style = "button",
  label,
}: {
  groceryTripId: number
  refetch?: () => void
  checkReceiptStatus?: () => unknown
  onSuccess?: () => void
  style?: "button" | "dropzone"
  label?: string
}) => {
  const [createReceiptMutation] = useMutation(createReceipt)
  const Component = style === "button" ? UploadButton : UploadDropzone
  return (
    <Component
      endpoint="imageUploader"
      content={{
        button:
          style === "button" ? (
            <Tooltip label="Add new receipt" openDelay={500}>
              <IconCamera />
            </Tooltip>
          ) : (
            <span>Upload</span>
          ),
      }}
      appearance={{
        button({ ready, isUploading }) {
          return `custom-button ${ready ? uploadStyles.customButton : "custom-button-not-ready"} ${
            isUploading ? "custom-button-uploading" : ""
          }`
        },
        container: uploadStyles.customContainer,
        allowedContent: "custom-allowed-content",
      }}
      onClientUploadComplete={async (res) => {
        // Do something with the response
        res?.forEach(async (image, index) => {
          const receipt = await createReceiptMutation({
            url: image.url,
            groceryTripId: groceryTripId,
          })
          await processImageQueue({
            receiptId: receipt.id,
            url: image.url,
          })
          if (res.length === index + 1) {
            await refetch?.()
            if (checkReceiptStatus) await pRetry(checkReceiptStatus, { factor: 3 })
            onSuccess?.()
          }
        })

        notifications.show({
          color: "green",
          title: "Success",
          message: "File(s) uploaded!",
        })
      }}
      onUploadError={(error: Error) => {
        console.error("ERROR", error)
        notifications.show({
          color: "red",
          title: "Error",
          message: error.message,
        })
      }}
    />
  )
}
