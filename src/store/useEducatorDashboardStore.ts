import { create } from "zustand";

import {
  fetchAtRiskStudents,
  fetchClassroomSlice,
  fetchMasteryMatrix,
  fetchStudentProfile,
} from "@/lib/api/educator";
import { buildStudentCatalog } from "@/lib/educator/students";
import type {
  AtRiskStudentAlert,
  ClassroomSliceResponse,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  StudentProfileResponse,
} from "@/types/educator";

interface EducatorDashboardState {
  studentIds: readonly string[];
  students: readonly ClassroomStudentMeta[];
  topicIds: readonly string[];
  topicCatalog: readonly ClassroomTopicMeta[];
  sliceSource: ClassroomSliceResponse["source"] | null;
  selectedStudentId: string | null;
  masteryMatrix: Record<string, Record<string, number | null>>;
  unknownTopicIds: string[];
  atRiskAlerts: AtRiskStudentAlert[];
  studentProfile: StudentProfileResponse | null;
  isLoadingSlice: boolean;
  isLoadingDashboard: boolean;
  isLoadingProfile: boolean;
  error: string | null;
  profileError: string | null;
  lastRefreshedAt: string | null;
  setSelectedStudentId: (studentId: string) => void;
  refreshDashboard: () => Promise<void>;
  loadStudentProfile: (studentId: string) => Promise<void>;
}

export const useEducatorDashboardStore = create<EducatorDashboardState>(
  (set, get) => ({
    studentIds: [],
    students: [],
    topicIds: [],
    topicCatalog: [],
    sliceSource: null,
    selectedStudentId: null,
    masteryMatrix: {},
    unknownTopicIds: [],
    atRiskAlerts: [],
    studentProfile: null,
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

    refreshDashboard: async () => {
      set({ isLoadingDashboard: true, isLoadingSlice: true, error: null });

      try {
        const slice = await fetchClassroomSlice();
        const { studentIds, topicIds } = slice;
        const students = slice.students?.length
          ? slice.students
          : buildStudentCatalog(studentIds);

        if (studentIds.length === 0 || topicIds.length === 0) {
          set({
            studentIds,
            students,
            topicIds,
            topicCatalog: slice.topics,
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
              "No live learners or topics found yet. Submit assessment or tutor activity first.",
          });
          return;
        }

        set({
          studentIds,
          students,
          topicIds,
          topicCatalog: slice.topics,
          sliceSource: slice.source,
          selectedStudentId: get().selectedStudentId ?? studentIds[0] ?? null,
          isLoadingSlice: false,
        });

        const [matrixPayload, riskPayload] = await Promise.all([
          fetchMasteryMatrix({
            student_ids: [...studentIds],
            topic_ids: [...topicIds],
          }),
          fetchAtRiskStudents({
            student_ids: [...studentIds],
            topic_ids: [...topicIds],
          }),
        ]);

        const selectedStudentId =
          get().selectedStudentId &&
          studentIds.includes(get().selectedStudentId!)
            ? get().selectedStudentId
            : studentIds[0] ?? null;

        set({
          masteryMatrix: matrixPayload.mastery_matrix ?? {},
          unknownTopicIds: matrixPayload.unknown_topic_ids ?? [],
          atRiskAlerts: riskPayload.students ?? [],
          selectedStudentId,
          isLoadingDashboard: false,
          lastRefreshedAt: new Date().toISOString(),
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
      set({ isLoadingProfile: true, profileError: null });

      try {
        const profile = await fetchStudentProfile(studentId);
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
