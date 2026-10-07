# NutriLift 🥗🏋️

> **AI-Powered Calorie & Macro Intelligence Tailored for Indian Diets**

NutriLift is a full-stack health & nutrition platform engineered specifically for Indian food items and portion units (rotis, bowls of dal, idlis, cups of chai, etc.). It uses **Google Gemini AI (`gemini-1.5-flash`)** to parse natural language meal descriptions and calculates personalized daily targets using the **Mifflin-St Jeor TDEE equation**.

---

## 🌟 Key Features

1. **AI Natural Language Meal Logging:**
   - Type or speak meals naturally (e.g. *"2 rotis with 1 bowl dal tadka and steamed rice"* or *"3 idlis with sambar and coconut chutney"*).
   - Gemini AI transforms unstructured text into structured foods, portion quantities, standard Indian units, calories, and complete macronutrient breakdowns (Protein, Carbs, Fat).
   - Built-in heuristic fallback engine for offline or low-connectivity usage.

2. **Mifflin-St Jeor TDEE & Macro Targeting:**
   - Multi-step biometrics onboarding (Age, Gender, Height, Weight, Activity Level).
   - Automatic Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) calculation.
   - Recommended daily protein goal target based on standard fitness guidelines (`weight_kg * 1.8g`).
   - Custom target overrides at any time from the dashboard.

3. **Modern Dark-Mode First UI/UX:**
   - **4 Circular Progress Rings:** Live animated SVG rings tracking consumed vs. daily target for **Calories**, **Protein**, **Carbohydrates**, and **Fats**.
   - **Meal Category Grouping:** Dedicated sections for Breakfast, Lunch, Dinner, and Snacks & Beverages with subtotal calories and macro counters.
   - **Interactive 7-Day Analytics:** Recharts composed line & bar charts comparing daily calorie intake against your goal, with past date inspection.

4. **Robust Security & Enterprise Architecture:**
   - Stateless **Spring Security 6** with **JWT authentication** and BCrypt password hashing.
   - Complete data validation on requests with friendly JSON error responses.

---

## 🏗️ Architecture & Tech Stack

```
Nutrilift/
├── backend/                       # Spring Boot 3.3.4 (Java 21) REST API
│   ├── src/main/java/com/nutrilift/
│   │   ├── config/               # Security, JWT, CORS
│   │   ├── controller/           # Auth, Profile, FoodEntry REST controllers
│   │   ├── dto/                  # Request / Response DTOs
│   │   ├── exception/            # GlobalExceptionHandler
│   │   ├── model/                # JPA Entities (User, FoodEntry) & Enums
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   └── service/              # TDEE Calculator, AI Parsing, Food Entries
│   ├── src/main/resources/       # application.yml, application-dev.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                      # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── components/           # Navbar, Dashboard, MacroRing, AiMealLogger,
│   │   │                         # MealCard, HistoryStats, OnboardingModal, Modals
│   │   ├── context/              # AuthContext (JWT session management)
│   │   ├── services/             # Axios API client with bearer interceptor
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css             # Tailwind CSS & custom styling
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml             # PostgreSQL 15, Backend, Frontend
├── .env.example                   # Environment configuration template
└── prd.md                         # Product Requirements Document
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 21+** and **Maven 3.9+**
- **Node.js 18+** and **npm**
- *(Optional)* **Docker & Docker Compose**

---

### Method 1: Local Development (Quickstart)

#### 1. Backend (Spring Boot)

Run with the local `dev` profile (uses embedded PostgreSQL-compatible H2 database with zero external setup):

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

*The backend starts at `http://localhost:8080`.*

To connect to local PostgreSQL, set your `.env` variables and run:
```bash
mvn spring-boot:run
```

#### 2. Frontend (Vite + React)

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

*The frontend opens at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.*

---

### Method 2: Docker Compose (Full-Stack)

Make sure Docker Desktop or your Docker daemon is running, then:

```bash
# Build and start PostgreSQL 15, Spring Boot Backend, and Frontend
docker-compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8080`
- **PostgreSQL 15:** `localhost:5432` (database: `nutrilift`, user: `postgres`, password: `password`)

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nutrilift
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=update

JWT_SECRET=your_super_secret_jwt_key_at_least_32_bytes_long
JWT_EXPIRATION_MS=604800000

# Google Gemini API
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Frontend API URL
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 📡 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user, calculates TDEE & daily targets |
| `POST` | `/api/auth/login` | Login and obtain JWT token |

### Profile (`/api/profile`) *(Requires JWT)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile` | Get authenticated user profile & targets |
| `PUT` | `/api/profile/targets` | Manually override calorie & protein targets |

### Food Entries (`/api/entries`) *(Requires JWT)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/entries/ai-parse` | Analyzes meal text using Gemini AI (does not save) |
| `POST` | `/api/entries` | Saves meal items for a specific date and meal type |
| `GET` | `/api/entries/today` | Get today's food items grouped by meal with totals |
| `GET` | `/api/entries/history?date=YYYY-MM-DD` | Get food entries for a specific past date |
| `GET` | `/api/entries/stats?days=7` | 7-day daily aggregates for chart visualization |
| `DELETE` | `/api/entries/{id}` | Delete a specific food entry |

---

## 🧪 Testing

Run backend unit and integration tests:

```bash
cd backend
mvn test
```
