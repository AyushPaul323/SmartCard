from flask import Flask, request, jsonify
from openvino.inference_engine import IECore
import numpy as np

app = Flask(__name__)

# Initialize OpenVINO Inference Engine
ie = IECore()

# Load the OpenVINO model
model_path = "openvino_model/fare_prediction_model.xml"
weights_path = "openvino_model/fare_prediction_model.bin"
net = ie.read_network(model=model_path, weights=weights_path)
exec_net = ie.load_network(network=net, device_name="CPU")

@app.route('/predict_fare', methods=['POST'])
def predict_fare():
    try:
        data = request.get_json()

        pickup_latitude = data.get('pickup_latitude')
        pickup_longitude = data.get('pickup_longitude')
        destination_latitude = data.get('destination_latitude')
        destination_longitude = data.get('destination_longitude')
        distance = data.get('distance')

        # Prepare the input for the model
        input_data = np.array([pickup_latitude, pickup_longitude, destination_latitude, destination_longitude, distance], dtype=np.float32)

        # Reshape input to match the model's input format
        input_data = input_data.reshape(1, -1)

        # Perform inference
        result = exec_net.infer(inputs={net.input_info.keys()[0]: input_data})
        
        # Get the predicted fare
        fare = result[next(iter(result))][0]

        print(f"Calculated Fare (using Intel AI): {fare} INR")  # Print it in the terminal

        return jsonify({'fare': fare})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
