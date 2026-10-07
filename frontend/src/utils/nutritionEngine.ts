export interface CalculatedFood {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  category?: string;
  note?: string;
}

// Comprehensive nutrition database per standard serving size
// Calorie, Protein, Carbs, Fat values
interface NutritionData {
  defaultQty: number;
  defaultUnit: string;
  calories: number; // kcal
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  fiber: number;    // grams
  category: 'Grains' | 'Dairy' | 'Protein' | 'Vegetables' | 'Snacks' | 'Beverages' | 'Dishes';
}

export const FOOD_DATABASE: Record<string, NutritionData> = {
  // Breads & Grains
  'roti': { defaultQty: 1, defaultUnit: 'piece', calories: 104, protein: 3.2, carbs: 20.0, fat: 1.2, fiber: 2.8, category: 'Grains' },
  'chapati': { defaultQty: 1, defaultUnit: 'piece', calories: 104, protein: 3.2, carbs: 20.0, fat: 1.2, fiber: 2.8, category: 'Grains' },
  'paratha': { defaultQty: 1, defaultUnit: 'piece', calories: 230, protein: 4.5, carbs: 32.0, fat: 9.8, fiber: 3.0, category: 'Grains' },
  'aloo paratha': { defaultQty: 1, defaultUnit: 'piece', calories: 290, protein: 5.5, carbs: 42.0, fat: 11.0, fiber: 3.5, category: 'Grains' },
  'paneer paratha': { defaultQty: 1, defaultUnit: 'piece', calories: 340, protein: 12.0, carbs: 36.0, fat: 16.0, fiber: 3.2, category: 'Grains' },
  'naan': { defaultQty: 1, defaultUnit: 'piece', calories: 260, protein: 7.0, carbs: 45.0, fat: 5.0, fiber: 2.0, category: 'Grains' },
  'rice': { defaultQty: 1, defaultUnit: 'bowl', calories: 205, protein: 4.2, carbs: 45.0, fat: 0.5, fiber: 1.0, category: 'Grains' },
  'brown rice': { defaultQty: 1, defaultUnit: 'bowl', calories: 218, protein: 5.0, carbs: 46.0, fat: 1.6, fiber: 3.5, category: 'Grains' },
  'jeera rice': { defaultQty: 1, defaultUnit: 'bowl', calories: 240, protein: 4.5, carbs: 46.0, fat: 4.0, fiber: 1.2, category: 'Grains' },
  'biryani': { defaultQty: 1, defaultUnit: 'plate', calories: 520, protein: 26.0, carbs: 62.0, fat: 18.0, fiber: 3.0, category: 'Dishes' },
  'chicken biryani': { defaultQty: 1, defaultUnit: 'plate', calories: 560, protein: 32.0, carbs: 60.0, fat: 20.0, fiber: 3.0, category: 'Dishes' },
  'mutton biryani': { defaultQty: 1, defaultUnit: 'plate', calories: 640, protein: 30.0, carbs: 62.0, fat: 28.0, fiber: 3.0, category: 'Dishes' },
  'veg biryani': { defaultQty: 1, defaultUnit: 'plate', calories: 420, protein: 9.0, carbs: 68.0, fat: 12.0, fiber: 5.0, category: 'Dishes' },
  'pulao': { defaultQty: 1, defaultUnit: 'bowl', calories: 260, protein: 5.0, carbs: 48.0, fat: 5.5, fiber: 2.5, category: 'Grains' },
  'khichdi': { defaultQty: 1, defaultUnit: 'bowl', calories: 240, protein: 8.0, carbs: 42.0, fat: 4.5, fiber: 4.0, category: 'Grains' },
  'oats': { defaultQty: 1, defaultUnit: 'bowl', calories: 160, protein: 6.0, carbs: 28.0, fat: 2.5, fiber: 4.0, category: 'Grains' },
  'oatmeal': { defaultQty: 1, defaultUnit: 'bowl', calories: 190, protein: 7.0, carbs: 32.0, fat: 3.5, fiber: 4.5, category: 'Grains' },
  'bread': { defaultQty: 2, defaultUnit: 'slices', calories: 150, protein: 5.0, carbs: 28.0, fat: 1.8, fiber: 2.0, category: 'Grains' },
  'toast': { defaultQty: 2, defaultUnit: 'slices', calories: 150, protein: 5.0, carbs: 28.0, fat: 1.8, fiber: 2.0, category: 'Grains' },

  // South Indian
  'idli': { defaultQty: 2, defaultUnit: 'pieces', calories: 130, protein: 4.2, carbs: 26.0, fat: 0.4, fiber: 1.8, category: 'Grains' },
  'dosa': { defaultQty: 1, defaultUnit: 'piece', calories: 165, protein: 3.8, carbs: 28.0, fat: 4.2, fiber: 1.5, category: 'Grains' },
  'masala dosa': { defaultQty: 1, defaultUnit: 'piece', calories: 290, protein: 5.5, carbs: 44.0, fat: 10.0, fiber: 3.2, category: 'Dishes' },
  'vada': { defaultQty: 1, defaultUnit: 'piece', calories: 145, protein: 4.0, carbs: 14.0, fat: 8.5, fiber: 2.0, category: 'Snacks' },
  'medu vada': { defaultQty: 1, defaultUnit: 'piece', calories: 145, protein: 4.0, carbs: 14.0, fat: 8.5, fiber: 2.0, category: 'Snacks' },
  'sambar': { defaultQty: 1, defaultUnit: 'bowl', calories: 120, protein: 5.0, carbs: 20.0, fat: 2.5, fiber: 4.5, category: 'Dishes' },
  'coconut chutney': { defaultQty: 2, defaultUnit: 'tbsp', calories: 75, protein: 0.8, carbs: 3.0, fat: 7.0, fiber: 1.2, category: 'Dishes' },
  'poha': { defaultQty: 1, defaultUnit: 'plate', calories: 250, protein: 4.5, carbs: 46.0, fat: 5.5, fiber: 3.0, category: 'Grains' },
  'upma': { defaultQty: 1, defaultUnit: 'bowl', calories: 220, protein: 5.0, carbs: 38.0, fat: 5.0, fiber: 2.5, category: 'Grains' },

  // Dals & Curries
  'dal': { defaultQty: 1, defaultUnit: 'bowl', calories: 155, protein: 9.0, carbs: 22.0, fat: 3.5, fiber: 5.0, category: 'Dishes' },
  'dal tadka': { defaultQty: 1, defaultUnit: 'bowl', calories: 175, protein: 9.0, carbs: 22.0, fat: 5.5, fiber: 5.0, category: 'Dishes' },
  'dal makhani': { defaultQty: 1, defaultUnit: 'bowl', calories: 280, protein: 10.5, carbs: 28.0, fat: 14.0, fiber: 6.5, category: 'Dishes' },
  'chole': { defaultQty: 1, defaultUnit: 'bowl', calories: 260, protein: 11.5, carbs: 36.0, fat: 7.5, fiber: 9.0, category: 'Dishes' },
  'chickpeas': { defaultQty: 1, defaultUnit: 'bowl', calories: 240, protein: 12.0, carbs: 38.0, fat: 4.0, fiber: 10.0, category: 'Protein' },
  'rajma': { defaultQty: 1, defaultUnit: 'bowl', calories: 240, protein: 11.0, carbs: 35.0, fat: 6.0, fiber: 8.5, category: 'Dishes' },
  'sambar dal': { defaultQty: 1, defaultUnit: 'bowl', calories: 120, protein: 5.0, carbs: 20.0, fat: 2.5, fiber: 4.5, category: 'Dishes' },
  'curry': { defaultQty: 1, defaultUnit: 'bowl', calories: 210, protein: 6.0, carbs: 18.0, fat: 13.0, fiber: 3.5, category: 'Dishes' },
  'mix veg': { defaultQty: 1, defaultUnit: 'bowl', calories: 140, protein: 3.5, carbs: 18.0, fat: 6.0, fiber: 5.0, category: 'Vegetables' },
  'palak paneer': { defaultQty: 1, defaultUnit: 'bowl', calories: 280, protein: 14.0, carbs: 10.0, fat: 21.0, fiber: 4.5, category: 'Dishes' },
  'paneer butter masala': { defaultQty: 1, defaultUnit: 'bowl', calories: 360, protein: 14.0, carbs: 16.0, fat: 28.0, fiber: 3.0, category: 'Dishes' },
  'paneer bhurji': { defaultQty: 1, defaultUnit: 'bowl', calories: 310, protein: 18.0, carbs: 8.0, fat: 23.0, fiber: 2.0, category: 'Protein' },
  'paneer': { defaultQty: 100, defaultUnit: 'g', calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, fiber: 0, category: 'Dairy' },
  'tofu': { defaultQty: 100, defaultUnit: 'g', calories: 76, protein: 8.2, carbs: 1.9, fat: 4.8, fiber: 0.3, category: 'Protein' },
  'soya chunks': { defaultQty: 50, defaultUnit: 'g', calories: 172, protein: 26.0, carbs: 16.5, fat: 0.5, fiber: 6.5, category: 'Protein' },

  // Eggs & Meat & Poultry
  'egg': { defaultQty: 1, defaultUnit: 'piece', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, category: 'Protein' },
  'eggs': { defaultQty: 2, defaultUnit: 'pieces', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6, fiber: 0, category: 'Protein' },
  'boiled egg': { defaultQty: 1, defaultUnit: 'piece', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, category: 'Protein' },
  'egg white': { defaultQty: 1, defaultUnit: 'piece', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0, category: 'Protein' },
  'omelette': { defaultQty: 1, defaultUnit: 'serving', calories: 180, protein: 13.0, carbs: 2.0, fat: 13.5, fiber: 0.5, category: 'Protein' },
  'egg bhurji': { defaultQty: 1, defaultUnit: 'plate', calories: 220, protein: 14.0, carbs: 5.0, fat: 16.0, fiber: 1.0, category: 'Protein' },
  'chicken breast': { defaultQty: 100, defaultUnit: 'g', calories: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, category: 'Protein' },
  'chicken curry': { defaultQty: 1, defaultUnit: 'bowl', calories: 320, protein: 28.0, carbs: 8.0, fat: 20.0, fiber: 2.0, category: 'Dishes' },
  'grilled chicken': { defaultQty: 150, defaultUnit: 'g', calories: 245, protein: 42.0, carbs: 1.0, fat: 8.0, fiber: 0, category: 'Protein' },
  'chicken tikka': { defaultQty: 6, defaultUnit: 'pieces', calories: 290, protein: 34.0, carbs: 6.0, fat: 14.0, fiber: 1.0, category: 'Protein' },
  'fish': { defaultQty: 100, defaultUnit: 'g', calories: 140, protein: 22.0, carbs: 0, fat: 5.5, fiber: 0, category: 'Protein' },
  'fish curry': { defaultQty: 1, defaultUnit: 'bowl', calories: 260, protein: 24.0, carbs: 7.0, fat: 15.0, fiber: 1.5, category: 'Dishes' },
  'salmon': { defaultQty: 150, defaultUnit: 'g', calories: 310, protein: 34.0, carbs: 0, fat: 19.0, fiber: 0, category: 'Protein' },
  'mutton': { defaultQty: 100, defaultUnit: 'g', calories: 294, protein: 25.0, carbs: 0, fat: 21.0, fiber: 0, category: 'Protein' },
  'mutton curry': { defaultQty: 1, defaultUnit: 'bowl', calories: 380, protein: 26.0, carbs: 8.0, fat: 28.0, fiber: 1.5, category: 'Dishes' },

  // Dairy & Whey
  'milk': { defaultQty: 1, defaultUnit: 'glass', calories: 145, protein: 8.0, carbs: 12.0, fat: 7.5, fiber: 0, category: 'Dairy' },
  'curd': { defaultQty: 1, defaultUnit: 'bowl', calories: 130, protein: 7.0, carbs: 8.0, fat: 8.0, fiber: 0, category: 'Dairy' },
  'yogurt': { defaultQty: 1, defaultUnit: 'cup', calories: 120, protein: 9.0, carbs: 10.0, fat: 4.5, fiber: 0, category: 'Dairy' },
  'greek yogurt': { defaultQty: 1, defaultUnit: 'cup', calories: 130, protein: 17.0, carbs: 6.0, fat: 3.5, fiber: 0, category: 'Dairy' },
  'whey protein': { defaultQty: 1, defaultUnit: 'scoop', calories: 120, protein: 25.0, carbs: 2.0, fat: 1.5, fiber: 0, category: 'Protein' },
  'protein shake': { defaultQty: 1, defaultUnit: 'glass', calories: 230, protein: 32.0, carbs: 15.0, fat: 4.0, fiber: 2.0, category: 'Protein' },
  'buttermilk': { defaultQty: 1, defaultUnit: 'glass', calories: 45, protein: 2.5, carbs: 4.5, fat: 1.8, fiber: 0, category: 'Dairy' },
  'chaas': { defaultQty: 1, defaultUnit: 'glass', calories: 45, protein: 2.5, carbs: 4.5, fat: 1.8, fiber: 0, category: 'Dairy' },
  'lassi': { defaultQty: 1, defaultUnit: 'glass', calories: 210, protein: 6.0, carbs: 32.0, fat: 7.0, fiber: 0, category: 'Dairy' },

  // Fruits & Snacks & Beverages
  'banana': { defaultQty: 1, defaultUnit: 'piece', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, fiber: 3.1, category: 'Snacks' },
  'apple': { defaultQty: 1, defaultUnit: 'piece', calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3, fiber: 4.4, category: 'Snacks' },
  'mango': { defaultQty: 1, defaultUnit: 'cup', calories: 135, protein: 1.0, carbs: 35.0, fat: 0.5, fiber: 3.0, category: 'Snacks' },
  'almonds': { defaultQty: 10, defaultUnit: 'pieces', calories: 70, protein: 2.5, carbs: 2.5, fat: 6.0, fiber: 1.5, category: 'Snacks' },
  'peanuts': { defaultQty: 30, defaultUnit: 'g', calories: 170, protein: 7.5, carbs: 5.0, fat: 14.5, fiber: 2.5, category: 'Snacks' },
  'salad': { defaultQty: 1, defaultUnit: 'bowl', calories: 45, protein: 1.5, carbs: 8.0, fat: 0.5, fiber: 3.5, category: 'Vegetables' },
  'cucumber': { defaultQty: 1, defaultUnit: 'piece', calories: 20, protein: 0.8, carbs: 4.0, fat: 0.1, fiber: 1.5, category: 'Vegetables' },
  'sprouts': { defaultQty: 1, defaultUnit: 'bowl', calories: 110, protein: 8.5, carbs: 18.0, fat: 0.8, fiber: 5.5, category: 'Protein' },
  'chai': { defaultQty: 1, defaultUnit: 'cup', calories: 85, protein: 2.0, carbs: 12.0, fat: 3.0, fiber: 0, category: 'Beverages' },
  'tea': { defaultQty: 1, defaultUnit: 'cup', calories: 75, protein: 1.5, carbs: 10.0, fat: 2.5, fiber: 0, category: 'Beverages' },
  'coffee': { defaultQty: 1, defaultUnit: 'cup', calories: 90, protein: 2.2, carbs: 12.0, fat: 3.2, fiber: 0, category: 'Beverages' },
  'green tea': { defaultQty: 1, defaultUnit: 'cup', calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, category: 'Beverages' },
  'biscuits': { defaultQty: 2, defaultUnit: 'pieces', calories: 70, protein: 1.0, carbs: 12.0, fat: 2.0, fiber: 0.5, category: 'Snacks' },
  'samosa': { defaultQty: 1, defaultUnit: 'piece', calories: 260, protein: 4.0, carbs: 32.0, fat: 14.0, fiber: 2.5, category: 'Snacks' },
  'peanut butter': { defaultQty: 2, defaultUnit: 'tbsp', calories: 190, protein: 8.0, carbs: 7.0, fat: 16.0, fiber: 2.0, category: 'Snacks' },
};

/**
 * Natural Language Food Parser
 * Parses single or combined meal inputs:
 * Examples:
 * - "2 rotis and 1 bowl dal tadka"
 * - "100g chicken breast with 1 bowl rice"
 * - "2 boiled eggs and 1 cup chai"
 * - "paneer bhurji 200g"
 * - "1 plate biryani"
 */
export function calculateFoodItem(input: string): CalculatedFood[] {
  if (!input || !input.trim()) return [];

  const text = input.trim();
  const segments = text.split(/,|(?:\s+and\s+)|\+/i);
  const results: CalculatedFood[] = [];

  for (const seg of segments) {
    const rawSeg = seg.trim();
    if (!rawSeg) continue;

    const item = parseSingleFoodSegment(rawSeg);
    if (item) {
      results.push(item);
    }
  }

  // If no segment matched, fallback to fuzzy keyword match on the whole string
  if (results.length === 0) {
    const fuzzy = parseSingleFoodSegment(text);
    if (fuzzy) results.push(fuzzy);
    else {
      // Generic fallback for unrecognized item
      results.push({
        foodName: text,
        quantity: 1,
        unit: 'serving',
        calories: 180,
        proteinG: 8,
        carbsG: 22,
        fatG: 6,
        fiberG: 2,
        category: 'Dishes',
        note: 'Estimated based on average balanced meal'
      });
    }
  }

  return results;
}

function parseSingleFoodSegment(segment: string): CalculatedFood | null {
  const lower = segment.toLowerCase().trim();

  // Try to find quantity and unit
  // Examples: "2 rotis", "100g paneer", "1.5 bowl dal", "2 slices bread"
  const qtyRegex = /^([\d.]+)\s*(g|grams|kg|bowl|bowls|piece|pieces|slice|slices|cup|cups|plate|plates|glass|glasses|scoop|scoops|tbsp)?\s*(?:of\s+)?(.*)$/i;
  const match = lower.match(qtyRegex);

  let detectedQty: number | null = null;
  let detectedUnit: string | null = null;
  let foodQuery = lower;

  if (match) {
    detectedQty = parseFloat(match[1]);
    if (match[2]) detectedUnit = match[2];
    foodQuery = match[3] || '';
  }

  // If foodQuery is empty, look for quantity embedded inside (e.g. "chicken breast 200g")
  if (!foodQuery) {
    const endQtyRegex = /^(.*?)\s*([\d.]+)\s*(g|grams|kg|bowl|bowls|piece|pieces|slice|slices|cup|cups|plate|plates|glass|glasses|scoop|scoops)?$/i;
    const endMatch = lower.match(endQtyRegex);
    if (endMatch) {
      foodQuery = endMatch[1].trim();
      detectedQty = parseFloat(endMatch[2]);
      if (endMatch[3]) detectedUnit = endMatch[3];
    }
  }

  // Find best match in database
  let bestMatchKey: string | null = null;
  let longestMatchLen = 0;

  for (const key of Object.keys(FOOD_DATABASE)) {
    if (foodQuery.includes(key) || lower.includes(key)) {
      if (key.length > longestMatchLen) {
        longestMatchLen = key.length;
        bestMatchKey = key;
      }
    }
  }

  if (bestMatchKey) {
    const data = FOOD_DATABASE[bestMatchKey];
    const qty = detectedQty !== null && !isNaN(detectedQty) && detectedQty > 0 ? detectedQty : data.defaultQty;
    const unit = detectedUnit || data.defaultUnit;

    // Calculate ratio
    let multiplier = 1;
    if (data.defaultUnit === 'g' && (unit === 'g' || unit === 'grams')) {
      multiplier = qty / data.defaultQty;
    } else if (data.defaultUnit === 'g' && unit === 'kg') {
      multiplier = (qty * 1000) / data.defaultQty;
    } else {
      multiplier = qty / data.defaultQty;
    }

    // Capitalize food name
    const prettyName = bestMatchKey
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      foodName: prettyName,
      quantity: qty,
      unit: unit,
      calories: Math.round(data.calories * multiplier),
      proteinG: Math.round(data.protein * multiplier * 10) / 10,
      carbsG: Math.round(data.carbs * multiplier * 10) / 10,
      fatG: Math.round(data.fat * multiplier * 10) / 10,
      fiberG: Math.round(data.fiber * multiplier * 10) / 10,
      category: data.category,
      note: `${qty} ${unit} • ${data.category}`,
    };
  }

  return null;
}
