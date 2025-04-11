import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  AntDesign,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { SERVER_URI } from "@/utils/uri";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, loading, setRefetch } = useUser();
  const [image, setImage] = useState<any>(null);
  const [loader, setLoader] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const logoutHandler = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    router.replace("/(routes)/login");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setLoader(true);
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const base64Image = `data:image/jpeg;base64,${base64}`;
        setImage(base64Image);

        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        const response = await axios.put(
          `${SERVER_URI}/update-user-avatar`,
          { avatar: base64Image },
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        
        if (response.data) {
          setRefetch(true);
        }
      } catch (error) {
        console.error("Error updating avatar:", error);
      } finally {
        setLoader(false);
      }
    }
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, IconComponent }: any) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.profileItemContent}>
        <View style={styles.iconContainer}>
          <IconComponent
            style={styles.icon}
            name={icon}
            size={24}
            color="#2467EC"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <AntDesign name="right" size={24} color="#CBD5E0" />
    </TouchableOpacity>
  );

  if (loader || loading) {
    return <Loader />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={["#F6F7F9", "#E5ECF9"]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: image || user?.avatar?.url || "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={20} color="#2467EC" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            {user?.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <ProfileItem
              icon="user-o"
              title="Profile Details"
              subtitle="Update your personal information"
              IconComponent={FontAwesome}
              onPress={() => router.push("/(routes)/profile-details")}
            />
            
            <ProfileItem
              icon="book-account-outline"
              title="Enrolled Courses"
              subtitle="View your learning progress"
              IconComponent={MaterialCommunityIcons}
              onPress={() => router.push("/(routes)/enrolled-courses")}
            />
            
            <ProfileItem
              icon="log-out-outline"
              title="Log Out"
              subtitle="Sign out of your account"
              IconComponent={Ionicons}
              onPress={logoutHandler}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: hp('8%'),
  },
  scrollContainer: {
    paddingBottom: hp('4%'),
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  avatar: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    borderWidth: 3,
    borderColor: '#2467EC20',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: wp('6%'),
    fontFamily: 'Raleway_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('0.5%'),
  },
  userEmail: {
    fontSize: wp('4%'),
    fontFamily: 'Nunito_400Regular',
    color: '#7C7C80',
  },
  section: {
    marginHorizontal: wp('5%'),
    marginTop: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontFamily: 'Raleway_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('3%'),
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: hp('2%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#2467EC10',
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: wp('4.2%'),
    fontFamily: 'Nunito_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('0.5%'),
  },
  itemSubtitle: {
    fontSize: wp('3.5%'),
    fontFamily: 'Nunito_400Regular',
    color: '#7C7C80',
  },
});