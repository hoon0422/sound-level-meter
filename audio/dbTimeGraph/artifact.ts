import { DB_TIME_GRAPH_DB_MAX, DB_TIME_GRAPH_DB_MIN } from './constants';
import type { DbTimeGraphArtifact, DbTimeGraphPoint, DbTimeGraphSample } from './types';

export const DB_TIME_GRAPH_CONTAINER_HEIGHT = 180;
export const DB_TIME_GRAPH_CONTAINER_VERTICAL_PADDING = 8;
export const DB_TIME_GRAPH_CONTAINER_HORIZONTAL_PADDING = 8;
export const DB_TIME_GRAPH_CONTAINER_RIGHT_PADDING = 24;
export const DB_TIME_GRAPH_CONTAINER_WIDTH = 320;
export const DB_TIME_GRAPH_INNER_HEIGHT = 110;
export const DB_TIME_GRAPH_CHART_TOP_INSET = 10;
export const DB_TIME_GRAPH_CHART_HEIGHT = DB_TIME_GRAPH_INNER_HEIGHT + DB_TIME_GRAPH_CHART_TOP_INSET;
export const DB_TIME_GRAPH_X_AXIS_HEIGHT = 20;
export const DB_TIME_GRAPH_Y_AXIS_WIDTH = 28;
export const DB_TIME_GRAPH_CHART_RIGHT_INSET = 10;
export const DB_TIME_GRAPH_CHART_WIDTH =
  DB_TIME_GRAPH_CONTAINER_WIDTH -
  DB_TIME_GRAPH_Y_AXIS_WIDTH -
  DB_TIME_GRAPH_CONTAINER_HORIZONTAL_PADDING -
  DB_TIME_GRAPH_CONTAINER_RIGHT_PADDING;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function dbTimeGraphDbToY(db: number) {
  const clampedDb = clamp(db, DB_TIME_GRAPH_DB_MIN, DB_TIME_GRAPH_DB_MAX);
  return (
    DB_TIME_GRAPH_CHART_TOP_INSET +
    DB_TIME_GRAPH_INNER_HEIGHT -
    ((clampedDb - DB_TIME_GRAPH_DB_MIN) / (DB_TIME_GRAPH_DB_MAX - DB_TIME_GRAPH_DB_MIN)) *
      DB_TIME_GRAPH_INNER_HEIGHT
  );
}

export function dbTimeGraphDbToTop(db: number) {
  return (
    DB_TIME_GRAPH_CHART_TOP_INSET +
    ((DB_TIME_GRAPH_DB_MAX - db) / (DB_TIME_GRAPH_DB_MAX - DB_TIME_GRAPH_DB_MIN)) *
      DB_TIME_GRAPH_INNER_HEIGHT
  );
}

function toChartPoint(
  sample: DbTimeGraphSample,
  windowStartSeconds: number,
  windowEndSeconds: number
): DbTimeGraphPoint {
  const durationSeconds = Math.max(windowEndSeconds - windowStartSeconds, 1);
  return {
    x:
      ((sample.sessionElapsedSeconds - windowStartSeconds) / durationSeconds) *
      (DB_TIME_GRAPH_CHART_WIDTH - DB_TIME_GRAPH_CHART_RIGHT_INSET),
    y: dbTimeGraphDbToY(sample.db),
  };
}

export function createDbTimeGraphArtifact(
  samples: readonly DbTimeGraphSample[],
  windowStartSeconds: number,
  windowEndSeconds: number
): DbTimeGraphArtifact {
  let chartStartSeconds = windowStartSeconds;
  let currentPoint: DbTimeGraphPoint | null = null;
  let hasPoint = false;
  let path = '';

  if (windowStartSeconds === 0) {
    const firstDrawableSample = samples.find(
      sample =>
        !sample.isInitial &&
        sample.sessionElapsedSeconds >= windowStartSeconds &&
        sample.sessionElapsedSeconds <= windowEndSeconds
    );
    chartStartSeconds = firstDrawableSample?.sessionElapsedSeconds ?? windowStartSeconds;
  }

  for (const sample of samples) {
    if (
      sample.isInitial ||
      sample.sessionElapsedSeconds < windowStartSeconds ||
      sample.sessionElapsedSeconds > windowEndSeconds
    ) {
      continue;
    }

    const point = toChartPoint(sample, chartStartSeconds, windowEndSeconds);
    path += `${hasPoint ? ' L' : 'M'}${point.x} ${point.y}`;
    hasPoint = true;
    currentPoint = point;
  }

  return {
    path,
    currentPoint,
  };
}
