import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSettings, updateSettings } from "@/lib/settings";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import type { CompanySettings } from "@/lib/settings-schemas";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/settings/upload-logo
 * Upload company logo
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.type.split("/")[1];
    const filename = `logo-${Date.now()}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/${filename}`;

    // Get current settings to check for existing logo
    const currentSettings = await getSettings<CompanySettings>("company");

    // Delete old logo if exists
    if (currentSettings.logo) {
      try {
        const oldFilePath = join(process.cwd(), "public", currentSettings.logo);
        await unlink(oldFilePath);
      } catch {
        // Ignore errors if old file doesn't exist
      }
    }

    // Save new file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update settings with new logo path
    await updateSettings(
      "company",
      { ...currentSettings, logo: publicPath },
      userId
    );

    return NextResponse.json({
      success: true,
      path: publicPath,
      message: "Logo uploaded successfully",
    });
  } catch (error) {
    console.error("POST /api/settings/upload-logo error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/upload-logo
 * Remove company logo
 */
export async function DELETE() {
  try {
    const userId = await requireAdmin();

    const currentSettings = await getSettings<CompanySettings>("company");

    if (currentSettings.logo) {
      try {
        const filepath = join(process.cwd(), "public", currentSettings.logo);
        await unlink(filepath);
      } catch {
        // Ignore errors if file doesn't exist
      }
    }

    // Update settings to remove logo path
    await updateSettings("company", { ...currentSettings, logo: "" }, userId);

    return NextResponse.json({
      success: true,
      message: "Logo removed successfully",
    });
  } catch (error) {
    console.error("DELETE /api/settings/upload-logo error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 }
    );
  }
}
