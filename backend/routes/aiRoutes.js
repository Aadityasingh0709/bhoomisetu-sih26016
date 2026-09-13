import express from "express";
import { getSuggestions, getModelStats, chatWithAssistant, predictRisk } from "../services/aiRecommendationService.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// AI can expose project and case context; it is never a public endpoint.
router.use(protect);

/**
 * POST /api/ai/suggest
 * Get KNN-based resolution suggestions for a bottleneck.
 * Body: { department, issue_type, issue_description, severity, urgency, k }
 */
router.post("/suggest", async (req, res) => {
  try {
    const result = await getSuggestions(req.body);
    res.json({
      success: true,
      suggestions: result.suggestions || [],
      recommendation: result.recommendation || null,
      total_cases: result.total_cases || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/ai/chat
 * Conversational follow-up assistant for bottlenecks and precedents.
 */
router.post("/chat", async (req, res) => {
  try {
    const result = await chatWithAssistant(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/risk/predict", async (req, res) => {
  try {
    const result = await predictRisk(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(503).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/ai/stats
 * Model health and dataset distribution statistics.
 */
router.get("/stats", restrictTo("Administrator", "SeniorOfficer", "ProjectManager"), async (req, res) => {
  try {
    const data = await getModelStats();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
