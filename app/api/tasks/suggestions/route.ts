import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTaskSuggestions } from "@/lib/task-suggestions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suggestions = await generateTaskSuggestions(session.user.id);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate task suggestions" },
      { status: 500 }
    );
  }
}





