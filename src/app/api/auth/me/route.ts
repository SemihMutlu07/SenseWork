import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return NextResponse.json({ user });
}
