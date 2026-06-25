from ultralytics import YOLO
from PIL import Image
import os
import uuid

uid = str(uuid.uuid4())[:8]

# Load detector model
model = YOLO("detector/best.pt")


def detect(image_path):

    results = model.predict(
        source=image_path,
        conf=0.25,
        save=False,
        verbose=False
    )

    result = results[0]

    # No drone found
    if len(result.boxes) == 0:
        return False, None, None, None

    # Highest confidence detection
    box = result.boxes[0]

    confidence = float(box.conf[0])

    x1, y1, x2, y2 = map(int, box.xyxy[0])

    img = Image.open(image_path)

    crop = img.crop((x1, y1, x2, y2))

    os.makedirs("outputs", exist_ok=True)

    crop_path = f"outputs/crop_{uid}.jpg"

    crop.save(crop_path)

    plotted = result.plot()

    detected_path = f"outputs/detected_{uid}.jpg"

    Image.fromarray(plotted).save(detected_path)

    return True, confidence, detected_path, crop_path