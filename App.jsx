import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Detection from "./pages/Detection";
import Chatbot from "./pages/Chatbot";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-content">
            <Link to="/" className="nav-brand">
              🌿 Plant Disease Detection
            </Link>
            <div className="nav-menu">
              <Link to="/" className="nav-link">
                Detection
              </Link>
              <Link to="/chatbot" className="nav-link">
                💬 AgriBot (தமிழ்)
              </Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Detection />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Plant Health Assistant</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;