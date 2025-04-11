import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../Chatbot.css";

function Chatbot() {
  const [messages, setMessages] = useState([
    { 
      role: "bot", 
      content: "வணக்கம்! நான் தாவர நோய் ஆலோசகர். உங்கள் தாவரங்களின் ஆரோக்கியத்தைப் பற்றி என்ன கேட்க விரும்புகிறீர்கள்?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Download chat history
  const handleDownload = () => {
    const chatText = messages.map(msg => 
      `${msg.role === "user" ? "நீங்கள்: " : "ஆலோசகர்: "}${msg.content.replace(/<[^>]+>/g, '')}`
    ).join("\n\n");
    
    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "தாவர_ஆலோசனை_வரலாறு.txt";
    link.click();
  };

  // Speech recognition
  const handleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setMessages([...messages, { 
        role: "bot", 
        content: "⚠️ உங்கள் உலாவி பேச்சு உள்ளீட்டை ஆதரிக்கவில்லை" 
      }]);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "ta-IN"; 
    recognition.start();
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    
    recognition.onerror = (event) => {
      setMessages([...messages, { 
        role: "bot", 
        content: "⚠️ பேச்சு உள்ளீட்டில் பிழை: " + event.error 
      }]);
    };
  };

  
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        query: userMessage,
      });

      const formattedResponse = formatResponse(response.data.reply);
      setMessages(prev => [...prev, { role: "bot", content: formattedResponse }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "⚠️ பிழை: பதிலை பெற முடியவில்லை. தயவு செய்து பிறகு முயற்சிக்கவும்." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (text) => {
    const lines = text.split("\n");
    return lines.map(line => {
      if (line.startsWith("**")) {
        return `<strong class="response-heading">${line.replace(/\*\*/g, "")}</strong>`;
      } else if (line.startsWith("- ") || line.startsWith("• ")) {
        return `<div class="response-bullet">${line.substring(2)}</div>`;
      } else if (/^\d+\.\s+/.test(line)) {
        return `<div class="response-numbered">${line}</div>`;
      } else if (line.trim() === "") {
        return `<div class="response-space"></div>`;
      } else {
        return `<div class="response-paragraph">${line}</div>`;
      }
    }).join("");
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chatbot-app ${darkMode ? "dark-mode" : ""}`}>
      <div className="chatbot-header">
        <div className="header-content">
          <div className="logo">🌿</div>
          <h1>தாவர நோய் ஆலோசகர்</h1>
          <p>உங்கள் தாவரங்களின் ஆரோக்கியத்தை பராமரிக்க உதவுகிறேன்</p>
        </div>
        <div className="header-controls">
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="download-btn" onClick={handleDownload} title="உரையாடலை பதிவிறக்கவும்">
            📥
          </button>
        </div>
      </div>

      <div className="chatbot-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.role}`}
            >
              <div className="message-content">
                {msg.role === "bot" ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                ) : (
                  msg.content
                )}
              </div>
              <div className="message-time">
                {new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="உங்கள் கேள்வியை இங்கே உள்ளிடவும்..."
              disabled={isLoading}
            />
            <button 
              className="speech-btn"
              onClick={handleSpeechInput}
              title="பேச்சு உள்ளீடு"
              disabled={isLoading}
            >
              🎙️
            </button>
            <button 
              className="send-btn"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                <span>அனுப்பு</span>
              )}
            </button>
          </div>
          <div className="input-hint">
            உதவிக்குறிப்பு: "தக்காளி இலை கரும்புள்ளி நோய் பற்றி சொல்லுங்கள்"
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;