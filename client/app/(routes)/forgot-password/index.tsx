import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
  } from "react-native";
  import { LinearGradient } from "expo-linear-gradient";
  import {
    useFonts,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_400Regular,
  } from "@expo-google-fonts/nunito";
  import { router } from "expo-router";
  
  export default function ForgotPassword() {
    let [fontsLoaded, fontError] = useFonts({
      Nunito_600SemiBold,
      Nunito_700Bold,
      Nunito_400Regular,
    });
  
    if (!fontsLoaded && !fontError) {
      return null;
    }
  
    return (
      <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          <Text style={[styles.headerText, { fontFamily: "Nunito_700Bold" }]}>
            Reset Your Password
          </Text>
          <Text style={[styles.subText, { fontFamily: "Nunito_400Regular" }]}>
            Enter your email address, and we'll send you a link to reset your password.
          </Text>
  
          <TextInput
            style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
            placeholder="Enter your email"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
  
          <TouchableOpacity style={styles.button}>
            <Text style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
              Send Reset Link
            </Text>
          </TouchableOpacity>
  
          <View style={styles.loginLink}>
            <Text style={[styles.backText, { fontFamily: "Nunito_400Regular" }]}>
              Remember your password?
            </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={[styles.loginText, { fontFamily: "Nunito_700Bold" }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 25,
    },
    innerContainer: {
      width: "100%",
      alignItems: "center",
    },
    headerText: {
      fontSize: 22,
      textAlign: "center",
      color: "#2D3A4A",
      marginBottom: 8,
    },
    subText: {
      fontSize: 14,
      textAlign: "center",
      color: "#6C7A92",
      marginBottom: 25,
      paddingHorizontal: 10,
    },
    input: {
      width: "100%",
      height: 50,
      backgroundColor: "white",
      borderRadius: 10,
      paddingHorizontal: 15,
      fontSize: 16,
      color: "#333",
      borderWidth: 1,
      borderColor: "#ddd",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
      marginBottom: 20,
    },
    button: {
      backgroundColor: "#3876EE",
      width: "100%",
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
      shadowColor: "#3876EE",
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 5,
      elevation: 4,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
    },
    loginLink: {
      flexDirection: "row",
      marginTop: 25,
    },
    loginText: {
      color: "#3876EE",
      marginLeft: 5,
      fontSize: 16,
    },
    backText: {
      fontSize: 16,
      color: "#555",
    },
  });
  