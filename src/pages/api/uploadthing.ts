import { ourFileRouter } from "src/uploader/uploader-route"
import { createNextPageApiHandler } from "uploadthing/next-legacy"

const handler = createNextPageApiHandler({
  router: ourFileRouter,
})

export default handler
