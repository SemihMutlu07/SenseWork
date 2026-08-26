import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { jsonError } from "@/lib/api";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const { userId } = await context.params;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(userId)) {
    return jsonError(404, {
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const user = await getUserById(userId);
  if (!user) {
    return jsonError(404, {
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return NextResponse.json({ user });
}
