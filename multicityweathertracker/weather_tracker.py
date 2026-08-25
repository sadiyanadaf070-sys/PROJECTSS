import csv
import time
import requests

# 1. Define our target cities with their real latitude and longitude coordinates
cities = [
    {"name": "Bangalore", "lat": 12.97, "lon": 77.59},
    {"name": "London", "lat": 51.50, "lon": -0.12},
    {"name": "New York", "lat": 40.71, "lon": -74.00},
    {"name": "Tokyo", "lat": 35.67, "lon": 139.65},
]

# 2. Open a clean CSV spreadsheet file on your computer to save our API data
with open("city_weather_report.csv", mode="w", newline="") as file:
    writer = csv.writer(file)

    # Write the column headers for our spreadsheet
    writer.writerow(
        ["City", "Temperature (C)", "Wind Speed (km/h)", "Status Code"]
    )

    print("--- Starting Multi-City API Integration Tracker ---")

    # 3. Loop through each city and perform the API integration loop
    for city in cities:
        print(f"Connecting to API server for {city['name']}...")

        # Construct the unique endpoint URL using the city's coordinates
        url = f"https://api.open-meteo.com/v1/forecast?latitude={city['lat']}&longitude={city['lon']}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"

        # Fire the HTTP GET request over the internet
        response = requests.get(url)

        # 4. Handle the response based on the HTTP status code
        if response.status_code == 200:
            # Convert the raw network text data into a readable Python format (JSON)
            data = response.json()

            # Extract specific pieces of data out of the nested JSON structure
            temp = data["current"]["temperature_2m"]
            wind = data["current"]["wind_speed_10m"]

            print(f"-> Success! Temp: {temp}°C | Wind: {wind} km/h")

            # Write the successful API data directly into our spreadsheet row
            writer.writerow([city["name"], temp, wind, "200 OK"])
        else:
            print(f"-> Failed! Server responded with error: {response.status_code}")
            writer.writerow([city["name"], "N/A", "N/A", response.status_code])

        # Pause for 1 second between requests so we don't spam the free API server
        time.sleep(1)
        

print("\n--- Project Complete! Check your desktop for 'city_weather_report.csv' ---")