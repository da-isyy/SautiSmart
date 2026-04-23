from flask import Flask, jsonify, render_template, request, session
import mysql.connector
from mysql.connector import Error
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize the Flask application
app = Flask(__name__)
# Secret key is essential for session management and flash messages 
app.secret_key = 'sautismart_secure_session_key' 
CORS(app)

# Database Connection Helper Function
def create_db_connection():
    """Establishes a connection to the local MySQL database."""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='However123#*', # Password must match your Workbench settings
            database='sautismart_db'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# --- UI ROUTES ---

@app.route('/')
def home():
    """Serves the main SautiSmart website interface."""
    return render_template('index.html')

# --- AUTHENTICATION API ENDPOINTS ---

@app.route('/api/signup', methods=['POST'])
def signup():
    """Handles new user registration and hashes passwords for security."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role_id = data.get('role_id') # 2 for Teacher, 3 for Student

    # Hash the password before storing it to ensure security 
    hashed_pw = generate_password_hash(password)
    
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500
        
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password_hash, role_id) VALUES (%s, %s, %s)", 
                       (username, hashed_pw, role_id))
        connection.commit()
        return jsonify({"message": "User created successfully!"}), 201
    except Error as e:
        return jsonify({"error": "Username already exists"}), 400
    finally:
        cursor.close()
        connection.close()

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates users by comparing hashed passwords."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    
    # Check if user exists and verify hashed password 
    if user and check_password_hash(user['password_hash'], password):
        session['username'] = user['username']
        session['role'] = user['role_id']
        return jsonify({
            "message": "Login successful", 
            "role": user['role_id'],
            "username": user['username']
        }), 200
    
    return jsonify({"error": "Invalid username or password"}), 401

# --- DATA API ENDPOINTS ---

@app.route('/api/communities', methods=['GET'])
def get_communities():
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM communities;")
    communities = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(communities)

@app.route('/api/instruments', methods=['GET'])
def get_instruments():
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM instruments;")
    instruments = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(instruments)

@app.route('/api/songs', methods=['GET'])
def get_songs():
    connection = create_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM songs;")
    songs = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(songs)

if __name__ == '__main__':
    app.run(debug=True, port=5000)