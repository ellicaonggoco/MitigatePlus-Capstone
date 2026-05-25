import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActivityIndicator, Animated, View, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "./theme";

import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import VerifyOTPScreen from "./screens/VerifyOTPScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";
import ReportScreen from "./screens/ReportScreen";
import AssessmentScreen from "./screens/AssessmentScreen";
import GoBagScreen from "./screens/GoBagScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import SettingsScreen from "./screens/SettingsScreen";
import OfficialReviewScreen from "./screens/OfficialReviewScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ routeName, color, size, focused }) => {
  const scale = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 130,
      friction: 12,
    }).start();
  }, [focused, scale]);

  const icons = {
    Home: focused ? "home" : "home-outline",
    Map: focused ? "map" : "map-outline",
    Report: focused ? "add-circle" : "add-circle-outline",
    Assessment: focused ? "analytics" : "analytics-outline",
    GoBag: focused ? "briefcase" : "briefcase-outline",
    Official: focused ? "checkmark-done-circle" : "checkmark-done-circle-outline",
  };
  const isReport = routeName === "Report";

  return (
    <Animated.View
      style={{
        width: isReport ? 54 : 44,
        height: isReport ? 44 : 36,
        borderRadius: isReport ? 22 : 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.blue : "rgba(255,255,255,0)",
        borderWidth: focused ? 1 : 0,
        borderColor: focused ? "rgba(255,255,255,0.7)" : "transparent",
        shadowColor: focused ? colors.blue : "transparent",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: focused ? 0.3 : 0,
        shadowRadius: focused ? 16 : 0,
        elevation: focused ? 8 : 0,
        transform: [
          {
            translateY: scale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -7],
            }),
          },
          {
            scale: scale.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.08],
            }),
          },
        ],
      }}
    >
      <Ionicons
        name={icons[routeName]}
        size={isReport ? size + 6 : size + 1}
        color={focused ? "#fff" : color}
      />
    </Animated.View>
  );
};

const MainTabs = () => {
  const { user } = useAuth();
  const isOfficial = user?.role === "barangay_official" && user?.status === "active";

  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: "#89a4c7",
      tabBarLabelStyle: {
        fontFamily: fonts.bold,
        fontSize: 10,
        marginBottom: 8,
      },
      tabBarStyle: {
        height: 86,
        paddingTop: 10,
        paddingHorizontal: 8,
        borderTopWidth: 0,
        backgroundColor: "rgba(255,255,255,0.94)",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        position: "absolute",
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.16,
        shadowRadius: 28,
        elevation: 24,
      },
      tabBarIcon: ({ color, size, focused }) => {
        return <TabIcon routeName={route.name} color={color} size={size} focused={focused} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="Report" component={ReportScreen} />
    <Tab.Screen name="Assessment" component={AssessmentScreen} />
    <Tab.Screen name="GoBag" component={GoBagScreen} options={{ title: "Go Bag" }} />
    {isOfficial ? <Tab.Screen name="Official" component={OfficialReviewScreen} /> : null}
  </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  // Load all Poppins font weights
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("./assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("./assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("./assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("./assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("./assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-Black": require("./assets/fonts/Poppins-Black.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D47A1" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
});
