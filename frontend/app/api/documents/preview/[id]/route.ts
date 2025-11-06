import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[PDF PROXY] Starting request");
    
    // Get token from Authorization header (sent by frontend)
    const authHeader = request.headers.get("authorization");
    console.log("[PDF PROXY] Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[PDF PROXY] No valid auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { id } = await params;
    console.log("[PDF PROXY] Document ID:", id);

    // Forward request to backend (use 127.0.0.1 for server-side fetch to avoid IPv6 issues)
    const backendUrl = `${process.env.BACKEND_API_URL || 'http://127.0.0.1:4000'}/documents/preview/${id}`;
    console.log("[PDF PROXY] Backend URL:", backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[PDF PROXY] Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PDF PROXY] Backend error:`, errorText);
      return NextResponse.json(
        { error: "Failed to fetch document" },
        { status: response.status }
      );
    }

    // Get PDF buffer
    const buffer = await response.arrayBuffer();
    console.log("[PDF PROXY] PDF buffer size:", buffer.byteLength);

    // Return PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[PDF PROXY] Error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
