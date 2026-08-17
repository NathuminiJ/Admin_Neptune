/**
 * NEPTUNE domain types.
 * These mirror the entities managed by the Neptune backend so that
 * real API responses can be mapped onto them later without touching the UI.
 */

export type Role = 'ADMIN' | 'COLLECTOR' | 'RIDER';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export type VehicleStatus = 'ACTIVE' | 'INACTIVE';

export type VehicleType = 'TRUCK' | 'TUK' | 'BIKE';

export type RiderVehicleType = 'TUK' | 'BIKE';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export type AssignmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Collector {
  id: string;
  fullName: string;
  loginId: string;
  nic: string;
  mobile: string;
  address: string;
  guardianName: string;
  guardianMobile: string;
  qrToken: string;
  status: AccountStatus;
  area: string;
  createdDate: string;
  lastLogin: string | null;
}

export interface Rider {
  id: string;
  fullName: string;
  loginId: string;
  nic: string;
  mobile: string;
  address: string;
  status: AccountStatus;
  vehicleType: RiderVehicleType;
  vehicleNumber: string;
  vehicleColour: string;
  assignedVehicleId: string | null;
  createdDate: string;
  lastLogin: string | null;
}

export interface Vehicle {
  id: string;
  vehicleCode: string;
  vehicleType: VehicleType;
  status: VehicleStatus;
  assignedRiderId: string | null;
  createdDate: string;
}

export interface DailyAssignment {
  id: string;
  date: string;
  collectorId: string;
  area: string;
  status: AssignmentStatus;
  requestIds: string[];
  createdDate: string;
}

export interface CollectionRequest {
  id: string;
  collectorId: string;
  riderId: string | null;
  vehicleId: string | null;
  location: string;
  createdDate: string;
  status: RequestStatus;
  totalWeight: number | null;
  collectionDate: string | null;
  acceptedDate: string | null;
  cancelledDate: string | null;
  assignmentId: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
}

export interface LeaderboardEntry {
  collectorId: string;
  fullName: string;
  totalWeightKg: number;
  totalCollections: number;
  rank: number;
}

export interface AdminProfile {
  id?: string;
  loginId: string;
  role: Role;
  status?: AccountStatus;
  name?: string;
  email?: string;
  mobile?: string;
}