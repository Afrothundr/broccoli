import { generateComponents } from "@uploadthing/react"
import { OurFileRouter } from "src/uploader/uploader-route"

export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>()
