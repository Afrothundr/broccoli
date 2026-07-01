import {
  createUploadthing,
  createRouteHandler,
  UploadThingError,
  type FileRouter,
} from "uploadthing/server";
import { auth } from "./auth";

const f = createUploadthing();

// UploadThing FileRouter. The mobile app uploads a receipt photo directly to
// UploadThing (not through this service) after a short auth handshake with the
// `middleware` below; UploadThing then calls `onUploadComplete` server-side.
//
// This task (2r8.3) stops at handing the app a fetchable `url` + `key`. The app
// passes those to `receipt.create` (2r8.5), which persists the Receipt row.
// broccoli-model later fetches `url`; `key` lets us delete the file.
export const uploadRouter = {
  receiptImage: f({
    image: {
      // Receipts are tall; allow headroom over the default 4MB.
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    // Runs on this server before UploadThing issues the upload URL. We gate on
    // the better-auth session so only signed-in users can upload, and stamp the
    // uploader's id onto the file's metadata.
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user.id };
    })
    // Runs on this server once the upload finishes. Whatever we return here is
    // forwarded to the client as the upload result.
    .onUploadComplete(({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

// Fetch-adapter handler mounted by the Hono app at /api/uploadthing. Reads its
// credentials from UPLOADTHING_TOKEN in the environment.
export const uploadthingHandlers = createRouteHandler({ router: uploadRouter });
