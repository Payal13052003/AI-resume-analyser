import streamlit as st
from streamlit_extras.add_vertical_space import add_vertical_space
import os
import json
from helper import (
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
    # Configure Streamlit page
    st.set_page_config(page_title="Smart ATS | Hirelyzer", layout="wide")
    
    # Initialize session state
    init_session_state()

    # Load API key
    api_key = st.secrets.get("GOOGLE_API_KEY")  # ✅ Works for Streamlit Cloud
    if not api_key:
        st.error("❌ GOOGLE_API_KEY is not set. Please add it to Streamlit secrets.")
        return

    # Configure Gemini
    try:
        configure_genai(api_key)
    except Exception as e:
        st.error(f"❌ Failed to configure Gemini API: {str(e)}")
        return

    # Sidebar: Branding & About
    with st.sidebar:
        logo_path = "logo.png"
        if os.path.exists(logo_path):
            st.image(logo_path, use_container_width=True)
        else:
            st.warning("⚠️ 'logo.png' not found. Add it to your project directory.")

        st.title("🎯 Hirelyzer")
        st.subheader("About")
        st.write(""" 
        **Hirelyzer** helps you:
        - ✅ **Evaluate resume-job description match**
        - 🔍 **Identify missing keywords**
        - ✍️ **Get personalized improvement suggestions**
        """)
        add_vertical_space(2)
        st.markdown("🔒 Powered by Google Gemini API")

    # Main app layout
    st.title("📄 Hirelyzer Resume Analyzer")
    st.subheader("Optimize Your Resume for ATS")

    # Input: Job Description
    jd = st.text_area(
        "Job Description",
        placeholder="Paste the job description here...",
        help="Enter the complete job description for accurate analysis"
    )

    # Input: Resume Upload
    uploaded_file = st.file_uploader(
        "Resume (PDF)",
        type="pdf",
        help="Upload your resume in PDF format"
    )

    # Button: Analyze
    if st.button("Analyze Resume", disabled=st.session_state.processing):
        if not jd:
            st.warning("⚠️ Please provide a job description.")
            return

        if not uploaded_file:
            st.warning("⚠️ Please upload a resume in PDF format.")
            return

        st.session_state.processing = True

        try:
            with st.spinner("📊 Analyzing your resume..."):
                # Extract resume text
                resume_text = extract_pdf_text(uploaded_file)
                if not resume_text:
                    st.error("❌ Failed to extract text from the resume.")
                    return

                # Prepare prompt
                input_prompt = prepare_prompt(resume_text, jd)

                # Call Gemini
                response_json = get_gemini_response(input_prompt)

                # Display results
                st.success("✨ Analysis Complete!")

                # Match Score
                match_percentage = response_json.get("JD Match", "N/A")
                st.metric("Match Score", match_percentage)

                # Missing Keywords
                st.subheader("📌 Missing Keywords")
                missing_keywords = response_json.get("MissingKeywords", [])
                if missing_keywords:
                    st.write(", ".join(missing_keywords))
                else:
                    st.write("✅ No critical missing keywords found!")

                # Profile Summary
                st.subheader("🧾 Profile Summary")
                st.write(response_json.get("Profile Summary", "No summary available."))

        except Exception as e:
            st.error(f"❌ An error occurred: {str(e)}")

        finally:
            st.session_state.processing = False

if __name__ == "__main__":
    main()
