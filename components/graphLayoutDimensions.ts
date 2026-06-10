import { useWindowDimensions } from 'react-native';

export const GRAPH_LAYOUT_PADDING_LEFT = 20;
export const GRAPH_LAYOUT_PADDING_RIGHT = 16;
export const GRAPH_LAYOUT_COLUMN_GAP = 10;
export const GRAPH_LAYOUT_ROCKET_WIDTH = 24;

export function getGraphSurfaceWidth(screenWidth: number) {
  return Math.max(
    0,
    screenWidth -
      GRAPH_LAYOUT_PADDING_LEFT -
      GRAPH_LAYOUT_PADDING_RIGHT -
      GRAPH_LAYOUT_COLUMN_GAP -
      GRAPH_LAYOUT_ROCKET_WIDTH
  );
}

export function useGraphSurfaceWidth() {
  const { width } = useWindowDimensions();
  return getGraphSurfaceWidth(width);
}
