from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import config

class PolicyChat:
    def __init__(self):
        if not config.GEMINI_API_KEY:
            print("WARNING: GEMINI_API_KEY is not set for PolicyChat.")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.5,
            google_api_key=config.GEMINI_API_KEY
        )

        self.prompt = ChatPromptTemplate.from_template("""
        You are an AI policy expert for an Urban Digital Twin platform.
        Your goal is to explain specific urban policies to stakeholders (city planners, citizens).

        The user is asking about the following policies which are currently selected in the simulator:
        {policy_context}

        Context about these policies:
        - These are used to reduce CO2 emissions and improve Air Quality (AQI).
        - The user may ask about implementation details, costs, side effects, or effectiveness.

        User Question: {question}

        Provide a clear, concise, and helpful answer. validation: If the user asks about something unrelated to the policies or urban planning, politely steer them back to the topic.
        """)

    def chat(self, policies, question):
        """
        policies: List of policy dictionaries (name, description, etc.)
        question: User's question string
        """
        # Format policy context
        policy_context = ""
        for p in policies:
            policy_context += f"- {p.get('name')} ({p.get('id')}): {p.get('description')}\n"
            if 'details' in p:
                details = p['details']
                policy_context += f"  Cost: {details.get('implementation_cost')}, Public Acceptance: {details.get('public_acceptance')}\n"

        chain = (
            {"policy_context": lambda x: policy_context, "question": lambda x: question}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

        return chain.invoke({})
