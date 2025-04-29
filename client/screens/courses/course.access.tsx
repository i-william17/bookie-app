import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useRef } from "react";
import {
  useFonts,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import Loader from "@/components/loader/loader";
import { Video, ResizeMode } from 'expo-av';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-notifications';

const SERVER_URI = 'https://your-api-server.com'; // Replace with your actual server URI
const DEFAULT_AVATAR_URL = 'https://example.com/default-avatar.jpg'; // Replace with your default avatar

interface Lesson {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoLength: number;
  videoSection: string;
  links: Array<{
    title: string;
    url: string;
    _id: string;
  }>;
  questions: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      avatar?: string;
    };
    question: string;
    questionReplies: any[];
    createdAt: Date;
  }>;
}

interface Review {
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: Date;
}

interface CoursesType {
  _id: string;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: Array<{ title: string; _id: string }>;
  prerequisites: Array<{ title: string; _id: string }>;
  courseData: Lesson[];
  ratings: number;
  purchased: number;
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface QuestionReply {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  answer: string;
  createdAt: Date;
}

const VideoPlayer = ({ 
  videoUrl, 
  videoTitle,
  videoDescription,
  thumbnailUrl,
  autoPlay = false,
  showControls = true,
  onPlay,
  onPause,
  onEnd,
  onError,
  style,
}: {
  videoUrl: string;
  videoTitle: string;
  videoDescription?: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  style?: any;
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [controlsVisible, setControlsVisible] = useState(showControls);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlaying && controlsVisible) {
        setControlsVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [controlsVisible, isPlaying]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
      onPause?.();
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
      onPlay?.();
    }
    setControlsVisible(true);
  };

  const handleVideoTap = () => {
    setControlsVisible(!controlsVisible);
  };

  const handleSeek = (value: number) => {
    videoRef.current?.setPositionAsync(value);
  };

  return (
    <View style={[styles.videoContainer, style]}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={handleVideoTap}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          shouldPlay={autoPlay}
          usePoster={!!thumbnailUrl}
          posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          posterStyle={styles.poster}
          onPlaybackStatusUpdate={(status) => {
            setStatus(status);
            if (status.isLoaded && status.didJustFinish) {
              onEnd?.();
            }
          }}
          onLoadStart={() => setIsLoading(true)}
          onReadyForDisplay={() => setIsLoading(false)}
          onError={(error) => {
            console.error("Video Error:", error);
            setIsLoading(false);
            onError?.(error);
          }}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2467EC" />
          </View>
        )}

        {controlsVisible && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topBar}>
              <Text style={styles.title} numberOfLines={1}>
                {videoTitle}
              </Text>
              {videoDescription && (
                <Text style={styles.description} numberOfLines={2}>
                  {videoDescription}
                </Text>
              )}
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity onPress={togglePlayPause}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>
                {formatTime(status?.positionMillis || 0)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={status?.durationMillis || 1}
                value={status?.positionMillis || 0}
                minimumTrackTintColor="#2467EC"
                maximumTrackTintColor="#FFFFFF"
                thumbTintColor="#2467EC"
                onSlidingComplete={handleSeek}
              />
              <Text style={styles.timeText}>
                {formatTime(status?.durationMillis || 0)}
              </Text>
            </View>
          </View>
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
};

const formatTime = (millis: number) => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const sanitizeMongoData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeMongoData(item));
  } else if (data !== null && typeof data === 'object') {
    if (data.$oid) return data.$oid;
    if (data.$numberInt) return parseInt(data.$numberInt);
    if (data.$numberLong) return parseInt(data.$numberLong);
    if (data.$date) return new Date(data.$date.$numberLong);

    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeMongoData(data[key]);
    }
    return sanitized;
  }
  return data;
};

const QuestionItem = ({ 
  question, 
  courseId,
  contentId,
  onReplyAdded 
}: { 
  question: any; 
  courseId: string;
  contentId: string;
  onReplyAdded: () => void;
}) => {
  const [reply, setReply] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUserData = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    getUserData();
  }, []);

  const handleAddReply = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      await axios.put(
        `${SERVER_URI}/add-answer`,
        {
          answer: reply,
          courseId,
          contentId,
          questionId: question._id,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      setReply('');
      setShowReplyInput(false);
      onReplyAdded();
      Toast.show("Reply added successfully!", { placement: "bottom" });
    } catch (error) {
      console.error("Reply submission error:", error);
      Toast.show("Failed to add reply", { type: "danger", placement: "bottom" });
    }
  };

  return (
    <View style={styles.questionItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={{ uri: question.user.avatar || DEFAULT_AVATAR_URL }}
          style={styles.avatar}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.questionerName}>{question.user.name}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
          <Text style={styles.questionDate}>
            {new Date(question.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Replies */}
      {question.questionReplies?.length > 0 && (
        <View style={styles.repliesContainer}>
          {question.questionReplies.map((reply: any, index: number) => (
            <View key={index} style={styles.replyItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={{ uri: reply.user.avatar || DEFAULT_AVATAR_URL }}
                  style={[styles.avatar, { width: 30, height: 30 }]}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.replierName}>{reply.user.name}</Text>
                  <Text style={styles.replyText}>{reply.answer}</Text>
                  <Text style={styles.replyDate}>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Reply input */}
      {user && (
        <TouchableOpacity 
          onPress={() => setShowReplyInput(!showReplyInput)}
          style={styles.replyButton}
        >
          <Text style={styles.replyButtonText}>
            {showReplyInput ? 'Cancel' : 'Reply'}
          </Text>
        </TouchableOpacity>
      )}

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            placeholder="Write your reply..."
            value={reply}
            onChangeText={setReply}
            multiline
            style={styles.replyInput}
          />
          <TouchableOpacity
            style={[
              styles.submitReplyButton,
              !reply.trim() && styles.submitButtonDisabled
            ]}
            onPress={handleAddReply}
            disabled={!reply.trim()}
          >
            <Text style={styles.submitButtonText}>Submit Reply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function CourseAccessScreen() {
  const { courseData } = useLocalSearchParams();
  const [currentCourse, setCurrentCourse] = useState<CoursesType | null>(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [parseError, setParseError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'qa' | 'reviews'>('content');
  const [rating, setRating] = useState(1);
  const [review, setReview] = useState('');
  const [question, setQuestion] = useState('');
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (courseData) {
          const parsedData = JSON.parse(decodeURIComponent(courseData as string));
          const sanitizedData = sanitizeMongoData(parsedData);
          setCurrentCourse(sanitizedData);
          
          if (user && sanitizedData?.reviews) {
            const hasReviewed = sanitizedData.reviews.some(
              (r: Review) => r.user._id === user._id
            );
            setReviewAvailable(hasReviewed);
          }
        }
      } catch (error) {
        console.error("Failed to parse course data:", error);
        setParseError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [courseData, user, refreshing]);

  const refreshData = () => {
    setRefreshing(true);
  };

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  const handleReviewSubmit = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      const response = await axios.put(
        `${SERVER_URI}/add-review/${currentCourse?._id}`,
        {
          review,
          rating,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      setCurrentCourse(prev => ({
        ...prev!,
        reviews: [
          ...prev!.reviews,
          {
            user: {
              _id: user?._id,
              name: user?.name,
              avatar: user?.avatar,
            },
            rating,
            comment: review,
            createdAt: new Date(),
          },
        ],
      }));

      setRating(1);
      setReview('');
      setReviewAvailable(true);
      Toast.show("Review submitted successfully!", { placement: "bottom" });
    } catch (error) {
      console.error("Review submission error:", error);
      Toast.show("Failed to submit review", { type: "danger", placement: "bottom" });
    }
  };

  const handleQuestionSubmit = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      await axios.put(
        `${SERVER_URI}/add-question`,
        {
          question,
          courseId: currentCourse?._id,
          contentId: currentCourse?.courseData[activeLesson]._id,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      setQuestion('');
      refreshData();
      Toast.show("Question submitted successfully!", { placement: "bottom" });
    } catch (error) {
      console.error("Question submission error:", error);
      Toast.show("Failed to submit question", { type: "danger", placement: "bottom" });
    }
  };

  const renderStars = () => {
    return Array(5).fill(0).map((_, i) => (
      <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
        <FontAwesome
          name={i < rating ? "star" : "star-o"}
          size={25}
          color="#FF8D07"
          style={{ marginHorizontal: 4 }}
        />
      </TouchableOpacity>
    ));
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    return <Loader />;
  }

  if (parseError || !currentCourse) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Invalid course data. Please go back.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "blue", marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentVideo = currentCourse.courseData[activeLesson];
  const videoUrl = currentVideo.videoUrl || currentCourse.demoUrl;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#E5ECF9", "#F6F7F9"]}
        style={{ flex: 1, paddingTop: 15 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                position: "absolute",
                zIndex: 1,
                left: 0,
                top: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "Raleway_700Bold",
                marginBottom: 10,
              }}
            >
              {currentCourse.name}
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 15, marginHorizontal: 16 }}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'content' && styles.activeTabButton
              ]}
              onPress={() => setActiveTab('content')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'content' && styles.activeTabText
              ]}>
                Content
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'qa' && styles.activeTabButton
              ]}
              onPress={() => setActiveTab('qa')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'qa' && styles.activeTabText
              ]}>
                Q&A ({currentVideo?.questions?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'reviews' && styles.activeTabButton
              ]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'reviews' && styles.activeTabText
              ]}>
                Reviews ({currentCourse?.reviews?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'content' ? (
            <>
              <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                {videoUrl ? (
                  <VideoPlayer
                    videoUrl={videoUrl}
                    videoTitle={currentVideo.title}
                    videoDescription={currentVideo.description}
                    thumbnailUrl={currentCourse.thumbnail.url}
                    onPlay={() => console.log('Video started playing')}
                    onPause={() => console.log('Video paused')}
                    onEnd={() => console.log('Video ended')}
                    onError={(error) => Alert.alert('Playback Error', error.message)}
                  />
                ) : (
                  <Image
                    source={{ uri: currentCourse.thumbnail.url }}
                    style={styles.videoContainer}
                    resizeMode="cover"
                  />
                )}
              </View>

              <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Raleway_700Bold",
                    marginBottom: 10,
                  }}
                >
                  {currentVideo.title}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Nunito_500Medium",
                    color: "#525258",
                  }}
                >
                  {currentVideo.description}
                </Text>
              </View>

              <View style={{ marginHorizontal: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "Raleway_700Bold",
                    marginBottom: 15,
                  }}
                >
                  Course Content
                </Text>
                {currentCourse.courseData.map((lesson: Lesson, index: number) => (
                  <TouchableOpacity
                    key={lesson._id}
                    style={[
                      styles.lessonItem,
                      index === activeLesson && styles.activeLessonItem
                    ]}
                    onPress={() => setActiveLesson(index)}
                  >
                    <FontAwesome
                      name={index === activeLesson ? "play-circle" : "circle-o"}
                      size={20}
                      color={index === activeLesson ? "#2467EC" : "#808080"}
                    />
                    <Text
                      style={[
                        styles.lessonTitle,
                        index === activeLesson && styles.activeLessonTitle
                      ]}
                    >
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDuration}>
                      {lesson.videoLength} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    activeLesson === 0 && styles.disabledNavButton
                  ]}
                  disabled={activeLesson === 0}
                  onPress={() => setActiveLesson(activeLesson - 1)}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      activeLesson === 0 && styles.disabledNavButtonText
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    activeLesson === currentCourse.courseData.length - 1 && styles.disabledNavButton
                  ]}
                  disabled={activeLesson === currentCourse.courseData.length - 1}
                  onPress={() => setActiveLesson(activeLesson + 1)}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      activeLesson === currentCourse.courseData.length - 1 && styles.disabledNavButtonText
                    ]}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : activeTab === 'qa' ? (
            <View style={{ marginHorizontal: 16, marginTop: 15 }}>
              {user && (
                <View style={styles.questionForm}>
                  <Text style={styles.sectionTitle}>Ask a Question</Text>
                  <TextInput
                    placeholder="What would you like to ask?"
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    style={styles.questionInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !question.trim() && styles.submitButtonDisabled
                    ]}
                    onPress={handleQuestionSubmit}
                    disabled={!question.trim()}
                  >
                    <Text style={styles.submitButtonText}>Submit Question</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionTitle}>
                Questions ({currentVideo?.questions?.length || 0})
              </Text>

              {currentVideo?.questions?.length ? (
                currentVideo.questions.map((item, index) => (
                  <QuestionItem
                    key={index}
                    question={item}
                    courseId={currentCourse._id}
                    contentId={currentVideo._id}
                    onReplyAdded={refreshData}
                  />
                ))
              ) : (
                <Text style={styles.noReviewsText}>No questions yet</Text>
              )}
            </View>
          ) : (
            <View style={{ marginHorizontal: 16, marginTop: 15 }}>
              {!reviewAvailable && user && (
                <View style={styles.reviewForm}>
                  <Text style={styles.sectionTitle}>Add Your Review</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
                    <Text style={{ marginRight: 10 }}>Rating:</Text>
                    {renderStars()}
                  </View>
                  <TextInput
                    placeholder="Write your review..."
                    value={review}
                    onChangeText={setReview}
                    multiline
                    style={styles.reviewInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !review.trim() && styles.submitButtonDisabled
                    ]}
                    onPress={handleReviewSubmit}
                    disabled={!review.trim()}
                  >
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionTitle}>
                All Reviews ({currentCourse?.reviews?.length || 0})
              </Text>

              {currentCourse?.reviews?.length ? (
                currentCourse.reviews.map((item, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image
                        source={{ uri: item.user.avatar || DEFAULT_AVATAR_URL }}
                        style={styles.avatar}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.reviewerName}>{item.user.name}</Text>
                        <View style={{ flexDirection: "row", marginTop: 2 }}>
                          {Array(5).fill(0).map((_, i) => (
                            <FontAwesome
                              key={i}
                              name={i < item.rating ? "star" : "star-o"}
                              size={14}
                              color="#FF8D07"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{item.comment}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noReviewsText}>No reviews yet</Text>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: "black",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    aspectRatio: 16 / 9,
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  poster: {
    resizeMode: 'cover',
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
  controlsOverlay: {
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
  description: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
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
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E9F8",
  },
  activeLessonItem: {
    backgroundColor: "#F0F5FF",
  },
  lessonTitle: {
    marginLeft: 10,
    fontFamily: "Nunito_600SemiBold",
    color: "#000",
    flex: 1,
  },
  activeLessonTitle: {
    color: "#2467EC",
  },
  lessonDuration: {
    fontFamily: "Nunito_500Medium",
    color: "#808080",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  navButton: {
    backgroundColor: "#2467EC",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledNavButton: {
    backgroundColor: "#E1E9F8",
  },
  navButtonText: {
    color: "white",
    fontFamily: "Nunito_600SemiBold",
  },
  disabledNavButtonText: {
    color: "#808080",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#2467EC',
  },
  tabText: {
    fontFamily: 'Nunito_600SemiBold',
    color: '#808080',
    fontSize: 14,
  },
  activeTabText: {
    color: '#2467EC',
  },
  reviewForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  questionForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Raleway_700Bold',
    marginBottom: 15,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E1E9F8',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#E1E9F8',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2467EC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_600SemiBold',
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  questionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E9F8',
  },
  reviewerName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
  questionerName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  replierName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  reviewText: {
    marginTop: 10,
    fontFamily: 'Nunito_400Regular',
    color: '#525258',
  },
  questionText: {
    marginTop: 5,
    fontFamily: 'Nunito_400Regular',
    color: '#525258',
  },
  replyText: {
    marginTop: 3,
    fontFamily: 'Nunito_400Regular',
    color: '#525258',
    fontSize: 12,
  },
  reviewDate: {
    marginTop: 5,
    fontSize: 12,
    color: '#808080',
    alignSelf: 'flex-end',
  },
  questionDate: {
    marginTop: 5,
    fontSize: 11,
    color: '#808080',
  },
  replyDate: {
    marginTop: 2,
    fontSize: 10,
    color: '#808080',
  },
  noReviewsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#808080',
  },
  repliesContainer: {
    marginTop: 10,
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E1E9F8',
    paddingLeft: 10,
  },
  replyItem: {
    marginTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  replyButton: {
    marginTop: 10,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  replyButtonText: {
    color: '#2467EC',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#E1E9F8',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  submitReplyButton: {
    backgroundColor: '#2467EC',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
});