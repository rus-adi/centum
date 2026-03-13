import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export async function GET(_: Request, { params }: { params: { versionId: string } }) {
  const version = await db.governanceDocumentVersion.findUnique({
    where: { id: params.versionId },
    include: { document: true }
  });

  if (!version) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (version.storagePath && /^https?:\/\//i.test(version.storagePath)) {
    return NextResponse.redirect(version.storagePath);
  }

  return new NextResponse(version.body || "", {
    status: 200,
    headers: {
      "Content-Type": version.mimeType || "text/plain; charset=utf-8",
      "Content-Disposition": `inline; filename="${version.originalFilename || `${version.document.title}.txt`}"`
    }
  });
}
