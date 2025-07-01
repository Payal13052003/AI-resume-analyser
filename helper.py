import google.generativeai as genai
import PyPDF2 as pdf
import json
import re
import logging
from typing import Optional

def configure_genai(api_key: str) -> None:
    """
    Configure the Gemini API using the provided API key.
    """
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        raise Exception(f"Failed to configure Generative AI: {str(e)}")


def get_gemini_response(prompt: str) -> dict:
    """
    Generate a response using Gemini and return a parsed JSON object.
    Includes fallback JSON extraction and field validation.
    """
    try:
        model = genai.GenerativeModel(model_name="gemini-pro")
        response = model.generate_content(prompt)

        if not response or not response.text:
            raise Exception("Empty response received from Gemini")

        # First try direct JSON parsing
        try:
            response_json = json.loads(response.text)

            required_fields = ["JD Match", "MissingKeywords", "Profile Summary"]
            for field in required_fields:
                if field not in response_json:
                    raise ValueError(f"Missing required field: {field}")

            return response_json

        # Fallback if JSON is embedded in text
        except json.JSONDecodeError:
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


def extract_pdf_text(uploaded_file) -> str:
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


def prepare_prompt(resume_text: str, job_description: str) -> str:
    """
    Prepare a formatted prompt to send to Gemini for resume analysis.
    Ensures proper structure and includes instructions for a JSON-only output.
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
        "MissingKeywords": ["keyword1", "keyword2", "..."],
        "Profile Summary": "detailed analysis of the match and specific improvement suggestions"
    }}
    """

    return prompt_template.format(
        resume_text=resume_text.strip(),
        job_description=job_description.strip()
    )
