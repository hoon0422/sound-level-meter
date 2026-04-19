import { CALIBRATION_PEAK_DBFS } from "@/audio/engine";
import { SPECTRUM_BANDS } from "@/audio/spectrum";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const BAR_HEIGHT = 180;
const MIN_DB = 10;
const MAX_DB = 90;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_GRID_LINES = [20, 40, 60, 80];

type SpectrumBarsProps = {
  bars: number[];
};

function dbToY(db: number) {
  return ((db - MIN_DB) / DB_RANGE) * BAR_HEIGHT;
}

function calibrate(dbfs: number) {
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function dbToHeight(db: number) {
  return Math.max(2, ((Math.max(db, MIN_DB) - MIN_DB) / DB_RANGE) * BAR_HEIGHT);
}

function meterColorDb(db: number) {
  if (db < 40) return "#4caf50";
  if (db < 70) return "#ff9800";
  return "#f44336";
}

export const SpectrumBars = memo(function SpectrumBars({
  bars,
}: SpectrumBarsProps) {
  return (
    <View style={styles.spectrumContainer}>
      <View style={styles.spectrumChart}>
        <View style={styles.dbAxis}>
          {DB_GRID_LINES.map(db => (
            <Text key={db} style={[styles.dbLabel, { bottom: dbToY(db) - 6 }]}>
              {db}
            </Text>
          ))}
        </View>

        <View style={styles.chartArea}>
          {DB_GRID_LINES.map(db => (
            <View key={db} style={[styles.gridLine, { bottom: dbToY(db) }]} />
          ))}

          <View style={styles.barsRow}>
            {bars.map((rawDbfs, index) => {
              const db = calibrate(rawDbfs);
              return (
                <View
                  key={SPECTRUM_BANDS[index]?.label ?? String(index)}
                  style={[
                    styles.bar,
                    {
                      height: dbToHeight(db),
                      backgroundColor: meterColorDb(db),
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.freqLabelsRow}>
        <View style={styles.dbAxisSpacer} />
        <View style={styles.freqLabelsInner}>
          {SPECTRUM_BANDS.map(band => (
            <Text key={band.label} style={styles.freqLabel}>
              {band.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  spectrumContainer: {
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  spectrumChart: {
    flexDirection: "row",
    width: "100%",
  },
  dbAxis: {
    width: 30,
    height: BAR_HEIGHT,
    position: "relative",
  },
  dbAxisSpacer: {
    width: 30,
  },
  dbLabel: {
    position: "absolute",
    right: 4,
    fontSize: 9,
    color: "#999",
  },
  chartArea: {
    flex: 1,
    height: BAR_HEIGHT,
    position: "relative",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  barsRow: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
  freqLabelsRow: {
    flexDirection: "row",
    width: "100%",
  },
  freqLabelsInner: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  freqLabel: {
    flex: 1,
    fontSize: 9,
    color: "#999",
    textAlign: "center",
  },
});
