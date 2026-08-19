import { BarChart3, CalendarClock, Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { EmptyState, ErrorState } from '../components/states';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import {
  normalizeAssignment,
  normalizeCollector,
  normalizeRider,
  normalizeRequest,
} from '../lib/normalize';
import type {
  CollectionRequest,
  Collector,
  CollectorView,
  DailyAssignment,
  RequestView,
  Rider,
  RiderView,
  Vehicle,
} from '../types';
import { formatDateTime, formatWeight } from '../utils/format';

type ReportKey = 'collection' | 'request' | 'collector' | 'rider' | 'vehicle' | 'assignment';

const REPORT_TYPES: { value: ReportKey; label: string }[] = [
  { value: 'collection', label: 'Collection Report' },
  { value: 'request', label: 'Collection Request Report' },
  { value: 'collector', label: 'Collector Report' },
  { value: 'rider', label: 'Rider Report' },
  { value: 'vehicle', label: 'Vehicle Report' },
  { value: 'assignment', label: 'Assignment Report' },
];

const REQUEST_STATUSES = ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

type ReportRow = Record<string, string>;

interface ReportSummary {
  total: number;
  weightKg?: number;
  statuses?: Record<string, number>;
}

interface ReportResult {
  columns: Column<ReportRow>[];
  rows: ReportRow[];
  summary: ReportSummary;
}

const noOp: Column<ReportRow>[] = [];

const FILTER_CONFIG: Record<
  ReportKey,
  { date: boolean; collector: boolean; rider: boolean; vehicle: boolean; status: boolean }
> = {
  collection: { date: true, collector: true, rider: true, vehicle: true, status: true },
  request: { date: true, collector: true, rider: true, vehicle: true, status: true },
  collector: { date: true, collector: true, rider: false, vehicle: false, status: false },
  rider: { date: true, collector: false, rider: true, vehicle: false, status: false },
  vehicle: { date: true, collector: false, rider: false, vehicle: true, status: false },
  assignment: { date: true, collector: true, rider: false, vehicle: false, status: false },
};

const dateKey = (value: string | null | undefined): string => {
  const v = value ? String(value) : '';
  return v.length >= 10 ? v.slice(0, 10) : v;
};

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportKey>('collection');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [collectorId, setCollectorId] = useState('ALL');
  const [riderId, setRiderId] = useState('ALL');
  const [vehicleId, setVehicleId] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const [collectors, setCollectors] = useState<CollectorView[]>([]);
  const [riders, setRiders] = useState<RiderView[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, r, v] = await Promise.all([
          api.get<Collector[]>('/admin/collectors'),
          api.get<Rider[]>('/admin/riders'),
          api.get<Vehicle[]>('/admin/vehicles'),
        ]);
        if (cancelled) return;
        setCollectors(c.map(normalizeCollector));
        setRiders(r.map(normalizeRider));
        setVehicles(v);
      } catch {
        // Filter dropdowns fall back to their "All" option only.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any change to the report type OR any filter invalidates a previously
  // generated result so stale data is never shown as if it belongs to the
  // current selection.
  useEffect(() => {
    setError(null);
    setResult(null);
  }, [reportType, dateFrom, dateTo, collectorId, riderId, vehicleId, status]);

  const inDateRange = useCallback(
    (value: string | null | undefined): boolean => {
      const key = dateKey(value);
      if (!key) return true;
      if (dateFrom && key < dateFrom) return false;
      if (dateTo && key > dateTo) return false;
      return true;
    },
    [dateFrom, dateTo],
  );

  const matchesRequest = useCallback(
    (r: RequestView, dateValue: string | null | undefined): boolean => {
      if (!inDateRange(dateValue)) return false;
      if (collectorId !== 'ALL' && r.collector?.id !== collectorId) return false;
      if (riderId !== 'ALL' && r.rider?.id !== riderId) return false;
      if (vehicleId !== 'ALL' && r.collection?.vehicle?.id !== vehicleId) return false;
      if (status !== 'ALL' && r.status !== status) return false;
      return true;
    },
    [inDateRange, collectorId, riderId, vehicleId, status],
  );

  const buildReport = useCallback(async (): Promise<ReportResult> => {
    if (reportType === 'collection' || reportType === 'request') {
      const req = await api.get<CollectionRequest[]>('/admin/collection-requests');
      const requests = req.map(normalizeRequest);

      if (reportType === 'collection') {
        const filtered = requests
          .filter((r) => r.collection !== null)
          .filter((r) => matchesRequest(r, r.collection?.collectedAt ?? r.collection?.createdAt));
        const rows: ReportRow[] = filtered.map((r) => ({
          collectionId: r.collection!.id,
          requestId: r.id,
          date: formatDateTime(r.collection!.collectedAt ?? r.collection!.createdAt),
          collector: r.collector?.fullName ?? '—',
          rider: r.rider?.fullName ?? '—',
          vehicle: r.collection!.vehicle?.vehicleCode ?? '—',
          weight: formatWeight(r.collection!.weightKg),
        }));
        const weightKg = filtered.reduce(
          (sum, r) => sum + (r.collection?.weightKg ?? 0),
          0,
        );
        return {
          columns: [
            { key: 'collectionId', header: 'Collection ID', render: (x) => <span className="mono">{x.collectionId}</span> },
            { key: 'requestId', header: 'Request ID', render: (x) => <span className="mono">{x.requestId}</span> },
            { key: 'date', header: 'Collected At' },
            { key: 'collector', header: 'Collector' },
            { key: 'rider', header: 'Rider' },
            { key: 'vehicle', header: 'Vehicle' },
            { key: 'weight', header: 'Weight (kg)', align: 'right' },
          ],
          rows,
          summary: { total: rows.length, weightKg },
        };
      }

      const filtered = requests.filter((r) => matchesRequest(r, r.requestedAt));
      const rows: ReportRow[] = filtered.map((r) => ({
        requestId: r.id,
        collector: r.collector?.fullName ?? '—',
        rider: r.rider?.fullName ?? '—',
        status: r.status,
        qrVerified: r.qrVerified ? 'Yes' : 'No',
        latitude: String(r.latitude),
        longitude: String(r.longitude),
        requested: r.requestedAt ? formatDateTime(r.requestedAt) : '—',
        accepted: r.acceptedAt ? formatDateTime(r.acceptedAt) : '—',
        completed: r.completedAt ? formatDateTime(r.completedAt) : '—',
        cancelled: r.cancelledAt ? formatDateTime(r.cancelledAt) : '—',
      }));
      const statuses: Record<string, number> = {};
      for (const r of filtered) statuses[r.status] = (statuses[r.status] || 0) + 1;
      return {
        columns: [
          { key: 'requestId', header: 'Request ID', render: (x) => <span className="mono">{x.requestId}</span> },
          { key: 'collector', header: 'Collector' },
          { key: 'rider', header: 'Rider' },
          {
            key: 'status',
            header: 'Status',
            render: (x) => <StatusBadge status={x.status} />,
          },
          { key: 'qrVerified', header: 'QR Verified' },
          { key: 'latitude', header: 'Latitude' },
          { key: 'longitude', header: 'Longitude' },
          { key: 'requested', header: 'Requested At' },
          { key: 'accepted', header: 'Accepted At' },
          { key: 'completed', header: 'Completed At' },
          { key: 'cancelled', header: 'Cancelled At' },
        ],
        rows,
        summary: { total: rows.length, statuses },
      };
    }

    if (reportType === 'assignment') {
      const a = (await api.get<DailyAssignment[]>('/admin/assignments')).map(normalizeAssignment);
      const rows: ReportRow[] = a
        .filter((x) => inDateRange(x.assignmentDate))
        .filter((x) => collectorId === 'ALL' || x.collectorId === collectorId)
        .map((x) => ({
          id: x.id,
          collector: x.collectorName || '—',
          date: x.assignmentDate,
          created: formatDateTime(x.createdAt),
          updated: formatDateTime(x.updatedAt),
        }));
      return {
        columns: [
          { key: 'id', header: 'Assignment ID', render: (x) => <span className="mono">{x.id}</span> },
          { key: 'collector', header: 'Collector' },
          { key: 'date', header: 'Assignment Date' },
          { key: 'created', header: 'Created At' },
          { key: 'updated', header: 'Updated At' },
        ],
        rows,
        summary: { total: rows.length },
      };
    }

    // Entity reports: collector / rider / vehicle with real activity aggregates.
    const requests = (await api.get<CollectionRequest[]>('/admin/collection-requests')).map(
      normalizeRequest,
    );

    if (reportType === 'collector') {
      const rows: ReportRow[] = collectors
        .filter((c) => collectorId === 'ALL' || c.id === collectorId)
        .map((c) => {
          const act = requests.filter(
            (r) => r.collector?.id === c.id && inDateRange(r.requestedAt),
          );
          const completed = act.filter((r) => r.status === 'COMPLETED');
          const weight = completed.reduce(
            (sum, r) => sum + (r.collection?.weightKg ?? 0),
            0,
          );
          return {
            id: c.id,
            name: c.fullName,
            loginId: c.loginId,
            nic: c.nic,
            mobile: c.mobile,
            address: c.address,
            requests: String(act.length),
            completed: String(completed.length),
            weight: formatWeight(weight),
          };
        });
      return {
        columns: [
          { key: 'name', header: 'Collector' },
          { key: 'loginId', header: 'Login ID', render: (x) => <span className="mono">{x.loginId}</span> },
          { key: 'nic', header: 'NIC', render: (x) => <span className="mono">{x.nic}</span> },
          { key: 'mobile', header: 'Mobile' },
          { key: 'address', header: 'Address' },
          { key: 'requests', header: 'Requests', align: 'right' },
          { key: 'completed', header: 'Completed', align: 'right' },
          { key: 'weight', header: 'Total Weight (kg)', align: 'right' },
        ],
        rows,
        summary: { total: rows.length },
      };
    }

    if (reportType === 'rider') {
      const rows: ReportRow[] = riders
        .filter((r) => riderId === 'ALL' || r.id === riderId)
        .map((r) => {
          const act = requests.filter(
            (x) => x.rider?.id === r.id && inDateRange(x.requestedAt),
          );
          const completed = act.filter((x) => x.status === 'COMPLETED');
          return {
            id: r.id,
            name: r.fullName,
            nic: r.nic,
            mobile: r.mobile,
            address: r.address,
            vehicle: r.vehicleCode ?? 'No Vehicle',
            requests: String(act.length),
            completed: String(completed.length),
          };
        });
      return {
        columns: [
          { key: 'name', header: 'Rider' },
          { key: 'nic', header: 'NIC', render: (x) => <span className="mono">{x.nic}</span> },
          { key: 'mobile', header: 'Mobile' },
          { key: 'address', header: 'Address' },
          { key: 'vehicle', header: 'Assigned Vehicle' },
          { key: 'requests', header: 'Requests', align: 'right' },
          { key: 'completed', header: 'Completed', align: 'right' },
        ],
        rows,
        summary: { total: rows.length },
      };
    }

    // vehicle report
    const rows: ReportRow[] = vehicles
      .filter((v) => vehicleId === 'ALL' || v.id === vehicleId)
      .map((v) => {
        const collections = requests.filter(
          (r) =>
            r.collection?.vehicle?.id === v.id &&
            inDateRange(r.collection?.collectedAt ?? r.collection?.createdAt),
        );
        const weight = collections.reduce(
          (sum, r) => sum + (r.collection?.weightKg ?? 0),
          0,
        );
        return {
          id: v.id,
          code: v.vehicleCode,
          type: v.vehicleType,
          status: v.status,
          collections: String(collections.length),
          weight: formatWeight(weight),
        };
      });
    return {
      columns: [
        { key: 'code', header: 'Vehicle Code', render: (x) => <span className="mono">{x.code}</span> },
        { key: 'type', header: 'Vehicle Type' },
        {
          key: 'status',
          header: 'Status',
          render: (x) => <StatusBadge status={x.status} />,
        },
        { key: 'collections', header: 'Collections', align: 'right' },
        { key: 'weight', header: 'Total Weight (kg)', align: 'right' },
      ],
      rows,
      summary: { total: rows.length },
    };
  }, [
    reportType,
    matchesRequest,
    inDateRange,
    collectorId,
    riderId,
    vehicleId,
    collectors,
    riders,
    vehicles,
  ]);

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const built = await buildReport();
      setResult(built);
    } catch (err: any) {
      setError(err.message || 'The report could not be generated.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [loading, buildReport]);

  const handleDownload = useCallback(() => {
    if (!result || result.rows.length === 0 || loading) return;
    const header = result.columns.map((c) => c.header);
    const body = result.rows.map((row) => result.columns.map((c) => row[c.key] ?? ''));
    const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, REPORT_TYPES.find((t) => t.value === reportType)?.label ?? 'Report');
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `neptune-${reportType}-report-${stamp}.xlsx`);
  }, [result, loading, reportType]);

  const cfg = FILTER_CONFIG[reportType];
  const canDownload = !loading && result !== null && result.rows.length > 0;
  const showInitial = result === null && !error && !loading;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <BarChart3 /> Reports
          </h1>
          <p>Generate system reports from real Neptune data.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-grid">
            <FormField label="Report Type" className="span-2">
              <select
                className="select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportKey)}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>

            {cfg.date && (
              <>
                <FormField label="Date From">
                  <input
                    type="date"
                    className="input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </FormField>
                <FormField label="Date To">
                  <input
                    type="date"
                    className="input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </FormField>
              </>
            )}

            {cfg.collector && (
              <FormField label="Collector">
                <select
                  className="select"
                  value={collectorId}
                  onChange={(e) => setCollectorId(e.target.value)}
                >
                  <option value="ALL">All Collectors</option>
                  {collectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {cfg.rider && (
              <FormField label="Rider">
                <select
                  className="select"
                  value={riderId}
                  onChange={(e) => setRiderId(e.target.value)}
                >
                  <option value="ALL">All Riders</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {cfg.vehicle && (
              <FormField label="Vehicle">
                <select
                  className="select"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleCode} — {v.vehicleType}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {cfg.status && (
              <FormField label="Status">
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <div className="span-2 form-actions-row">
              <PrimaryButton onClick={handleGenerate} loading={loading}>
                {loading ? 'Generating…' : 'Generate Report'}
              </PrimaryButton>
              <SecondaryButton onClick={handleDownload} disabled={!canDownload}>
                <Download size={15} /> Download Excel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3 className="card-title">
            <CalendarClock /> Results
            {result && (
              <span className="badge badge-slate" style={{ marginLeft: 8 }}>
                {result.summary.total}
              </span>
            )}
          </h3>
        </div>
        {result && result.summary.total > 0 && (
          <div className="report-summary">
            {result.summary.total !== null && (
              <span>Records: {result.summary.total}</span>
            )}
            {typeof result.summary.weightKg === 'number' && (
              <span>Total Weight: {result.summary.weightKg.toFixed(1)} kg</span>
            )}
            {result.summary.statuses &&
              Object.entries(result.summary.statuses).map(([k, v]) => (
                <span key={k}>
                  {k.charAt(0) + k.slice(1).toLowerCase()}: {v}
                </span>
              ))}
          </div>
        )}
        <div className="card-body flush">
          {error ? (
            <ErrorState
              title="Report could not be generated"
              message={error}
              onRetry={handleGenerate}
            />
          ) : showInitial ? (
            <div className="state">
              <div className="state-icon octagonal">
                <BarChart3 />
              </div>
              <div className="state-title">Choose a report type and generate it</div>
              <div className="state-desc">Select the filters above, then click Generate Report.</div>
            </div>
          ) : (
            <DataTable<ReportRow>
              columns={result ? result.columns : noOp}
              rows={result ? result.rows : []}
              rowKey={(x) => x.requestId ?? x.id ?? x.collectionId ?? x.vehicleCode ?? x.name}
              loading={loading}
              emptyState={
                <EmptyState
                  icon="inbox"
                  title="No records found for the selected filters."
                  description="Try adjusting the report filters above."
                />
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
