import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import api from "../services/api";
import { colors, fonts, shadow } from "../theme";

const fallbackItems = [
  { _id: "water", name: "Drinking Water", category: "Food & Water", description: "At least 3 liters per person.", whyImportant: "Prevents dehydration during evacuation.", forRiskLevel: ["low", "moderate", "high"] },
  { _id: "food", name: "Ready-to-eat Food", category: "Food & Water", description: "Canned or packed food good for 72 hours.", whyImportant: "Keeps your household supplied during disruption.", forRiskLevel: ["low", "moderate", "high"] },
  { _id: "flashlight", name: "Flashlight", category: "Tools", description: "Battery or rechargeable light.", whyImportant: "Useful during outages and night evacuation.", forRiskLevel: ["low", "moderate", "high"] },
  { _id: "radio", name: "Battery Radio", category: "Communication", description: "Small AM/FM radio.", whyImportant: "Receives PAGASA and official advisories.", forRiskLevel: ["moderate", "high"] },
  { _id: "medicine", name: "Medicine Kit", category: "Health", description: "First aid, maintenance meds, masks.", whyImportant: "Covers urgent health needs while waiting for help.", forRiskLevel: ["low", "moderate", "high"] },
  { _id: "documents", name: "Waterproof Documents", category: "Documents", description: "IDs, cash, prescriptions, emergency contacts.", whyImportant: "Speeds up aid, identification, and recovery.", forRiskLevel: ["moderate", "high"] },
];

const filters = ["All", "Low", "Moderate", "High"];

const GoBagScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [filter, setFilter] = useState("All");
  const [household, setHousehold] = useState(4);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/gobag");
      const data = res.data.data || [];
      setItems(data.length ? data : fallbackItems);
    } catch (err) {
      setItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  const visibleItems = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((item) =>
      (item.forRiskLevel || []).map((risk) => risk.toLowerCase()).includes(filter.toLowerCase()),
    );
  }, [filter, items]);

  const packed = visibleItems.filter((item) => checked[item._id]).length;
  const progress = visibleItems.length ? packed / visibleItems.length : 0;
  const waterLiters = household * 3;
  const readyMeals = household * 3;

  const toggleItem = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const checkVisible = () => {
    const next = { ...checked };
    visibleItems.forEach((item) => {
      next[item._id] = true;
    });
    setChecked(next);
  };

  if (loading) {
    return (
      <ScreenShell padded={false}>
        <Header title="Go Bag" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padded={false}>
      <Header title="Go Bag" subtitle="72-hour household checklist" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryKicker}>Packed items</Text>
            <Text style={styles.summaryTitle}>{packed} of {visibleItems.length}</Text>
          </View>
          <TouchableOpacity style={styles.checkAllBtn} onPress={checkVisible}>
            <Text style={styles.checkAllText}>Check visible</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.familyCard}>
          <View>
            <Text style={styles.familyTitle}>Household calculator</Text>
            <Text style={styles.familyText}>{waterLiters}L water and {readyMeals} ready-to-eat meals for 72 hours.</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setHousehold((value) => Math.max(1, value - 1))}>
              <Ionicons name="remove" size={18} color={colors.blue} />
            </TouchableOpacity>
            <Text style={styles.household}>{household}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setHousehold((value) => Math.min(12, value + 1))}>
              <Ionicons name="add" size={18} color={colors.blue} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {visibleItems.map((item) => {
          const isChecked = !!checked[item._id];
          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.itemCard, isChecked && styles.itemChecked]}
              activeOpacity={0.86}
              onPress={() => toggleItem(item._id)}
            >
              <View style={[styles.checkBox, isChecked && styles.checkBoxActive]}>
                <Ionicons name={isChecked ? "checkmark" : "ellipse-outline"} size={18} color={isChecked ? "#fff" : colors.blue} />
              </View>
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                <Text style={styles.why}>Why: {item.whyImportant || "Supports household readiness during disasters."}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 112 },
  summaryCard: { backgroundColor: colors.navy, borderRadius: 24, padding: 18, marginBottom: 14, ...shadow.card },
  summaryKicker: { color: "rgba(255,255,255,0.75)", fontFamily: fonts.medium, fontSize: 12 },
  summaryTitle: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 34, marginTop: 2 },
  checkAllBtn: { position: "absolute", top: 18, right: 18, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  checkAllText: { color: colors.navy, fontFamily: fonts.bold, fontSize: 11 },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: colors.lightBlue },
  familyCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, ...shadow.card },
  familyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  familyText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 210 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: { width: 34, height: 34, borderRadius: 13, backgroundColor: "#e8f3ff", alignItems: "center", justifyContent: "center" },
  household: { color: colors.text, fontFamily: fonts.extraBold, fontSize: 18, minWidth: 22, textAlign: "center" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  filterText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 11 },
  filterTextActive: { color: "#fff" },
  itemCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  itemChecked: { borderColor: colors.blue, backgroundColor: "#f3f9ff" },
  checkBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#e8f3ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkBoxActive: { backgroundColor: colors.blue },
  itemInfo: { flex: 1 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  itemName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  category: { color: colors.blue, fontFamily: fonts.bold, fontSize: 10, backgroundColor: "#e8f3ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  description: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 4 },
  why: { color: colors.text, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 6 },
});

export default GoBagScreen;
