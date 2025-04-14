import React, { useState, useRef } from "react";
import axios from "axios";
import scenarios from "./scenarios";

function App() {
  
  var scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  const [story, setStory] = useState([scenario["story"]]);
  const [choices, setChoices] = useState([
    scenario["choices"][0],
    scenario["choices"][1],
    scenario["choices"][2],
  ]);
  const [addon, setAddon] = useState(""); // Addon input state
  const [selectedChoice, setSelectedChoice] = useState(""); // Selected choice
  const [loading, setLoading] = useState(false);
  const storyEndRef = useRef(null);


  
  const sendInput = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/story", {
        choice: selectedChoice, // Can be empty
        addon: addon.trim(),
      });

      const newStory = response.data.story;
      const newChoices = response.data.choices || [];

      setStory((prev) => [
        ...prev,
        <div
          key={prev.length}
          className="bg-yellow-300 text-black p-3 rounded-md shadow-md transition-all duration-500 ease-in-out"
          style={{
            display: "inline-block",
            padding: "8px 12px",
            backgroundColor: "black",
            borderRadius: "4px",
            fontWeight: "bold",
            boxShadow: "0px 0px 15px rgba(255, 235, 59, 0.7)",
          }}
        >
          🔹 <strong>You said:</strong> {addon || selectedChoice}
        </div>,
        newStory,
        <br />,
      ]);

      if (newChoices.length > 0) {
        setChoices(newChoices);
      }

      setAddon("");
      setSelectedChoice("");
    } catch (error) {
      console.error("Error fetching story:", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-16 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6 text-purple-400">🌟 AI Dungeon Master 🌟</h1>

      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg overflow-y-auto h-80">
        {story.map((paragraph, index) => (
          <p key={index} className="mb-3">{paragraph}</p>
        ))}
        <div ref={storyEndRef} />
      </div>

      <div className="w-full max-w-2xl mt-4 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-2 text-gray-300">What will you do?</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => setSelectedChoice(choice)}
              className={`px-4 py-2 rounded-md font-bold transition ${selectedChoice === choice ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600"}`}
              disabled={loading}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
          <br />
      <div className="w-full max-w-4xl mt-6">
        <input
          type="text"
          value={addon}
          onChange={(e) => setAddon(e.target.value)}
          placeholder="✨ Type your action..."
          className="w-full p-6 text-2xl rounded-xl bg-gray-800 bg-opacity-70 border-2 border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500 text-white placeholder-gray-400 shadow-2xl backdrop-blur-lg transition-all duration-300"
        />
      </div>
          <br />

      <button
        onClick={sendInput}
        className={`px-6 py-2 rounded-md font-bold transition ${loading || (!selectedChoice && !addon) ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
        disabled={loading || (!selectedChoice && !addon)}
      >
        {loading ? "Loading..." : "Submit"}
      </button>
          <br />
    </div>
  );
}

export default App;