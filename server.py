from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
import re
import chromadb
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
import dotenv
import os
import shutil



app = Flask(__name__)
CORS(app)


dotenv.load_dotenv()
api_key = os.getenv("API_KEY")

genai.configure(api_key=api_key)

# Initialize ChromaDB for storing and retrieving past stories
chroma_client = chromadb.PersistentClient(path="./story_memory")
embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
vector_db = Chroma(embedding_function=embedding_function, client=chroma_client)

# Default starting story
# initial_story = "You wake up in a mysterious forest. The trees whisper ancient secrets."
# vector_db.add_texts([initial_story])

# Function to generate the next story segment
def generate_story(player_choice, addon, free_input=False):

    # Retrieve Top 3 similar past events
    retrieved_contexts = vector_db.similarity_search(player_choice or addon, k=3)
    past_context = "\n".join([doc.page_content for doc in retrieved_contexts])

    # prompt
    prompt = f"""
    You are an AI Dungeon Master. Continue the story based on past events:

    Past Context:
    {past_context}

    The player provided input: {player_choice or addon}
    Additional input: {addon if addon else "None"}
    
    Provide a vivid scene followed by exactly three choices.
    
    Keep responses short and easy english.
    
    Format:
    Story: <If the player did not choose from existing choices and their input is not related to the story, provide a short rebuttal asking to follow the game before offering three choices else describe the Engaging scene>
    Choices:
    1. <choice one>
    2. <choice two>
    3. <choice three>
    """

    # API response
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    if not response or not response.text:
        return {"story": "Error generating story.", "choices": []}

    text = response.text.strip()

    # Extract story text
    story_match = re.search(r"Story:\s*(.*?)\nChoices:", text, re.DOTALL)
    story_text = story_match.group(1).strip() if story_match else text

    # Extract choices
    choices_match = re.findall(r"\d+\.\s*(.*)", text)
    choices = [choice.strip() for choice in choices_match][:3]
    if not choices:
        choices = ["Explore deeper", "Stay and observe", "Call for help"]

    # Store new story segment in ChromaDB
    vector_db.add_texts([story_text])

    return {"story": story_text, "choices": choices}

@app.route("/story", methods=["POST"])
def get_story():
    data = request.json
    player_choice = data.get("choice", "").strip()
    addon = data.get("addon", "").strip()

    if not player_choice and not addon:
        return jsonify({"error": "No input provided"}), 400

    # Generate new story 
    result = generate_story(player_choice, addon, free_input=not player_choice)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)