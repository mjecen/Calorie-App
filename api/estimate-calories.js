function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return Promise.resolve(request.body);
  }

  if (typeof request.body === "string") {
    return Promise.resolve(JSON.parse(request.body || "{}"));
  }

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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    sendJson(response, 500, {
      error:
        "Add OPENAI_API_KEY as a server-side environment variable, then redeploy."
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
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
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
}
