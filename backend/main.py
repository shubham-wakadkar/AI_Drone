from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File

import os

from microdoppler.predict import predict
from detector.detect import detect
from classifier.classify import classify
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db

from database import (
    save_analysis,
    get_history
)

app = FastAPI()

init_db()

app.mount(
    "/outputs",
    StaticFiles(directory="outputs"),
    name="outputs"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(
    "uploads",
    exist_ok=True
)


@app.get("/")
def home():

    return {
        "message":
        "AI Drone Surveillance Backend Running"
    }


@app.post("/analyze-radar")
async def analyze_radar(
    file: UploadFile = File(...)
):

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as f:

        f.write(
            await file.read()
        )

    prediction, confidence = predict(
        file_path
    )

    return {

        "prediction": prediction,

        "confidence": confidence

    }

@app.post("/detect-drone")
async def detect_drone(
    file: UploadFile = File(...)
):

    image_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(image_path, "wb") as f:

        f.write(
            await file.read()
        )

    found, confidence, detected_image, crop_image = detect(
        image_path
    )

    if not found:

        return {

            "detected": False

        }

    return {

        "detected": True,

        "confidence": confidence,

        "detected_image": detected_image,

        "crop_image": crop_image

    }

@app.post("/classify-drone")
async def classify_drone(
    file: UploadFile = File(...)
):

    image_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(image_path, "wb") as f:

        f.write(
            await file.read()
        )

    label, confidence = classify(
        image_path
    )

    return {

        "drone_type": label,

        "confidence": confidence

    }

@app.get("/history")
def history():

    rows = get_history()

    result = []

    for row in rows:

        result.append({

            "id": row[0],

            "timestamp": row[1],

            "radar_prediction": row[2],

            "radar_confidence": row[3],

            "detection_confidence": row[4],

            "drone_type": row[5],

            "classification_confidence": row[6]

        })

    return result

@app.post("/save-analysis")
async def save_analysis_endpoint(data: dict):

    save_analysis(

        data["radar_prediction"],

        data["radar_confidence"],

        data["detection_confidence"],

        data["drone_type"],

        data["classification_confidence"]

    )

    return {
        "message": "saved"
    }