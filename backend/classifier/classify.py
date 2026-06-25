from ultralytics import YOLO

# Load classifier once
model = YOLO("classifier/best.pt")


def classify(image_path):
    """
    Classify cropped drone image.

    Returns:
        drone_name (str)
        confidence (float)
    """

    results = model.predict(
        image_path,
        verbose=False
    )

    r = results[0]

    class_id = r.probs.top1
    confidence = float(r.probs.top1conf)

    class_name = r.names[class_id]

    return class_name, confidence