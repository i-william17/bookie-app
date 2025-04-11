import { StyleSheet, Text, View, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useFonts, Raleway_700Bold, Raleway_400Regular } from '@expo-google-fonts/raleway';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export default function OnBoardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade-in animation
  const slideAnim = useRef(new Animated.Value(100)).current; // For slide-up animation
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // For scale animation

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Raleway_400Regular,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Slide-up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LinearGradient
        colors={["#E5ECF9", "#F6F7F9"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <View style={styles.firstContainer}>
          {/* Logo and Hero Image with Overlapping Layout */}
          <Animated.View style={[styles.heroContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={["rgba(229, 236, 249, 0.6)", "transparent"]}
              style={styles.gradientOverlay}
            />
            <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
            <Image
              source={require("@/assets/images/image1.png")}
              style={styles.heroImage}
            />
            <Image
              source={require("@/assets/images/image2.png")}
              style={styles.floatingShape1}
            />
            <Image
              source={require("@/assets/images/image3.png")}
              style={styles.floatingShape2}
            />
          </Animated.View>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleWrapper,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.titleText, { fontFamily: "Raleway_700Bold" }]}>
              This is Bookie
            </Text>
          </Animated.View>

          {/* Description Section */}
          <Animated.View
            style={[
              styles.dscpWrapper,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.dscpText, { fontFamily: "Nunito_400Regular" }]}>
              Explore a variety of interactive lessons,
            </Text>
            <Text style={[styles.dscpText, { fontFamily: "Nunito_400Regular" }]}>
              videos, quizzes & assignments.
            </Text>
          </Animated.View>

          {/* Button Section */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={() => router.push("/(routes)/welcome-intro")}
            >
              <LinearGradient
                colors={["#4A90E2", "#6BB9F0"]}
                style={styles.buttonGradient}
              >
                <Text style={[styles.buttonText, { fontFamily: "Nunito_700Bold" }]}>
                  Get Started
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  firstContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  heroContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    position: "absolute",
    top: -60,
    zIndex: 2,
  },
  heroImage: {
    width: 300,
    height: 200,
    resizeMode: "contain",
    zIndex: 1,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  floatingShape1: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    position: "absolute",
    top: -30,
    left: -30,
    zIndex: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  floatingShape2: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    position: "absolute",
    bottom: -30,
    right: -30,
    zIndex: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  titleWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 32,
    color: "#2E3A59",
    textAlign: "center",
    marginVertical: 10,
    letterSpacing: 1,
  },
  dscpWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  dscpText: {
    fontSize: 16,
    color: "#6C7A92",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonWrapper: {
    width: "80%",
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
  },
});