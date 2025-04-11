import { StyleSheet } from "react-native";
import { responsiveWidth } from "react-native-responsive-dimensions";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    height: hp("35%"),
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  slide: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },

  background: {
    width: "100%",
    height: hp("27%"),
    resizeMode: "cover",
    borderRadius: 16,
  },

  dot: {
    backgroundColor: "#D1D1D6",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 8,
  },

  activeDot: {
    backgroundColor: "#2467EC",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    marginVertical: 8,
  },

  backgroundView: {
    position: "absolute",
    zIndex: 5,
    paddingHorizontal: 18,
    paddingVertical: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  backgroundViewContainer: {
    width: responsiveWidth(45),
    height: responsiveWidth(30),
    marginTop: -40,
  },

  backgroundViewText: {
    color: "#FFFFFF",
    fontSize: hp("2.8%"),
    fontWeight: "700",
  },

  backgroundViewOffer: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 6,
  },

  backgroundViewImage: {
    width: wp("38%"),
    height: hp("22%"),
    top: -10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  backgroundViewButtonContainer: {
    borderWidth: 1.1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    width: 109,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  backgroundViewButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
});
