import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminApp } from "@/lib/firebase/admin";
import { z } from "zod";

async function getDb() {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(getAdminApp());
}

async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const session = req.cookies.get("__session")?.value;
    if (!session) return null;
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

const ProfileSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
  track: z.enum(["science", "social", "mixed"]),
  school: z.string().min(1, "Vui lòng nhập trường"),
  targetSchoolScore: z.number().min(1).max(10).optional().default(7),
  targetUniScore: z.number().min(1).max(30).optional().default(18),
  targetScore: z.number().min(1).max(10).optional(),
  phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized", profile: null }, { status: 401 });
    }

    const db = await getDb();
    const snap = await db.collection("students").doc(uid).get();

    if (!snap.exists) {
      return NextResponse.json({ profile: null });
    }

    const data = snap.data();
    const profile = {
      ...data,
      examResults: Array.isArray(data?.examResults) ? data.examResults : [],
    };

    const res = NextResponse.json({ profile });
    res.cookies.set({
      name: "__profile",
      value: "1",
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  } catch (err) {
    console.error("[/api/student GET]", err);
    return NextResponse.json({ error: "Internal server error", profile: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = ProfileSchema.parse(await req.json());
    const db = await getDb();

    const existing = await db.collection("students").doc(uid).get();
    const now = new Date().toISOString();

    const profileData = {
      id: uid,
      ...body,
      examResults: existing.exists ? (existing.data()?.examResults ?? []) : [],
      roadmap: existing.exists ? (existing.data()?.roadmap ?? null) : null,
      createdAt: existing.exists ? existing.data()?.createdAt : now,
      updatedAt: now,
    };

    await db.collection("students").doc(uid).set(profileData, { merge: true });

    const res = NextResponse.json({ success: true, profile: profileData });
    res.cookies.set({
      name: "__profile",
      value: "1",
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }
    console.error("[/api/student POST]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
