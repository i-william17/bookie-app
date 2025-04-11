import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import {
  Entypo,
  FontAwesome,
  Fontisto,
  Ionicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Raleway_700Bold,
  Raleway_600SemiBold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import { useState, useEffect, useRef } from "react";
import { commonStyles } from "@/styles/common/common.styles";
import { router } from "expo-router";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { Toast } from "react-native-toast-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [required, setRequired] = useState("");
  const [error, setError] = useState({
    password: "",
  });

  const buttonScale = useRef(new Animated.Value(1)).current;

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handlePasswordValidation = (value: string) => {
    const password = value;
    const passwordSpecialCharacter = /(?=.*[!@#$&*])/;
    const passwordOneNumber = /(?=.*[0-9])/;
    const passwordSixValue = /(?=.{6,})/;

    if (!passwordSpecialCharacter.test(password)) {
      setError({
        ...error,
        password: "Write at least one special character",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordOneNumber.test(password)) {
      setError({
        ...error,
        password: "Write at least one number",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordSixValue.test(password)) {
      setError({
        ...error,
        password: "Write at least 6 characters",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else {
      setError({
        ...error,
        password: "",
      });
      setUserInfo({ ...userInfo, password: value });
    }
  };

  const handleSignIn = async () => {
    setButtonSpinner(true);
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();

    await axios
      .post(`${SERVER_URI}/login`, {
        email: userInfo.email,
        password: userInfo.password,
      },
        {
          headers: { "Content-Type": "application/json" },
        })
      .then(async (res) => {
        await AsyncStorage.setItem("access_token", res.data.accessToken);
        await AsyncStorage.setItem("refresh_token", res.data.refreshToken);
        router.push("/(tabs)");
      })
      .catch((error) => {
        console.log(error);
        console.log(userInfo);
        Toast.show("Email or password is not correct!", {
          type: "danger",
        });
      })
      .finally(() => setButtonSpinner(false));
  };

  return (
    <LinearGradient
      colors={["#E5ECF9", "#F6F7F9", "#E8EEF9"]}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          style={styles.signInImage}
          source={require("@/assets/images/sign.png")}
        />
        <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
          Welcome Back!
        </Text>
        <Text style={styles.learningText}>
          Login to your existing Bookie account
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Fontisto
              style={styles.inputIcon}
              name="email"
              size={20}
              color={"#A1A1A1"}
            />
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              value={userInfo.email}
              placeholder="Enter your e-mail address"
              placeholderTextColor="#A1A1A1"
              onChangeText={(value) =>
                setUserInfo({ ...userInfo, email: value })
              }
            />
          </View>

          <View style={styles.inputWrapper}>
            <SimpleLineIcons
              style={styles.inputIcon}
              name="lock"
              size={20}
              color={"#A1A1A1"}
            />
            <TextInput
              style={styles.input}
              keyboardType="default"
              secureTextEntry={!isPasswordVisible}
              placeholder="Enter your Bookie password"
              placeholderTextColor="#A1A1A1"
              onChangeText={handlePasswordValidation}
            />
            <TouchableOpacity
              style={styles.visibleIcon}
              onPress={() => setPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
              ) : (
                <Ionicons name="eye-outline" size={23} color={"#747474"} />
              )}
            </TouchableOpacity>
          </View>

          {error.password && (
            <View style={styles.errorContainer}>
              <Entypo name="cross" size={18} color={"red"} />
              <Text style={styles.errorText}>{error.password}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push("/(routes)/forgot-password")}
          >
            <Text style={styles.forgotSection}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.signInButton} onPress={(handleSignIn)}>
              {buttonSpinner ? (
                <ActivityIndicator size="small" color={"white"} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.socialLoginContainer}>
            <Text style={styles.socialLoginText}>Or continue with</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="google" size={20} color="#DB4437" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="github" size={20} color="#333" />
                <Text style={styles.socialButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.signupRedirect}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(routes)/sign-up")}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 50,
    paddingBottom: 20,
  },
  signInImage: {
    width: "60%",
    height: 250,
    alignSelf: "center",
  },
  welcomeText: {
    textAlign: "center",
    fontSize: 28,
    color: "#2E3A59",
    marginTop: 20,
  },
  learningText: {
    textAlign: "center",
    color: "#575757",
    fontSize: 16,
    marginTop: 10,
    fontFamily: "Nunito_400Regular",
  },
  inputContainer: {
    marginHorizontal: 24,
    marginTop: 30,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingLeft: 50,
    fontSize: 16,
    backgroundColor: "white",
    color: "#2E3A59",
    borderWidth: 1,
    borderColor: "#E5ECF9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visibleIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    fontFamily: "Nunito_400Regular",
  },
  forgotSection: {
    textAlign: "right",
    fontSize: 16,
    color: "#2467EC",
    fontFamily: "Nunito_600SemiBold",
    marginTop: 10,
  },
  signInButton: {
    backgroundColor: "#2467EC",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#2467EC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signInButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
  },
  socialLoginContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  socialLoginText: {
    color: "#575757",
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 15,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5ECF9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#2E3A59",
    fontFamily: "Nunito_600SemiBold",
  },
  signupRedirect: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    color: "#575757",
    fontFamily: "Nunito_600SemiBold",
  },
  signupLink: {
    fontSize: 16,
    color: "#2467EC",
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
  },
});