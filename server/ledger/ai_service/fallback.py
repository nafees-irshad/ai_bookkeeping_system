
import logging

from .models.registry import MODELS
from .provider import request_completion
from .validation import validate_batch


logger = logging.getLogger(__name__)


class AllModelsFailed(Exception):
    pass


def generate_with_fallback(
    *,
    messages,
    accounts,
    context,
):
    for config in MODELS:
        try:
            raw_response = request_completion(
                config,
                messages,
            )

            entries = validate_batch(
                raw_response,
                accounts=accounts,
                context=context,
            )

            return entries, {
                "provider": config.provider,
                "model": config.model_id,
            }

        except Exception as exc:
            logger.warning(
                "AI draft failed: %s / %s (%s)",
                config.provider,
                config.model_id,
                type(exc).__name__,
            )

    raise AllModelsFailed(
        "All AI models failed or returned "
        "invalid accounting drafts."
    )
