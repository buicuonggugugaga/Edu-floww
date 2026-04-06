import { ExamResult, StudentProfile, LearningRoadmap } from "./types";
import path from "path";

// ─── Interface chung — cả JSON lẫn Firebase đều implement này ───
interface StorageAdapter {
  getStudent(id: string): Promise<StudentProfile | null>;
  getAllStudents(): Promise<StudentProfile[]>;
  saveExamResult(result: ExamResult): Promise<void>;
  updateRoadmap(studentId: string, roadmap: LearningRoadmap): Promise<void>;
}

// ─── JSON Adapter — dùng trong development ───────────────────────
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
    // Tránh trùng lặp — xoá kết quả cũ nếu cùng id
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

// ─── Firebase Adapter — dùng trong production ────────────────────
class FirebaseAdapter implements StorageAdapter {
  async getStudent(id: string): Promise<StudentProfile | null> {
    const { getFirestore, doc, getDoc } = await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    const snap = await getDoc(doc(db, "students", id));
    return snap.exists() ? (snap.data() as StudentProfile) : null;
  }

  async getAllStudents(): Promise<StudentProfile[]> {
    const { getFirestore, collection, getDocs } =
      await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    const snap = await getDocs(collection(db, "students"));
    return snap.docs.map((d) => d.data() as StudentProfile);
  }

  async saveExamResult(result: ExamResult): Promise<void> {
    const { getFirestore, doc, updateDoc, arrayUnion } =
      await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    await updateDoc(doc(db, "students", result.studentId), {
      examResults: arrayUnion(result),
    });
  }

  async updateRoadmap(
    studentId: string,
    roadmap: LearningRoadmap,
  ): Promise<void> {
    const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
    const { getApp } = await import("firebase/app");
    const db = getFirestore(getApp());
    await updateDoc(doc(db, "students", studentId), { roadmap });
  }
}

// ─── Export — tự động chọn adapter theo biến môi trường ──────────
export const storage: StorageAdapter =
  process.env.USE_FIREBASE === "true"
    ? new FirebaseAdapter()
    : new JsonAdapter();
