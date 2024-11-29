from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict_fare', methods=['POST'])
def predict_fare():
    try:
        data = request.get_json()

        pickup_latitude = data.get('pickup_latitude')
        pickup_longitude = data.get('pickup_longitude')
        destination_latitude = data.get('destination_latitude')
        destination_longitude = data.get('destination_longitude')
        distance = data.get('distance')

        # Calculate the fare
        fare = calculate_fare(pickup_latitude, pickup_longitude, destination_latitude, destination_longitude, distance)
        
        # Print the fare in the terminal
        print(f"Calculated Fare: {fare} INR")  # Print it in the server's terminal

        return jsonify({'fare': fare})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_fare(pickup_lat, pickup_lon, dest_lat, dest_lon, distance):
    # Example logic for fare calculation (could be more complex based on your needs)
    base_fare = 50  # base fare
    cost_per_km = 10  # cost per kilometer

    # Logic to calculate fare
    total_fare = base_fare + (cost_per_km * distance)
    return total_fare

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
