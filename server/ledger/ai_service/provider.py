
import os
from functools import lru_cache

from groq import Groq
from openai import OpenAI


@lru_cache(maxsize=1)
def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing")

    return Groq(api_key=api_key)


@lru_cache(maxsize=1)
def get_openrouter_client():
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is missing")

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )


def request_completion(config, messages):
    if config.provider == "groq":
        client = get_groq_client()

    elif config.provider == "openrouter":
        client = get_openrouter_client()

    else:
        raise ValueError(
            f"Unsupported provider: {config.provider}"
        )

    response = client.chat.completions.create(
        model=config.model_id,
        messages=messages,
        temperature=0,
        timeout=config.timeout,
        max_tokens=3500,
    )

    if not response.choices:
        raise ValueError("AI returned no choices")

    content = response.choices[0].message.content

    if not content:
        raise ValueError("AI returned empty content")

    return content
