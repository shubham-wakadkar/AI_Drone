// App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
// Assuming you placed your new hero image in the public folder or imported it
import heroImage from "./assets/drone-hero.png"; 

function App() {
  const [radarFile, setRadarFile] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [detected, setDetected] = useState(false);
  const [detectorConfidence, setDetectorConfidence] = useState("");
  const [detectedImage, setDetectedImage] = useState("");
  const [cropImage, setCropImage] = useState("");
  const [droneType, setDroneType] = useState("");
  const [classConfidence, setClassConfidence] = useState("");
  const [history, setHistory] = useState([]);

  const analyzeRadar = async () => {
    if (!radarFile) {
      alert("Please select CSV file");
      return;
    }
    const formData = new FormData();
    formData.append("file", radarFile);
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze-radar", formData);
      setPrediction(response.data.prediction);
      setConfidence(response.data.confidence);
      setDetected(false);
      setDetectedImage("");
      setCropImage("");
    } catch (error) {
      console.error(error);
      alert("Radar Analysis Failed");
    }
  };

  const detectDrone = async () => {
    if (!imageFile) {
      alert("Please select image");
      return;
    }
    const formData = new FormData();
    formData.append("file", imageFile);
    try {
      const response = await axios.post("http://127.0.0.1:8000/detect-drone", formData);
      if (!response.data.detected) {
        alert("No drone detected");
        return;
      }
      setDetected(true);
      setDetectorConfidence(response.data.confidence);
      setDetectedImage("http://127.0.0.1:8000/" + response.data.detected_image + "?t=" + Date.now());
      setCropImage(  "http://127.0.0.1:8000/" + response.data.crop_image + "?t=" + Date.now());
    } catch (error) {
      console.error(error);
      alert("Detection Failed");
    }
  };
  
  const classifyDrone = async () => {
    if (!cropImage) {
      alert("No cropped drone image found");
      return;
    }
    try {
      const imageResponse = await fetch(cropImage);
      const blob = await imageResponse.blob();
      const formData = new FormData();
      formData.append("file", blob, "crop.jpg");
      
      const response = await axios.post("http://127.0.0.1:8000/classify-drone", formData);
      setDroneType(response.data.drone_type);
      setClassConfidence(response.data.confidence);
      
      await axios.post("http://127.0.0.1:8000/save-analysis", {
        radar_prediction: prediction,
        radar_confidence: confidence,
        detection_confidence: detectorConfidence,
        drone_type: response.data.drone_type,
        classification_confidence: response.data.confidence
      });
      loadHistory();
    } catch (error) {
      console.error(error);
      alert("Classification Failed");
    }
  };
  
  const loadHistory = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/history");
      setHistory(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const totalAnalyses = history.length;
  const totalDrones = history.filter(item => item.radar_prediction === "Drone").length;
  const totalBirds = history.filter(item => item.radar_prediction === "Bird").length;
  const latestDrone = history.length > 0 ? history[0].drone_type : "N/A";

  return (
    <div className="app-container">
      
      <div className="header-container">
        <img src={heroImage} alt="Drone Hero" className="hero-image" />
        <h1 className="title">AI Drone Surveillance System</h1>
        <div className="subtitle">MODERN DEFENSE RELIES ON LAYERED, INTELLIGENT INFRASTRUCTURE</div>
      </div>

      <hr />

      <h2>System Dashboard</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Analyses</h3>
          <h2>{totalAnalyses}</h2>
        </div>
        <div className="dashboard-card">
          <h3>Total Drones</h3>
          <h2>{totalDrones}</h2>
        </div>
        <div className="dashboard-card">
          <h3>Total Birds</h3>
          <h2>{totalBirds}</h2>
        </div>
        <div className="dashboard-card">
          <h3>Latest Drone</h3>
          <h2>{latestDrone}</h2>
        </div>
      </div>

      <hr />

      <div className="section">
        <h2>Phase 1: Radar Array Input</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setRadarFile(e.target.files[0])}
        />
        <br />
        <button onClick={analyzeRadar}>Initialize Radar Analysis</button>
        
        {prediction && (
          <div style={{ marginTop: "20px" }}>
            <h3>Prediction: <span style={{color: "#fff"}}>{prediction}</span></h3>
            <h3>Confidence: <span style={{color: "var(--neon-green)"}}>{(confidence * 100).toFixed(2)}%</span></h3>
          </div>
        )}
      </div>

      {prediction === "Drone" && (
        <div className="section" style={{ marginTop: "30px" }}>
          <h2>Phase 2: Optical Targeting System</h2>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
          <br />
          <button onClick={detectDrone}>Engage Drone Detection</button>
          
          {detected && (
            <div className="result-card" style={{ marginTop: "20px" }}>
              <h3>Target Lock Acquired</h3>
              <p>Confidence: {(detectorConfidence * 100).toFixed(2)}%</p>
              <img src={detectedImage} alt="Detected Drone" className="detected-image" />
              <br /><br />
              <button onClick={classifyDrone}>Execute Target Classification</button>
              
              {droneType && (
                <div className="result-card" style={{ marginTop: "20px", border: "1px solid var(--neon-green)" }}>
                  <h3>Drone Classification Verified</h3>
                  <p>Type: <span style={{color: "#fff"}}>{droneType}</span></p>
                  <p>Match Confidence: <span style={{color: "var(--neon-green)"}}>{(classConfidence * 100).toFixed(2)}%</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <hr />

      <div className="section">
        <h2>Latest Telemetry Log</h2>
        <p>Radar Result: <span style={{color: "#fff"}}>{prediction || "N/A"}</span></p>
        <p>Drone Type: <span style={{color: "#fff"}}>{droneType || "N/A"}</span></p>
      </div>

      <h2 style={{ marginTop: "40px" }}>Surveillance History Database</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Timestamp</th>
            <th>Radar Signature</th>
            <th>Drone Class</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.timestamp}</td>
              <td>{item.radar_prediction}</td>
              <td>{item.drone_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;