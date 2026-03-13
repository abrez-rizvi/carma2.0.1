import os
import joblib
from aqi_history import AQIHistory

MODEL_PATH = 'aqi_model.pkl'

def train_and_save():
    print("Initializing AQI History...")
    # This triggers training in __init__
    handler = AQIHistory()
    
    if handler.model:
        print("Model trained successfully.")
        print("Saving model to disk...")
        joblib.dump(handler.model, MODEL_PATH)
        joblib.dump(handler.metrics, 'aqi_metrics.pkl')
        print(f"Model saved to {MODEL_PATH}")
    else:
        print("Failed to train model.")

if __name__ == "__main__":
    train_and_save()
