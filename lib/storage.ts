import { ExamResult, StudentProfile, LearningRoadmap } from "./types";
import path from "path";

interface StorageAdapter {
  getStudent(id: string): Promise<StudentProfile | null>;
  getAllStudents(): Promise<StudentProfile[]>;
  saveExamResult(result: ExamResult): Promise<void>;
  updateRoadmap(studentId: string, roadmap: LearningRoadmap): Promise<void>;
}

// ─── JSON Adapter ─────────────────────────────────────────────────
class JsonAdapter implements StorageAdapter {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), "data", "students.json");
  }

  private async read(): Promise<{ students: StudentProfile[] }> {
    const fs = await import("fs/promises");
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return { students: [] };
    }
  }

  private async write(data: { students: StudentProfile[] }): Promise<void> {
    const fs = await import("fs/promises");
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async getStudent(id: string): Promise<StudentProfile | null> {
    const data = await this.read();
    return data.students.find((s) => s.id === id) ?? null;
  }

  async getAllStudents(): Promise<StudentProfile[]> {
    const data = await this.read();
    return data.students;
  }

  async saveExamResult(result: ExamResult): Promise<void> {
    const data = await this.read();
    const student = data.students.find((s) => s.id === result.studentId);
    if (!student) throw new Error(`Student ${result.studentId} not found`);
    student.examResults = student.examResults.filter((r) => r.id !== result.id);
    student.examResults.push(result);
    await this.write(data);
  }

  async updateRoadmap(
    studentId: string,
    roadmap: LearningRoadmap,
  ): Promise<void> {
    const data = await this.read();
    const student = data.students.find((s) => s.id === studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);
    student.roadmap = roadmap;
    await this.write(data);
  }
}

// ─── Firebase Admin Adapter (dùng Admin SDK — chạy server-side) ───
class FirebaseAdapter implements StorageAdapter {
  private async getDb() {
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getAdminApp } = await import("./firebase/admin");
    return getFirestore(getAdminApp());
  }

  async getStudent(id: string): Promise<StudentProfile | null> {
    console.log("[FirebaseAdapter] getStudent called for:", id);
    const db = await this.getDb();
    const snap = await db.collection("students").doc(id).get();
    console.log("[FirebaseAdapter] Document exists:", snap.exists);
    if (!snap.exists) return null;
    const data = snap.data() as any;
    console.log("[FirebaseAdapter] examResults count:", data?.examResults?.length);
    return {
      ...data,
      examResults: Array.isArray(data.examResults) ? data.examResults : [],
    } as StudentProfile;
  }

  async getAllStudents(): Promise<StudentProfile[]> {
    const db = await this.getDb();
    const snap = await db.collection("students").get();
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        ...data,
        examResults: Array.isArray(data.examResults) ? data.examResults : [],
      } as StudentProfile;
    });
  }

  async saveExamResult(result: ExamResult): Promise<void> {
    console.log("[FirebaseAdapter] saveExamResult called for student:", result.studentId);
    const db = await this.getDb();
    const ref = db.collection("students").doc(result.studentId);
    const snap = await ref.get();
    console.log("[FirebaseAdapter] Student exists:", snap.exists);
    if (!snap.exists) throw new Error(`Student ${result.studentId} not found`);
    const data = snap.data() as any;
    const existing: ExamResult[] = Array.isArray(data.examResults)
      ? data.examResults
      : [];
    console.log("[FirebaseAdapter] Existing results count:", existing.length);
    const updated = [...existing.filter((r) => r.id !== result.id), result];
    console.log("[FirebaseAdapter] New results count:", updated.length);
    await ref.update({ examResults: updated });
    console.log("[FirebaseAdapter] Update completed");
  }

  async updateRoadmap(
    studentId: string,
    roadmap: LearningRoadmap,
  ): Promise<void> {
    const db = await this.getDb();
    await db.collection("students").doc(studentId).update({ roadmap });
  }
}

// ─── Export ───────────────────────────────────────────────────────
export const storage: StorageAdapter =
  process.env.USE_FIREBASE === "true"
    ? new FirebaseAdapter()
    : new JsonAdapter();
