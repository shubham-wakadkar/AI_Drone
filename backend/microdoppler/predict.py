import tensorflow as tf
import pandas as pd
import numpy as np

# Load model only once
model = tf.keras.models.load_model("microdoppler/microdoppler_fft_cnn.h5")

WINDOW_SIZE = 128
STRIDE = 64


def preprocess(csv_file):

    df = pd.read_csv(csv_file)

    if 'V' not in df.columns:
        raise ValueError("CSV must contain column 'V'")

    v = pd.to_numeric(df['V'], errors='coerce').dropna().values

    segments = []

    for i in range(0, len(v) - WINDOW_SIZE + 1, STRIDE):

        window = v[i:i + WINDOW_SIZE]

        fft_window = np.abs(np.fft.fft(window))[:WINDOW_SIZE // 2]

        segments.append(fft_window)

    X = np.array(segments)

    X = (X - X.mean(axis=1, keepdims=True)) / X.std(axis=1, keepdims=True)

    X = X[..., np.newaxis]

    return X


def predict(csv_file):

    X = preprocess(csv_file)

    prediction = model.predict(X, verbose=0)

    predictions = (prediction > 0.5).astype(int).flatten()

    birds = np.sum(predictions == 0)
    drones = np.sum(predictions == 1)

    if drones > birds:

        confidence = drones / len(predictions)

        return "Drone", confidence

    else:

        confidence = birds / len(predictions)

        return "Bird", confidence