import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import useUser from "@/hooks/auth/useUser";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";

export default function Header() {
  const [cartItems, setCartItems] = useState([]);
  const [image, setImage] = useState<any>(null);
  const [loader, setLoader] = useState(false);
  const { user, setRefetch } = useUser();

  useEffect(() => {
    const fetchCart = async () => {
      const cart: any = await AsyncStorage.getItem("cart");
      setCartItems(JSON.parse(cart) || []);
    };
    fetchCart();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photos is required!');
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

        await axios.put(
          `${SERVER_URI}/update-user-avatar`,
          { avatar: base64Image },
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        setRefetch(true);
      } catch (error) {
        console.error("Error updating avatar:", error);
      } finally {
        setLoader(false);
      }
    }
  };

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Image
              source={{
                uri: image || user?.avatar?.url || "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
              }}
              style={styles.image}
            />
          </TouchableOpacity>

        </View>
        <View>
          <Text style={[styles.helloText, { fontFamily: "Raleway_700Bold" }]}>
            Hello,
          </Text>
          <Text 
            style={[styles.text, { fontFamily: "Raleway_700Bold" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user?.name || "Guest"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => router.push("/(routes)/cart")}
        activeOpacity={0.7}
      >
        <View>
          <Feather name="shopping-bag" size={24} color={"#2467EC"} />
          {cartItems?.length > 0 && (
            <View style={styles.bellContainer}>
              <Text style={styles.bellText}>
                {cartItems.length > 9 ? "9+" : cartItems.length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
    width: "90%",
    alignSelf: "center",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2467EC20",
  },
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#fff",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5ECF9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 16,
    color: "#1A1A1A",
    maxWidth: 180,
  },
  bellButton: {
    backgroundColor: "#2467EC10",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2467EC15",
  },
  bellContainer: {
    width: 20,
    height: 20,
    backgroundColor: "#2467EC",
    position: "absolute",
    borderRadius: 10,
    right: -4,
    top: -4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  bellText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  helloText: {
    color: "#7C7C80",
    fontSize: 14,
    lineHeight: 18,
  },
});