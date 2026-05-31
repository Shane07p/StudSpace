export interface HandleDto {
  platform: string;
  url: string;
  displayOrder: number;
}

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  college?: string;
  branch?: string;
  year?: number;
  bio?: string;
  profilePublic: boolean;
  hasPassword: boolean;
  profilePhoto?: string;
  coverPhoto?: string;
  handles: HandleDto[];
}

export interface SemesterDto {
  id: string;
  label: string;
  shortName?: string;
  isCurrent: boolean;
  shareToken?: string;
}

export interface CourseDto {
  id: string;
  semesterId: string;
  code?: string;
  name: string;
  instructor?: string;
  credits: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  cancelledCount: number;
  attendancePercentage: number;
  classesNeededFor75: number;
  resourceCount: number;
}

export type ResourceType = 'PYQ' | 'PLAYLIST' | 'NOTES' | 'LINK' | 'OTHER';

export interface ResourceDto {
  id: string;
  courseId?: string;
  semesterId?: string;
  type: ResourceType;
  title: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED';

export interface AttendanceDto {
  id: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
}

export interface TimetableSlotDto {
  id: string;
  semesterId: string;
  courseId?: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface DashboardStats {
  totalCourses: number;
  totalResources: number;
  totalCredits: number;
  overallAttendance: number;
}

export interface CurrentSemesterView {
  semester: { id: string; label: string; shareToken?: string };
  courses: CourseDto[];
}

export interface DashboardResponse {
  stats: DashboardStats;
  currentSemester?: CurrentSemesterView;
  recentResources: ResourceDto[];
}
