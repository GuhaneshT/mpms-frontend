# M-PMS Frontend (Machine Management PMS)

This is the React frontend for the Machine Management Property Management System (M-PMS), built with Vite. It provides a sleek, modern, and responsive interface for tracking machine lifecycles, service calls, and reliability metrics.

## Tech Stack
*   **Framework:** React 18 + Vite
*   **State Management & Auth:** Supabase Client
*   **Styling:** Custom CSS (Modular, Light SaaS Aesthetic)
*   **Icons:** Lucide React
*   **Charting:** Recharts
*   **Routing:** React Router DOM

## Prerequisites
*   Node.js (v18+)
*   npm or yarn

## Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GuhaneshT/mpms-frontend.git
    cd mpms-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of the `frontend` directory and add your Supabase credentials and the Backend API URL:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_API_URL=http://localhost:8000 # Use your Render URL for production
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Deployment
This frontend is optimized for deployment on [Vercel](https://vercel.com). Simply connect this GitHub repository to Vercel, select the **Vite** framework preset, and add the three environment variables listed above.
