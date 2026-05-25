import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import api from "../services/api";
import { colors, fonts, shadow } from "../theme";

const quickChips = [
  "Saan ang pinakamalapit na evacuation center sa akin?",
  "Paano malalaman kung legit ang hazard report?",
  "Ano gagawin kapag mabilis tumaas ang baha?",
  "Kailan dapat gamitin ang Emergency Ping?",
];

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I'm MitiGo. Ask me about disaster safety, go bags, hazard reports, or Manila emergency preparedness.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async (preset) => {
    const text = (preset || input).trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const location = await getLocationForQuestion(text);
      const res = await api.post("/chatbot/message", { message: text, location });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.data?.reply || res.data.reply || "I'm here to help with preparedness." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I'm having trouble connecting right now. For urgent help, follow barangay/MDRRMO instructions and call emergency services." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <ScreenShell padded={false}>
      <Header title="MitiGo" subtitle="Disaster safety assistant" onBack={() => navigation.goBack()} rightIcon="sparkles-outline" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          <View style={styles.chipRow}>
            {quickChips.map((chip) => (
              <TouchableOpacity key={chip} style={styles.chip} onPress={() => sendMessage(chip)}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {messages.map((msg, index) => (
            <View key={`${msg.role}-${index}`} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.botBubble]}>
              {msg.role === "bot" ? (
                <View style={styles.botIcon}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                </View>
              ) : null}
              <Text style={[styles.bubbleText, msg.role === "user" && styles.userBubbleText]}>{msg.text}</Text>
            </View>
          ))}

          {loading ? (
            <View style={styles.loadingBubble}>
              <ActivityIndicator color={colors.blue} />
              <Text style={styles.loadingText}>MitiGo is thinking...</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about disaster safety..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
};

const getLocationForQuestion = async (text) => {
  const lower = text.toLowerCase();
  const asksNearest =
    ["nearest", "pinakamalapit", "malapit", "near me", "sa akin"].some((word) => lower.includes(word)) &&
    ["evacuation", "evacuate", "center", "shelter"].some((word) => lower.includes(word));

  if (!asksNearest) return undefined;

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return undefined;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return undefined;
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: coords.latitude, lng: coords.longitude };
  } catch {
    return undefined;
  }
};

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 18 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 11 },
  bubble: { maxWidth: "86%", padding: 13, borderRadius: 18, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", ...shadow.card },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.blue, borderBottomRightRadius: 6 },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#fff", borderBottomLeftRadius: 6 },
  botIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginRight: 8 },
  bubbleText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium, lineHeight: 21, flex: 1 },
  userBubbleText: { color: "#fff" },
  loadingBubble: { alignSelf: "flex-start", flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12 },
  loadingText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  inputRow: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderColor: colors.border, alignItems: "flex-end" },
  textInput: { flex: 1, minHeight: 46, maxHeight: 105, backgroundColor: "#f6f9ff", borderRadius: 18, paddingHorizontal: 15, paddingVertical: 12, color: colors.text, fontFamily: fonts.medium, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  sendBtn: { marginLeft: 8, backgroundColor: colors.navy, width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
});

export default ChatbotScreen;
