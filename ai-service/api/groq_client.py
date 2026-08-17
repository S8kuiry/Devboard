# Thin wrapper around Groq SDK

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing")
    return Groq(api_key=api_key)