"""
Carbon Emission Maps - Visualization of CO2 emissions across Delhi
Similar to AQI maps but showing emission sources and concentrations
"""

import folium
import os
import time
import random
import pandas as pd
from pathlib import Path

# Delhi center coordinates
DELHI_LAT = 28.7041
DELHI_LON = 77.1025

# Emission hotspots with sector-based CO2 values (in tonnes/day per zone)
# Categories: Industrial, Transport Hub, Residential, Power, Commercial
EMISSION_HOTSPOTS = [
    # Industrial Areas (Highest emissions)
    {"name": "Bawana Industrial Area", "lat": 28.8, "lon": 77.03, "emission": 45.2, "sector": "Industry", "icon": "🏭"},
    {"name": "Okhla Industrial Area", "lat": 28.5365, "lon": 77.2803, "emission": 42.8, "sector": "Industry", "icon": "🏭"},
    {"name": "Mundka Industrial", "lat": 28.6794, "lon": 77.0284, "emission": 38.5, "sector": "Industry", "icon": "🏭"},
    {"name": "Wazirpur Industrial", "lat": 28.6967, "lon": 77.1658, "emission": 36.2, "sector": "Industry", "icon": "🏭"},
    {"name": "Narela Industrial", "lat": 28.85, "lon": 77.1, "emission": 34.8, "sector": "Industry", "icon": "🏭"},
    {"name": "Patparganj Industrial", "lat": 28.612, "lon": 77.292, "emission": 32.5, "sector": "Industry", "icon": "🏭"},
    
    # Transport Hubs
    {"name": "IGI Airport", "lat": 28.5562, "lon": 77.1, "emission": 48.5, "sector": "Aviation", "icon": "✈️"},
    {"name": "ISBT Kashmere Gate", "lat": 28.6682, "lon": 77.2284, "emission": 28.4, "sector": "Transport", "icon": "🚌"},
    {"name": "ISBT Anand Vihar", "lat": 28.6508, "lon": 77.3152, "emission": 26.8, "sector": "Transport", "icon": "🚌"},
    {"name": "New Delhi Railway Station", "lat": 28.6421, "lon": 77.2194, "emission": 22.5, "sector": "Transport", "icon": "🚂"},
    {"name": "ITO Junction", "lat": 28.6294, "lon": 77.241, "emission": 21.2, "sector": "Transport", "icon": "🚗"},
    {"name": "Connaught Place", "lat": 28.6315, "lon": 77.2167, "emission": 24.6, "sector": "Transport", "icon": "🚗"},
    {"name": "Chandni Chowk", "lat": 28.656, "lon": 77.231, "emission": 23.8, "sector": "Transport", "icon": "🚗"},
    
    # Power Plants / Substations
    {"name": "Badarpur Power Plant", "lat": 28.48, "lon": 77.35, "emission": 52.3, "sector": "Power", "icon": "⚡"},
    {"name": "Rajghat Power House", "lat": 28.6567, "lon": 77.2519, "emission": 38.7, "sector": "Power", "icon": "⚡"},
    {"name": "Indraprastha Power", "lat": 28.6125, "lon": 77.2372, "emission": 35.4, "sector": "Power", "icon": "⚡"},
    
    # Residential Dense Areas
    {"name": "Rohini Residential", "lat": 28.7019, "lon": 77.0984, "emission": 18.5, "sector": "Residential", "icon": "🏠"},
    {"name": "Dwarka Sector-8", "lat": 28.5656, "lon": 77.067, "emission": 16.8, "sector": "Residential", "icon": "🏠"},
    {"name": "Jahangirpuri", "lat": 28.716, "lon": 77.1829, "emission": 15.2, "sector": "Residential", "icon": "🏠"},
    {"name": "Shahdara", "lat": 28.681, "lon": 77.305, "emission": 17.4, "sector": "Residential", "icon": "🏠"},
    {"name": "Lajpat Nagar", "lat": 28.5697, "lon": 77.253, "emission": 14.8, "sector": "Residential", "icon": "🏠"},
    {"name": "Punjabi Bagh", "lat": 28.673, "lon": 77.1374, "emission": 15.6, "sector": "Residential", "icon": "🏠"},
    {"name": "RK Puram", "lat": 28.5505, "lon": 77.1849, "emission": 14.2, "sector": "Residential", "icon": "🏠"},
    
    # Commercial Areas
    {"name": "Nehru Place", "lat": 28.5485, "lon": 77.2513, "emission": 19.8, "sector": "Commercial", "icon": "🏢"},
    {"name": "Saket Mall Area", "lat": 28.521, "lon": 77.219, "emission": 17.2, "sector": "Commercial", "icon": "🏢"},
    {"name": "Gurgaon Border", "lat": 28.495, "lon": 77.08, "emission": 22.4, "sector": "Commercial", "icon": "🏢"},
]

# Sector colors for visualization
SECTOR_COLORS = {
    "Industry": "#dc2626",      # Red
    "Aviation": "#f97316",      # Orange
    "Transport": "#eab308",     # Yellow
    "Power": "#8b5cf6",         # Purple
    "Residential": "#22c55e",   # Green
    "Commercial": "#3b82f6",    # Blue
}


def get_emission_color(emission_value):
    """Get color based on emission level (tonnes/day)."""
    if emission_value < 15:
        return "#22c55e"  # Green - Low
    elif emission_value < 25:
        return "#84cc16"  # Lime
    elif emission_value < 35:
        return "#eab308"  # Yellow
    elif emission_value < 45:
        return "#f97316"  # Orange
    else:
        return "#dc2626"  # Red - High


def add_delhi_boundary_to_map(m):
    """Helper to fetch and add Delhi boundary to a map."""
    import requests
    try:
        geojson_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Boundary.geojson"
        
        folium.GeoJson(
            geojson_url,
            name="Delhi Boundary",
            style_function=lambda x: {
                'fillColor': 'none',
                'color': 'black',
                'weight': 3,
                'dashArray': '5, 5',
                'opacity': 0.6
            }
        ).add_to(m)
        return True
    except Exception as e:
        print(f"Error adding boundary: {e}")
        return False


def generate_emission_heatmap_html():
    """Generates a Folium map with Grid Heatmap for CO2 emissions (Clipped to Delhi)."""
    
    m = folium.Map(
        location=[DELHI_LAT, DELHI_LON], 
        zoom_start=10, 
        control_scale=True
    )
    
    import requests
    from shapely.geometry import shape, Point
    from shapely.ops import unary_union
    
    add_delhi_boundary_to_map(m)
    
    delhi_polygon = None
    has_boundary = False
    
    try:
        geojson_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Boundary.geojson"
        resp = requests.get(geojson_url)
        data = resp.json()
        features = data.get('features', [])
        shapes = [shape(f['geometry']) for f in features]
        delhi_polygon = unary_union(shapes)
        has_boundary = True
    except Exception as e:
        print(f"Error processing boundary for clipping: {e}")
    
    # Grid config
    lat_min, lat_max = 28.40, 28.88
    lon_min, lon_max = 76.85, 77.35
    step = 0.015  # Approx 1.5km grid size
    
    def get_color(value):
        """Blue-to-red emission heatmap colors."""
        if value < 15: return "#eff6ff"   # Very Light Blue
        if value < 25: return "#bfdbfe"   # Light Blue
        if value < 35: return "#93c5fd"   # Medium Blue
        if value < 45: return "#60a5fa"   # Blue
        if value < 55: return "#3b82f6"   # Strong Blue
        if value < 65: return "#f97316"   # Orange
        return "#dc2626"                   # Red
    
    lat = lat_min
    while lat < lat_max:
        lon = lon_min
        while lon < lon_max:
            center_point = Point(lon + step/2, lat + step/2)
            
            if has_boundary and not delhi_polygon.contains(center_point):
                lon += step
                continue
            
            # Calculate emission based on nearby hotspots
            base_emission = 20.0  # Baseline
            
            # Add contribution from nearby hotspots
            for hotspot in EMISSION_HOTSPOTS:
                dist = ((lat - hotspot['lat'])**2 + (lon - hotspot['lon'])**2)**0.5
                if dist < 0.05:  # ~5km radius of influence
                    contribution = hotspot['emission'] * (1 - dist/0.05) * 0.5
                    base_emission += contribution
            
            # Add random variation
            val = base_emission + random.uniform(-5, 5)
            val = max(10, min(80, val))  # Clamp
            
            color = get_color(val)
            
            folium.Rectangle(
                bounds=[[lat, lon], [lat + step, lon + step]],
                color=None,
                fill=True,
                fill_color=color,
                fill_opacity=0.6,
                tooltip=f"CO₂: {val:.1f} t/day"
            ).add_to(m)
            
            lon += step
        lat += step
    
    return m.get_root().render()


def generate_emission_hotspots_html():
    """Generates a map with sector-wise emission sources."""
    m = folium.Map(location=[DELHI_LAT, DELHI_LON], zoom_start=11)
    
    add_delhi_boundary_to_map(m)
    
    for spot in EMISSION_HOTSPOTS:
        emission = spot['emission']
        sector = spot['sector']
        color = SECTOR_COLORS.get(sector, "#6b7280")
        
        # Size based on emission level
        radius = 8 + (emission / 5)
        
        folium.CircleMarker(
            location=[spot['lat'], spot['lon']],
            radius=radius,
            popup=f"<b>{spot['icon']} {spot['name']}</b><br>Sector: {sector}<br>CO₂: {emission} t/day",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7
        ).add_to(m)
        
        # Add emission value label
        folium.Marker(
            location=[spot['lat'], spot['lon']],
            icon=folium.DivIcon(
                html=f'<div style="font-weight: bold; font-size: 10px; color: white; text-shadow: 0 0 3px black;">{spot["emission"]:.0f}</div>'
            )
        ).add_to(m)
    
    # Add legend
    legend_html = '''
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000; background: white; padding: 10px; border-radius: 5px; font-size: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <b>Emission Sources (t/day)</b><br>
        <span style="color: #dc2626;">●</span> Industry<br>
        <span style="color: #f97316;">●</span> Aviation<br>
        <span style="color: #eab308;">●</span> Transport<br>
        <span style="color: #8b5cf6;">●</span> Power<br>
        <span style="color: #22c55e;">●</span> Residential<br>
        <span style="color: #3b82f6;">●</span> Commercial
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m.get_root().render()


def generate_forecast_emission_hotspots_html(year: int):
    """Generates emission hotspots adjusted for forecast year."""
    m = folium.Map(location=[DELHI_LAT, DELHI_LON], zoom_start=11)
    
    add_delhi_boundary_to_map(m)
    
    # Get scaling factor
    try:
        forecast_path = Path(__file__).parent / "emission_forecast_3years_full.csv"
        if forecast_path.exists():
            df = pd.read_csv(forecast_path)
            df['Date'] = pd.to_datetime(df['Date'])
            df['Year'] = df['Date'].dt.year
            
            baseline_2025 = df[df['Year'] == 2025]['Total_Emission'].mean()
            year_avg = df[df['Year'] == year]['Total_Emission'].mean()
            
            if not pd.isna(baseline_2025) and not pd.isna(year_avg) and baseline_2025 > 0:
                scaling_factor = year_avg / baseline_2025
            else:
                scaling_factor = 1.0
        else:
            scaling_factor = 1.0
    except Exception as e:
        print(f"Error calculating scaling: {e}")
        scaling_factor = 1.0
    
    print(f"Emission hotspots for {year}: scaling factor = {scaling_factor:.4f}")
    
    for spot in EMISSION_HOTSPOTS:
        emission = spot['emission'] * scaling_factor
        sector = spot['sector']
        color = SECTOR_COLORS.get(sector, "#6b7280")
        
        radius = 8 + (emission / 5)
        
        folium.CircleMarker(
            location=[spot['lat'], spot['lon']],
            radius=radius,
            popup=f"<b>{spot['icon']} {spot['name']}</b><br>Sector: {sector}<br>CO₂: {emission:.1f} t/day ({year} Forecast)",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.7
        ).add_to(m)
        
        folium.Marker(
            location=[spot['lat'], spot['lon']],
            icon=folium.DivIcon(
                html=f'<div style="font-weight: bold; font-size: 10px; color: white; text-shadow: 0 0 3px black;">{emission:.0f}</div>'
            )
        ).add_to(m)
    
    # Add legend with year
    legend_html = f'''
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000; background: white; padding: 10px; border-radius: 5px; font-size: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <b>{year} CO₂ Sources (t/day)</b><br>
        <span style="color: #dc2626;">●</span> Industry<br>
        <span style="color: #f97316;">●</span> Aviation<br>
        <span style="color: #eab308;">●</span> Transport<br>
        <span style="color: #8b5cf6;">●</span> Power<br>
        <span style="color: #22c55e;">●</span> Residential<br>
        <span style="color: #3b82f6;">●</span> Commercial
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m.get_root().render()


def generate_sector_heatmap_html(sector: str):
    """Generates a Folium map with Grid Heatmap for a specific sector's emissions."""
    
    m = folium.Map(
        location=[DELHI_LAT, DELHI_LON], 
        zoom_start=10, 
        control_scale=True
    )
    
    import requests
    from shapely.geometry import shape, Point
    from shapely.ops import unary_union
    
    add_delhi_boundary_to_map(m)
    
    delhi_polygon = None
    has_boundary = False
    
    try:
        geojson_url = "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Boundary.geojson"
        resp = requests.get(geojson_url)
        data = resp.json()
        features = data.get('features', [])
        shapes = [shape(f['geometry']) for f in features]
        delhi_polygon = unary_union(shapes)
        has_boundary = True
    except Exception as e:
        print(f"Error processing boundary for clipping: {e}")
    
    # Filter hotspots by sector
    sector_hotspots = [h for h in EMISSION_HOTSPOTS if h['sector'] == sector]
    base_color = SECTOR_COLORS.get(sector, "#6b7280")
    
    # Grid config
    lat_min, lat_max = 28.40, 28.88
    lon_min, lon_max = 76.85, 77.35
    step = 0.015
    
    def get_sector_color(value, max_val=50):
        """Generate color gradient based on sector color."""
        import colorsys
        # Convert hex to RGB
        hex_color = base_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        # Vary opacity/lightness based on value
        intensity = min(1.0, value / max_val)
        # Blend with white for lower values
        r = int(255 - (255 - r) * intensity)
        g = int(255 - (255 - g) * intensity)
        b = int(255 - (255 - b) * intensity)
        return f"#{r:02x}{g:02x}{b:02x}"
    
    lat = lat_min
    while lat < lat_max:
        lon = lon_min
        while lon < lon_max:
            center_point = Point(lon + step/2, lat + step/2)
            
            if has_boundary and not delhi_polygon.contains(center_point):
                lon += step
                continue
            
            # Calculate emission based on nearby sector-specific hotspots
            base_emission = 5.0  # Lower baseline for sector-specific
            
            for hotspot in sector_hotspots:
                dist = ((lat - hotspot['lat'])**2 + (lon - hotspot['lon'])**2)**0.5
                if dist < 0.08:  # Larger radius for sector
                    contribution = hotspot['emission'] * (1 - dist/0.08) * 0.6
                    base_emission += contribution
            
            val = base_emission + random.uniform(-3, 3)
            val = max(2, min(60, val))
            
            color = get_sector_color(val)
            
            folium.Rectangle(
                bounds=[[lat, lon], [lat + step, lon + step]],
                color=None,
                fill=True,
                fill_color=color,
                fill_opacity=0.6,
                tooltip=f"{sector}: {val:.1f} t/day"
            ).add_to(m)
            
            lon += step
        lat += step
    
    return m.get_root().render()


def generate_sector_hotspots_html(sector: str, year: int = None):
    """Generates a map showing only hotspots from a specific sector."""
    m = folium.Map(location=[DELHI_LAT, DELHI_LON], zoom_start=11)
    
    add_delhi_boundary_to_map(m)
    
    # Get scaling factor if year provided
    scaling_factor = 1.0
    if year:
        try:
            forecast_path = Path(__file__).parent / "emission_forecast_3years_full.csv"
            if forecast_path.exists():
                df = pd.read_csv(forecast_path)
                df['Date'] = pd.to_datetime(df['Date'])
                df['Year'] = df['Date'].dt.year
                
                baseline_2025 = df[df['Year'] == 2025]['Total_Emission'].mean()
                year_avg = df[df['Year'] == year]['Total_Emission'].mean()
                
                if not pd.isna(baseline_2025) and not pd.isna(year_avg) and baseline_2025 > 0:
                    scaling_factor = year_avg / baseline_2025
        except Exception as e:
            print(f"Error calculating scaling: {e}")
    
    # Filter and display sector hotspots
    sector_hotspots = [h for h in EMISSION_HOTSPOTS if h['sector'] == sector]
    color = SECTOR_COLORS.get(sector, "#6b7280")
    
    for spot in sector_hotspots:
        emission = spot['emission'] * scaling_factor
        
        radius = 10 + (emission / 4)
        
        label = f"{spot['name']}"
        if year:
            label += f" ({year})"
        
        folium.CircleMarker(
            location=[spot['lat'], spot['lon']],
            radius=radius,
            popup=f"<b>{spot['icon']} {spot['name']}</b><br>CO₂: {emission:.1f} t/day{' (' + str(year) + ' Forecast)' if year else ''}",
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8
        ).add_to(m)
        
        folium.Marker(
            location=[spot['lat'], spot['lon']],
            icon=folium.DivIcon(
                html=f'<div style="font-weight: bold; font-size: 11px; color: white; text-shadow: 0 0 4px black;">{emission:.0f}</div>'
            )
        ).add_to(m)
    
    # Sector-specific legend
    sector_icons = {
        "Industry": "🏭",
        "Aviation": "✈️",
        "Transport": "🚗",
        "Power": "⚡",
        "Residential": "🏠",
        "Commercial": "🏢"
    }
    icon = sector_icons.get(sector, "📍")
    
    legend_html = f'''
    <div style="position: fixed; bottom: 50px; left: 50px; z-index: 1000; background: white; padding: 10px; border-radius: 5px; font-size: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <b>{icon} {sector} Emissions</b><br>
        <span style="color: {color};">●</span> {len(sector_hotspots)} locations<br>
        {f'Year: {year}' if year else 'Baseline Data'}
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m.get_root().render()


def render_map_to_png(html_content, output_path):
    """Renders the HTML content to a PNG image using Selenium headless Chrome."""
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    import uuid
    
    unique_id = uuid.uuid4()
    tmp_html_path = os.path.abspath(f"temp_emission_map_{unique_id}.html")
    
    with open(tmp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=800,600")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.get(f"file:///{tmp_html_path}")
        time.sleep(2)
        
        driver.save_screenshot(output_path)
        print(f"Emission map image saved to {output_path}")
        
    except Exception as e:
        print(f"Error rendering map to PNG: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()
        if os.path.exists(tmp_html_path):
            os.remove(tmp_html_path)


if __name__ == "__main__":
    print("Generating emission hotspots map...")
    html = generate_emission_hotspots_html()
    render_map_to_png(html, "emission_map_test.png")
