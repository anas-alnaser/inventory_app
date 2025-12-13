import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Lazy initialization of Gemini client
let genAI: GoogleGenerativeAI | null = null;
let geminiFlashModel: GenerativeModel | null = null;

/**
 * Get the Gemini AI client instance
 * Must be called within a function that has access to the secret
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    // Access the secret from environment variable (set by Firebase)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY secret is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Get the Gemini 2.5 Flash model for text generation
 */
export function getGeminiFlash(): GenerativeModel {
  if (!geminiFlashModel) {
    const client = getGeminiClient();
    geminiFlashModel = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });
  }
  return geminiFlashModel;
}

/**
 * Generate AI recommendation for anomaly
 */
export async function generateAnomalyRecommendation(
  anomalyType: string,
  ingredientName: string,
  details: Record<string, unknown>
): Promise<string> {
  try {
    const model = getGeminiFlash();
    
    const prompt = `You are a restaurant inventory management AI assistant. 
An anomaly was detected in the inventory system. Please provide a brief, actionable recommendation (2-3 sentences max).

Anomaly Type: ${anomalyType}
Ingredient: ${ingredientName}
Details: ${JSON.stringify(details)}

Provide a concise recommendation to address this issue:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return 'Unable to generate AI recommendation at this time.';
  }
}

/**
 * Generate forecast explanation using AI
 */
export async function generateForecastExplanation(
  ingredientName: string,
  forecastQuantity: number,
  currentStock: number,
  historicalData: { date: string; usage: number }[]
): Promise<string> {
  try {
    const model = getGeminiFlash();
    
    const prompt = `You are a restaurant inventory forecasting AI. Provide a brief explanation (2-3 sentences) for the following forecast.

Ingredient: ${ingredientName}
Forecasted Daily Usage: ${forecastQuantity.toFixed(2)} units
Current Stock: ${currentStock.toFixed(2)} units
Recent Usage Pattern: ${JSON.stringify(historicalData.slice(0, 7))}

Explain the forecast briefly:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating forecast explanation:', error);
    return '';
  }
}

/**
 * Process invoice image using Gemini Vision
 */
export async function processInvoiceImage(
  base64Image: string,
  mimeType: string
): Promise<{
  success: boolean;
  data?: {
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      unit_price: number;
    }>;
    supplier_name?: string;
    invoice_number?: string;
    total?: number;
    date?: string;
  };
  error?: string;
}> {
  try {
    const model = getGeminiFlash();
    
    const prompt = `Analyze this invoice image and extract the following information in JSON format:
{
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "unit": "kg/g/L/mL/piece/box/pack",
      "unit_price": number
    }
  ],
  "supplier_name": "supplier name if visible",
  "invoice_number": "invoice number if visible",
  "total": total amount as number,
  "date": "date in YYYY-MM-DD format if visible"
}

Only return valid JSON, no additional text. If a field is not visible, omit it.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const text = response.text().trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    if (text.includes('```json')) {
      jsonStr = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonStr = text.split('```')[1].split('```')[0].trim();
    }
    
    const data = JSON.parse(jsonStr);
    return { success: true, data };
  } catch (error) {
    console.error('Error processing invoice image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process invoice' 
    };
  }
}

/**
 * Analyze stock image for visual inventory taking
 */
export async function analyzeStockImage(
  base64Image: string,
  mimeType: string,
  knownItems?: string[]
): Promise<{
  success: boolean;
  data?: Array<{
    item_name: string;
    estimated_quantity: number;
    unit: string;
    fill_level_percent?: number;
    confidence: number;
  }>;
  error?: string;
}> {
  try {
    const model = getGeminiFlash();
    
    const itemsHint = knownItems?.length 
      ? `Known items in inventory: ${knownItems.join(', ')}` 
      : '';
    
    const prompt = `Analyze this inventory/stock image and identify visible items with quantity estimates.
${itemsHint}

Return JSON array format:
[
  {
    "item_name": "name of item",
    "estimated_quantity": number estimate,
    "unit": "kg/g/L/mL/piece/box/pack",
    "fill_level_percent": percentage if it's a container (0-100),
    "confidence": confidence score 0-100
  }
]

Only return valid JSON array, no additional text. Focus on food/beverage inventory items.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const text = response.text().trim();
    
    // Extract JSON from response
    let jsonStr = text;
    if (text.includes('```json')) {
      jsonStr = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonStr = text.split('```')[1].split('```')[0].trim();
    }
    
    const data = JSON.parse(jsonStr);
    return { success: true, data };
  } catch (error) {
    console.error('Error analyzing stock image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze stock image' 
    };
  }
}

/**
 * Generate expiry risk recommendation
 */
export async function generateExpiryRecommendation(
  ingredientName: string,
  currentStock: number,
  daysUntilExpiry: number,
  predictedUsage: number,
  menuItemsUsingIngredient: string[]
): Promise<string> {
  try {
    const model = getGeminiFlash();
    
    const prompt = `You are a restaurant inventory AI assistant helping reduce food waste.

Ingredient: ${ingredientName}
Current Stock: ${currentStock} units
Days Until Expiry: ${daysUntilExpiry} days
Predicted Usage in that period: ${predictedUsage} units
Excess Stock at Risk: ${Math.max(0, currentStock - predictedUsage)} units
Menu Items Using This Ingredient: ${menuItemsUsingIngredient.join(', ') || 'None specified'}

Provide a brief, actionable recommendation (2-3 sentences) to prevent waste. Suggest specific actions like promotions, specials, or alternative uses:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating expiry recommendation:', error);
    return 'Consider running a special promotion or adjusting portion sizes to use up expiring stock.';
  }
}
