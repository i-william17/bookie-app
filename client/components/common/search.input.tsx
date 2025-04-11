import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Text,
  Image,
} from "react-native";
import { useFonts, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { AntDesign } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { router } from "expo-router";
import CourseCard from "../cards/course.card";
import { widthPercentageToDP } from "react-native-responsive-screen";

export default function SearchInput({ homeScreen }: { homeScreen?: boolean }) {
  const [value, setValue] = useState("");
  const [courses, setcourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    axios
      .get(`${SERVER_URI}/get-courses`)
      .then((res: any) => {
        setcourses(res.data.courses);
        if (!homeScreen) {
          setFilteredCourses(res.data.courses);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (homeScreen && value === "") {
      setFilteredCourses([]);
    } else if (value) {
      const filtered = courses.filter((course: CoursesType) =>
        course.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else if (!homeScreen) {
      setFilteredCourses(courses);
    }
  }, [value, courses]);

  let [fontsLoaded, fontError] = useFonts({
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const renderCourseItem = ({ item }: { item: CoursesType }) => (
    <TouchableOpacity
      style={styles.courseItem}
      onPress={() =>
        router.push({
          pathname: "/(routes)/course-details",
          params: { item: JSON.stringify(item) },
        })
      }
    >
      <Image
        source={{ uri: item?.thumbnail?.url }}
        style={styles.thumbnail}
      />
      <Text style={styles.courseName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.filteringContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { fontFamily: "Nunito_700Bold" }]}
            placeholder="Search courses"
            value={value}
            onChangeText={setValue}
            placeholderTextColor="#A0A0A0"
          />
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={() => router.push("/(tabs)/search")}
          >
            <AntDesign name="search1" size={18} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 10 }}>
        <FlatList
          data={filteredCourses}
          keyExtractor={(item: CoursesType) => item._id}
          renderItem={
            homeScreen
              ? renderCourseItem
              : ({ item }) => <CourseCard item={item} key={item._id} />
          }
        />
      </View>

      {!homeScreen && filteredCourses.length === 0 && (
        <Text style={styles.noDataText}>No data available to show!</Text>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  filteringContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    shadowColor: "#2467EC",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },

  searchIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#2467EC",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginLeft: 8,
    shadowColor: "#2467EC",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    height: 50,
    fontFamily: "Nunito_700Bold",
    paddingVertical: 12,
  },

  courseItem: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    width: widthPercentageToDP("90%"),
    marginLeft: "5%",
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },

  courseName: {
    fontSize: 16,
    paddingLeft: 16,
    width: widthPercentageToDP("68%"),
    fontFamily: "Nunito_700Bold",
    color: "#1A1A1A",
    lineHeight: 22,
  },

  noDataText: {
    textAlign: "center",
    paddingTop: 60,
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#7C7C80",
    lineHeight: 24,
  },
});
