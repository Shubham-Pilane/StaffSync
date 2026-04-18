const { GoogleGenAI } = require("@google/genai");
const { User, Attendance, StatusLog } = require("../models");
const { Op } = require("sequelize");

console.log("--- AI Controller (NEW SDK) LOADED ---");

// ✅ Initialize AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🧠 AI function
async function generateInsights(prompt) {
  try {
    console.log("[AI] Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("[AI] Response received");

    if (!response || !response.text) {
      throw new Error("Empty AI response");
    }

    return response.text;
  } catch (err) {
    console.error("[AI ERROR]:", err.message);
    throw err;
  }
}

exports.getEmployeeInsights = async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[REQ:${requestId}] --- NEW INSIGHTS REQUEST ---`);

  try {
    const { userId } = req.params;
    console.log(`[REQ:${requestId}] Target User ID: ${userId}`);

    // 👤 Get employee
    const employee = await User.findByPk(userId);
    if (!employee) {
      console.error(`[REQ:${requestId}] Employee not found`);
      return res.status(404).json({ error: "Employee not found" });
    }

    console.log(
      `[REQ:${requestId}] Employee Found: ${employee.name} (${employee.role})`
    );

    // 🕒 10 AM cycle logic
    const now = new Date();
    const cycleStart = new Date(now);
    cycleStart.setHours(10, 0, 0, 0);

    if (now < cycleStart) {
      cycleStart.setDate(cycleStart.getDate() - 1);
    }

    console.log(`[REQ:${requestId}] Cycle Start: ${cycleStart.toISOString()}`);

    // 🕒 Fetch Activity Logs (Tea break, Lunch, Meeting, Idle)
    const activityLogs = await StatusLog.findAll({
      where: {
        userId,
        startTime: { [Op.gte]: cycleStart }
      }
    });
    console.log(`[REQ:${requestId}] Found ${activityLogs.length} activity state logs.`);

    const statusMins = {};
    activityLogs.forEach(log => {
      const start = new Date(log.startTime);
      const end = log.endTime ? new Date(log.endTime) : now;
      const duration = (end - start) / 1000 / 60; // to minutes
      statusMins[log.status] = (statusMins[log.status] || 0) + duration;
    });

    const detailedActivity = Object.entries(statusMins)
      .map(([s, m]) => `- ${s.toUpperCase()}: ${Math.round(m)} minutes`)
      .join('\n');

    // 📊 Fetch attendance sessions
    const history = await Attendance.findAll({
      where: { userId },
      order: [["checkIn", "DESC"]],
    });

    console.log(`[REQ:${requestId}] Found ${history.length} attendance records`);

    let activeMs = 0;
    let sessionsCount = 0;

    history.forEach((session) => {
      const checkIn = new Date(session.checkIn);
      const checkOut = session.checkOut ? new Date(session.checkOut) : now;

      if (checkOut < cycleStart) return;

      const effectiveStart = checkIn < cycleStart ? cycleStart : checkIn;

      if (checkOut > effectiveStart) {
        activeMs += checkOut - effectiveStart;
        sessionsCount++;
      }
    });

    const activeHours = (activeMs / (1000 * 60 * 60)).toFixed(1);
    console.log(`[REQ:${requestId}] Stats: ${activeHours} hrs, ${sessionsCount} sessions`);

    // 🧠 The "Ultimate" Prompt
    const prompt = `
Employee: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}

Status Breakdown (TOTAL time spent in these states today):
${detailedActivity || "- No breaks or meetings recorded yet (he remained Active)."}

Work Summary (Total sessions since 10AM):
- Total Active Time: ${activeHours} hours
- Number of Sessions: ${sessionsCount}
- Estimated Breaks: ${sessionsCount > 0 ? sessionsCount - 1 : 0}
- Current Manual Status: ${employee.status}

Tasks:
1. Summarize how he spent his time (Focus on Tea Breaks, Lunch, Meetings, Idle time).
2. Note if he spent too long in any non-work status.
3. Suggest an action for the manager.

Rules:
- DO NOT use markdown characters (No #, No *).
- DO NOT use asterisks (**).
- Use plain text only.
- Use simple line breaks between points.
- Use capital letters for emphasis instead of bolding.

Keep response short, professional, and clear.
`;

    console.log(`[REQ:${requestId}] Sending prompt to AI...`);

    // 🤖 Call AI
    const text = await generateInsights(prompt);

    console.log(`[REQ:${requestId}] ✅ SUCCESS`);

    return res.json({
      success: true,
      insights: text,
    });
  } catch (error) {
    console.error(`[REQ:${requestId}] ❌ ERROR:`, error);
    return res.status(500).json({
      error: error.message || "AI failed",
    });
  }
};