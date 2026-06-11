import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

async function authMiddleware() {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { userId };
}

export const ourFileRouter = {
  receipt: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => ({ uploadedBy: metadata.userId, url: file.ufsUrl })),
  groupCover: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => ({ uploadedBy: metadata.userId, url: file.ufsUrl })),
  paymentProof: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => ({ uploadedBy: metadata.userId, url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
