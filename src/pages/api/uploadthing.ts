import { ourFileRouter } from "src/uploader/uploader-route"
import { createRouteHandler } from "uploadthing/next-legacy"

const handler = createRouteHandler({
  router: ourFileRouter,
})

export default handler
