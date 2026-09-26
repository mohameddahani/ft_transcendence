import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/server-api";

export async function POST(req: NextRequest) {
  try {
    const userToken = req.cookies.get("auth_token")?.value;
    const clientFormData = await req.formData();
    const file = clientFormData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    // Size limit check (1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { message: "Image size exceeds the 1MB limit" },
        { status: 400 }
      );
    }

    // Mime type check
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files (JPEG, PNG, WEBP, etc.) are allowed" },
        { status: 400 }
      );
    }

    // Construct FormData to forward to backend
    const backendFormData = new FormData();
    const fileName = (file as File).name || "avatar.jpg";
    backendFormData.append("image", file, fileName);

    const backendRes = await fetchFromBackend(
      "/api/users/owners/profile-image",
      userToken,
      {
        method: "POST",
        body: backendFormData,
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to upload image" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      { message: "Profile image updated successfully", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { message: "Failed to upload profile image to server" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userToken = req.cookies.get("auth_token")?.value;

    const backendRes = await fetchFromBackend(
      "/api/users/owners/profile-image",
      userToken,
      {
        method: "DELETE",
      }
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to delete image" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      { message: "Profile image removed successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return NextResponse.json(
      { message: "Failed to delete profile image on server" },
      { status: 500 }
    );
  }
}

