import OpenAI from "openai";

let cachedClient = null;
let cachedKey = null;

const getOpenAIClient = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedKey = key;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
};

export const buildRecipePrompt = (pantryItems = [], expiringItems = []) => {
  const pantryList = pantryItems
    .map((i) => `- ${i.name} (${i.quantity} ${i.unit || "piece"})`)
    .join("\n");
  const expiringList = expiringItems.length
    ? expiringItems
      .map((i) => `- ${i.name}`)
      .join("\n")
    : "None expiring soon";

  return `You are a helpful Indian home cooking assistant.

The user currently has these items at home:
${pantryList}

Items expiring soon (prioritize these):
${expiringList}

Suggest exactly 3 practical Indian home recipes they can cook tonight.
Rules:
- Prefer simple recipes under 30 minutes
- Use realistic home ingredients
- Return only valid JSON with this shape:
{
  "recipes": [{
    "title": "Recipe Name",
    "description": "One sentence description",
    "cookTimeMinutes": 20,
    "expiringItemsUsed": ["Milk"],
    "ingredients": [{ "name": "Eggs", "quantity": "2", "inPantry": true }],
    "instructions": ["Step 1...", "Step 2..."]
  }]
}`;
};

export const generateRecipesWithOpenAI = async ({ pantryItems, expiringItems }) => {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildRecipePrompt(pantryItems, expiringItems) }],
    max_tokens: 1500,
  });

  const content = response?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return Array.isArray(parsed?.recipes) ? parsed.recipes : [];
};
