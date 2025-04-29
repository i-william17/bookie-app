import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import Video  from "expo-video";
import { useState, useRef, useEffect } from "react";
import ControlsOverlay from "./controlsoverlay"; // We'll create this next
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Text } from "@/components/typography/text";

interface VideoPlayerProps {
  videoUrl: string;
  videoTitle: string;
}

const { width } = Dimensions.get("window");

export default function VideoPlayer({ videoUrl, videoTitle }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => {
      if (isPlaying && showControls) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleVideoTap = () => {
    setShowControls(!showControls);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowControls(true);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoContainer}
        onPress={handleVideoTap}
      >
        <Video
          ref={videoRef}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          source={{ uri: videoUrl }}
          resizeMode="contain"
          isLooping={false}
          onPlaybackStatusUpdate={setStatus}
          onLoadStart={handleLoadStart}
          onReadyForDisplay={handleLoad}
          shouldPlay={false}
          useNativeControls={false}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2467EC" />
          </View>
        )}

        {showControls && (
          <ControlsOverlay
            status={status}
            isPlaying={isPlaying}
            onTogglePlay={togglePlayPause}
            onFullscreen={handleFullscreen}
            videoTitle={videoTitle}
          />
        )}

        {!isPlaying && !isLoading && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={48} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  fullscreenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 100,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 50,
    padding: 8,
  },
});