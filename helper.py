import google.generativeai as genai
import PyPDF2 as pdf
import json
import re

def configure_genai(api_key):
    """
    Configure the Gemini API with error handling.
    """
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        raise Exception(f"Failed to configure Generative AI: {str(e)}")


def get_gemini_response(prompt):
    """
    Generate a response using Gemini with enhanced error handling and response validation.
    Returns a parsed JSON dictionary.
    """
    try:
        model = genai.GenerativeModel(model_name="gemini-pro")
        response = model.generate_content(prompt)

        if not response or not response.text:
            raise Exception("Empty response received from Gemini")

        try:
            # Try to parse the response directly
            response_json = json.loads(response.text)

            required_fields = ["JD Match", "MissingKeywords", "Profile Summary"]
            for field in required_fields:
                if field not in response_json:
                    raise ValueError(f"Missing required field: {field}")

            return response_json

        except json.JSONDecodeError:
            # Attempt to extract JSON-like structure manually
            json_pattern = r'\{.*\}'
            match = re.search(json_pattern, response.text, re.DOTALL)
            if match:
                try:
                    extracted_json = json.loads(match.group())
                    return extracted_json
                except json.JSONDecodeError:
                    raise Exception("Extracted content is not valid JSON")
            else:
                raise Exception("Could not extract valid JSON response")

    except Exception as e:
        raise Exception(f"Error generating response: {str(e)}")


def extract_pdf_text(uploaded_file):
    """
    Extract text from a PDF file using PyPDF2 with error handling.
    """
    try:
        reader = pdf.PdfReader(uploaded_file)
        if len(reader.pages) == 0:
            raise Exception("PDF file is empty")

        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)

        if not text:
            raise Exception("No text could be extracted from the PDF")

        return " ".join(text)

    except Exception as e:
        raise Exception(f"Error extracting PDF text: {str(e)}")


def prepare_prompt(resume_text, job_description):
    """
    Prepare the prompt to send to Gemini, formatting the resume and job description properly.
    """
    if not resume_text or not job_description:
        raise ValueError("Resume text and job description cannot be empty")

    prompt_template = """
    Act as an expert ATS (Applicant Tracking System) specialist with deep expertise in:
    - Technical fields
    - Software engineering
    - Data science
    - Data analysis
    - Big data engineering

    Evaluate the following resume against the job description. Consider that the job market 
    is highly competitive. Provide detailed feedback for resume improvement.

    Resume:
    {resume_text}

    Job Description:
    {job_description}

    Provide a response in the following JSON format ONLY:
    {{
        "JD Match": "percentage between 0-100",
        "MissingKeywords": ["keyword1", "keyword2", ...],
        "Profile Summary": "detailed analysis of the match and specific improvement suggestions"
    }}
    """

    return prompt_template.format(
        resume_text=resume_text.strip(),
        job_description=job_description.strip()
    )
