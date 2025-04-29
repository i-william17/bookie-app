import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/typography/text";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { formatTime } from "@/utils/formattime"; // Utility function we'll create

interface ControlsOverlayProps {
  status: any;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onFullscreen: () => void;
  videoTitle: string;
}

export default function ControlsOverlay({
  status,
  isPlaying,
  onTogglePlay,
  onFullscreen,
  videoTitle,
}: ControlsOverlayProps) {
  return (
    <View style={styles.overlay}>
      {/* Top Bar - Video Title */}
      <View style={styles.topBar}>
        <Text style={styles.title} numberOfLines={1}>
          {videoTitle}
        </Text>
      </View>

      {/* Center Controls */}
      <View style={styles.centerControls}>
        <TouchableOpacity onPress={onTogglePlay}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={32}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Bar - Progress and Fullscreen */}
      <View style={styles.bottomBar}>
        <Text style={styles.timeText}>
          {formatTime(status.positionMillis || 0)}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.durationMillis || 1}
          value={status.positionMillis || 0}
          minimumTrackTintColor="#2467EC"
          maximumTrackTintColor="#FFFFFF"
          thumbTintColor="#2467EC"
          onSlidingComplete={async (value) => {
            await videoRef.current?.setPositionAsync(value);
          }}
        />
        <Text style={styles.timeText}>
          {formatTime(status.durationMillis || 0)}
        </Text>
        <TouchableOpacity onPress={onFullscreen}>
          <Ionicons
            name="expand-outline"
            size={24}
            color="white"
            style={styles.fullscreenButton}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  centerControls: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    minWidth: 40,
    textAlign: "center",
  },
  fullscreenButton: {
    marginLeft: 10,
  },
});