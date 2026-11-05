import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "public/data");
    const files = readdirSync(dataDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const content = JSON.parse(readFileSync(join(dataDir, file), "utf-8"));
        return {
          id: file.replace(".json", ""),
          filename: file,
          title: content.title || file,
          description: content.description || "",
          dateRange: content.dateRange || null,
        };
      });

    return NextResponse.json({ datasets: files });
  } catch (error) {
    console.error("Error reading datasets:", error);
    return NextResponse.json(
      { error: "Failed to read datasets" },
      { status: 500 }
    );
  }
}
