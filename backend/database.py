import sqlite3

DB_NAME = "drone_surveillance.db"


def init_db():

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        timestamp TEXT,

        radar_prediction TEXT,

        radar_confidence REAL,

        detection_confidence REAL,

        drone_type TEXT,

        classification_confidence REAL

    )
    """)

    conn.commit()

    conn.close()

from datetime import datetime


def save_analysis(
    radar_prediction,
    radar_confidence,
    detection_confidence,
    drone_type,
    classification_confidence
):

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO analyses (

            timestamp,

            radar_prediction,
            radar_confidence,

            detection_confidence,

            drone_type,
            classification_confidence

        )

        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            radar_prediction,
            radar_confidence,

            detection_confidence,

            drone_type,
            classification_confidence
        )
    )

    conn.commit()

    conn.close()

def get_history():

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *

        FROM analyses

        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()

    conn.close()

    return rows