import OpenAI from 'openai';
import { config } from 'dotenv';
import ApiResponse from '../utils/ApiResponse.util.js';
import CustomError from '../utils/customError.util.js';

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a recipe suggestion based on the provided pantry items.
 * @param {Array<{name:string, quantity:number, unit:string}>} items
 * @returns {Promise<{title:string, ingredients:Array<string>, steps:Array<string>}>}
 */
export const generateRecipe = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CustomError(400, 'Pantry items are required for recipe generation');
  }
  const prompt = `You are a helpful cooking assistant. Given the following pantry items, suggest ONE complete recipe (title, list of ingredients, and step‑by‑step instructions). Use metric units where appropriate. Return the answer in JSON format with keys: title, ingredients (array of strings), steps (array of strings).\n\nPantry items:\n${items
    .map((i) => `- ${i.name} (${i.quantity} ${i.unit})`)
    .join('\n')}`;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    const content = completion.choices[0].message.content;
    // Attempt to parse JSON from the response
    const jsonStart = content.indexOf('{');
    const jsonStr = content.slice(jsonStart);
    const data = JSON.parse(jsonStr);
    return data;
  } catch (err) {
    console.error('OpenAI error', err);
    throw new CustomError(500, 'Failed to generate recipe');
  }
};
