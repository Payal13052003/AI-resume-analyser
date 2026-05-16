import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from "pdf-parse";

export const runtime = "nodejs";

const REQUIRED_FIELDS = [
  "JD Match",
  "MissingKeywords",
  "Profile Summary",
  "Cover Letter",
  "Resume Summary",
  "Skills Gap Map",
  "Keyword Optimizer",
  "Tailored Bullet Rewrites",
  "Interview Prep",
];

function buildPrompt(resumeText, jobDescription) {
  return `Act as an expert ATS (Applicant Tracking System) specialist with deep expertise in:
- Technical fields
- Software engineering
- Data science
- Data analysis
- Big data engineering

Evaluate the following resume against the job description. Consider that the job market
is highly competitive. Provide detailed feedback for resume improvement.

Then draft a tailored, professional cover letter based on the resume and job description.
Keep it concise (250-350 words), avoid placeholders, and focus on role alignment.

Also provide:
- Resume Summary: 4-6 bullet points that highlight strengths and fit.
- Skills Gap Map: categorize missing skills into Technical, Tools, Soft Skills.
- Keyword Optimizer: list keywords with importance (High/Medium/Low).
- Tailored Bullet Rewrites: 4-6 resume bullet improvements aligned to the JD.
- Interview Prep: 4-6 questions with 2-3 talking points each.

Resume:
${resumeText}

Job Description:
${jobDescription}

Respond in the following JSON format only:
{
  "JD Match": "percentage between 0-100",
  "MissingKeywords": ["keyword1", "keyword2", "..."],
  "Profile Summary": "detailed analysis of the match and specific improvement suggestions",
  "Cover Letter": "full cover letter text",
  "Resume Summary": ["bullet 1", "bullet 2"],
  "Skills Gap Map": {
    "Technical": ["skill1", "skill2"],
    "Tools": ["tool1", "tool2"],
    "Soft Skills": ["skill1", "skill2"]
  },
  "Keyword Optimizer": [
    { "keyword": "keyword1", "importance": "High" }
  ],
  "Tailored Bullet Rewrites": ["bullet 1", "bullet 2"],
  "Interview Prep": [
    {
      "question": "Question text",
      "talkingPoints": ["point 1", "point 2"]
    }
  ]
}
`;
}

function extractContactDetails(resumeText) {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const name = lines[0] || "";
  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{4}/
  );
  const linkedInMatch = resumeText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[\w\-/]+/i);

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    linkedIn: linkedInMatch ? linkedInMatch[0] : "",
  };
}

function parseGeminiJson(text) {
  try {
    const direct = JSON.parse(text);
    return direct;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function validateResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return "Invalid Gemini response payload.";
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in payload)) {
      return `Missing required field: ${field}`;
    }
  }

  return null;
}

export async function POST(request) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid form data. Please try again." },
      { status: 400 }
    );
  }

  const jobDescription = formData.get("jobDescription");
  const resumeFile = formData.get("resume");

  if (!jobDescription || typeof jobDescription !== "string") {
    return Response.json(
      { error: "Job description is required." },
      { status: 400 }
    );
  }

  if (!resumeFile || typeof resumeFile.arrayBuffer !== "function") {
    return Response.json({ error: "Resume PDF is required." }, { status: 400 });
  }

  try {
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdf(buffer);
    const resumeText = parsed.text?.trim();

    if (!resumeText) {
      return Response.json(
        { error: "Could not extract text from the PDF." },
        { status: 400 }
      );
    }

    const contact = extractContactDetails(resumeText);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = buildPrompt(resumeText, jobDescription.trim());

    const result = await model.generateContent(prompt);
    const responseText = result?.response?.text?.() || "";

    if (!responseText) {
      return Response.json(
        { error: "Empty response received from Gemini." },
        { status: 502 }
      );
    }

    const payload = parseGeminiJson(responseText);
    const validationError = validateResponse(payload);

    if (validationError) {
      return Response.json(
        { error: validationError, raw: responseText },
        { status: 502 }
      );
    }

    return Response.json({
      jdMatch: payload["JD Match"],
      missingKeywords: payload["MissingKeywords"],
      profileSummary: payload["Profile Summary"],
      coverLetter: payload["Cover Letter"],
      resumeSummary: payload["Resume Summary"],
      skillsGapMap: payload["Skills Gap Map"],
      keywordOptimizer: payload["Keyword Optimizer"],
      bulletRewrites: payload["Tailored Bullet Rewrites"],
      interviewPrep: payload["Interview Prep"],
      contact,
    });
  } catch (error) {
    console.error("Analyze route failed:", error);
    return Response.json(
      {
        error: "Failed to analyze the resume.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
