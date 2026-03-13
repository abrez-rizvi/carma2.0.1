import requests
import os
from config import AMBEE_DATA_KEY


def get_live_aqi(lat: float = 28.7041, lon: float = 77.1025) -> dict:
    """Fetch live AQI data from Ambee Data API for Delhi"""
    
    # Try Ambee API first
    if AMBEE_DATA_KEY:
        try:
            url = "https://api.ambeedata.com/latest/by-lat-lng"
            headers = {
                "x-api-key": AMBEE_DATA_KEY,
                "Content-Type": "application/json"
            }
            params = {
                "lat": lat,
                "lng": lon
            }
            
            print(f"Fetching AQI from Ambee for lat={lat}, lng={lon}")
            response = requests.get(url, headers=headers, params=params, timeout=10)
            print(f"Response status: {response.status_code}")
            
            
            response.raise_for_status()
            data = response.json()
            print(f"Ambee response: {data}")
            
            # Parse Ambee API response
            if data.get("stations") and len(data["stations"]) > 0:
                station = data["stations"][0]  # Get first station
                print(f"AQI data extracted from station: {station}")
                
                # Map Ambee pollution to our format
                return {
                    "aqi": station.get("AQI", 50),  # Actual AQI value (0-500)
                    "aqi_category": station.get("aqiInfo", {}).get("category", "Unknown"),
                    "pm2_5": station.get("PM25", 0),
                    "pm10": station.get("PM10", 0),
                    "o3": station.get("OZONE", 0),
                    "no2": station.get("NO2", 0),
                    "so2": station.get("SO2", 0),
                    "co": station.get("CO", 0),
                    "city": station.get("city", "Unknown"),
                    "source": "Ambee Data API"
                }
            else:
                print(f"No 'stations' array in response: {data}")
        except Exception as e:
            print(f"Error fetching from Ambee API: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("AMBEE_API_KEY not set in environment")
    
    # Return mock data as fallback
    print("Using mock AQI data (Ambee API failed or not configured)")
    return {
        "aqi": 50,
        "aqi_category": "Good",
        "pm2_5": 12.5,
        "pm10": 25.0,
        "o3": 45.2,
        "no2": 28.5,
        "so2": 8.1,
        "co": 0.5,
        "source": "Mock Data"
    }

# Function to register Flask routes (call this from main app file)
def register_aqi_routes(app):
    """Register AQI routes with Flask app"""
    from flask import request, jsonify
    
    @app.route('/api/aqi', methods=['GET'])
    def fetch_aqi():
        try:
            lat = request.args.get('lat', 40.7128, type=float)
            lon = request.args.get('lon', -74.0060, type=float)
            aqi_data = get_live_aqi(lat, lon)
            return jsonify(aqi_data), 200
        except Exception as e:
            print(f"Error in fetch_aqi: {e}")
            return jsonify({"error": str(e), "aqi_index": 2, "pm2_5": 12.5}), 200