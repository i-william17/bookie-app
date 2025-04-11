import {
    View,
    Text,
    ScrollView,
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
  } from "react-native";
  import {
    AntDesign,
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
  import { useState } from "react";
  import { commonStyles } from "@/styles/common/common.styles";
  import { router } from "expo-router";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import axios from "axios";
  import { SERVER_URI } from "@/utils/uri";
  import { Toast } from "react-native-toast-notifications";
  import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";
  
  export default function SignUpScreen() {
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [buttonSpinner, setButtonSpinner] = useState(false);
    const [userInfo, setUserInfo] = useState({
      name: "",
      email: "",
      password: "",
    });
    const [required, setRequired] = useState("");
    const [error, setError] = useState({
      password: "",
    });
  
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
      await axios
        .post(`${SERVER_URI}/registration`, {
          name: userInfo.name,
          email: userInfo.email,
          password: userInfo.password,
        })
        .then(async (res) => {
          await AsyncStorage.setItem(
            "activation_token",
            res.data.activationToken
          );
          Toast.show(res.data.message, {
            type: "success",
          });
          console.log(userInfo.name, userInfo.email, userInfo.password);
          setUserInfo({
            name: "",
            email: "",
            password: "",
          });
          setButtonSpinner(false);
          router.push("/(routes)/verifyAccount");
          
        })
        .catch((error) => {
          setButtonSpinner(false);
          Toast.show("Email already exists!", {
            type: "danger",
          });
          console.log(error);
        });
    };
  
    return (
      <LinearGradient
        colors={["#E5ECF9", "#F6F7F9"]}
        style={{ flex: 1, paddingTop: hp(2) }}
      >
        <ScrollView>
          <Image
            style={styles.signInImage}
            source={require("@/assets/images/signup.png")}
          />
          <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Start your learning journey!
          </Text>
          <Text style={styles.learningText}>
            Create your Bookie account to get started.
          </Text>
          <View style={styles.inputContainer}>
            <View>
              <TextInput
                style={[styles.input, { paddingLeft: wp(10), marginBottom: hp(1) }]}
                keyboardType="default"
                value={userInfo.name}
                placeholder="Enter your full name."
                onChangeText={(value) =>
                  setUserInfo({ ...userInfo, name: value })
                }
              />
              <AntDesign
                style={{ position: "absolute", left: wp(6), top: hp(1.8) }}
                name="user"
                size={wp(5)}
                color={"#A1A1A1"}
              />
            </View>
            <View>
              <TextInput
                style={[styles.input, { paddingLeft: wp(10) }]}
                keyboardType="email-address"
                value={userInfo.email}
                placeholder="Enter valid e-mail address."
                onChangeText={(value) =>
                  setUserInfo({ ...userInfo, email: value })
                }
              />
              <Fontisto
                style={{ position: "absolute", left: wp(6), top: hp(2) }}
                name="email"
                size={wp(5)}
                color={"#A1A1A1"}
              />
              {required && (
                <View style={commonStyles.errorContainer}>
                  <Entypo name="cross" size={wp(4)} color={"red"} />
                </View>
              )}
              <View style={{ marginTop: hp(2) }}>
                <TextInput
                  style={styles.input}
                  keyboardType="default"
                  secureTextEntry={!isPasswordVisible}
                  defaultValue=""
                  placeholder="Create your Bookie password."
                  onChangeText={handlePasswordValidation}
                />
                <TouchableOpacity
                  style={styles.visibleIcon}
                  onPress={() => setPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <Ionicons
                      name="eye-off-outline"
                      size={wp(6)}
                      color={"#747474"}
                    />
                  ) : (
                    <Ionicons name="eye-outline" size={wp(6)} color={"#747474"} />
                  )}
                </TouchableOpacity>
                <SimpleLineIcons
                  style={styles.icon2}
                  name="lock"
                  size={wp(5)}
                  color={"#A1A1A1"}
                />
              </View>
              {error.password && (
                <View style={[commonStyles.errorContainer, { top: hp(18) }]}>
                  <Entypo name="cross" size={wp(4)} color={"red"} />
                  <Text style={{ color: "red", fontSize: wp(3), marginTop: -1 }}>
                    {error.password}
                  </Text>
                </View>
              )}
  
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleSignIn}
              >
                {buttonSpinner ? (
                  <ActivityIndicator size="small" color={"white"} />
                ) : (
                  <LinearGradient
                    colors={["#2467EC", "#1A4FAD"]}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.createAccountText}>Create Account</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
  
              <View style={styles.socialLoginContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="google" size={wp(7)} color={"#DB4437"} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="github" size={wp(7)} color={"#333"} />
                </TouchableOpacity>
              </View>
  
              <View style={styles.signupRedirect}>
                <Text style={styles.redirectText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.push("/(routes)/login")}>
                  <Text style={styles.redirectLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }
  
  const styles = StyleSheet.create({
    signInImage: {
      width: wp(60),
      height: hp(25),
      alignSelf: "center",
      marginTop: hp(5),
    },
    welcomeText: {
      textAlign: "center",
      fontSize: wp(6),
      color: "#333",
      marginTop: hp(2),
    },
    learningText: {
      textAlign: "center",
      color: "#575757",
      fontSize: wp(4),
      marginTop: hp(1),
      fontFamily: "Nunito_500Medium",
    },
    inputContainer: {
      marginHorizontal: wp(5),
      marginTop: hp(3),
      rowGap: hp(2),
    },
    input: {
      height: hp(7),
      marginHorizontal: wp(4),
      borderRadius: wp(2),
      paddingLeft: wp(10),
      fontSize: wp(4),
      backgroundColor: "white",
      color: "#A1A1A1",
      borderWidth: 1,
      borderColor: "#E0E0E0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    visibleIcon: {
      position: "absolute",
      right: wp(8),
      top: hp(1.8),
    },
    icon2: {
      position: "absolute",
      left: wp(6),
      top: hp(2),
    },
    createAccountButton: {
      marginHorizontal: wp(4),
      marginTop: hp(2),
      borderRadius: wp(2),
      overflow: "hidden",
    },
    gradientButton: {
      padding: hp(1.5),
      alignItems: "center",
      justifyContent: "center",
    },
    createAccountText: {
      color: "white",
      fontSize: wp(4.5),
      fontFamily: "Raleway_700Bold",
    },
    socialLoginContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: hp(3),
      gap: wp(5),
    },
    socialButton: {
      padding: wp(3),
      borderRadius: wp(50),
      backgroundColor: "#FFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    signupRedirect: {
      flexDirection: "row",
      marginHorizontal: wp(4),
      justifyContent: "center",
      marginBottom: hp(3),
      marginTop: hp(2),
    },
    redirectText: {
      fontSize: wp(4),
      fontFamily: "Raleway_600SemiBold",
      color: "#333",
    },
    redirectLink: {
      fontSize: wp(4),
      fontFamily: "Raleway_600SemiBold",
      color: "#2467EC",
      marginLeft: wp(1),
    },
  });