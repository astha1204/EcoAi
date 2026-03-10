// src/services/geminiService.js
const config = require("../config");
const Logger = require("../utils/logger");

const GeminiService = {
  async call(prompt, moduleName) {
    const url = `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.gemini.temperature,
        maxOutputTokens: config.gemini.maxOutputTokens,
      },
    };

    const start = Date.now();
    let rawText = "";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || `Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // ── TEMPORARY DEBUG — shows raw Gemini output in terminal ──
      console.log("======= GEMINI RAW RESPONSE =======");
      console.log(rawText);
      console.log("===================================");

      if (!rawText) throw new Error("Empty response from Gemini");

      const parsed = GeminiService.parseJSON(rawText);
      const duration = Date.now() - start;

      Logger.aiCall({ module: moduleName, prompt, response: parsed, status: "OK", durationMs: duration });
      return { success: true, data: parsed, raw: rawText };

    } catch (err) {
      const duration = Date.now() - start;
      Logger.aiCall({ module: moduleName, prompt, response: rawText, status: "ERROR", error: err.message, durationMs: duration });
      return { success: false, error: err.message, raw: rawText };
    }
  },

  parseJSON(raw) {
  let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Could not parse JSON from AI response");
  clean = clean.slice(start, end + 1);
  
  // DEBUG — print exactly what's around position 941
  console.log("CHARS 900-980:", JSON.stringify(clean.slice(900, 980)));
  
  return JSON.parse(clean);
},
};

module.exports = GeminiService;