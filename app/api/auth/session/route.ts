import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminApp } from "@/lib/firebase/admin";

async function getDb() {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(getAdminApp());
}

const CreateSessionSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { idToken } = CreateSessionSchema.parse(await req.json());
    const expiresIn = 1000 * 60 * 60 * 24 * 7; // 7 ngày

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const db = await getDb();
    const snap = await db.collection("students").doc(decoded.uid).get();
    const hasProfile = snap.exists;

    const res = NextResponse.json({ success: true, hasProfile });

    res.cookies.set({
      name: "__session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    if (hasProfile) {
      res.cookies.set({
        name: "__profile",
        value: "1",
        httpOnly: false,
        path: "/",
        maxAge: Math.floor(expiresIn / 1000),
        sameSite: "lax",
      });
    } else {
      res.cookies.set({
        name: "__profile",
        value: "",
        maxAge: 0,
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("[/api/auth/session POST]", err);
    return NextResponse.json({ success: false }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("__session")?.value;
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const db = await getDb();
    const snap = await db.collection("students").doc(decoded.uid).get();
    const hasProfile = snap.exists;

    return NextResponse.json({
      authenticated: true,
      uid: decoded.uid,
      hasProfile
    });
  } catch (err) {
    console.error("[/api/auth/session GET]", err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: "__session", value: "", maxAge: 0, path: "/" });
  res.cookies.set({ name: "__profile", value: "", maxAge: 0, path: "/" });
  return res;
}
