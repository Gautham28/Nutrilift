# NutriLift - Product Requirements Document (PRD)

## 1. Project Overview

**NutriLift** is a comprehensive, full-stack calorie and macro tracking application tailored for Indian diets. It utilizes AI (Google Gemini) to eliminate manual data entry by allowing users to log meals using natural language. The system calculates personalized daily targets based on user biometrics and tracks progress over time.

## 2. Technical Stack

- **Backend:** Java 21, Spring Boot 3.2+, Spring Data JPA, Spring Security (JWT), Maven.
- **Frontend:** React 18+, Vite, TypeScript, Tailwind CSS, Recharts (for charts), Axios (for API calls).
- **Database:** PostgreSQL 15+.
- **AI Engine:** Google Gemini API (`gemini-1.5-flash` - Free tier).
- **Containerization:** Docker & Docker Compose.
- **Deployment Targets (Free Tier):** Render (Backend), Vercel (Frontend), Supabase or Neon (PostgreSQL).

---

## 3. Database Schema (PostgreSQL)

### Table: `users`

| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK, Default `gen_random_uuid()` | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email for login |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| `full_name` | VARCHAR(255) | NOT NULL | User's name |
| `age` | INT | NOT NULL | Age in years |
| `gender` | VARCHAR(10) | NOT NULL | 'MALE' or 'FEMALE' |
| `height_cm` | INT | NOT NULL | Height in centimeters |
| `weight_kg` | DECIMAL(5,2) | NOT NULL | Current weight in kg |
| `activity_level` | VARCHAR(50) | NOT NULL | 'SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE' |
| `target_calories` | INT | NOT NULL | Calculated daily calorie goal |
| `target_protein_g` | INT | NOT NULL | Calculated daily protein goal (in grams) |
| `created_at` | TIMESTAMP | NOT NULL, Default `NOW()` | Account creation time |

### Table: `food_entries`

| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK, Default `gen_random_uuid()` | Unique entry identifier |
| `user_id` | UUID | FK -> `users(id)`, NOT NULL | Owner of the entry |
| `entry_date` | DATE | NOT NULL, Default `CURRENT_DATE` | Date the food was consumed |
| `meal_type` | VARCHAR(50) | NOT NULL | 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK' |
| `food_name` | VARCHAR(255) | NOT NULL | Name of the food item |
| `quantity` | DECIMAL(8,2) | NOT NULL | Amount consumed |
| `unit` | VARCHAR(50) | NOT NULL | 'g', 'ml', 'bowl', 'piece', 'cup', etc. |
| `calories` | INT | NOT NULL | Total calories for this entry |
| `protein_g` | DECIMAL(6,2) | NOT NULL | Protein in grams |
| `carbs_g` | DECIMAL(6,2) | NOT NULL | Carbohydrates in grams |
| `fat_g` | DECIMAL(6,2) | NOT NULL | Fats in grams |
| `is_ai_parsed` | BOOLEAN | NOT NULL, Default `true` | Whether AI parsed this entry |

---

## 4. API Contracts (Spring Boot REST)

### 4.1 Authentication (`/api/auth`)

- **POST `/api/auth/register`**
    - **Request:** `{ email, password, fullName, age, gender, heightCm, weightKg, activityLevel }`
    - **Logic:** Hash password, calculate TDEE (see Section 6), save user.
    - **Response:** `{ token, user: { id, email, targetCalories, targetProteinG } }`
- **POST `/api/auth/login`**
    - **Request:** `{ email, password }`
    - **Response:** `{ token, user: { id, email, targetCalories, targetProteinG } }`

### 4.2 Profile (`/api/profile`) - *Requires JWT*

- **GET `/api/profile`**
    - **Response:** Full user profile object (excluding password).
- **PUT `/api/profile/targets`**
    - **Request:** `{ targetCalories, targetProteinG }`
    - **Logic:** Allows user to manually override AI-calculated targets.

### 4.3 Food Entries (`/api/entries`) - *Requires JWT*

- **POST `/api/entries/ai-parse`**
    - **Request:** `{ rawText: "string", mealType: "string" }`
    - **Logic:** Sends `rawText` to Gemini API. Returns parsed array. **Does not save to DB.**
    - **Response:** `[{ foodName, quantity, unit, calories, proteinG, carbsG, fatG }]`
- **POST `/api/entries`**
    - **Request:** `{ entryDate: "YYYY-MM-DD", mealType: "string", items: [ {foodName, quantity, unit, calories, proteinG, carbsG, fatG, isAiParsed} ] }`
    - **Logic:** Saves the array of items to `food_entries` for the authenticated user.
- **GET `/api/entries/today`**
    - **Response:** Array of `food_entries` for the current date, grouped by `mealType`.
- **GET `/api/entries/history?date=YYYY-MM-DD`**
    - **Response:** Array of `food_entries` for the specified date.
- **GET `/api/entries/stats?days=7`**
    - **Response:** Array of daily aggregates for the last X days: `[{ date, totalCalories, totalProtein, totalCarbs, totalFat }]`

---

## 5. AI Integration Rules (Google Gemini)

When calling the Gemini API (`gemini-1.5-flash`) in the `AiParsingService`, use the following strict guidelines:

**System Prompt:**

```
You are an expert nutritionist specializing in Indian diets.
Convert the user's meal description into a structured JSON array of food items.
Assume standard Indian portion sizes if not explicitly specified (e.g., 1 bowl = 150g, 1 piece of roti = 30g).
Return ONLY a valid JSON array. Do not include markdown formatting like ```json. Do not include any conversational text.
Each object in the array must have these exact keys: food_name, quantity, unit, calories, protein_g, carbs_g, fat_g.
```

**Backend Implementation Rules:**

1. Strip any markdown code blocks (e.g., `json ...` ) from the Gemini response before parsing.
2. Use Jackson (`ObjectMapper`) to parse the cleaned string into a `List<FoodItemDto>`.
3. If parsing fails, return a 400 Bad Request to the frontend with a message: "AI could not parse the meal. Please try rephrasing or use manual entry."

---

## 6. Business Logic: TDEE Calculation

Calculate the user's daily targets during registration using the **Mifflin-St Jeor Equation**:

**1. Calculate BMR (Basal Metabolic Rate):**

- Male: `BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5`
- Female: `BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161`

**2. Calculate TDEE (Total Daily Energy Expenditure):**
Multiply BMR by the activity level multiplier:

- Sedentary: `1.2`
- Lightly Active: `1.375`
- Moderately Active: `1.55`
- Very Active: `1.725`

**3. Set Targets:**

- `target_calories` = `TDEE` (Round to nearest integer).
- `target_protein_g` = `weight_kg * 1.8` (Standard fitness recommendation for muscle maintenance/growth. Round to nearest integer).

---

## 7. Frontend UI/UX Requirements

**Design System:** Minimalist, dark-mode first, clean typography. Use Tailwind CSS.

**Screens:**

1. **Auth Screen:** Simple login/register toggle.
2. **Onboarding Screen:** Multi-step form (Biometrics -> Activity Level -> Goals).
3. **Dashboard (Home):**
    - **Top:** 4 circular progress bars (Calories, Protein, Carbs, Fats) showing `consumed / target`.
    - **Middle:** Large text area: "What did you eat?" with a dropdown for Meal Type and an "Analyze with AI" button.
    - **Bottom:** List of today's logged meals, grouped by Breakfast/Lunch/Dinner/Snack. Each item shows name, quantity, and calories.
4. **History/Stats Screen:**
    - A line chart (using Recharts) showing calorie intake over the last 7 days.
    - A list of past dates. Clicking a date loads that day's food entries.

---

## 8. Environment Variables & Docker

**Required `.env` variables for Backend:**

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nutrilift
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=update
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Docker Compose Requirements:**
Provide a `docker-compose.yml` that spins up:

1. The Spring Boot backend application.
2. A PostgreSQL 15 database.
3. Ensure the backend waits for the database to be healthy before starting.