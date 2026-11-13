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

    const data = (await backendRes.json().catch(() => ({}))) as {
      message?: string;
      [key: string]: unknown;
    };

    if (!backendRes.ok) {
      return NextResponse.json(data || { message: "Failed to upload image" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      { message: "Profile image updated successfully", data },
      { status: 201 }
    );
  } catch {
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

    const data = (await backendRes.json().catch(() => ({}))) as {
      message?: string;
      [key: string]: unknown;
    };

    if (!backendRes.ok) {
      // If backend returns 400 because there is no profile image, treat as idempotent success (200 OK)
      if (
        backendRes.status === 400 &&
        (typeof data?.message === "string" && data.message.toLowerCase().includes("no profile image"))
      ) {
        return NextResponse.json(
          { message: "Profile image is already removed", data },
          { status: 200 }
        );
      }

      return NextResponse.json(data || { message: "Failed to delete image" }, {
        status: backendRes.status,
      });
    }

    return NextResponse.json(
      { message: "Profile image removed successfully", data },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to delete profile image on server" },
      { status: 500 }
    );
  }
}

