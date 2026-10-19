
from dataclasses import dataclass


@dataclass(frozen=True)
class ModelConfig:
    provider: str
    model_id: str
    timeout: float = 35.0


MODELS = (
    ModelConfig(
        provider="groq",
        model_id="openai/gpt-oss-120b",
    ),
    ModelConfig(
        provider="groq",
        model_id="qwen/qwen3.8-27b",
    ),
    ModelConfig(
        provider="openrouter",
        model_id="nvidia/nemotron-3.5-super-vl:free",
    ),
    ModelConfig(
        provider="openrouter",
        model_id="thinkingmachines/inkling-small:free",
    ),
)
