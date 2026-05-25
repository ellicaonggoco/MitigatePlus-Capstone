const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const axios = require("axios");
const EvacuationCenter = require("../models/EvacuationCenter");
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
].filter(Boolean);

const SYSTEM_PROMPT = `You are MitiGo, the AI assistant for MitigatePlus - a disaster risk mitigation system for City of Manila residents. 
Help residents understand disaster risks, provide mitigation advice, explain hazard zones, guide emergency preparedness, and assist with go bag planning. 
Focus only on disaster risk, emergency preparedness, and safety topics. 
Be friendly, clear, concise, and use simple language Filipino residents can understand. 
When relevant, mention Manila-specific resources like MDRRMO, PHIVOLCS, PAGASA, and BFP.
You can mix English and Tagalog (Taglish) for better understanding.
Always prioritize safety and official guidance from Philippine government agencies.
If the user asks unrelated questions, politely redirect them back to disaster safety and MitigatePlus.`;

const allowedKeywords = [
  "mitigate",
  "mitigateplus",
  "mitigo",
  "app",
  "mobile",
  "web",
  "dashboard",
  "login",
  "register",
  "account",
  "admin",
  "superadmin",
  "official",
  "resident",
  "mitigation",
  "hazard",
  "disaster",
  "emergency",
  "evacuation",
  "evacuate",
  "go bag",
  "prepared",
  "prepare",
  "prevent",
  "safety",
  "risk",
  "flood",
  "fire",
  "earthquake",
  "fault",
  "typhoon",
  "landslide",
  "drainage",
  "structural",
  "weather",
  "rain",
  "pagasa",
  "phivolcs",
  "bfp",
  "mdrrmo",
  "barangay",
  "report",
  "map",
  "alert",
  "notification",
  "nearest",
  "near",
  "malapit",
  "pinakamalapit",
  "saan",
  "ano",
  "paano",
  "bakit",
  "legit",
  "totoo",
  "verify",
  "validate",
  "lindol",
  "sunog",
  "baha",
  "bagyo",
  "ulan",
  "ligtas",
  "assessment",
  "checklist",
  "password",
  "otp",
  "approval",
  "approve",
  "suspend",
  "profile",
  "photo",
  "severity",
];

const greetingKeywords = [
  "hello",
  "hi",
  "hey",
  "thanks",
  "thank",
  "salamat",
  "kumusta",
  "kamusta",
  "good morning",
  "good afternoon",
  "good evening",
];

const broadQuestionKeywords = new Set(["saan", "ano", "paano", "bakit"]);

const tokenize = (message) =>
  message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const includesPhraseOrToken = (text, tokens, keyword) =>
  keyword.includes(" ") ? text.includes(keyword) : tokens.includes(keyword);

const isAllowedTopic = (message) => {
  const text = message.toLowerCase();
  const tokens = tokenize(message);
  return (
    allowedKeywords
      .filter((keyword) => !broadQuestionKeywords.has(keyword))
      .some((keyword) => includesPhraseOrToken(text, tokens, keyword)) ||
    greetingKeywords.some((keyword) => includesPhraseOrToken(text, tokens, keyword))
  );
};

const topicResponses = [
  {
    keywords: ["mitigateplus", "mitigo", "app", "mobile", "dashboard"],
    reply:
      "MitigatePlus helps Manila residents report hazards, view hazard maps, check mitigation tips, prepare go bags, answer safety assessments, and find evacuation centers. MitiGo is the in-app assistant for simple app and disaster safety questions.",
  },
  {
    keywords: ["login", "register", "account", "password", "otp", "approval"],
    reply:
      "For accounts: residents register in the mobile app and verify by OTP. Barangay official accounts need admin approval. Web dashboard access is for admins and superadmins. If login fails, check your email, password, account status, and internet connection.",
  },
  {
    keywords: ["admin", "superadmin", "official", "approve", "suspend"],
    reply:
      "In MitigatePlus, barangay officials validate community reports, admins manage hazards and validated reports, and superadmins manage users and higher-level system access. Superadmins should only create admin or superadmin accounts for trusted LGU personnel.",
  },
  {
    keywords: ["assessment", "checklist", "tips", "recommendation", "severity"],
    reply:
      "The assessment feature asks hazard-specific questions and gives a risk level with mitigation tips. Use it to check your home or area for flood, fire, earthquake, drainage, landslide, typhoon, or structural risks.",
  },
  {
    keywords: ["legit", "totoo", "verify", "validate", "validation", "official"],
    reply:
      "Sa MitigatePlus, hindi agad itinuturing na confirmed ang resident report. Barangay officials muna ang magve-verify, at kailangan ng 3 official validations bago ito ma-escalate for admin approval. Kung false report ito, traceable ang account, report details, photo, oras, at location, kaya dapat tunay at malinaw ang isusubmit.",
  },
  {
    keywords: ["sue", "penalty", "false", "fake", "hindi totoo", "peke"],
    reply:
      "Kung maling hazard report ang sinadya, pwedeng ma-trace ang reporter at reviewing officials through account ID, timestamp, location, and validation logs. MitigatePlus should be used only for real hazards. For questionable reports, officials should reject or add notes instead of validating.",
  },
  {
    keywords: ["before report", "when report", "kailan mag report", "kailan magreport"],
    reply:
      "Mag-report kapag may visible or active hazard: baha sa kalsada, sunog/usok, sirang poste o building cracks, open drainage, landslide signs, o blocked evacuation route. Ilagay ang exact location, malinaw na description, severity, at photo kung safe kumuha. Huwag lumapit sa danger area para lang makakuha ng picture.",
  },
  {
    keywords: ["emergency ping", "urgent", "high priority", "active danger"],
    reply:
      "Use Emergency Ping only kapag may active danger ngayon, tulad ng mabilis na pagtaas ng baha, sunog, collapse risk, o blocked evacuation path. It alerts officials with higher priority. Kung hindi immediate danger, regular report muna para ma-review nang maayos.",
  },
  {
    keywords: ["nearest", "pinakamalapit", "malapit", "near me", "sa akin"],
    reply:
      "Kung hinahanap mo ang pinakamalapit na evacuation center, i-open ang Hazard Map at tap Evacuation markers. Kapag pinayagan mo ang location access sa chat, MitiGo can estimate the nearest saved center based on your current location.",
  },
  {
    keywords: ["flood", "rain", "drainage"],
    reply:
      "For flood risk in Manila: move valuables and documents to higher shelves, avoid walking or driving through floodwater, turn off electricity if water enters the house, prepare clean water and a go bag, and monitor PAGASA/barangay announcements. If water rises fast, evacuate early to the nearest center.",
  },
  {
    keywords: ["fire", "bfp", "smoke"],
    reply:
      "For fire prevention: do not overload outlets, unplug appliances after use, keep LPG tanks and matches away from heat, prepare a small extinguisher if possible, and plan two exit routes. If there is active fire, leave immediately, warn others, and call BFP or 911.",
  },
  {
    keywords: ["earthquake", "fault", "phivolcs", "quake"],
    reply:
      "For earthquakes: Drop, Cover, and Hold during shaking. After shaking stops, check for injuries, gas leaks, and damaged wiring. Do not use elevators. Keep shoes, flashlight, whistle, water, first aid, IDs, and power bank in your go bag. Follow PHIVOLCS and Manila DRRMO advisories.",
  },
  {
    keywords: ["typhoon", "storm", "wind", "pagasa"],
    reply:
      "For typhoons: monitor PAGASA updates, charge phones and power banks, secure loose roof materials and outdoor items, prepare food/water for at least 3 days, and avoid coastal or flood-prone areas. Evacuate early if your barangay advises it.",
  },
  {
    keywords: ["go bag", "bag", "kit", "emergency kit"],
    reply:
      "A basic go bag should include water, ready-to-eat food, flashlight, batteries, first aid kit, medicines, whistle, hygiene items, masks, IDs, cash, phone charger/power bank, clothes, rain protection, and copies of important documents in a waterproof pouch.",
  },
  {
    keywords: ["evacuation", "evacuate", "center", "shelter"],
    reply:
      "For evacuation: leave before routes flood or become unsafe, bring your go bag and medicines, unplug appliances, lock your home if time allows, and follow barangay/MDRRMO instructions. On the MitigatePlus map, check evacuation markers and active hazard areas. Kung may location access, I can help estimate the nearest saved evacuation center.",
  },
  {
    keywords: ["report", "ping", "hazard", "map"],
    reply:
      "To report a hazard in MitigatePlus: choose the hazard type, mark the Manila location on the map, add a clear description and photo if available, then submit. Use Emergency Ping only for active danger because it alerts officials with high priority.",
  },
  {
    keywords: ["landslide", "slope"],
    reply:
      "For landslide risk: watch for new cracks, leaning posts/trees, rumbling sounds, or sudden muddy water. Avoid steep slopes during heavy rain, keep drainage clear, and evacuate if the ground shows movement or your barangay gives a warning.",
  },
  {
    keywords: ["safe route", "route", "daan", "kalsada", "blocked"],
    reply:
      "For a safer route, avoid flooded streets, fire areas, damaged structures, open manholes, and narrow roads with crowding. Check the MitigatePlus map before leaving, follow barangay/MDRRMO instructions, and choose higher, well-lit roads when possible. If water is moving fast or above ankle level, do not cross.",
  },
  {
    keywords: ["children", "senior", "pwd", "bata", "matanda", "elderly"],
    reply:
      "For children, seniors, PWDs, and pregnant residents: evacuate earlier, keep medicines and IDs in the go bag, assign one companion per vulnerable person, and avoid crowded or flooded routes. Bring water, snacks, flashlight, hygiene items, and emergency contact details.",
  },
  {
    keywords: ["pet", "aso", "pusa", "animal"],
    reply:
      "For pets during evacuation: prepare a small pet kit with food, water, leash/carrier, vaccination record, and waste bags. Keep pets secured before opening doors. Ask the evacuation center or barangay if pets are allowed inside or where they can be safely placed.",
  },
];

const distanceInMeters = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const wantsNearestEvacuation = (message) => {
  const text = message.toLowerCase();
  const hasEvacuation = ["evacuation", "evacuate", "center", "shelter"].some((word) =>
    text.includes(word),
  );
  const hasNearest = ["nearest", "near me", "pinakamalapit", "malapit", "sa akin"].some((word) =>
    text.includes(word),
  );
  return hasEvacuation && hasNearest;
};

const buildNearestEvacuationReply = async (location) => {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    return "Para mahanap ang pinakamalapit na evacuation center, please allow location access or open the Hazard Map and check the Evacuation markers. I need your current location to estimate distance.";
  }

  const centers = await EvacuationCenter.find({ isActive: true }).lean();
  const nearest = centers
    .filter((center) => Number.isFinite(center.location?.lat) && Number.isFinite(center.location?.lng))
    .map((center) => ({
      ...center,
      distance: distanceInMeters(location.lat, location.lng, center.location.lat, center.location.lng),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest) {
    return "Wala pang active evacuation center records sa system. Please check with your barangay hall or Manila MDRRMO for the official nearest evacuation site.";
  }

  const distance =
    nearest.distance >= 1000
      ? `${(nearest.distance / 1000).toFixed(1)} km`
      : `${Math.round(nearest.distance)} m`;
  const contact = nearest.contactNumber ? ` Contact: ${nearest.contactNumber}.` : "";
  return `Ang pinakamalapit na saved evacuation center sa current location mo ay ${nearest.name}, around ${distance} away. Address: ${nearest.address}.${contact} Check the Hazard Map before going and follow barangay/MDRRMO instructions.`;
};

const buildLocalReply = async (message, location) => {
  if (wantsNearestEvacuation(message)) {
    return buildNearestEvacuationReply(location);
  }

  const text = message.toLowerCase();
  const matched = topicResponses.find((item) =>
    item.keywords.some((keyword) => includesPhraseOrToken(text, tokenize(message), keyword)),
  );
  if (matched) return matched.reply;

  if (greetingKeywords.some((word) => includesPhraseOrToken(text, tokenize(message), word))) {
    return "Hello. I am MitiGo. I can help with MitigatePlus, hazard reports, mitigation tips, evacuation centers, go bags, and Manila disaster safety.";
  }

  return "For disaster mitigation: identify the hazard, reduce exposure, prepare supplies, know your evacuation route, and follow official barangay, Manila MDRRMO, PAGASA, PHIVOLCS, or BFP guidance. Ask me a specific question like “ano gagawin kapag baha?”, “legit ba ang report?”, or “saan ang pinakamalapit na evacuation center?”";
};

const hasLocalAnswer = (message) => {
  const text = message.toLowerCase();
  const tokens = tokenize(message);
  return (
    wantsNearestEvacuation(message) ||
    topicResponses.some((item) =>
      item.keywords.some((keyword) => includesPhraseOrToken(text, tokens, keyword)),
    ) ||
    greetingKeywords.some((word) => includesPhraseOrToken(text, tokens, word))
  );
};

const getGeminiError = (error) => ({
  status: error.response?.status,
  message: error.response?.data?.error?.message || error.message,
});

const listGeminiModels = async () => {
  const response = await axios.get(
    `${GEMINI_API_BASE}/models?key=${process.env.GEMINI_API_KEY}`,
    { timeout: 10000 },
  );

  return (response.data.models || [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => model.name?.replace("models/", ""))
    .filter(Boolean);
};

const generateWithGemini = async (message) => {
  const body = {
    contents: [
      {
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nUser: ${message}\n\nMitiGo:`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 500,
      topP: 0.8,
      topK: 40,
    },
  };

  const tried = [];
  let candidates = [...new Set(GEMINI_MODEL_CANDIDATES)];
  let lastModelError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    for (const model of candidates) {
      tried.push(model);
      try {
        const response = await axios.post(
          `${GEMINI_API_BASE}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          body,
          { timeout: 15000 },
        );

        const reply =
          response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!reply) throw new Error("Gemini returned an empty response");
        return { reply, model };
      } catch (error) {
        const status = error.response?.status;
        if (status === 404) {
          lastModelError = error;
          continue;
        }
        throw error;
      }
    }

    const listedModels = await listGeminiModels();
    candidates = listedModels.filter((model) => !tried.includes(model));
    if (!candidates.length) break;
  }

  const error = new Error(`No Gemini generateContent model available. Tried: ${tried.join(", ")}`);
  error.cause = lastModelError;
  throw error;
};

// @desc    Chat with AI
// @route   POST /api/chatbot/message
router.post("/message", protect, async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message",
      });
    }

    if (!isAllowedTopic(message)) {
      return res.json({
        success: true,
        data: {
          reply:
            "Hello. I can help with MitigatePlus, hazard reporting, disaster preparedness, mitigation, prevention, weather safety, evacuation, and go bag questions. Please ask me about those topics.",
          scoped: true,
        },
      });
    }

    if (hasLocalAnswer(message)) {
      return res.json({
        success: true,
        data: {
          reply: await buildLocalReply(message, location),
          provider: "mitigo-local",
          timestamp: new Date(),
        },
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: {
          reply: await buildLocalReply(message, location),
          fallback: true,
        },
      });
    }

    const { reply, model } = await generateWithGemini(message);

    res.json({
      success: true,
      data: {
        reply,
        provider: "gemini",
        model,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Chatbot Gemini error:", getGeminiError(error));

    // Fallback response if API fails
    const fallbackResponses = [
      "I understand you have a question about disaster preparedness. While I'm experiencing some technical difficulties, here's a quick tip: Always keep your go bag ready with essentials like water, food, first aid kit, and important documents.",
      "For emergency assistance, contact Manila MDRRMO at your barangay hall or call the emergency hotlines: 911 (Emergency) or 117 (BFP).",
      "Preparation is key! Make sure you know your evacuation route and have a family emergency plan in place. Would you like specific tips for your area?",
      "During typhoon season, monitor PAGASA updates regularly and prepare sandbags if you're in a flood-prone area. Stay safe!",
    ];

    const randomFallback =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({
      success: true,
      data: {
        reply: randomFallback,
        fallback: true,
      },
    });
  }
});

module.exports = router;
