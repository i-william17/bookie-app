import { SERVER_URI } from "@/utils/uri";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

interface CoursesType {
  _id: string;
  name: string;
  price: number;
  level: string;
  thumbnail: {
    url: string;
  };
}

interface PaymentResponse {
  merchantRequestID: string;
  checkoutRequestID: string;
  paymentId: string;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CoursesType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [currentPayment, setCurrentPayment] = useState<PaymentResponse | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const cart = await AsyncStorage.getItem("cart");
      setCartItems(cart ? JSON.parse(cart) : []);
    } catch (error) {
      console.error("Failed to load cart items:", error);
      Alert.alert("Error", "Failed to load your cart items");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartItems();
    setRefreshing(false);
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  // Validate Kenyan phone number format
  const validatePhoneNumber = (phone: string): string => {
    const regex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
    if (!phone) return "Phone number is required";
    if (!regex.test(phone)) return "Please enter a valid Kenyan phone number";
    return "";
  };

  const fetchAllPayments = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const response = await axios.get(`${SERVER_URI}/payments`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setAllPayments(response.data.data);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      Alert.alert("Error", "Failed to fetch payment history");
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (phoneError) setPhoneError(validatePhoneNumber(text));
  };

  const handleCourseDetails = (course: CoursesType) => {
    router.push({
      pathname: "/(routes)/course-details",
      params: { item: JSON.stringify(course) },
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedCart = cartItems.filter(item => item._id !== itemId);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartItems(updatedCart);
    } catch (error) {
      console.error("Failed to remove item:", error);
      Alert.alert("Error", "Failed to remove item from cart");
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) return `254${digits.substring(1)}`;
    if (digits.startsWith("7")) return `254${digits}`;
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("+254")) return digits.substring(1);

    return digits;
  };

  const initiateMpesaPayment = async () => {
    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setPhoneError(validationError);
      return false;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return false;
    }

    setIsProcessing(true);
    setShowPaymentModal(false);

    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      const amount = calculateTotalPrice();
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const response = await axios.post<{
        success: boolean;
        data: PaymentResponse;
      }>(
        `${SERVER_URI}/initiate-stkpush`,
        {
          phoneNumber: formattedPhone,
          amount,
          courses: cartItems.map(item => item._id)
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "access-token": accessToken,
            "refresh-token": refreshToken,
            ContentType: "application/json",
          },
        }
      );

      if (response.data.success) {
        setCurrentPayment(response.data.data);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const errorMessage = error.response?.data?.message || "Payment initiation failed. Please try again.";
      Alert.alert("Error", errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (payment: any) => {
    setIsVerifying(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");

      const response = await axios.post(
        `${SERVER_URI}/verify-payment`,
        {
          merchantRequestID: payment.merchantRequestID,
          checkoutRequestID: payment.checkoutRequestID
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Payment verified successfully");
        // Refresh payments list
        await fetchAllPayments();
      } else {
        Alert.alert("Error", response.data.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "Failed to verify payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const pollPaymentStatus = async (paymentInfo: PaymentResponse, retries = 10, interval = 3000): Promise<boolean> => {
    try {
      const result = await verifyPayment(paymentInfo);

      if (result.status === "completed") {
        await createOrder(result.paymentInfo);
        return true;
      }

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
        return pollPaymentStatus(paymentInfo, retries - 1, interval);
      }

      return false;
    } catch (error) {
      console.error("Polling error:", error);
      return false;
    }
  };

  const createOrder = async (paymentInfo: any) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      await axios.post(
        `${SERVER_URI}/create-order`,
        {
          courses: cartItems.map(item => item._id),
          payment_info: paymentInfo,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      // Clear cart and show success
      await AsyncStorage.removeItem("cart");
      setCartItems([]);
      setOrderSuccess(true);
      setCurrentPayment(null);
    } catch (error) {
      console.error("Order creation error:", error);
      throw error;
    }
  };

  const handlePayment = async () => {
    const paymentInitiated = await initiateMpesaPayment();
    if (!paymentInitiated) return;

    setIsProcessing(true);
    try {
      if (!currentPayment) {
        throw new Error("Payment information not available");
      }

      // Show verification modal instead of automatically polling
      setShowVerificationModal(true);
      await fetchAllPayments();

    } catch (error: any) {
      console.error("Payment processing error:", error);
      Alert.alert("Error", error.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const VerificationModal = ({
    visible,
    payments,
    selectedPayment,
    isVerifying,
    onClose,
    onSelectPayment,
    onVerifyPayment,
  }: {
    visible: boolean;
    payments: any[];
    selectedPayment: any;
    isVerifying: boolean;
    onClose: () => void;
    onSelectPayment: (payment: any) => void;
    onVerifyPayment: (payment: any) => void;
  }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.verificationModalOverlay}>
        <View style={styles.verificationModalContainer}>
          <Text style={styles.verificationModalTitle}>Verify Payment</Text>

          <FlatList
            data={payments}
            keyExtractor={(item) => item._id}
            style={styles.verificationList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.verificationItem,
                  selectedPayment?._id === item._id && styles.selectedVerificationItem,
                ]}
                onPress={() => onSelectPayment(item)}
              >
                <Text style={styles.verificationItemText}>
                  {item.merchantRequestID}
                </Text>
                <Text style={styles.verificationItemStatus}>
                  Status: {item.status}
                </Text>
                <Text style={styles.verificationItemAmount}>
                  KSh {item.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noPaymentsText}>No payments found</Text>
            }
          />

          <View style={styles.verificationModalButtons}>
            <TouchableOpacity
              style={styles.verificationCancelButton}
              onPress={onClose}
            >
              <Text style={styles.verificationButtonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.verificationConfirmButton,
                (!selectedPayment || isVerifying) && styles.disabledButton,
              ]}
              onPress={() => onVerifyPayment(selectedPayment)}
              disabled={!selectedPayment || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.verificationButtonText}>Verify Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={["#E5ECF9", "#F6F7F9"]}
      style={styles.gradientContainer}
    >
      {orderSuccess ? (
        <OrderSuccessView onContinueShopping={() => router.push("/(tabs)/courses")} />
      ) : (
        <>
          <CartItemsList
            cartItems={cartItems}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onCoursePress={handleCourseDetails}
            onRemoveItem={handleRemoveItem}
          />

          {cartItems.length > 0 && (
            <CheckoutFooter
              totalPrice={calculateTotalPrice()}
              isProcessing={isProcessing}
              onCheckoutPress={() => setShowPaymentModal(true)}
            />
          )}

          <PaymentModal
            visible={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            cartItems={cartItems}
            phoneNumber={phoneNumber}
            phoneError={phoneError}
            isProcessing={isProcessing}
            onPhoneNumberChange={handlePhoneNumberChange}
            onConfirmPayment={handlePayment}
          />
          {showVerificationModal && (
            <VerificationModal
              visible={showVerificationModal}
              payments={allPayments}
              selectedPayment={selectedPayment}
              isVerifying={isVerifying}
              onClose={() => setShowVerificationModal(false)}
              onSelectPayment={(payment) => setSelectedPayment(payment)}
              onVerifyPayment={verifyPayment}
            />
          )}
        </>
      )}
    </LinearGradient>
  );
}

// Sub-components for better organization
const OrderSuccessView = ({ onContinueShopping }: { onContinueShopping: () => void }) => (
  <View style={styles.successContainer}>
    <Image
      source={require("@/assets/images/account_confirmation.png")}
      style={styles.successImage}
    />
    <Text style={styles.successTitle}>Payment Successful!</Text>
    <Text style={styles.successMessage}>
      Thank you for your purchase! You will receive a confirmation email shortly.
    </Text>

    <TouchableOpacity
      style={styles.continueShoppingButton}
      onPress={onContinueShopping}
    >
      <Text style={styles.continueShoppingText}>Continue Shopping</Text>
    </TouchableOpacity>
  </View>
);

const CartItemsList = ({
  cartItems,
  refreshing,
  onRefresh,
  onCoursePress,
  onRemoveItem
}: {
  cartItems: CoursesType[];
  refreshing: boolean;
  onRefresh: () => void;
  onCoursePress: (course: CoursesType) => void;
  onRemoveItem: (id: string) => void;
}) => (
  <FlatList
    data={cartItems}
    keyExtractor={(item) => item._id}
    renderItem={({ item }) => (
      <View style={styles.cartItem}>
        <TouchableOpacity onPress={() => onCoursePress(item)}>
          <Image
            source={{ uri: item.thumbnail.url }}
            style={styles.courseImage}
          />
        </TouchableOpacity>

        <View style={styles.courseDetails}>
          <TouchableOpacity onPress={() => onCoursePress(item)}>
            <Text style={styles.courseName}>{item.name}</Text>
          </TouchableOpacity>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Entypo name="dot-single" size={24} color="#808080" />
              <Text style={styles.metaText}>{item.level}</Text>
            </View>

            <View style={styles.metaItem}>
              <FontAwesome name="dollar" size={14} color="#808080" />
              <Text style={styles.metaText}>{item.price.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveItem(item._id)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
    ListEmptyComponent={
      <View style={styles.emptyCartContainer}>
        <Image
          source={require("@/assets/empty_cart.png")}
          style={styles.emptyCartImage}
        />
        <Text style={styles.emptyCartText}>Your Cart is Empty!</Text>
      </View>
    }
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    }
    contentContainerStyle={styles.flatListContent}
  />
);

const CheckoutFooter = ({
  totalPrice,
  isProcessing,
  onCheckoutPress
}: {
  totalPrice: number;
  isProcessing: boolean;
  onCheckoutPress: () => void;
}) => (
  <View style={styles.checkoutContainer}>
    <View style={styles.totalContainer}>
      <Text style={styles.totalLabel}>Total:</Text>
      <Text style={styles.totalAmount}>KSh {totalPrice.toFixed(2)}</Text>
    </View>

    <TouchableOpacity
      style={[
        styles.checkoutButton,
        isProcessing && styles.disabledButton,
      ]}
      onPress={onCheckoutPress}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.checkoutButtonText}>Pay with M-Pesa</Text>
      )}
    </TouchableOpacity>
  </View>
);

const PaymentModal = ({
  visible,
  onClose,
  cartItems,
  phoneNumber,
  phoneError,
  isProcessing,
  onPhoneNumberChange,
  onConfirmPayment
}: {
  visible: boolean;
  onClose: () => void;
  cartItems: CoursesType[];
  phoneNumber: string;
  phoneError: string;
  isProcessing: boolean;
  onPhoneNumberChange: (text: string) => void;
  onConfirmPayment: () => void;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Confirm Payment</Text>

        <View style={styles.paymentSummary}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>{cartItems.length}</Text>

          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryAmount}>
            KSh {cartItems.reduce((total, item) => total + item.price, 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
          <TextInput
            style={[
              styles.phoneInput,
              phoneError && styles.inputError,
            ]}
            placeholder="e.g. 0712345678"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={onPhoneNumberChange}
            autoFocus={true}
          />
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : (
            <Text style={styles.helperText}>
              Enter your M-Pesa registered phone number
            </Text>
          )}
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              isProcessing && styles.disabledButton,
            ]}
            onPress={onConfirmPayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);


const styles = StyleSheet.create({
  // Container Styles
  gradientContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  flatListContent: {
    paddingBottom: 100,
  },

  // Success View Styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: "#575757",
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  continueShoppingButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
  continueShoppingText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },

  // Cart Item Styles
  cartItem: {
    flexDirection: "row",
    margin: 10,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 12,
  },
  courseImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  courseDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  courseName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  metaText: {
    fontSize: 14,
    color: "#808080",
    fontFamily: "Nunito_400Regular",
    marginLeft: 2,
  },
  removeButton: {
    backgroundColor: "#FF6347",
    borderRadius: 5,
    padding: 6,
    width: 100,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Nunito_600SemiBold",
  },

  // Empty Cart Styles
  emptyCartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  emptyCartText: {
    fontSize: 22,
    marginTop: 20,
    color: "#333",
    fontFamily: "Raleway_600SemiBold",
  },

  // Checkout Styles
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "Nunito_600SemiBold",
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#007BFF",
  },
  checkoutButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  disabledButton: {
    opacity: 0.7,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    marginBottom: 20,
    textAlign: "center",
  },
  paymentSummary: {
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#555",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#007BFF",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#555",
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
  },
  inputError: {
    borderColor: "#FF6347",
  },
  errorText: {
    color: "#FF6347",
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    marginTop: 5,
  },
  helperText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 14,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  verificationModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  verificationModalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  verificationModalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    marginBottom: 15,
    textAlign: "center",
  },
  verificationList: {
    marginBottom: 20,
  },
  verificationItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedVerificationItem: {
    borderColor: "#007BFF",
    backgroundColor: "#F0F7FF",
  },
  verificationItemText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  verificationItemStatus: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "#666",
    marginTop: 5,
  },
  verificationItemAmount: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#007BFF",
    marginTop: 5,
  },
  noPaymentsText: {
    textAlign: "center",
    color: "#888",
    fontFamily: "Nunito_400Regular",
    padding: 20,
  },
  verificationModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  verificationCancelButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 14,
    marginRight: 10,
    alignItems: "center",
  },
  verificationConfirmButton: {
    flex: 1,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  verificationButtonText: {
    color: "white",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
});