from uagents import Agent, Context, Protocol
from messages.t5_base import TranslationRequest, TranslationResponse, Error, SummarizationRequest, SummarizationResponse
from uagents.setup import fund_agent_if_low
import base64
import os

# text you want to translate
#INPUT_TEXT = "Who are you and what have you done with my banana?!"

#SUMM_TEXT = """Venezuelan President Nicolas Maduro has denounced the UK's decision to send the warship HMS Trent to Guyana, stating that it violates the peaceful resolution spirit of the Essequibo dispute agreement. Maduro considers the move a military threat and has ordered joint defensive action by the Bolivarian National Armed Forces. Venezuela asserts its right to defend maritime and territorial integrity within constitutional and international legal frameworks. The dispute arose after a December referendum where Venezuela claimed the "Guayana Esequiba" region, leading to a Declaration of Argyle signed by Maduro and Guyanese President Irfaan Ali to avoid escalation. Despite assurances of commitment to peace from both sides, tensions persist."""
#SUMM_TEXT = """Maine's Secretary of State, Shenna Bellows, has removed former President Donald Trump from the state's 2024 primary ballot, citing the 14th Amendment's "insurrectionist ban." The decision, pending a potential appeal, follows a bipartisan challenge and makes Maine the second state to disqualify Trump after a similar ruling in Colorado. Bellows emphasized her legal obligation under the 14th Amendment and presented evidence that Trump's actions on January 6, 2021, constituted an insurrection. The decision is seen as a significant victory for Trump's critics, who argue for enforcing constitutional provisions safeguarding against anti-democratic insurrectionists. Bellows, a Democrat, issued the decision Thursday after presiding over an administrative hearing earlier this month about Trump’s eligibility for office. A bipartisan group of former state lawmakers filed the challenge against Trump."""
SUMM_TEXT = """The study examines factors relevant to the projection of CCs (commitment contexts) and assesses their contributions to projection behavior. A model with predicate as a fixed effect shows the highest explanatory power, confirming theoretical claims about the role of embedding, genre, tense, person, and predicate lemma in projection. However, even with all factors considered, the model's Nagelkerke R2 remains at 0.35. Additional analyses incorporating plausibility means of CCs indicate more variability in the data to be accounted for, suggesting the need for further exploration. The CommitmentBank study emphasizes the complexity of understanding projectivity, highlighting the necessity for integrating multiple factors for a comprehensive account."""


T5_BASE_AGENT_ADDRESS = os.getenv(
    "T5_BASE_AGENT_ADDRESS", "T5_BASE_AGENT_ADDRESS")

if T5_BASE_AGENT_ADDRESS == "T5_BASE_AGENT_ADDRESS":
    raise Exception(
        "You need to provide an T5_BASE_AGENT_ADDRESS, by exporting env, check README file")

# Define user agent with specified parameters
user = Agent(
    name="t5_base_user",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"],
)

# Check and top up the agent's fund if low
fund_agent_if_low(user.wallet.address())

# translation
#@user.on_event("startup")
#async def initialize_storage(ctx: Context):
#    ctx.storage.set("TranslationDone", False)

# summarization
@user.on_event("startup")
async def initialize_storage(ctx: Context):
    ctx.storage.set("SummarizationDone", False)

# Create an instance of Protocol with a label "T5BaseModelUser"
t5_base_user = Protocol(name="T5BaseModelUser", version="0.0.1")

# translation on interval
#@t5_base_user.on_interval(period=30, messages=TranslationRequest)
#async def transcript(ctx: Context):
#    TranslationDone = ctx.storage.get("TranslationDone")

 #   if not TranslationDone:
  #      await ctx.send(T5_BASE_AGENT_ADDRESS, TranslationRequest(text=INPUT_TEXT))

# translation on message
#@t5_base_user.on_message(model=TranslationResponse)
#async def handle_data(ctx: Context, sender: str, response: TranslationResponse):
#    ctx.logger.info(f"Translated text:  {response.translated_text}")
 #   ctx.storage.set("TranslationDone", True)

# summarization on interval
@t5_base_user.on_interval(period=30, messages=SummarizationRequest) 
async def transcript(ctx: Context):
    SummarizationDone = ctx.storage.get("SummarizationDone")

    if not SummarizationDone:
        await ctx.send(T5_BASE_AGENT_ADDRESS, SummarizationRequest(text=f"summarize: {SUMM_TEXT}"))

# summarization on message
@t5_base_user.on_message(model=SummarizationResponse)
async def handle_data(ctx: Context, sender: str, response: SummarizationResponse):
    ctx.logger.info(f"Summarized text:  {response}")
    ctx.storage.set("SummarizationDone", True)

# error handling
@t5_base_user.on_message(model=Error)
async def handle_error(ctx: Context, sender: str, error: Error):
    ctx.logger.info(f"Got error from uagent: {error}")

# publish_manifest will make the protocol details available on agentverse.
user.include(t5_base_user, publish_manifest=True)

# Initiate the task
if __name__ == "__main__":
    t5_base_user.run()
