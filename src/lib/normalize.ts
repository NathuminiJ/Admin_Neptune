/**
 * Normalizes exact backend responses into the flat view models the UI uses.
 *
 * Every field produced here maps to a real backend field — no invented data.
 * See `src/types/index.ts` for both the backend shapes and the view shapes.
 */

import type {
  AssignmentView,
  CollectionRequest,
  Collector,
  CollectorView,
  DailyAssignment,
  RequestView,
  Rider,
  RiderView,
} from '../types';
import { toDateKey } from '../utils/dates';

export function normalizeCollector(raw: Collector): CollectorView {
  return {
    id: raw.id,
    loginId: raw.user.loginId,
    status: raw.user.status,
    fullName: raw.fullName,
    nic: raw.nic,
    mobile: raw.mobile,
    address: raw.address,
    guardianName: raw.guardianName,
    guardianMobile: raw.guardianMobile,
    qrToken: raw.qrToken,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeRider(raw: Rider): RiderView {
  return {
    id: raw.id,
    loginId: raw.user.loginId,
    status: raw.user.status,
    fullName: raw.fullName,
    nic: raw.nic,
    mobile: raw.mobile,
    address: raw.address,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeAssignment(raw: DailyAssignment): AssignmentView {
  return {
    id: raw.id,
    collectorId: raw.collectorId,
    assignmentDate: toDateKey(raw.assignmentDate),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    collectorName: raw.collector?.fullName ?? '',
    collectorMobile: raw.collector?.mobile ?? '',
    collectorLoginId: raw.collector?.user?.loginId ?? '',
  };
}

export function normalizeRequest(raw: CollectionRequest): RequestView {
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const hasCoords = !Number.isNaN(latitude) && !Number.isNaN(longitude);
  return {
    id: raw.id,
    collectorId: raw.collectorId,
    riderId: raw.riderId ?? null,
    latitude,
    longitude,
    status: raw.status,
    qrVerified: Boolean(raw.qrVerified),
    requestedAt: raw.requestedAt,
    acceptedAt: raw.acceptedAt ?? null,
    completedAt: raw.completedAt ?? null,
    cancelledAt: raw.cancelledAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    collector: raw.collector ?? null,
    rider: raw.rider ?? null,
    collection: raw.collection ?? null,
    location: hasCoords
      ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      : '—',
  };
}

/** Weight recorded for a request, from the real `collection` relation. */
export function requestWeightKg(request: RequestView): number | null {
  return request.collection?.weightKg ?? null;
}