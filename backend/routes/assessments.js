const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");
const ActivityLog = require("../models/ActivityLog");
const { protect, authorize } = require("../middleware/auth");

// Assessment questions data (10 questions per hazard type)
const assessmentQuestions = {
  Flood: [
    {
      id: "q1",
      question: "How close is your home to the nearest river or creek?",
      options: ["More than 500m", "200-500m", "50-200m", "Less than 50m"],
    },
    {
      id: "q2",
      question: "How would you describe the drainage system near your home?",
      options: [
        "Excellent, well-maintained",
        "Good, occasional clogs",
        "Poor, often clogged",
        "No drainage system",
      ],
    },
    {
      id: "q3",
      question: "Has your area experienced flooding in the past 5 years?",
      options: ["Never", "Once or twice", "Multiple times", "Every year"],
    },
    {
      id: "q4",
      question: "What is the elevation of your area?",
      options: [
        "High ground",
        "Slight elevation",
        "Low area",
        "Below sea level",
      ],
    },
    {
      id: "q5",
      question: "How prepared is your household for flooding?",
      options: [
        "Fully prepared with emergency plan",
        "Somewhat prepared",
        "Minimal preparation",
        "No preparation at all",
      ],
    },
    {
      id: "q6",
      question: "Do you have flood insurance or financial contingency?",
      options: [
        "Yes, comprehensive coverage",
        "Partial coverage",
        "Only government assistance",
        "No coverage or savings",
      ],
    },
    {
      id: "q7",
      question: "How often are canals or waterways near your home cleaned?",
      options: ["Monthly", "Quarterly", "Twice a year", "Never / rarely"],
    },
    {
      id: "q8",
      question: "Do you have a sump pump or water removal equipment?",
      options: [
        "Yes, high-capacity pump",
        "Basic pump or wet vacuum",
        "Only buckets and manual tools",
        "No equipment",
      ],
    },
    {
      id: "q9",
      question: "How quickly can you receive flood warnings?",
      options: [
        "Instant (mobile alerts + siren)",
        "Within minutes (radio/TV)",
        "Only from neighbours",
        "No warning system",
      ],
    },
    {
      id: "q10",
      question: "Is your home built with flood-resistant materials?",
      options: [
        "Yes, elevated and water‑resistant",
        "Partially resistant",
        "Standard construction",
        "Light materials only",
      ],
    },
  ],
  Fire: [
    {
      id: "q1",
      question: "How close is the nearest fire station?",
      options: ["Less than 1km", "1-3km", "3-5km", "More than 5km"],
    },
    {
      id: "q2",
      question: "What is the primary construction material of your home?",
      options: [
        "Concrete/brick",
        "Mixed materials",
        "Wood with fire treatment",
        "Untreated wood/light materials",
      ],
    },
    {
      id: "q3",
      question: "Do you have fire safety equipment at home?",
      options: [
        "Fire extinguisher + alarm + sprinkler",
        "Fire extinguisher + alarm",
        "Fire extinguisher only",
        "No fire safety equipment",
      ],
    },
    {
      id: "q4",
      question: "How would you rate electrical wiring in your home?",
      options: [
        "Professional, recently inspected",
        "Professional, older installation",
        "DIY with some professional help",
        "Old/faulty/overloaded wiring",
      ],
    },
    {
      id: "q5",
      question: "What is your fire escape plan status?",
      options: [
        "Written plan, practiced regularly",
        "Written plan, not practiced",
        "Verbal plan only",
        "No escape plan",
      ],
    },
    {
      id: "q6",
      question: "Are flammable materials stored safely?",
      options: [
        "Yes, in fire‑proof cabinets",
        "In separate outdoor shed",
        "Stored away from heat sources",
        "Stored randomly / unsafely",
      ],
    },
    {
      id: "q7",
      question: "How often do you test smoke alarms?",
      options: [
        "Monthly",
        "Every 3 months",
        "Annually",
        "Never / don't have alarms",
      ],
    },
    {
      id: "q8",
      question:
        "Do you have a meeting point for family members in case of fire?",
      options: [
        "Yes, and we practice it",
        "Yes, but never practiced",
        "We have discussed it",
        "No meeting point",
      ],
    },
    {
      id: "q9",
      question:
        "Is your kitchen equipped with a fire blanket or automatic shut‑off?",
      options: [
        "Both fire blanket and auto shut‑off",
        "Only fire blanket",
        "Only auto shut‑off on stove",
        "None",
      ],
    },
    {
      id: "q10",
      question: "Are escape routes free from obstruction?",
      options: [
        "Yes, always clear and accessible",
        "Mostly clear, occasional blockage",
        "Sometimes cluttered",
        "Often blocked",
      ],
    },
  ],
  Landslide: [
    {
      id: "q1",
      question: "Is your home located on or near a slope?",
      options: [
        "Flat terrain",
        "Gentle slope (<15°)",
        "Moderate slope (15-30°)",
        "Steep slope (>30°)",
      ],
    },
    {
      id: "q2",
      question: "What is the soil condition around your area?",
      options: [
        "Solid rock base",
        "Compacted soil",
        "Loose soil",
        "Cracked/unstable ground",
      ],
    },
    {
      id: "q3",
      question: "Have there been landslides in your area before?",
      options: [
        "Never",
        "Over 20 years ago",
        "Within last 10 years",
        "Within last 5 years",
      ],
    },
    {
      id: "q4",
      question: "What is the vegetation cover on nearby slopes?",
      options: [
        "Dense forest cover",
        "Moderate vegetation",
        "Sparse vegetation",
        "Bare/denuded land",
      ],
    },
    {
      id: "q5",
      question: "Is there visible cracking on the ground or structures?",
      options: [
        "No visible cracks",
        "Minor hairline cracks",
        "Noticeable cracks",
        "Large/severe cracking",
      ],
    },
    {
      id: "q6",
      question: "How is the water drainage on the slope?",
      options: [
        "Well‑designed drainage channels",
        "Adequate natural drainage",
        "Poor drainage, some pooling",
        "Water flows directly toward structures",
      ],
    },
    {
      id: "q7",
      question:
        "Have retaining walls or other protective structures been built?",
      options: [
        "Yes, engineered retaining wall",
        "Yes, simple gabion wall",
        "Only minor reinforcements",
        "No protective structures",
      ],
    },
    {
      id: "q8",
      question: "Do you hear unusual sounds like cracking or rumbling?",
      options: [
        "Never",
        "Very rarely",
        "Sometimes after heavy rain",
        "Frequently",
      ],
    },
    {
      id: "q9",
      question: "How quickly can you evacuate to safe high ground?",
      options: [
        "Less than 10 minutes",
        "10–30 minutes",
        "30–60 minutes",
        "Over an hour / no clear route",
      ],
    },
    {
      id: "q10",
      question:
        "Are there any recent excavations or construction on the slope?",
      options: [
        "No excavations",
        "Minor landscaping",
        "Cutting into the slope for roads",
        "Major excavation / quarrying",
      ],
    },
  ],
  "Fault Line": [
    {
      id: "q1",
      question: "Distance from the nearest known fault line?",
      options: ["More than 10km", "5-10km", "1-5km", "Less than 1km"],
    },
    {
      id: "q2",
      question: "What year was your building constructed?",
      options: ["After 2010", "2000-2010", "1990-2000", "Before 1990"],
    },
    {
      id: "q3",
      question: "Has your building undergone seismic retrofitting?",
      options: [
        "Yes, full retrofitting",
        "Partial retrofitting",
        "Planned but not done",
        "No retrofitting",
      ],
    },
    {
      id: "q4",
      question: "What is the building type?",
      options: [
        "Modern earthquake-resistant",
        "Reinforced concrete",
        "Mixed construction",
        "Unreinforced masonry",
      ],
    },
    {
      id: "q5",
      question: "Do you have earthquake preparedness supplies?",
      options: [
        "Complete emergency kit + plan",
        "Basic emergency supplies",
        "Minimal supplies",
        "No supplies at all",
      ],
    },
    {
      id: "q6",
      question: "How secure are heavy furniture and appliances?",
      options: [
        "All anchored to walls",
        "Some anchored, some braced",
        "Only a few secured",
        "Nothing secured",
      ],
    },
    {
      id: "q7",
      question: "Is your home's foundation bolted to the structure?",
      options: [
        "Yes, professionally bolted",
        "Partially bolted",
        "Unsure",
        "No, it's simply resting",
      ],
    },
    {
      id: "q8",
      question: "Do you practice earthquake drills (Drop, Cover, Hold)?",
      options: ["Monthly", "Quarterly", "Annually", "Never"],
    },
    {
      id: "q9",
      question:
        "Are there any large bookshelves, cabinets, or mirrors near exits?",
      options: [
        "No, all exits are clear",
        "One small item near exit",
        "Some obstacles near exits",
        "Exits heavily blocked",
      ],
    },
    {
      id: "q10",
      question:
        "Do you have a designated safe space in each room (under sturdy table)?",
      options: [
        "Yes, and marked clearly",
        "Yes, but not marked",
        "Only in some rooms",
        "No safe spaces identified",
      ],
    },
  ],
  Typhoon: [
    {
      id: "q1",
      question: "How would you describe your roof condition?",
      options: [
        "New/professionally maintained",
        "Good, minor repairs needed",
        "Fair, some leaks",
        "Poor, major repairs needed",
      ],
    },
    {
      id: "q2",
      question: "Are there large trees or structures near your home?",
      options: [
        "No hazards nearby",
        "Few small trees",
        "Some large trees",
        "Many large trees/poles",
      ],
    },
    {
      id: "q3",
      question: "Do you have storm shutters or window protection?",
      options: [
        "Full storm protection",
        "Partial protection",
        "Temporary measures only",
        "No protection",
      ],
    },
    {
      id: "q4",
      question: "How do you receive weather warnings?",
      options: [
        "Multiple sources + alerts",
        "Radio/TV + alerts",
        "Neighbor/community only",
        "No reliable source",
      ],
    },
    {
      id: "q5",
      question: "What is your evacuation readiness?",
      options: [
        "Go bag ready + planned route",
        "Go bag partially ready",
        "Know evacuation center location",
        "No preparation",
      ],
    },
    {
      id: "q6",
      question:
        "Have you trimmed branches and removed dead trees near your home?",
      options: [
        "Yes, recently done",
        "Done more than a year ago",
        "Partially done",
        "Never",
      ],
    },
    {
      id: "q7",
      question: "Are your gutters and downspouts clear and functional?",
      options: [
        "Yes, cleaned regularly",
        "Mostly clean",
        "Occasionally clogged",
        "Completely blocked",
      ],
    },
    {
      id: "q8",
      question:
        "Do you have alternative power sources (generator, power bank)?",
      options: [
        "Yes, generator + power banks",
        "Only power banks",
        "Only candles / flashlight",
        "No backup power",
      ],
    },
    {
      id: "q9",
      question: "Is your house anchored with hurricane straps or bolts?",
      options: [
        "Yes, fully anchored",
        "Partially anchored",
        "Not sure",
        "No anchoring",
      ],
    },
    {
      id: "q10",
      question: "Do you keep outdoor furniture and decorations secured?",
      options: [
        "Always tie down or bring inside",
        "Only when storm is imminent",
        "Rarely secure them",
        "Never, they stay outside",
      ],
    },
  ],
  "Drainage Issue": [
    {
      id: "q1",
      question: "Condition of canals/drainage near your home?",
      options: [
        "Well-maintained, regularly cleaned",
        "Mostly clean",
        "Often clogged",
        "Completely blocked",
      ],
    },
    {
      id: "q2",
      question: "Does water pool near your home after rain?",
      options: [
        "Never",
        "Only during heavy rain",
        "Moderate rain",
        "Even with light rain",
      ],
    },
    {
      id: "q3",
      question: "What is your waste disposal method?",
      options: [
        "Proper waste collection",
        "Occasional burning",
        "Dispose in vacant lots",
        "Throw in waterways",
      ],
    },
    {
      id: "q4",
      question: "Are you aware of proper drainage maintenance?",
      options: [
        "Yes, actively participate",
        "Aware but don't participate",
        "Somewhat aware",
        "No awareness",
      ],
    },
    {
      id: "q5",
      question: "Has your barangay conducted drainage cleanup?",
      options: ["Monthly", "Quarterly", "Annually", "Never"],
    },
    {
      id: "q6",
      question:
        "Do you have a rain garden or permeable pavement to absorb runoff?",
      options: [
        "Yes, both installed",
        "Only rain garden",
        "Only permeable pavement",
        "Neither, all paved/concrete",
      ],
    },
    {
      id: "q7",
      question:
        "Are there open manholes or broken drainage covers near your home?",
      options: [
        "No, all covers secure",
        "One or two slightly loose",
        "Several broken/missing",
        "Completely missing, exposed",
      ],
    },
    {
      id: "q8",
      question:
        "Does your household properly separate and dispose of solid waste?",
      options: [
        "Yes, segregation and scheduled pickup",
        "Segregate but inconsistent pickup",
        "No segregation",
        "Open dumping",
      ],
    },
    {
      id: "q9",
      question: "Are you familiar with the barangay drainage master plan?",
      options: [
        "Yes, I help implement it",
        "I know it exists",
        "Vaguely aware",
        "No plan exists",
      ],
    },
    {
      id: "q10",
      question: "How often do you check and clear your own drainage channels?",
      options: ["Weekly", "Monthly", "Only before rainy season", "Never"],
    },
  ],
  "Structural Damage": [
    {
      id: "q1",
      question: "Visible cracks in walls or foundation?",
      options: [
        "No cracks",
        "Hairline cracks (<1mm)",
        "Minor cracks (1-3mm)",
        "Major cracks (>3mm)",
      ],
    },
    {
      id: "q2",
      question: "Condition of support beams/columns?",
      options: [
        "Excellent, no issues",
        "Minor surface cracks",
        "Visible rust/deterioration",
        "Severe damage/bowing",
      ],
    },
    {
      id: "q3",
      question: "Has the building been inspected by an engineer?",
      options: [
        "Yes, within last year",
        "Yes, within 3 years",
        "Yes, more than 3 years ago",
        "Never inspected",
      ],
    },
    {
      id: "q4",
      question: "Are there signs of water damage or leaks?",
      options: [
        "No water damage",
        "Minor staining",
        "Active small leaks",
        "Major water intrusion",
      ],
    },
    {
      id: "q5",
      question: "Building age and maintenance history?",
      options: [
        "<10 years, well-maintained",
        "10-20 years, maintained",
        "20-30 years, some maintenance",
        ">30 years, poor maintenance",
      ],
    },
    {
      id: "q6",
      question: "Are there sagging floors or uneven doorframes?",
      options: [
        "No, everything is level",
        "Slight unevenness",
        "Noticeable sagging",
        "Doors/windows won't close properly",
      ],
    },
    {
      id: "q7",
      question: "Is the roof structure showing signs of failure?",
      options: [
        "No, solid and dry",
        "Minor leaks, no sagging",
        "Visible sagging, leaks",
        "Severe sagging, risk of collapse",
      ],
    },
    {
      id: "q8",
      question: "Has any part of the building been modified without permits?",
      options: [
        "No modifications",
        "Minor non‑structural changes",
        "Added rooms or extensions",
        "Major unauthorized renovations",
      ],
    },
    {
      id: "q9",
      question:
        "Are there signs of termite or pest damage in load‑bearing wood?",
      options: [
        "No signs",
        "Minor surface damage",
        "Moderate damage, repaired",
        "Severe, untreated damage",
      ],
    },
    {
      id: "q10",
      question:
        "Do you have a maintenance log or schedule for structural checks?",
      options: [
        "Yes, detailed log and reminders",
        "Informal notes",
        "Rely on memory",
        "No tracking at all",
      ],
    },
  ],
};

// Personalized mitigation tips based on weak areas
const generatePersonalizedTips = (hazardType, weakAreas, riskScore) => {
  const tipsMap = {
    Flood: {
      q1: "Your proximity to a water source puts you at risk. Elevate your home if possible, build flood barriers, and prepare sandbags during rainy season.",
      q2: "Improve drainage around your property by cleaning canals regularly and installing proper drainage channels.",
      q3: "Given your area's flooding history, invest in waterproof storage for important documents and valuables.",
      q4: "Low elevation increases flood risk. Consider raising electrical outlets and appliances above potential flood levels.",
      q5: "Create a comprehensive flood emergency plan. Practice evacuation routes with your family regularly.",
      q6: "Without insurance, recovery is difficult. Explore government‑backed disaster insurance or set aside emergency funds.",
      q7: "Infrequent waterway cleaning causes blockages. Advocate for regular community canal maintenance.",
      q8: "Having a pump can greatly reduce indoor flooding. Invest in a sump pump or water‑removal equipment.",
      q9: "Early warning saves lives. Register for local flood alerts and keep a battery‑powered radio.",
      q10: "Flood‑resistant materials reduce damage. Consider elevating your home and using waterproof building materials.",
      baseline: [
        "Keep emergency contact numbers readily available.",
        "Monitor PAGASA weather updates during rainy season.",
      ],
    },
    Fire: {
      q1: "Distance from fire station matters. Install smoke detectors and fire alarms to ensure early warning.",
      q2: "Your building materials may be fire‑prone. Apply fire‑retardant treatments and limit combustible materials.",
      q3: "Invest in proper fire safety equipment. A fire extinguisher can prevent small fires from becoming disasters.",
      q4: "Have your electrical system inspected by a licensed electrician. Avoid overloading circuits.",
      q5: "Develop and practice a fire escape plan with multiple exit routes. Conduct regular fire drills.",
      q6: "Store flammable materials in fire‑proof cabinets away from heat sources.",
      q7: "Test smoke alarms monthly. Replace batteries at least once a year.",
      q8: "Agree on a family meeting point outside the home and practice reaching it calmly.",
      q9: "Install a fire blanket and automatic stove shut‑off to contain kitchen fires quickly.",
      q10: "Keep escape routes clear. Even small clutter can be dangerous during a fire.",
      baseline: [
        "Keep a fire extinguisher accessible on every floor.",
        "Save emergency hotlines: BFP 117.",
      ],
    },
    Landslide: {
      q1: "Living on or near a slope increases landslide risk. Consult a geotechnical engineer for slope stability assessment.",
      q2: "Loose soil can trigger landslides. Improve soil cohesion with deep‑rooted vegetation.",
      q3: "If landslides have occurred nearby, reinforce your property with retaining walls and drainage.",
      q4: "Bare slopes are dangerous. Plant native trees and shrubs to anchor the soil.",
      q5: "Visible cracks indicate ground movement. Monitor them closely and report to local DRRMO.",
      q6: "Poor drainage on slopes worsens stability. Redirect water flow away from steep areas.",
      q7: "Retaining walls reduce risk. Build engineered structures and maintain them regularly.",
      q8: "Unusual sounds may signal impending landslide. Evacuate immediately if you hear cracking or rumbling.",
      q9: "Ensure you can reach safe high ground in under 10 minutes. Pre‑pack a go bag.",
      q10: "Excavation and construction can destabilize slopes. Avoid cutting into slopes without professional guidance.",
      baseline: [
        "Evacuate immediately if you hear unusual sounds like rumbling or see tilted trees.",
        "Know the nearest safe elevated area and evacuation route.",
      ],
    },
    "Fault Line": {
      q1: "Proximity to a fault line demands earthquake‑resistant construction. Consult a structural engineer.",
      q2: "Older buildings may not meet modern seismic codes. Retrofitting can save lives.",
      q3: "Seismic retrofitting strengthens your structure. Even partial reinforcement helps.",
      q4: "Unreinforced masonry is the most dangerous in earthquakes. Prioritize strengthening walls and connections.",
      q5: "Without supplies, survival is difficult. Build a disaster kit with food, water, first aid, and tools.",
      q6: "Secure heavy furniture and appliances to walls to prevent toppling and injuries.",
      q7: "Bolting your foundation to the structure prevents sliding off the foundation during quakes.",
      q8: "Regular drills save lives. Practice Drop, Cover, and Hold On monthly.",
      q9: "Clear exits ensure quick evacuation. Remove large furniture from near doorways.",
      q10: "Identify a sturdy table or desk in each room for immediate cover during shaking.",
      baseline: [
        "Secure heavy furniture and appliances to walls to prevent toppling.",
        "Practice Drop, Cover, and Hold On drills regularly.",
      ],
    },
    Typhoon: {
      q1: "A damaged roof can lead to catastrophic damage. Repair or reinforce it before typhoon season.",
      q2: "Large trees or poles near your home can fall. Trim branches and secure loose structures.",
      q3: "Without window protection, flying debris can cause injury. Install storm shutters or board up windows.",
      q4: "Reliable weather warnings are crucial. Get a battery‑powered radio and subscribe to alerts.",
      q5: "An evacuation plan saves lives. Pre‑pack a go bag and agree on a family meeting point.",
      q6: "Trim overhanging branches and remove dead trees to prevent damage from high winds.",
      q7: "Clean gutters prevent water damage and reduce roof stress during heavy rain.",
      q8: "Power outages are common. Keep a generator or fully charged power banks ready.",
      q9: "Hurricane straps anchor your roof to the walls. Install them to reduce structural failure.",
      q10: "Secure or bring inside all outdoor items to prevent them from becoming projectiles.",
      baseline: [
        "Bring outdoor furniture indoors or tie it down securely.",
        "Stay updated with PAGASA bulletins and local advisories.",
      ],
    },
    "Drainage Issue": {
      q1: "Clogged drainage causes flooding. Organize regular community canal clean‑ups.",
      q2: "Pooling water breeds disease. Improve your property’s drainage gradient.",
      q3: "Improper waste disposal worsens blockages. Advocate for proper waste segregation and pickup.",
      q4: "Community participation is key. Join or initiate a barangay drainage maintenance program.",
      q5: "Infrequent clean‑ups lead to chronic flooding. Push for monthly barangay‑led drainage checks.",
      q6: "Rain gardens and permeable surfaces absorb runoff. Replace impermeable concrete with porous materials.",
      q7: "Broken manhole covers are safety hazards. Report them to the barangay immediately.",
      q8: "Proper waste segregation prevents blockages. Practice it diligently and support scheduled pickup.",
      q9: "Knowing the drainage master plan helps you take action. Request a copy from the barangay office.",
      q10: "Regular home drainage checks prevent buildup. Make it a weekly habit.",
      baseline: [
        "Dispose of waste responsibly—never throw trash into waterways.",
        "Report blocked drainage to your barangay immediately.",
      ],
    },
    "Structural Damage": {
      q1: "Cracks wider than 3mm need immediate professional inspection. Do not ignore them.",
      q2: "Damaged beams or columns can lead to collapse. Consult a structural engineer for reinforcement.",
      q3: "Regular inspections catch problems early. Have your building assessed every 2–3 years.",
      q4: "Water damage weakens materials over time. Fix leaks promptly and repaint with waterproof paint.",
      q5: "Older buildings require more maintenance. Create a schedule for checks and repairs.",
      q6: "Sagging floors indicate foundation issues. Contact an engineer to assess and repair.",
      q7: "Roof failure is dangerous. Replace damaged sections and reinforce with hurricane ties.",
      q8: "Unauthorized modifications can compromise safety. Consult an engineer before any extension.",
      q9: "Termite damage in load‑bearing wood can cause collapse. Treat infestations immediately.",
      q10: "Keep a maintenance log to track inspections and repairs. It helps identify patterns early.",
      baseline: [
        "Contact the City Engineering Office for structural assessment programs.",
        "If you suspect serious damage, evacuate and seek professional help.",
      ],
    },
  };

  const hazardTips = tipsMap[hazardType] || tipsMap["Flood"];
  const personalizedTips = [];

  if (weakAreas && weakAreas.length > 0) {
    weakAreas.forEach((area) => {
      if (hazardTips[area]) {
        personalizedTips.push(hazardTips[area]);
      }
    });
  }

  if (hazardTips.baseline) {
    hazardTips.baseline.forEach((tip) => personalizedTips.push(tip));
  }

  if (personalizedTips.length === 0) {
    personalizedTips.push(
      "Continue maintaining your current safety practices.",
    );
    personalizedTips.push("Stay informed about hazards in your area.");
  }

  return personalizedTips.slice(0, 10);
};

// Generate evaluation paragraph (unchanged)
const generateEvaluation = (hazardType, riskLevel, riskScore, percentage) => {
  const evaluations = {
    low: `Based on your assessment, your ${hazardType.toLowerCase()} risk is LOW (${percentage}%). Your current practices and location factors provide good protection. Continue maintaining safety measures and stay informed about potential hazard changes in your area.`,
    moderate: `Your ${hazardType.toLowerCase()} risk level is MODERATE (${percentage}%). While some protective factors exist, there are areas that need improvement. Taking corrective actions on the identified weak areas can significantly reduce your risk exposure.`,
    high: `URGENT: Your ${hazardType.toLowerCase()} risk assessment shows HIGH risk (${percentage}%). Immediate action is needed to address critical vulnerabilities. Prioritize implementing the recommended mitigation measures and contact your local DRRMO for assistance.`,
  };

  return evaluations[riskLevel] || evaluations["low"];
};

// @desc    Submit assessment
// @route   POST /api/assessments
router.post("/", protect, async (req, res) => {
  try {
    const { hazardType, answers } = req.body;

    // Calculate risk score
    let totalPossibleScore = 0;
    let actualScore = 0;

    Object.keys(answers).forEach((questionId) => {
      const score = parseInt(answers[questionId]);
      actualScore += score;
      totalPossibleScore += 4;
    });

    const percentage = Math.round((actualScore / totalPossibleScore) * 100);
    let riskLevel;

    if (percentage <= 35) {
      riskLevel = "low";
    } else if (percentage <= 65) {
      riskLevel = "moderate";
    } else {
      riskLevel = "high";
    }

    const weakAreas = Object.keys(answers).filter((qId) => {
      const score = parseInt(answers[qId]);
      return score >= 3;
    });

    const tips = generatePersonalizedTips(hazardType, weakAreas, percentage);
    const evaluation = generateEvaluation(
      hazardType,
      riskLevel,
      percentage,
      percentage,
    );

    const governmentActions = [
      "Contact your Barangay Disaster Risk Reduction and Management Office (DRRMO) for local assistance.",
      "Register for free community disaster preparedness training from MDRRMO.",
      "Report hazards to your barangay officials through the MitigatePlus app.",
    ];

    const assessment = await Assessment.create({
      userId: req.user._id,
      hazardType,
      answers,
      riskScore: percentage,
      riskLevel,
      recommendations: tips,
      weakAreas,
    });

    await ActivityLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: "ASSESSMENT_COMPLETED",
      details: `Completed ${hazardType} assessment - Risk: ${riskLevel.toUpperCase()} (${percentage}%)`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        assessment,
        evaluation,
        tips,
        governmentActions,
        percentage,
        weakAreas,
      },
    });
  } catch (error) {
    console.error("Submit assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting assessment",
    });
  }
});

// @desc    Get all assessments (admin)
// @route   GET /api/assessments
router.get("/", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate("userId", "name email barangay")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    console.error("Get assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching assessments",
    });
  }
});

// @desc    Get user assessments
// @route   GET /api/assessments/user/:id
router.get("/user/:id", protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ userId: req.params.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    console.error("Get user assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user assessments",
    });
  }
});

// @desc    Get assessment questions
// @route   GET /api/assessments/questions/:type
router.get("/questions/:type", async (req, res) => {
  try {
    const questions = assessmentQuestions[req.params.type];

    if (!questions) {
      return res.status(404).json({
        success: false,
        message: "Assessment questions not found for this hazard type",
      });
    }

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching assessment questions",
    });
  }
});

module.exports = router;
