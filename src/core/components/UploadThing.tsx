import { generateComponents } from "@uploadthing/react"
import type { OurFileRouter } from "src/uploader/uploader-route"

export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>()
