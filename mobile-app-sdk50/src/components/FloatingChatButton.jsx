import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "../theme";

const FloatingChatButton = ({ navigation }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    style={styles.button}
    onPress={() => navigation.navigate("Chatbot")}
  >
    <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 18,
    bottom: 92,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    ...shadow.button,
  },
});

export default FloatingChatButton;
