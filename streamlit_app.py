import streamlit as st
import os
from dotenv import load_dotenv
import json
from main import (
    configure_genai,
    get_gemini_response,
    extract_pdf_text,
    prepare_prompt
)

def init_session_state():
    """Initialize session state variables."""
    if 'processing' not in st.session_state:
        st.session_state.processing = False

def main():
    load_dotenv()
    # Configure Streamlit page
    st.set_page_config(page_title="Smart ATS | Hirelyzer", layout="wide")

    # Initialize session state
    init_session_state()

    # Load API key
    api_key = None
    try:
        api_key = st.secrets.get("GOOGLE_API_KEY", None)
    except Exception:
        api_key = None

    if not api_key:
        api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        st.error("❌ GOOGLE_API_KEY is not set. Add it in Streamlit secrets or .env.")
        return

    # Configure Gemini
    try:
        configure_genai(api_key)
    except Exception as e:
        st.error(f"❌ Gemini API configuration failed: {str(e)}")
        return

    # Sidebar
    with st.sidebar:
        logo_path = "logo.png"
        if os.path.exists(logo_path):
            st.image(logo_path, use_container_width=True)
        else:
            st.warning("⚠️ 'logo.png' not found. Upload it to the project directory.")

        st.title("🎯 Hirelyzer")
        st.subheader("About")
        st.write("""
        **Hirelyzer** helps you:
        - ✅ Evaluate resume-job description match
        - 🔍 Identify missing keywords
        - ✍️ Get personalized improvement suggestions
        """)
        st.space(2)
        st.markdown("🔒 Powered by Google Gemini API")

    # Main UI
    st.title("📄 Hirelyzer Resume Analyzer")
    st.subheader("Optimize Your Resume for ATS")

    # Job Description
    jd = st.text_area(
        "Job Description",
        placeholder="Paste the job description here...",
        help="Enter the complete job description for accurate analysis"
    )

    # Resume Upload
    uploaded_file = st.file_uploader(
        "Upload Resume (PDF format only)",
        type=["pdf"],
        help="Upload your resume in PDF format"
    )

    # Button
    if st.button("Analyze Resume", disabled=st.session_state.processing):
        if not jd:
            st.warning("⚠️ Please enter a job description.")
            return

        if not uploaded_file:
            st.warning("⚠️ Please upload a resume.")
            return

        st.session_state.processing = True

        try:
            with st.spinner("📊 Processing..."):
                st.info(f"📁 Processing file: `{uploaded_file.name}`")

                resume_text = extract_pdf_text(uploaded_file)
                if not resume_text:
                    st.error("❌ Failed to extract text from the uploaded resume.")
                    return

                prompt = prepare_prompt(resume_text, jd)
                response_json = get_gemini_response(prompt)

                # Output
                st.success("✅ Analysis Complete!")

                # Match Score
                st.metric("📈 JD Match Score", response_json.get("JD Match", "N/A"))

                # Missing Keywords
                st.subheader("📌 Missing Keywords")
                missing_keywords = response_json.get("MissingKeywords", [])
                if missing_keywords:
                    st.write(", ".join(missing_keywords))
                else:
                    st.write("✅ No major keywords missing!")

                # Summary
                st.subheader("🧾 Profile Summary")
                st.write(response_json.get("Profile Summary", "No summary available."))

        except Exception as e:
            st.error("🚨 An error occurred during processing:")
            st.code(str(e), language="text")

        finally:
            st.session_state.processing = False

if __name__ == "__main__":
    main()
