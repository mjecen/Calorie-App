import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error("Image is too large. Choose a smaller photo."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid request body."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

function calorieEstimatorPlugin({ apiKey, model }) {
  return {
    name: "calorie-estimator-api",
    configureServer(server) {
      server.middlewares.use("/api/estimate-calories", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed." });
          return;
        }

        if (!apiKey || apiKey === "your_api_key_here") {
          sendJson(response, 500, {
            error:
              "Replace OPENAI_API_KEY in .env with a real OpenAI API key, then restart the dev server."
          });
          return;
        }

        try {
          const { image } = await readJsonBody(request);
          if (!image || !String(image).startsWith("data:image/")) {
            sendJson(response, 400, { error: "Choose a meal photo first." });
            return;
          }

          const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model || "gpt-4.1-mini",
              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text:
                        "Estimate calories and protein from this meal photo. Return structured JSON only using the requested schema. Use conservative approximate values. If the photo is unclear, obstructed, not food, or portion size cannot be reasonably inferred, set confidence to low, say so in assumptions, and ask the user to manually adjust before saving. Do not claim certainty."
                    },
                    {
                      type: "input_image",
                      image_url: image
                    }
                  ]
                }
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "meal_nutrition_estimate",
                  strict: true,
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      mealName: {
                        type: "string",
                        description: "Short editable meal name."
                      },
                      description: {
                        type: "string",
                        description:
                          "Short plain-language description of visible food and likely portions."
                      },
                      estimatedCalories: {
                        type: "integer",
                        minimum: 0
                      },
                      estimatedProtein: {
                        type: "integer",
                        minimum: 0
                      },
                      confidence: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                      },
                      assumptions: {
                        type: "array",
                        description:
                          "Clear assumptions and manual adjustment guidance, especially if the photo is unclear.",
                        items: {
                          type: "string"
                        }
                      },
                      itemsDetected: {
                        type: "array",
                        description: "Visible food items detected in the photo.",
                        items: {
                          type: "string"
                        }
                      }
                    },
                    required: [
                      "mealName",
                      "description",
                      "estimatedCalories",
                      "estimatedProtein",
                      "confidence",
                      "assumptions",
                      "itemsDetected"
                    ]
                  }
                }
              }
            })
          });

          const data = await openaiResponse.json();

          if (!openaiResponse.ok) {
            sendJson(response, openaiResponse.status, {
              error: data?.error?.message || "OpenAI estimation failed."
            });
            return;
          }

          const outputText =
            data.output_text ||
            data.output
              ?.flatMap((item) => item.content || [])
              ?.find((item) => item.type === "output_text")?.text;

          if (!outputText) {
            sendJson(response, 502, { error: "OpenAI returned no estimate." });
            return;
          }

          sendJson(response, 200, JSON.parse(outputText));
        } catch (error) {
          sendJson(response, 500, {
            error: error.message || "Could not estimate this meal."
          });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      calorieEstimatorPlugin({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL
      })
    ]
  };
});
