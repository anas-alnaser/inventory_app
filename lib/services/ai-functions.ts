import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from '@/lib/firebase';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Connect to emulator in development (uncomment when needed)
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// ==================== ANOMALY DETECTION ====================

export interface AnomalyDetectionResult {
  success: boolean;
  results: {
    usage_spikes?: number;
    price_creep?: number;
    ghost_inventory?: number;
    theoretical_variance?: number;
  };
}

/**
 * Run anomaly detection on-demand
 */
export async function runAnomalyDetection(
  types?: ('usage_spike' | 'price_creep' | 'ghost_inventory' | 'theoretical_variance')[]
): Promise<AnomalyDetectionResult> {
  const callable = httpsCallable<{ types?: string[] }, AnomalyDetectionResult>(
    functions,
    'runAnomalyDetection'
  );
  const result = await callable({ types });
  return result.data;
}

// ==================== FORECASTING ====================

export interface ForecastData {
  date: string;
  quantity: number;
  dayOfWeek: number;
}

export interface ForecastResult {
  success: boolean;
  forecast: {
    ingredientId: string;
    forecasts: ForecastData[];
    confidence: number;
    historicalAverage: number;
  };
}

/**
 * Generate forecast for a specific ingredient
 */
export async function generateForecast(
  ingredientId: string,
  days: number = 7
): Promise<ForecastResult> {
  const callable = httpsCallable<{ ingredientId: string; days: number }, ForecastResult>(
    functions,
    'generateForecast'
  );
  const result = await callable({ ingredientId, days });
  return result.data;
}

export interface MenuDrivenForecastItem {
  ingredientId: string;
  requiredQuantity: number;
  usedInMenuItems: string[];
}

export interface MenuDrivenForecastResult {
  success: boolean;
  requirements: MenuDrivenForecastItem[];
  days: number;
}

/**
 * Get menu-driven ingredient requirements forecast
 */
export async function getMenuDrivenForecast(days: number = 7): Promise<MenuDrivenForecastResult> {
  const callable = httpsCallable<{ days: number }, MenuDrivenForecastResult>(
    functions,
    'getMenuDrivenForecast'
  );
  const result = await callable({ days });
  return result.data;
}

export interface ParLevelResult {
  success: boolean;
  recommendedMin: number;
  recommendedMax: number;
  avgDailyUsage: number;
  usageVariance: number;
}

/**
 * Get par level recommendations for an ingredient
 */
export async function getParLevelRecommendation(
  ingredientId: string,
  leadTimeDays: number = 3
): Promise<ParLevelResult> {
  const callable = httpsCallable<{ ingredientId: string; leadTimeDays: number }, ParLevelResult>(
    functions,
    'getParLevelRecommendation'
  );
  const result = await callable({ ingredientId, leadTimeDays });
  return result.data;
}

// ==================== EXPIRY RISKS ====================

export interface ExpiryRisk {
  ingredient_id: string;
  predicted_waste: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  expiry_date: { _seconds: number };
  days_until_expiry: number;
  predicted_usage: number;
  ai_recommendation?: string;
}

export interface ExpiryRisksResult {
  success: boolean;
  risks: ExpiryRisk[];
}

/**
 * Get expiry risk predictions
 */
export async function getExpiryRisks(): Promise<ExpiryRisksResult> {
  const callable = httpsCallable<void, ExpiryRisksResult>(functions, 'getExpiryRisks');
  const result = await callable();
  return result.data;
}

// ==================== INVOICE OCR ====================

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
}

export interface InvoiceOCRResult {
  success: boolean;
  data?: {
    items: InvoiceItem[];
    supplier_name?: string;
    invoice_number?: string;
    total?: number;
    date?: string;
  };
  error?: string;
}

/**
 * Process invoice image with OCR
 */
export async function processInvoiceOCR(
  imageBase64: string,
  mimeType: string
): Promise<InvoiceOCRResult> {
  const callable = httpsCallable<{ imageBase64: string; mimeType: string }, InvoiceOCRResult>(
    functions,
    'processInvoiceOCR'
  );
  const result = await callable({ imageBase64, mimeType });
  return result.data;
}

export interface CreatePOResult {
  success: boolean;
  purchaseOrderId?: string;
  error?: string;
}

/**
 * Create purchase order from processed invoice
 */
export async function createPOFromInvoice(
  invoiceData: {
    items: InvoiceItem[];
    supplier_name?: string;
    invoice_number?: string;
    total?: number;
  },
  supplierId: string
): Promise<CreatePOResult> {
  const callable = httpsCallable<
    { invoiceData: typeof invoiceData; supplierId: string },
    CreatePOResult
  >(functions, 'createPOFromInvoice');
  const result = await callable({ invoiceData, supplierId });
  return result.data;
}

// ==================== VISUAL STOCK TAKING ====================

export interface StockTakeItem {
  item_name: string;
  estimated_quantity: number;
  unit: string;
  fill_level_percent?: number;
  confidence: number;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  current_stock?: number;
  difference?: number;
}

export interface VisualStockTakeResult {
  success: boolean;
  data?: StockTakeItem[];
  error?: string;
}

/**
 * Perform visual stock taking from an image
 */
export async function visualStockTake(
  imageBase64: string,
  mimeType: string,
  notes?: string
): Promise<VisualStockTakeResult> {
  const callable = httpsCallable<
    { imageBase64: string; mimeType: string; notes?: string },
    VisualStockTakeResult
  >(functions, 'visualStockTake');
  const result = await callable({ imageBase64, mimeType, notes });
  return result.data;
}

export interface ApplyStockTakeResult {
  success: boolean;
  updatedCount: number;
  error?: string;
}

/**
 * Apply visual stock take results to inventory
 */
export async function applyStockTakeResults(
  items: Array<{
    matched_ingredient_id: string;
    estimated_quantity: number;
    unit: string;
  }>
): Promise<ApplyStockTakeResult> {
  const callable = httpsCallable<{ items: typeof items }, ApplyStockTakeResult>(
    functions,
    'applyStockTakeResults'
  );
  const result = await callable({ items });
  return result.data;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}

