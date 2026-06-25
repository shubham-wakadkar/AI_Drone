import tensorflow as tf
import pandas as pd
import numpy as np

# Lazy-load model to avoid import-time crash and provide clearer errors
model = None


def _load_model():
    global model
    if model is not None:
        return model
    try:
        model = tf.keras.models.load_model("microdoppler/microdoppler_fft_cnn.h5")
        return model
    except TypeError as e:
        raise RuntimeError(
            "Failed to deserialize the Keras model. This is commonly caused by a TensorFlow/Keras version mismatch (model saved with a different Keras version).\n"
            "Possible fixes:\n"
            " - Uninstall the standalone `keras` package if installed: `pip uninstall -y keras`\n"
            " - Install a TensorFlow version compatible with the model (example): `pip install 'tensorflow==2.11.0'`\n"
            " - Re-save the model using the current environment's TensorFlow/Keras, then retry.\n"
            "Original error: %s" % e
        ) from e

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

    # Ensure model is loaded (and raise a clear error if it fails)
    m = _load_model()

    prediction = m.predict(X, verbose=0)

    predictions = (prediction > 0.5).astype(int).flatten()

    birds = np.sum(predictions == 0)
    drones = np.sum(predictions == 1)

    if drones > birds:

        confidence = drones / len(predictions)

        return "Drone", confidence

    else:

        confidence = birds / len(predictions)

        return "Bird", confidence