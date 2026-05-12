import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useCreateTestSchedule,
  useRunnerSchedules,
  useRunnerTestSurfaceBundles,
  useEnvironmentTestElements,
  useEnvironmentTestSurfaces,
} from '@sudobility/testomniac_client';
import type { CreateTestScheduleRequest, TestScheduleResponse } from '@sudobility/testomniac_types';
import SEOHead from '@/components/SEOHead';
import { CONSTANTS } from '../config/constants';
import { StatusBadge } from '../components/scanner/StatusBadge';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';

type TargetKind = 'bundle' | 'surface' | 'element';

const RECURRENCE_OPTIONS = [
  { value: 'one_time', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekly', label: 'Weekly' },
] as const;

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

function describeScheduleTarget(schedule: TestScheduleResponse) {
  if (schedule.testSurfaceBundleId) return `Bundle #${schedule.testSurfaceBundleId}`;
  if (schedule.testSurfaceId) return `Surface #${schedule.testSurfaceId}`;
  if (schedule.testElementId) return `Element #${schedule.testElementId}`;
  return 'Unknown target';
}

function describeRecurrence(schedule: TestScheduleResponse) {
  if (schedule.recurrenceType === 'weekly' && schedule.dayOfWeek != null) {
    const day = DAY_OPTIONS.find(option => option.value === schedule.dayOfWeek)?.label ?? 'Day';
    return `Weekly on ${day} at ${schedule.timeOfDay}`;
  }
  if (schedule.recurrenceType === 'weekday') {
    return `Weekdays at ${schedule.timeOfDay}`;
  }
  if (schedule.recurrenceType === 'daily') {
    return `Daily at ${schedule.timeOfDay}`;
  }
  return `One time at ${schedule.timeOfDay}`;
}

export default function SchedulesPage() {
  const { envId } = useParams<{ envId: string }>();
  const {
    networkClient,
    token,
    primaryRunner,
    envId: numericEnvId,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetKind, setTargetKind] = useState<TargetKind>('bundle');
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [selectedSurfaceId, setSelectedSurfaceId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState('');
  const [recurrenceType, setRecurrenceType] =
    useState<CreateTestScheduleRequest['recurrenceType']>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [sizeClass, setSizeClass] = useState<CreateTestScheduleRequest['sizeClass']>('desktop');
  const [discovery, setDiscovery] = useState(true);

  const {
    schedules,
    isLoading: schedulesLoading,
    error: schedulesError,
    refetch,
  } = useRunnerSchedules({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  const {
    bundles,
    isLoading: bundlesLoading,
    error: bundlesError,
  } = useRunnerTestSurfaceBundles({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
    enabled: !!envId && !!token && !!primaryRunner,
  });

  const {
    testSurfaces,
    isLoading: surfacesLoading,
    error: surfacesError,
  } = useEnvironmentTestSurfaces({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: numericEnvId,
    token,
    enabled: !!envId && !!token,
  });

  const {
    testElements,
    isLoading: elementsLoading,
    error: elementsError,
  } = useEnvironmentTestElements({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    envId: numericEnvId,
    token,
    enabled: !!envId && !!token,
  });

  const {
    createTestSchedule,
    isCreating,
    error: createError,
    reset,
  } = useCreateTestSchedule({
    networkClient,
    baseUrl: CONSTANTS.API_URL,
    runnerId: primaryRunner?.id ?? 0,
    token,
  });

  const pageError =
    contextError ||
    schedulesError ||
    bundlesError ||
    surfacesError ||
    elementsError ||
    createError ||
    null;
  const isLoading =
    contextLoading || schedulesLoading || bundlesLoading || surfacesLoading || elementsLoading;

  const selectedTargetId = useMemo(() => {
    if (targetKind === 'bundle') return selectedBundleId;
    if (targetKind === 'surface') return selectedSurfaceId;
    return selectedElementId;
  }, [selectedBundleId, selectedElementId, selectedSurfaceId, targetKind]);

  const canCreate = useMemo(() => {
    if (!title.trim()) return false;
    if (!selectedTargetId) return false;
    if (!timeOfDay.trim() || !timezone.trim()) return false;
    if (recurrenceType === 'weekly' && !dayOfWeek) return false;
    return true;
  }, [dayOfWeek, recurrenceType, selectedTargetId, timeOfDay, timezone, title]);

  const resetForm = () => {
    setTitle('');
    setTargetKind('bundle');
    setSelectedBundleId('');
    setSelectedSurfaceId('');
    setSelectedElementId('');
    setRecurrenceType('daily');
    setTimeOfDay('09:00');
    setDayOfWeek('1');
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSizeClass('desktop');
    setDiscovery(true);
    reset();
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!canCreate || !primaryRunner) return;

    const payload: CreateTestScheduleRequest = {
      runnerId: primaryRunner.id,
      title: title.trim(),
      recurrenceType,
      timeOfDay,
      timezone: timezone.trim(),
      sizeClass,
      discovery,
      ...(targetKind === 'bundle' ? { testSurfaceBundleId: Number(selectedBundleId) } : {}),
      ...(targetKind === 'surface' ? { testSurfaceId: Number(selectedSurfaceId) } : {}),
      ...(targetKind === 'element' ? { testElementId: Number(selectedElementId) } : {}),
      ...(recurrenceType === 'weekly' ? { dayOfWeek: Number(dayOfWeek) } : {}),
    };

    await createTestSchedule(payload);
    await refetch();
    closeForm();
  };

  if (pageError) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600 dark:text-red-400 py-8">Error: {pageError}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SEOHead title="Schedules" description="" noIndex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedules</h1>
        <button
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Schedule'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Production navigation smoke"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target type
              </label>
              <select
                value={targetKind}
                onChange={e => setTargetKind(e.target.value as TargetKind)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="bundle">Bundle</option>
                <option value="surface">Surface</option>
                <option value="element">Element</option>
              </select>
            </div>
          </div>

          {targetKind === 'bundle' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bundle
              </label>
              <select
                value={selectedBundleId}
                onChange={e => setSelectedBundleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Select a bundle</option>
                {bundles.map(bundle => (
                  <option key={bundle.id} value={bundle.id}>
                    #{bundle.id} {bundle.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetKind === 'surface' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Surface
              </label>
              <select
                value={selectedSurfaceId}
                onChange={e => setSelectedSurfaceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Select a surface</option>
                {testSurfaces.map(surface => (
                  <option key={surface.id} value={surface.id}>
                    #{surface.id} {surface.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetKind === 'element' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Element
              </label>
              <select
                value={selectedElementId}
                onChange={e => setSelectedElementId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Select a test element</option>
                {testElements.map(element => (
                  <option key={element.id} value={element.id}>
                    #{element.id} {element.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recurrence
              </label>
              <select
                value={recurrenceType}
                onChange={e =>
                  setRecurrenceType(e.target.value as CreateTestScheduleRequest['recurrenceType'])
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                {RECURRENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>

            {recurrenceType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day
                </label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {DAY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Device
              </label>
              <select
                value={sizeClass}
                onChange={e =>
                  setSizeClass(e.target.value as CreateTestScheduleRequest['sizeClass'])
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={discovery}
              onChange={e => setDiscovery(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Run in discovery mode
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={!canCreate || isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Schedule'}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              This only creates the schedule object. Worker launch is not wired here.
            </span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          Loading schedules...
        </div>
      )}

      {!isLoading && schedules.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No schedules yet
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Create a schedule to store a recurring run definition for a bundle, surface, or test
            element.
          </p>
        </div>
      )}

      {!isLoading && schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {schedule.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {describeScheduleTarget(schedule)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {describeRecurrence(schedule)} · {schedule.timezone}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
                  <StatusBadge status={schedule.enabled ? 'enabled' : 'disabled'} />
                  <StatusBadge status={schedule.sizeClass} />
                  {schedule.discovery && <StatusBadge status="discovery" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
