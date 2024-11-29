import math

# Function to calculate distance in km using Haversine formula
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c  # Distance in km
    return distance

# Function to calculate fare based on distance
def calculate_fare(lat1, lon1, lat2, lon2):
    distance = haversine(lat1, lon1, lat2, lon2)
    fare = distance * 10  # 1 km = 10 tokens
    return round(fare, 2)
