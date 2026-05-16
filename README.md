# AI-resume-analyser
📄 Hirelyzer – AI-Powered Resume Analyzer & Job Readiness Recommender
Hirelyzer is an AI-driven application that analyzes resumes, evaluates job fit, and suggests personalized learning paths. Built with Streamlit for a sleek and interactive UI, it leverages Google Gemini AI to deliver insights similar to Applicant Tracking Systems (ATS), empowering job seekers with data-driven feedback.

🚀 Key Features
✅ Job Description Match Scoring
Calculates how well a resume matches the provided job description (as a percentage).

🔍 Missing Keywords Extraction
Identifies essential skills and keywords absent in the resume but required in the job listing.

📊 ATS-Style Profile Summary
Provides professional and personalized feedback similar to what an ATS would generate.

🎓 Online Course Recommendations
Suggests relevant courses (Coursera, Udemy, etc.) based on missing skills and roles.

📄 PDF Resume Parsing
Uses PyPDF2 to extract structured text from resumes submitted in PDF format.

🌐 Interactive Streamlit Interface
Built with Streamlit for a real-time, intuitive, and user-friendly experience.

🤖 Google Gemini AI Integration
Uses gemini-2.0-flash to generate accurate and human-like resume evaluations.

🛠️ Tech Stack
Frontend: Streamlit

Backend: Python

AI/ML: Google Generative AI (Gemini)

File Handling: PyPDF2

Output: JSON

## Web App (Next.js + Vercel)
This repo now includes a Next.js web app in the `web/` folder for Vercel deployment.

### Local Run
1. `cd web`
2. `npm install`
3. Create `web/.env.local` and set `GOOGLE_API_KEY=your_key`
4. `npm run dev`

### Vercel Deployment
1. Import the repository in Vercel.
2. Set the project root to `web/`.
3. Add environment variable `GOOGLE_API_KEY` in Vercel settings.
4. Deploy.

🔮 Future Scope
🖥️ Expanded Web Features
Enhance Streamlit UI with drag-and-drop uploads, advanced visualization, and real-time resume score updates.

📱 Mobile App Development
Create a mobile version using Flutter or React Native for accessibility on the go.

📊 Visual Analytics Dashboard
Display resume improvement trends, JD match history, and skill acquisition paths over time.

🧠 AI Resume Generator
Automatically create job-specific resumes using Gemini based on user input.

🌐 Live Job Scraping and Matching
Integrate job boards (e.g., LinkedIn, Naukri) to fetch real-time openings and run automated match analysis.

🌍 Multilingual Support
Enable resume parsing and analysis in multiple regional languages.

👤 Target Audience
Students & Job Seekers – Improve job readiness and bridge skill gaps.

Career Counselors – Provide smarter feedback and personalized roadmaps.

Recruiters – Screen and score resumes faster and more intelligently.

EdTech Platforms – Recommend online courses based on users’ job goals.

🤝 Contributing
