# Ruumr 

**A Co-Living Matchmaking Platform Assisted by AI**

Ruumr is a smart flatmate-matching platform designed to revolutionize co-living. We match **people before apartments** by analyzing lifestyle compatibility, daily habits, and shared vibes.

## 🏆 Base44 Backend Competition Showcase

This repository showcases our full-stack architecture, built and refined over a long period of dedicated development and hard work. For this competition, we are highlighting the robust **Base44** backend infrastructure that powers our platform.

### ⚙️ System Architecture & Base44 Integration

* **High-Frequency Data Layer:** We utilize Base44's relational database to store complex lifestyle profiles and handle high-volume, daily Tinder-style swipe feeds. Security is strictly enforced via Base44's built-in Authentication and Row-Level Security (RLS) across hundreds of active users.

* **External Matchmaking Engine (Ruumr+):** Heavy compatibility computations are completely decoupled from daily swiping. Ruumr+ operates on a dedicated external server that processes our multi-variable algorithms. Once the calculations are complete, this external server seamlessly sends the computed compatibility results and top 5 ideal flatmate matches back to the application.

* **Event-Driven Automations:** To keep our client lightweight, we handle community engagement asynchronously. We use Base44's built-in email functions triggered by backend events (like mutual matches) to send beautifully designed transactional emails, entirely eliminating the need for third-party mailing services.

### 💻 Tech Stack
* **Backend (BaaS):** Base44 (Database, Authentication, Built-in Email API)
* **Matchmaking Engine:** Dedicated External Server (Ruumr+)
* **Frontend:** Vite, Tailwind CSS
* **Mobile Packaging:** Capacitor (Native wrappers for iOS & Android)
* **Agentic IDEs Used:** CodeX & Claude Code

## 🚀 Repository Structure
* `/base44` - Contains our backend logic, database schemas, and API configurations.
* `/src` - The core frontend application.
* `/ios` & `/android` - Native Capacitor environments for App Store & Google Play deployment.
