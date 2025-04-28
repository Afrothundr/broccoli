import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { Tooltip, rem } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconCamera } from "@tabler/icons-react"
import cx from "classnames"
import dayjs from "dayjs"
import type { GroceryTrip } from "db"
import heicConvert from "heic-convert"
import { useRouter } from "next/router"
import pRetry from "p-retry"
import { processImageQueue } from "src/api/processImageQueue"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import createReceipt from "src/receipts/mutations/createReceipt"
import uploadStyles from "src/styles/UploadButton.module.css"
import { UploadButton, UploadDropzone } from "./UploadThing"

export const ImageUpload = ({
  groceryTripId,
  refetch,
  checkReceiptStatus,
  onSuccess,
  onError,
  style = "button",
}: {
  groceryTripId?: number
  refetch?: () => void
  checkReceiptStatus?: () => unknown
  onSuccess?: () => void
  onError?: () => void
  style?: "button" | "dropzone" | "floating"
  label?: string
}) => {
  const [createReceiptMutation] = useMutation(createReceipt)
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)
  const router = useRouter()
  const { userId } = useSession()
  const Component = (() => {
    switch (style) {
      case "dropzone":
        return UploadDropzone
      case "floating":
      case "button":
        return UploadButton
    }
  })()
  const getContent = () => {
    switch (style) {
      case "button":
        return (
          <Tooltip label="Add new receipt" openDelay={500}>
            <IconCamera />
          </Tooltip>
        )
      case "dropzone":
        return <span>Upload</span>
      case "floating":
        return (
          <Tooltip label="Add new receipt">
            <img
              src="/billing_icon.svg"
              alt="add new receipt"
              style={{ width: rem(32), height: rem(32), fill: "white", marginLeft: "5px" }}
            />
          </Tooltip>
        )
    }
  }

  return (
    <Component
      endpoint="imageUploader"
      content={{
        button: getContent(),
      }}
      appearance={{
        button({ ready, isUploading }) {
          return cx(
            {
              "!h-16 !w-16 !rounded-full !bg-[#72b455]": style === "floating",
            },
            `custom-button ${ready ? uploadStyles.customButton : "custom-button-not-ready"} ${
              isUploading ? "custom-button-uploading" : ""
            }`
          )
        },
        container: uploadStyles.customContainer,
        allowedContent: cx({
          "!hidden": style === "floating",
        }),
      }}
      onBeforeUploadBegin={async (input) => {
        const convertedFiles: File[] = []

        for (const file of input) {
          if (file.type === "image/heic" || file.name.endsWith(".heic")) {
            try {
              const buffer = await file.arrayBuffer()
              const jpegBuffer = await heicConvert({
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                buffer: Buffer.from(buffer) as any,
                format: "JPEG",
              })

              const jpgFile = new File([jpegBuffer], file.name.replace(/\.heic$/i, ".jpg"), {
                type: "image/jpeg",
              })

              convertedFiles.push(jpgFile)
            } catch (error) {
              console.error("Error converting HEIC to JPEG:", error)
              onError?.()
              notifications.show({
                color: "red",
                title: "Error",
                message: "There was a problem converting your image",
              })
              break
            }
          } else {
            convertedFiles.push(file)
          }
        }

        return convertedFiles
      }}
      onClientUploadComplete={async (res) => {
        if (res.length < 1) return
        let fallbackGroceryTrip: GroceryTrip | null = { id: 0 } as unknown as GroceryTrip
        if (!groceryTripId) {
          fallbackGroceryTrip = await createGroceryTripMutation({
            name: `${dayjs().format("dddd")} grocery trip`,
            createdAt: dayjs().toDate(),
            userId: userId || 0,
          })
        }
        res?.forEach(async (image, index) => {
          const receipt = await createReceiptMutation({
            url: image.url,
            groceryTripId: groceryTripId || fallbackGroceryTrip.id,
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
        if (style === "floating") {
          await router.push(
            Routes.ShowGroceryTripPage({ groceryTripId: groceryTripId || fallbackGroceryTrip.id })
          )
        }
      }}
      onUploadError={(error: Error) => {
        console.error("ERROR", error)
        onError?.()
        notifications.show({
          color: "red",
          title: "Error",
          message: error.message,
        })
      }}
    />
  )
}
