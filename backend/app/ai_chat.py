import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Optional

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

SYSTEM_PROMPT = """You are GeneTrust AI, an expert bioinformatics research assistant specialising in:
- CRISPR-Cas9 guide RNA design and optimisation
- DNA sequence analysis, mutation prediction, and off-target risk
- Biochemical properties of nucleic acids (melting temperature, GC content, molecular weight)
- Pairwise sequence alignment and similarity
- Genomics, transcriptomics, and molecular biology

You are embedded inside GeneTrust, a CRISPR guide RNA optimisation platform that uses DNABERT-2 (a transformer model trained on the human genome) to predict optimal single-base mutations in 20-mer guide sequences.

Guidelines:
- Give precise, scientifically accurate answers.
- When analysing sequences, cite the actual nucleotide positions and bases.
- If a prediction result context is provided, refer to it directly.
- Keep answers concise but thorough — use bullet points for multi-part answers.
- If asked something outside bioinformatics/genomics, politely redirect.
- Never hallucinate citations or gene names.
"""

def get_groq_client():
    """Return a configured Groq client, or None if no API key."""
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        from groq import Groq  # type: ignore[import-untyped]
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"[ai_chat] Failed to initialise Groq client: {e}")
        return None

def build_context_prefix(prediction_context: Optional[dict]) -> str:
    """Convert a prediction result dict into a readable context string."""
    if not prediction_context:
        return ""
    ctx = prediction_context
    lines = [
        "=== Current Prediction Context ===",
        f"Original sequence : {ctx.get('originalSequence', 'N/A')}",
        f"Optimised sequence: {ctx.get('editedSequence', 'N/A')}",
        f"Mutation          : {ctx.get('originalBase', '?')}→{ctx.get('newBase', '?')} at position {ctx.get('changedPosition', '?')}",
        f"Original efficiency: {ctx.get('originalEfficiency', 'N/A')}%",
        f"Optimised efficiency: {ctx.get('efficiency', 'N/A')}%",
        f"GC content        : {ctx.get('gcContent', 'N/A')}%",
        f"Melting temp (Tm) : {ctx.get('meltingTemp', 'N/A')}°C",
        f"Molecular weight  : {ctx.get('molecularWeight', 'N/A')} g/mol",
        "=================================",
        "",
    ]
    return "\n".join(lines)

async def chat_with_ai(
    message: str,
    history: List[dict],
    prediction_context: Optional[dict] = None,
    ncbi_context: Optional[dict] = None,
) -> str:
    """
    Send a message to Groq and return the reply string.
    Falls back to a helpful stub if no API key is configured.
    """
    client = get_groq_client()

    if client is None:
        return (
            "⚠️ **AI Assistant not configured.** "
            "Please paste your `GROQ_API_KEY` into `backend/.env` **AND SAVE THE FILE** (Cmd+S / Ctrl+S) to enable this feature."
        )

    try:

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        for msg in history:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

        context_prefix = build_context_prefix(prediction_context)
        if ncbi_context:
            context_prefix += f"\n\n=== NCBI Gene Context ===\nGene: {ncbi_context.get('gene')}\nDescription: {ncbi_context.get('description')}\nNCBI ID: {ncbi_context.get('ncbi_id')}\nThis is a real human gene sequence imported from NCBI.\n==========================\n\n"

        full_message = context_prefix + message if context_prefix else message
        messages.append({"role": "user", "content": full_message})

        chat_completion = client.chat.completions.create(
            messages=messages,  # type: ignore
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content or ""

    except Exception as e:
        error_msg = str(e)
        if "AuthenticationError" in error_msg or "authentication" in error_msg.lower():
            return "❌ Invalid Groq API key. Please check your `GROQ_API_KEY` in `backend/.env`."
        if "quota" in error_msg.lower() or "rate" in error_msg.lower() or "RateLimitError" in error_msg:
            return "⚠️ Groq API rate limit or quota exceeded. Please try again later."
        return f"❌ AI service error: {error_msg}"
