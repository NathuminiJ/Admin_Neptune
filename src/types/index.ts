/**
 * NEPTUNE domain types.
 *
 * The entity interfaces below mirror the EXACT response shapes returned by
 * the Neptune backend (see NEPTUNE_API_HANDOVER.md and the NestJS admin
 * controllers). The `*View` interfaces are flattened UI view models produced
 * by the normalizers in `src/lib/normalize.ts` — they never contain fields
 * that do not exist in the backend.
 */

export type Role = 'ADMIN' | 'COLLECTOR' | 'RIDER';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export type VehicleStatus = 'ACTIVE' | 'INACTIVE';

export type VehicleType = string;

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

/* --------------------------------------------------------------------------
 * Authentication
 * ------------------------------------------------------------------------*/

export interface AuthUser {
  id: string;
  loginId: string;
  role: Role;
  status: AccountStatus;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MeResponse {
  id: string;
  role: Role;
  qrToken?: string | null;
}

export type AdminProfile = AuthUser;

/* --------------------------------------------------------------------------
 * Backend entity shapes (as returned by /admin/* endpoints)
 * ------------------------------------------------------------------------*/

export interface UserAccount {
  id: string;
  loginId: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Collector {
  id: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  guardianName: string;
  guardianMobile: string;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
  user: UserAccount;
}

export interface Rider {
  id: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  vehicleId: string | null;
  vehicle: {
    id: string;
    vehicleCode: string;
    vehicleType: string;
    status: VehicleStatus;
  } | null;
  createdAt: string;
  updatedAt: string;
  user: UserAccount;
}

export interface Vehicle {
  id: string;
  vehicleCode: string;
  vehicleType: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentCollectorRef {
  id: string;
  fullName: string;
  mobile: string;
  user: {
    loginId: string;
  };
}

export interface DailyAssignment {
  id: string;
  collectorId: string;
  /** ISO date-time string; the business date is its YYYY-MM-DD part. */
  assignmentDate: string;
  createdAt: string;
  updatedAt: string;
  collector: AssignmentCollectorRef | null;
}

export interface VehicleRef {
  id: string;
  vehicleCode: string;
  vehicleType: string;
  status: VehicleStatus;
}

export interface Collection {
  id: string;
  collectionRequestId: string;
  collectorId: string;
  riderId: string;
  vehicleId: string;
  weightKg: number;
  collectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: VehicleRef | null;
}

export interface CollectorRef {
  id: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  user: {
    id: string;
    loginId: string;
    role: Role;
    status: AccountStatus;
  };
}

export interface RiderRef {
  id: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  user: {
    id: string;
    loginId: string;
    role: Role;
    status: AccountStatus;
  };
}

export interface CollectionRequest {
  id: string;
  collectorId: string;
  riderId: string | null;
  latitude: number;
  longitude: number;
  status: RequestStatus;
  qrVerified: boolean;
  requestedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  collector: CollectorRef | null;
  rider: RiderRef | null;
  collection: Collection | null;
}

export interface LeaderboardEntry {
  collectorId: string;
  fullName: string;
  totalWeightKg: number;
  totalCollections: number;
  rank: number;
}

/* --------------------------------------------------------------------------
 * Flattened UI view models (produced by lib/normalize.ts)
 * ------------------------------------------------------------------------*/

export interface CollectorView {
  id: string;
  loginId: string;
  status: AccountStatus;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  guardianName: string;
  guardianMobile: string;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderView {
  id: string;
  loginId: string;
  status: AccountStatus;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  vehicleId: string | null;
  vehicleCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentView {
  id: string;
  collectorId: string;
  /** Business date in YYYY-MM-DD (local). */
  assignmentDate: string;
  createdAt: string;
  updatedAt: string;
  collectorName: string;
  collectorMobile: string;
  collectorLoginId: string;
}

export interface RequestView {
  id: string;
  collectorId: string;
  riderId: string | null;
  latitude: number;
  longitude: number;
  status: RequestStatus;
  qrVerified: boolean;
  requestedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  collector: CollectorRef | null;
  rider: RiderRef | null;
  collection: Collection | null;
  /** Human readable coordinates, derived from latitude/longitude. */
  location: string;
}

/* --------------------------------------------------------------------------
 * API request payloads (match the backend DTOs exactly)
 * ------------------------------------------------------------------------*/

export interface CreateCollectorPayload {
  loginId: string;
  password: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  guardianName: string;
  guardianMobile: string;
  qrToken: string;
}

export type UpdateCollectorPayload = Partial<CreateCollectorPayload>;

export interface CreateRiderPayload {
  loginId: string;
  password: string;
  fullName: string;
  nic: string;
  mobile: string;
  address: string;
  vehicleId: string | null;
}

export type UpdateRiderPayload = Partial<CreateRiderPayload>;

export interface CreateVehiclePayload {
  vehicleCode: string;
  vehicleType: string;
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export interface AssignmentPayload {
  collectorId: string;
  assignmentDate: string;
}

export type UpdateAssignmentPayload = Partial<AssignmentPayload>;