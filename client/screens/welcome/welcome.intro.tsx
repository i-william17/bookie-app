import { View, Text, Image, StyleSheet } from "react-native";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { LinearGradient } from "expo-linear-gradient";
import AppIntroSlider from "react-native-app-intro-slider";
import { onboardingSwiperData } from "@/constants/constants";
import { router } from "expo-router";
import { commonStyles } from "@/styles/common/common.styles";

export default function WelcomeIntroScreen() {
  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;  
  }

  const renderItem = ({ item }: { item: onboardingSwiperDataType }) => (
    <LinearGradient
      colors={["#E5ECF9", "#F6F7F9", "#E8EEF9"]}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Image
          source={item.image}
          style={styles.image}
        />
        <Text style={[commonStyles.title, styles.title]}>
          {item.title}
        </Text>
        <View style={styles.textContainer}>
          <Text style={[commonStyles.description, styles.description]}>
            {item.description}
          </Text>
          <Text style={[commonStyles.description, styles.description]}>
            {item.sortDescrition}
          </Text>
          <Text style={[commonStyles.description, styles.description]}>
            {item.sortDescrition2}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <AppIntroSlider
      renderItem={renderItem}
      data={onboardingSwiperData}
      onDone={() => {
        router.push("/login");
      }}
      onSkip={() => {
        router.push("/login");
      }}
      renderNextButton={() => (
        <View style={styles.button}>
          <Text style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Next
          </Text>
        </View>
      )}
      renderDoneButton={() => (
        <View style={styles.button}>
          <Text style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Done
          </Text>
        </View>
      )}
      showSkipButton={false}
      dotStyle={commonStyles.dotStyle}
      bottomButton={true}
      activeDotStyle={commonStyles.activeDotStyle}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  image: {
    alignSelf: "center",
    marginBottom: 30,
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: "Raleway_700Bold",
    fontSize: 28,
    color: '#2E3A59',
    textAlign: 'center',
    marginBottom: 20,
  },
  textContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  description: {
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});