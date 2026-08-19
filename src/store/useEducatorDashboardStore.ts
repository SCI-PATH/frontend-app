import { create } from "zustand";

import {
  fetchAtRiskStudents,
  fetchClassroomSlice,
  fetchMasteryMatrix,
  fetchStudentProfile,
} from "@/lib/api/educator";
import { fetchTeacherClasses } from "@/lib/user-management";
import { buildStudentCatalog } from "@/lib/educator/students";
import { useUserStore } from "@/store/useUserStore";
import type {
  AtRiskStudentAlert,
  ClassScopeMeta,
  ClassroomSliceResponse,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  StudentProfileResponse,
  TeacherClass,
} from "@/types/educator";

interface EducatorDashboardState {
  teacherClasses: TeacherClass[];
  classMeta: ClassScopeMeta | null;
  studentIds: readonly string[];
  students: readonly ClassroomStudentMeta[];
  topicIds: readonly string[];
  topicCatalog: readonly ClassroomTopicMeta[];
  sliceSource: ClassroomSliceResponse["source"] | null;
  selectedStudentId: string | null;
  masteryMatrix: Record<string, Record<string, number | null>>;
  attemptMatrix: Record<string, Record<string, number>>;
  unknownTopicIds: string[];
  atRiskAlerts: AtRiskStudentAlert[];
  studentProfile: StudentProfileResponse | null;
  isLoadingClasses: boolean;
  isLoadingSlice: boolean;
  isLoadingDashboard: boolean;
  isLoadingProfile: boolean;
  error: string | null;
  profileError: string | null;
  lastRefreshedAt: string | null;
  setSelectedStudentId: (studentId: string) => void;
  loadTeacherClasses: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  loadStudentProfile: (studentId: string) => Promise<void>;
}

function scopeFromSlice(slice: ClassroomSliceResponse): ClassScopeMeta | null {
  if (!slice.classCode) return null;
  return {
    classCode: slice.classCode,
    className: slice.className ?? slice.classCode,
    gradeLevel: slice.gradeLevel ?? 0,
    subject: slice.subject,
  };
}

export const useEducatorDashboardStore = create<EducatorDashboardState>(
  (set, get) => ({
    teacherClasses: [],
    classMeta: null,
    studentIds: [],
    students: [],
    topicIds: [],
    topicCatalog: [],
    sliceSource: null,
    selectedStudentId: null,
    masteryMatrix: {},
    attemptMatrix: {},
    unknownTopicIds: [],
    atRiskAlerts: [],
    studentProfile: null,
    isLoadingClasses: false,
    isLoadingSlice: false,
    isLoadingDashboard: false,
    isLoadingProfile: false,
    error: null,
    profileError: null,
    lastRefreshedAt: null,

    setSelectedStudentId: (studentId) => {
      set({ selectedStudentId: studentId });
      void get().loadStudentProfile(studentId);
    },

    loadTeacherClasses: async () => {
      const token = useUserStore.getState().token;
      if (!token) {
        set({
          teacherClasses: [],
          error: "Sign in as an educator to view classroom analytics.",
        });
        return;
      }

      set({ isLoadingClasses: true, error: null });
      try {
        const classes = await fetchTeacherClasses(token);
        const activeClassCode = useUserStore.getState().activeClassCode;
        const resolvedCode =
          activeClassCode &&
          classes.some((row) => row.class_code === activeClassCode)
            ? activeClassCode
            : classes[0]?.class_code ?? null;

        if (resolvedCode) {
          useUserStore.getState().setActiveClassCode(resolvedCode);
        }

        set({ teacherClasses: classes, isLoadingClasses: false });

        if (classes.length === 0) {
          set({
            error:
              "No classes found. Create one from Classrooms, share the class code, then refresh.",
          });
          return;
        }

        if (resolvedCode) {
          await get().refreshDashboard();
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Could not load your classes.";
        set({ isLoadingClasses: false, error: message });
      }
    },

    refreshDashboard: async () => {
      const classCode = useUserStore.getState().activeClassCode;
      if (!classCode) {
        set({
          error:
            "Select a class to load analytics. Create one from Classrooms if needed.",
        });
        return;
      }

      set({ isLoadingDashboard: true, isLoadingSlice: true, error: null });

      try {
        const slice = await fetchClassroomSlice(classCode);
        const classMeta = scopeFromSlice(slice);
        const { studentIds, topicIds } = slice;
        const students = slice.students?.length
          ? slice.students
          : buildStudentCatalog(studentIds);

        if (topicIds.length === 0) {
          set({
            classMeta,
            studentIds,
            students,
            topicIds,
            topicCatalog: slice.topics,
            sliceSource: slice.source,
            masteryMatrix: {},
            attemptMatrix: slice.attemptMatrix ?? {},
            unknownTopicIds: [],
            atRiskAlerts: [],
            studentProfile: null,
            selectedStudentId: null,
            isLoadingDashboard: false,
            isLoadingSlice: false,
            lastRefreshedAt: new Date().toISOString(),
            error: `No grade ${slice.gradeLevel ?? ""} skills found for this class.`,
          });
          return;
        }

        if (studentIds.length === 0) {
          set({
            classMeta,
            studentIds,
            students,
            topicIds,
            topicCatalog: slice.topics,
            attemptMatrix: slice.attemptMatrix ?? {},
            sliceSource: slice.source,
            masteryMatrix: {},
            unknownTopicIds: [],
            atRiskAlerts: [],
            studentProfile: null,
            selectedStudentId: null,
            isLoadingDashboard: false,
            isLoadingSlice: false,
            lastRefreshedAt: new Date().toISOString(),
            error:
              "No learners enrolled yet. Share your class code so students can join.",
          });
          return;
        }

        set({
          classMeta,
          studentIds,
          students,
          topicIds,
          topicCatalog: slice.topics,
          attemptMatrix: slice.attemptMatrix ?? {},
          sliceSource: slice.source,
          selectedStudentId: get().selectedStudentId ?? studentIds[0] ?? null,
          isLoadingSlice: false,
        });

        const scopedRequest = { class_code: classCode };

        const [matrixPayload, riskPayload] = await Promise.all([
          fetchMasteryMatrix(scopedRequest),
          fetchAtRiskStudents(scopedRequest),
        ]);

        const selectedStudentId =
          get().selectedStudentId &&
          studentIds.includes(get().selectedStudentId!)
            ? get().selectedStudentId
            : studentIds[0] ?? null;

        set({
          classMeta: classMeta ?? {
            classCode,
            className: matrixPayload.class_name ?? classCode,
            gradeLevel: matrixPayload.grade_level ?? slice.gradeLevel ?? 0,
            subject: matrixPayload.subject ?? slice.subject,
          },
          masteryMatrix: matrixPayload.mastery_matrix ?? {},
          unknownTopicIds: matrixPayload.unknown_topic_ids ?? [],
          atRiskAlerts: riskPayload.students ?? [],
          selectedStudentId,
          isLoadingDashboard: false,
          lastRefreshedAt: new Date().toISOString(),
          error: null,
        });

        if (selectedStudentId) {
          await get().loadStudentProfile(selectedStudentId);
        }
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Could not load educator dashboard data.";
        set({
          isLoadingDashboard: false,
          isLoadingSlice: false,
          error: message,
        });
      }
    },

    loadStudentProfile: async (studentId) => {
      const classCode = useUserStore.getState().activeClassCode;
      set({ isLoadingProfile: true, profileError: null });

      try {
        const profile = await fetchStudentProfile(
          studentId,
          classCode ?? undefined
        );
        set({ studentProfile: profile, isLoadingProfile: false });
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Could not load student profile.";
        set({ isLoadingProfile: false, profileError: message });
      }
    },
  })
);
