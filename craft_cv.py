import openai

def generate_cv_and_cover_letter(user_history, job_description, cover_letter_required=True):
    openai.api_key = "YOUR_API_KEY"  # Replace with your actual OpenAI API key

    if cover_letter_required:
        # Step 1: Generate the cover letter
        cover_letter_prompt = f"Based on the following user history and job description, create a tailored cover letter for the job application:\n\nUser History:\n{user_history}\n\nJob Description:\n{job_description}\n\nCover Letter:"
        cover_letter_response = openai.Completion.create(
            engine="text-davinci-002",
            prompt=cover_letter_prompt,
            max_tokens=500,
            n=1,
            stop=None,
            temperature=0.7,
        )
        cover_letter = cover_letter_response.choices[0].text.strip()
        print("Cover Letter:")
        print(cover_letter)
        print("\n")

        # Get user approval for the cover letter
        user_approval = input("Do you approve the generated cover letter? (yes/no): ")
        if user_approval.lower() != "yes":
            print("Cover letter not approved. Please revise and try again.")
            return None, None

    # Step 2: Generate the CV
    cv_prompt = f"Based on the following user history and job description, create a tailored CV for the job application:\n\nUser History:\n{user_history}\n\nJob Description:\n{job_description}\n\n"
    if cover_letter_required:
        cv_prompt += f"Cover Letter:\n{cover_letter}\n\n"
    cv_prompt += "CV (in plain text format):"

    cv_response = openai.Completion.create(
        engine="text-davinci-002",
        prompt=cv_prompt,
        max_tokens=1000,
        n=1,
        stop=None,
        temperature=0.7,
    )
    cv_draft = cv_response.choices[0].text.strip()

    return cv_draft, cover_letter if cover_letter_required else None