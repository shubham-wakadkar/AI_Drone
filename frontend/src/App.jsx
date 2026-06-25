import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";


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

    formData.append(
      "file",
      radarFile
    );

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/analyze-radar",
        formData
      );

      setPrediction(
        response.data.prediction
      );

      setConfidence(
        response.data.confidence
      );

      // reset downstream results
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

    formData.append(
      "file",
      imageFile
    );

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/detect-drone",
        formData
      );

      if (!response.data.detected) {

        alert("No drone detected");

        return;
      }

      setDetected(true);

      setDetectorConfidence(
        response.data.confidence
      );

      setDetectedImage(
        "http://127.0.0.1:8000/" +
        response.data.detected_image
      );

      setCropImage(
        "http://127.0.0.1:8000/" +
        response.data.crop_image
      );

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
  
      const imageResponse = await fetch(
        cropImage
      );
  
      const blob = await imageResponse.blob();
  
      const formData = new FormData();
  
      formData.append(
        "file",
        blob,
        "crop.jpg"
      );
  
      const response = await axios.post(
        "http://127.0.0.1:8000/classify-drone",
        formData
      );
  
      setDroneType(
        response.data.drone_type
      );
  
      setClassConfidence(
        response.data.confidence
      );
      
      await axios.post(
        "http://127.0.0.1:8000/save-analysis",
        {
      
          radar_prediction: prediction,
      
          radar_confidence: confidence,
      
          detection_confidence: detectorConfidence,
      
          drone_type: response.data.drone_type,
      
          classification_confidence:
            response.data.confidence
        }
      );
      
      loadHistory();
  
    } catch (error) {
  
      console.error(error);
  
      alert("Classification Failed");
    }
  };
  
  const loadHistory = async () => {

    try {
  
      const response = await axios.get(
        "http://127.0.0.1:8000/history"
      );
  
      setHistory(
        response.data
      );
  
    } catch (error) {
  
      console.error(error);
    }
  };
  
  useEffect(() => {

    loadHistory();
  
  }, []);
  
  const totalAnalyses = history.length;

  const totalDrones =
    history.filter(
      item => item.radar_prediction === "Drone"
    ).length;
  
  const totalBirds =
    history.filter(
      item => item.radar_prediction === "Bird"
    ).length;
  
  const latestDrone =
    history.length > 0
      ? history[0].drone_type
      : "N/A";

  return (

    <div className="app-container">

      <h1 className="title">
        AI Drone Surveillance System
      </h1>

      <hr />

<h2>
Dashboard
</h2>

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
      <h2>
        Step 1 : Radar Analysis
      </h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) =>
          setRadarFile(
            e.target.files[0]
          )
        }
      />
      </div>

      <br />
      <br />

      <button
        onClick={analyzeRadar}
      >
        Analyze Radar
      </button>

      <br />
      <br />

      {
        prediction && (

          <div>

            <h3>
              Prediction:
            </h3>

            <p>
              {prediction}
            </p>

            <h3>
              Confidence:
            </h3>

            <p>
              {(confidence * 100).toFixed(2)}%
            </p>

          </div>
        )
      }

      {
        prediction === "Drone" && (

          <div className="section">
            <hr />


            <h2>
              Step 2 : Camera Analysis
            </h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImageFile(
                  e.target.files[0]
                )
              }
            />

            <br />
            <br />

            <button
              onClick={detectDrone}
            >
              Detect Drone
            </button>

            <br />
            <br />

            {
              detected && (

                <div className="result-card">

                  <h3>
                    Drone Detected
                  </h3>

                  <p>
                    Confidence:
                    {" "}
                    {(detectorConfidence * 100).toFixed(2)}%
                  </p>

                  <img
                    src={detectedImage}
                    alt="Detected Drone"
                    className="detected-image"
                  />
                  <br />
                  <br />
                  
                  <button
                    onClick={classifyDrone}
                  >
                    Classify Drone
                  </button>{
  droneType && (

    <div className="result-card">

      <h3>
        Drone Classification
      </h3>

      <p>
        Type:
        {" "}
        {droneType}
      </p>

      <p>
        Confidence:
        {" "}
        {(classConfidence * 100).toFixed(2)}%
      </p>

    </div>

  )
}

                </div>
              )
            }

          </div>

        )
      }

<hr />

<div className="section">

  <h2>
    Latest Analysis
  </h2>

  <p>
    Radar Result:
    {" "}
    {prediction || "N/A"}
  </p>

  <p>
    Drone Type:
    {" "}
    {droneType || "N/A"}
  </p>

</div>
<h2>
Analysis History
</h2>

<table className="history-table">

  <thead>

    <tr>

      <th>ID</th>

      <th>Timestamp</th>

      <th>Radar</th>

      <th>Drone Type</th>

    </tr>

  </thead>

  <tbody>

    {
      history.map((item) => (

        <tr key={item.id}>

          <td>{item.id}</td>

          <td>{item.timestamp}</td>

          <td>{item.radar_prediction}</td>

          <td>{item.drone_type}</td>

        </tr>

      ))
    }

  </tbody>

</table>
</div>
  );
}

export default App;