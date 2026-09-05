export enum PlatformRole {
  EMPLOYEE = 'EMPLOYEE',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum DepartmentRole {
  AGENT = 'AGENT',
  MANAGER = 'MANAGER',
}

export enum Priority {
  LOW = 'LOW',
  STANDARD = 'STANDARD',
  URGENT = 'URGENT',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  ssoSubject: string;
  displayName: string;
  email: string;
  platformRole: PlatformRole;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  requestTypes: RequestType[];
}

export interface RequestType {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  description: string | null;
  defaultPriority: Priority;
}

export interface DepartmentMember {
  id: string;
  departmentId: string;
  userId: string;
  departmentRole: DepartmentRole;
  department: Department;
}

export interface HrRequest {
  id: string;
  employeeId: string;
  departmentId: string;
  requestTypeId: string;
  title: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  claimedBy: string | null;
  resolutionNote: string | null;
  rejectionReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department?: { code: string; name: string };
  requestType?: { code: string; name: string };
  employee?: { id: string; displayName: string; email: string };
  documents?: DocumentRef[];
  auditLogs?: AuditEntry[];
}

export interface DocumentRef {
  id: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  checksum: string;
  uploadedAt: string;
}

export interface AuditEntry {
  id: string;
  requestId: string | null;
  actorId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: any;
  createdAt: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

export const PRIORITY_OPTIONS: Priority[] = [Priority.LOW, Priority.STANDARD, Priority.URGENT];
export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Low',
  [Priority.STANDARD]: 'Standard',
  [Priority.URGENT]: 'Urgent',
};

export const STATUS_OPTIONS: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.IN_PROGRESS,
  RequestStatus.COMPLETED,
  RequestStatus.REJECTED,
  RequestStatus.CANCELLED,
];
export const STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'Pending',
  [RequestStatus.IN_PROGRESS]: 'In Progress',
  [RequestStatus.COMPLETED]: 'Completed',
  [RequestStatus.REJECTED]: 'Rejected',
  [RequestStatus.CANCELLED]: 'Cancelled',
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: '#f59e0b',
  [RequestStatus.IN_PROGRESS]: '#3b82f6',
  [RequestStatus.COMPLETED]: '#22c55e',
  [RequestStatus.REJECTED]: '#ef4444',
  [RequestStatus.CANCELLED]: '#6b7280',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.URGENT]: '#dc2626',
  [Priority.STANDARD]: '#2563eb',
  [Priority.LOW]: '#16a34a',
};

export interface CreateRequestDto {
  departmentCode: string;
  requestTypeCode: string;
  title: string;
  description?: string;
  priority?: Priority;
}

export interface UpdateRequestStatusDto {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  resolutionNote?: string;
  rejectionReason?: string;
}
