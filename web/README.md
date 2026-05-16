# Hirelyzer Web (Next.js)

## Local Development
1. Install dependencies:
	```bash
	npm install
	```
2. Create `.env.local` in this folder with:
	```bash
	GOOGLE_API_KEY=your_key
	```
3. Start the dev server:
	```bash
	npm run dev
	```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoint
`POST /api/analyze`
- Accepts multipart form data: `jobDescription` (string) and `resume` (PDF file).
- Returns JSON: `jdMatch`, `missingKeywords`, `profileSummary`.

## Vercel Deployment
1. Import the repo in Vercel.
2. Set the root directory to `web/`.
3. Add environment variable `GOOGLE_API_KEY`.
4. Deploy.
