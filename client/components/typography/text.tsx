import { Text as RNText, TextStyle, StyleProp } from "react-native";
import {
  useFonts,
  Raleway_400Regular,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";

type FontWeight = "regular" | "medium" | "semiBold" | "bold" | "extraBold";
type FontFamily = "raleway" | "nunito";

interface TextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  weight?: FontWeight;
  family?: FontFamily;
  size?: number;
  color?: string;
  centered?: boolean;
  numberOfLines?: number;
}

export function Text({
  children,
  style,
  weight = "regular",
  family = "nunito",
  size = 16,
  color = "#000000",
  centered = false,
  numberOfLines,
}: TextProps) {
  const [fontsLoaded] = useFonts({
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return <RNText style={style}>{children}</RNText>;
  }

  const getFontFamily = () => {
    if (family === "raleway") {
      switch (weight) {
        case "regular":
          return "Raleway_400Regular";
        case "semiBold":
          return "Raleway_600SemiBold";
        case "bold":
          return "Raleway_700Bold";
        case "extraBold":
          return "Raleway_800ExtraBold";
        default:
          return "Raleway_400Regular";
      }
    } else {
      switch (weight) {
        case "regular":
          return "Nunito_400Regular";
        case "medium":
          return "Nunito_500Medium";
        case "semiBold":
          return "Nunito_600SemiBold";
        case "bold":
          return "Nunito_700Bold";
        default:
          return "Nunito_400Regular";
      }
    }
  };

  return (
    <RNText
      style={[
        {
          fontFamily: getFontFamily(),
          fontSize: size,
          color,
          textAlign: centered ? "center" : "left",
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}