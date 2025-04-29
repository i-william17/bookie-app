import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import useUser from "@/hooks/auth/useUser";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { MaterialIcons, Feather, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRef, useState, useEffect } from "react";
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useToast } from "react-native-toast-notifications";

export default function ProfileDetailsScreen() {
  const { user } = useUser();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [isExpanded, setIsExpanded] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    toast.show("Copied to clipboard!", {
      type: "success",
      placement: "bottom",
      duration: 2000,
      animationType: "zoom-in",
    });
  };

  const shareProfile = async () => {
    try {
      const message = `Check out ${user?.name}'s profile!\nEmail: ${user?.email}\nRole: ${user?.role}`;
      await Sharing.shareAsync(message);
    } catch (error) {
      toast.show("Error sharing profile", {
        type: "danger",
        placement: "bottom",
        duration: 2000,
      });
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient colors={["#F6F7F9", "#E5ECF9", "#D9E7FF"]} style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerText}>My Profile</Text>
        <TouchableOpacity onPress={shareProfile} style={styles.shareButton}>
          <Feather name="share-2" size={wp('5%')} color="#2467EC" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={[styles.avatarContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            onPress={() => {
              startSpin();
              pulseAnimation();
            }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: spin }, { scale: scaleValue }] }}>
              <Image
                source={{
                  uri: user?.avatar?.url || "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
                }}
                style={styles.avatar}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.verificationBadge}>
            <Ionicons 
              name={user?.isVerified ? "checkmark-circle" : "close-circle"} 
              size={wp('5%')} 
              color={user?.isVerified ? "#4BB543" : "#FF3B30"} 
            />
            <Text style={styles.verificationText}>
              {user?.isVerified ? "Verified Account" : "Not Verified"}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' && (
          <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
            <DetailItem 
              icon="person-outline" 
              label="Full Name" 
              value={user?.name} 
              onPress={() => copyToClipboard(user?.name)} 
            />
            <DetailItem 
              icon="mail-outline" 
              label="Email Address" 
              value={user?.email} 
              onPress={() => copyToClipboard(user?.email)} 
            />
            <DetailItem 
              icon="badge-outline" 
              label="Role" 
              value={user?.role || "User"} 
            />
            <DetailItem 
              icon="verified-outline" 
              label="Verification Status" 
              value={user?.isVerified ? "Verified ✅" : "Not Verified ❌"} 
              valueColor={user?.isVerified ? "#4BB543" : "#FF3B30"}
            />
            
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
              <View style={styles.moreDetailsHeader}>
                <Text style={styles.moreDetailsText}>More Details</Text>
                <MaterialIcons 
                  name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={wp('6%')} 
                  color="#2467EC" 
                />
              </View>
            </TouchableOpacity>
            
            {isExpanded && (
              <Animated.View style={[styles.expandedContent, { opacity: fadeAnim }]}>
                <DetailItem 
                  icon="book-outline" 
                  label="Enrolled Courses" 
                  value={user?.courses?.length || 0} 
                />
                <DetailItem 
                  icon="calendar-today" 
                  label="Member Since" 
                  value={formatDate(user?.createdAt)} 
                />
                <DetailItem 
                  icon="update" 
                  label="Last Updated" 
                  value={formatDate(user?.updatedAt)} 
                />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.activityContainer}>
            <ActivityItem 
              icon="bookmark" 
              title="Saved Courses" 
              count={12} 
              color="#FF9F1C" 
            />
            <ActivityItem 
              icon="check-circle" 
              title="Completed Lessons" 
              count={45} 
              color="#2EC4B6" 
            />
            <ActivityItem 
              icon="clock" 
              title="Hours Learned" 
              count={28} 
              color="#E71D36" 
            />
            <ActivityItem 
              icon="star" 
              title="Achievements" 
              count={5} 
              color="#FFD166" 
            />
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <SettingsItem 
              icon="notifications" 
              title="Notification Settings" 
              onPress={() => {}} 
            />
            <SettingsItem 
              icon="lock" 
              title="Privacy & Security" 
              onPress={() => {}} 
            />
            <SettingsItem 
              icon="credit-card" 
              title="Payment Methods" 
              onPress={() => {}} 
            />
            <SettingsItem 
              icon="help-circle" 
              title="Help & Support" 
              onPress={() => {}} 
            />
            <SettingsItem 
              icon="log-out" 
              title="Logout" 
              isLast 
              onPress={() => {}} 
            />
          </View>
        )}

        <View style={styles.statsContainer}>
          <StatCard 
            icon="calendar" 
            value={formatDate(user?.createdAt, true)} 
            label="Member Since" 
          />
          <StatCard 
            icon="activity" 
            value={`${user?.courses?.length || 0}`} 
            label="Courses" 
          />
          <StatCard 
            icon="clock" 
            value="28h" 
            label="Learned" 
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const DetailItem = ({ 
  icon, 
  label, 
  value, 
  valueColor = "#7C7C80", 
  onPress 
}: { 
  icon: string; 
  label: string; 
  value: any; 
  valueColor?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon} size={wp('5%')} color="#2467EC" />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
      </View>
      {onPress && (
        <View style={styles.copyIcon}>
          <Feather name="copy" size={wp('4%')} color="#2467EC" />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, title, count, color }: { icon: string; title: string; count: number; color: string }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: `${color}20` }]}>
      <Feather name={icon} size={wp('5%')} color={color} />
    </View>
    <View style={styles.activityTextContainer}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityCount}>{count}</Text>
    </View>
    <Feather name="chevron-right" size={wp('5%')} color="#C7C7CC" />
  </View>
);

const SettingsItem = ({ icon, title, isLast = false, onPress }: { icon: string; title: string; isLast?: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}>
      <View style={styles.settingsIcon}>
        <Feather name={icon} size={wp('5%')} color="#2467EC" />
      </View>
      <Text style={styles.settingsTitle}>{title}</Text>
      <Feather name="chevron-right" size={wp('5%')} color="#C7C7CC" />
    </View>
  </TouchableOpacity>
);

const StatCard = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <View style={styles.statCard}>
    <View style={styles.statIcon}>
      <Feather name={icon} size={wp('5%')} color="#2467EC" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const formatDate = (date: any, short = false) => {
  if (!date) return "-";
  const d = new Date(date);
  return short ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
               : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('5%'),
    paddingBottom: hp('2%'),
  },
  headerText: {
    fontSize: wp('6%'),
    fontFamily: 'Raleway_700Bold',
    color: '#1A1A1A',
  },
  shareButton: {
    padding: wp('2%'),
  },
  content: {
    alignItems: 'center',
    paddingBottom: hp('4%'),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  avatar: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    borderWidth: 3,
    borderColor: '#2467EC20',
    marginBottom: hp('2%'),
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
    marginBottom: hp('1%'),
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF90',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: 20,
    marginTop: hp('0.5%'),
  },
  verificationText: {
    fontSize: wp('3.5%'),
    fontFamily: 'Nunito_700Bold',
    marginLeft: wp('1.5%'),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: wp('1%'),
    marginHorizontal: wp('5%'),
    marginBottom: hp('2%'),
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2467EC10',
  },
  tabText: {
    fontSize: wp('4%'),
    fontFamily: 'Nunito_700Bold',
    color: '#7C7C80',
  },
  activeTabText: {
    color: '#2467EC',
  },
  detailsContainer: {
    width: '90%',
    marginBottom: hp('2%'),
  },
  detailItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: hp('2%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  detailIconContainer: {
    marginRight: wp('4%'),
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: wp('3.8%'),
    fontFamily: 'Nunito_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('0.5%'),
  },
  detailValue: {
    fontSize: wp('3.8%'),
    fontFamily: 'Nunito_400Regular',
  },
  copyIcon: {
    marginLeft: wp('2%'),
  },
  moreDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp('1.5%'),
    marginTop: hp('1%'),
  },
  moreDetailsText: {
    fontSize: wp('4%'),
    fontFamily: 'Nunito_700Bold',
    color: '#2467EC',
    marginRight: wp('1%'),
  },
  expandedContent: {
    marginTop: hp('1%'),
  },
  activityContainer: {
    width: '90%',
    marginBottom: hp('2%'),
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: hp('2%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  activityIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: wp('3.8%'),
    fontFamily: 'Nunito_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('0.5%'),
  },
  activityCount: {
    fontSize: wp('3.5%'),
    fontFamily: 'Nunito_400Regular',
    color: '#7C7C80',
  },
  settingsContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: hp('2%'),
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    padding: hp('2%'),
    alignItems: 'center',
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  settingsIcon: {
    marginRight: wp('4%'),
  },
  settingsTitle: {
    flex: 1,
    fontSize: wp('3.8%'),
    fontFamily: 'Nunito_700Bold',
    color: '#1A1A1A',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: hp('1%'),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: hp('2%'),
    marginHorizontal: wp('1%'),
    alignItems: 'center',
    shadowColor: '#2467EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    backgroundColor: '#2467EC10',
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  statValue: {
    fontSize: wp('4.5%'),
    fontFamily: 'Raleway_700Bold',
    color: '#1A1A1A',
    marginBottom: hp('0.5%'),
  },
  statLabel: {
    fontSize: wp('3.2%'),
    fontFamily: 'Nunito_400Regular',
    color: '#7C7C80',
    textAlign: 'center',
  },
});