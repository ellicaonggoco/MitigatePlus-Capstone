import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import HazardLogoBadge from "../components/HazardLogoBadge";
import api from "../services/api";
import { colors, fonts, hazardTypes, riskColor, shadow } from "../theme";

const AssessmentScreen = () => {
  const [hazardType, setHazardType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [stage, setStage] = useState("select");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuestions = async (type) => {
    setLoadingQuestions(true);
    try {
      const res = await api.get(`/assessments/questions/${type}`);
      setHazardType(type);
      setQuestions((res.data.data || []).slice(0, 10));
      setAnswers({});
      setStage("questions");
    } catch (err) {
      Alert.alert("Could not load questions", err.response?.data?.message || "Please try again.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/assessments", { hazardType, answers });
      setResult(res.data.data);
      setStage("results");
    } catch (err) {
      Alert.alert("Assessment failed", err.response?.data?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setHazardType(null);
    setQuestions([]);
    setAnswers({});
    setStage("select");
    setResult(null);
  };

  const answerCount = Object.keys(answers).length;
  const activeIndex = Math.min(answerCount, Math.max(questions.length - 1, 0));
  const activeQuestion = questions[activeIndex];
  const riskLevel = result?.assessment?.riskLevel || result?.riskLevel;
  const percentage = result?.percentage || result?.assessment?.riskScore || 0;
  const shareResults = async () => {
    if (!result) return;
    const tips = (result.tips || result.assessment?.recommendations || [])
      .slice(0, 5)
      .map((tip, index) => `${index + 1}. ${tip}`)
      .join("\n");
    try {
      await Share.share({
        title: "MitigatePlus Risk Assessment",
        message: `MitigatePlus ${hazardType} Assessment\nRisk: ${riskLevel?.toUpperCase()} (${percentage}%)\n\n${result.evaluation || ""}\n\nTips:\n${tips}`,
      });
    } catch {
      Alert.alert("Share unavailable", "Could not open sharing on this device.");
    }
  };

  return (
    <ScreenShell padded={false}>
      <Header title="Risk Assessment" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {stage === "select" ? (
          <View>
            <Text style={styles.title}>Choose Hazard Type</Text>
            <View style={styles.grid}>
              {hazardTypes.map((type) => (
                <TouchableOpacity key={type} style={styles.card} onPress={() => fetchQuestions(type)}>
                  <View style={styles.hazardIconWrap}>
                    <HazardLogoBadge type={type} size={48} />
                  </View>
                  <Text style={styles.cardText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {stage === "questions" ? (
          <View>
            <Text style={styles.title}>{hazardType} Assessment</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${questions.length ? (answerCount / questions.length) * 100 : 0}%` }]} />
            </View>
            {loadingQuestions ? <ActivityIndicator color={colors.blue} /> : null}
            {activeQuestion ? (
              <View style={styles.questionBlock}>
                <Text style={styles.question}>{activeIndex + 1}. {activeQuestion.question}</Text>
                {activeQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionBtn,
                      answers[activeQuestion.id] === index + 1 && styles.optionSelected,
                    ]}
                    onPress={() => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: index + 1 }))}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.submitBtn, (answerCount < questions.length || submitting) && styles.disabled]}
              disabled={answerCount !== questions.length || submitting}
              onPress={submitAssessment}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>View Results</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        {stage === "results" && result ? (
          <View>
            <Text style={styles.resultTitle}>Assessment Result</Text>
            <View style={[styles.riskBadge, { backgroundColor: `${riskColor(riskLevel)}22` }]}>
              <Text style={[styles.riskText, { color: riskColor(riskLevel) }]}>{riskLevel?.toUpperCase()} RISK</Text>
            </View>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${percentage}%`, backgroundColor: riskColor(riskLevel) }]} />
            </View>
            <Text style={styles.scoreText}>Score: {percentage}%</Text>
            <Text style={styles.evaluation}>{result.evaluation}</Text>

            <View style={styles.formalPlan}>
              <Text style={styles.formalTitle}>Formal Prevention Plan</Text>
              <Text style={styles.formalText}>
                Your answers produced a {percentage}% score. For {riskLevel} risk, prioritize the recommendations below, correct the highest-scoring weak areas first, and coordinate with your barangay DRRMO when the risk is moderate or high.
              </Text>
            </View>

            <Text style={styles.sectionSubtitle}>Personalized Mitigation Tips</Text>
            {(result.tips || result.assessment?.recommendations || []).slice(0, 7).map((tip, index) => (
              <View key={`${tip}-${index}`} style={styles.tipItem}>
                <Text style={styles.tipNumber}>{index + 1}.</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}

            <Text style={styles.sectionSubtitle}>Recommended Government Actions</Text>
            {(result.governmentActions || []).map((action, index) => (
              <Text key={`${action}-${index}`} style={styles.actionText}>• {action}</Text>
            ))}

            <TouchableOpacity style={styles.downloadBtn} onPress={shareResults}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.downloadText}>Share Results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>Assess Another Hazard</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingBottom: 112 },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.text, marginBottom: 20, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  card: { width: "45%", minHeight: 126, backgroundColor: colors.surface, borderRadius: 24, padding: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  hazardIconWrap: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  hazardEmoji: { fontSize: 31, lineHeight: 36, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  cardText: { color: colors.text, fontSize: 14, fontFamily: fonts.semiBold, marginTop: 8, textAlign: "center" },
  progressTrack: { width: "100%", height: 10, borderRadius: 999, backgroundColor: "#dbeafe", marginBottom: 18, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: colors.blue },
  questionBlock: { width: "100%", marginBottom: 20, backgroundColor: colors.surface, borderRadius: 24, padding: 16, ...shadow.soft },
  question: { fontSize: 16, color: colors.text, marginBottom: 14, fontFamily: fonts.semiBold, lineHeight: 23 },
  optionBtn: { backgroundColor: "#f8fbff", borderRadius: 16, padding: 14, marginBottom: 9, borderWidth: 1, borderColor: colors.border },
  optionSelected: { borderColor: colors.blue, backgroundColor: "#e1f4ff" },
  optionText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
  submitBtn: { backgroundColor: colors.navy, borderRadius: 16, padding: 16, width: "100%", alignItems: "center", marginTop: 8 },
  disabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 16 },
  resultTitle: { fontSize: 26, fontFamily: fonts.bold, color: colors.text, marginBottom: 16, textAlign: "center" },
  riskBadge: { alignSelf: "center", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  riskText: { fontFamily: fonts.bold, fontSize: 18 },
  scoreTrack: { width: "100%", height: 14, borderRadius: 999, backgroundColor: "#e5e7eb", overflow: "hidden", marginBottom: 8 },
  scoreFill: { height: "100%", borderRadius: 999 },
  scoreText: { fontSize: 16, color: colors.muted, marginBottom: 12, fontFamily: fonts.semiBold, textAlign: "center" },
  evaluation: { fontSize: 14, color: colors.text, marginBottom: 20, lineHeight: 22, fontFamily: fonts.medium, backgroundColor: colors.surface, padding: 16, borderRadius: 18 },
  formalPlan: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  formalTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginBottom: 6 },
  formalText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
  sectionSubtitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginTop: 16, marginBottom: 10 },
  tipItem: { flexDirection: "row", marginBottom: 9, backgroundColor: colors.surface, padding: 12, borderRadius: 16, ...shadow.soft },
  tipNumber: { color: colors.blue, marginRight: 6, fontFamily: fonts.bold },
  tipText: { color: colors.text, fontSize: 13, flex: 1, fontFamily: fonts.medium, lineHeight: 20 },
  actionText: { color: colors.muted, fontSize: 13, marginBottom: 6, fontFamily: fonts.medium, lineHeight: 20 },
  downloadBtn: { backgroundColor: colors.blue, borderRadius: 16, padding: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 18 },
  downloadText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  resetBtn: { backgroundColor: colors.navy, borderRadius: 16, padding: 15, marginTop: 12, width: "100%", alignItems: "center" },
  resetBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
});

export default AssessmentScreen;
