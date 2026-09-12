import express from "express";
import { getSuggestions, getModelStats } from "../services/aiRecommendationService.js";

const router = express.Router();

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
 * GET /api/ai/stats
 * Model health and dataset distribution statistics.
 */
router.get("/stats", async (req, res) => {
  try {
    const data = await getModelStats();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
