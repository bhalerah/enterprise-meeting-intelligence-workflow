require("dotenv").config();
const fs = require("fs");
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callOpenAI(systemPrompt, userContent) {
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
function validateMeetingAnalysis(data) {
  const requiredFields = [
    "executive_summary",
    "key_decisions",
    "risks",
    "action_items",
    "stakeholders_impacted",
    "follow_up_questions",
    "release_readiness_score",
    "overall_risk_level",
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const score = Number(data.release_readiness_score);
  if (Number.isNaN(score) || score < 1 || score > 10) {
    throw new Error("release_readiness_score must be a number from 1 to 10");
  }

  const validRiskLevels = ["Low", "Medium", "High"];
  if (!validRiskLevels.includes(data.overall_risk_level)) {
    throw new Error("overall_risk_level must be Low, Medium, or High");
  }

  return true;
}
function validateReleaseRecommendation(data) {
  const requiredFields = [
    "release_recommendation",
    "recommendation_confidence",
    "business_justification",
    "approval_conditions",
    "required_mitigations",
    "escalation_needed",
    "executive_message",
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field in release recommendation: ${field}`);
    }
  }

  const validRecommendations = ["Approve", "Approve with Conditions", "Delay"];
  if (!validRecommendations.includes(data.release_recommendation)) {
    throw new Error("release_recommendation must be Approve, Approve with Conditions, or Delay");
  }

  const validConfidence = ["Low", "Medium", "High"];
  if (!validConfidence.includes(data.recommendation_confidence)) {
    throw new Error("recommendation_confidence must be Low, Medium, or High");
  }

  const validEscalation = ["Yes", "No"];
  if (!validEscalation.includes(data.escalation_needed)) {
    throw new Error("escalation_needed must be Yes or No");
  }

  return true;
}
async function run() {
  const transcript = fs.readFileSync("./data/transcript.txt", "utf8");

  const meetingSummaryPrompt = fs.readFileSync(
    "./prompts/meeting-summary-system.txt",
    "utf8"
  );

  const releaseRecommendationPrompt = fs.readFileSync(
    "./prompts/release-recommendation-system.txt",
    "utf8"
  );

  console.log("\n--- Stage 1: Meeting Analysis ---\n");

  const meetingAnalysis = await callOpenAI(meetingSummaryPrompt, transcript);
  console.log(JSON.stringify(meetingAnalysis, null, 2));
  fs.writeFileSync(
  "./outputs/meeting-analysis.json",
  JSON.stringify(meetingAnalysis, null, 2)
);
validateMeetingAnalysis(meetingAnalysis);
console.log("\nStage 1 validation passed.");
  console.log("\n--- Stage 2: Release Recommendation ---\n");

  const releaseRecommendation = await callOpenAI(
    releaseRecommendationPrompt,
    JSON.stringify(meetingAnalysis)
  );

  console.log(JSON.stringify(releaseRecommendation, null, 2));
  fs.writeFileSync(
  "./outputs/release-recommendation.json",
  JSON.stringify(releaseRecommendation, null, 2)
);
validateReleaseRecommendation(releaseRecommendation);
console.log("\nStage 2 validation passed.");
}

run().catch((error) => {
  console.error("Error running multi-step workflow:", error.message);
  
});