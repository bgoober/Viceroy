import requests
import json
from aea.helpers.transaction.base import Terms
from aea.protocols.default.message import DefaultMessage
from aea.skills.base import Handler
from aea.skills.base import Handler

# ...

def get_data(ctx: Context, text: str) -> Union[Data, Error]:
    try:
        # Send a request to the Hugging Face API
        response = requests.post(
            "https://api.huggingface.co/models/facebook/bart-large-cnn",
            headers={"Authorization": "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"},
            data=json.dumps({"inputs": text}),
        )
        response.raise_for_status()

        # Parse the response
        data = response.json()
        summarized_text = data["outputs"]

        # Construct a Data message
        msg = Data(
            value=summarized_text,
            unit="",
            time=datetime.now().isoformat(),
            rating=1.0,
            ref="https://api.huggingface.co/models/facebook/bart-large-cnn",
            summary="Summarized text from Hugging Face's BART/CNN model",
        )
        return msg
    except Exception as ex:
        ctx.logger.exception(f"An error occurred retrieving data from the Hugging Face API: {ex}")
        return Error(text="Sorry, I wasn't able to answer your request this time. Feel free to try again.")

# ...