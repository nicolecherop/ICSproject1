from flask import Flask, request, jsonify
import cv2
import numpy as np
from datetime import datetime
import os
import pytesseract
import mysql.connector
import tkinter as tk
import imutils
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('LicensePlatePictures', exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Tesseract path (adjust if needed)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Nicole,12345678',
    'database': 'gatesecurity'
}

# ---------- Utility Functions ----------

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def check_plate_in_database(numberplate):
    """Check if plate exists in vehicles table with Approved status"""
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vehicles WHERE numberplate = %s AND status = "Approved"', (numberplate,))
        return cursor.fetchone() is not None
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def log_plate_entry(numberplate, access_method='automatic'):
    """Log plate detection in entry_logs table"""
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        current_datetime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        is_registered = check_plate_in_database(numberplate)
        status = 'granted' if is_registered else 'denied'

        cursor.execute('''
            INSERT INTO entry_logs 
            (plate_number, entry_time, entry_status, access_method)
            VALUES (%s, %s, %s, %s)
        ''', (numberplate, current_datetime, status, access_method))

        conn.commit()
        print(f"Logged: {numberplate} at {current_datetime} - Status: {status}")
    except mysql.connector.Error as err:
        print(f"Database error during logging: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def show_status_window(status, plate_number=""):
    """Display access status with plate number"""
    root = tk.Tk()
    root.title("Access Status")
    root.geometry(f"{root.winfo_screenwidth()}x{root.winfo_screenheight()}+0+0")
    root.attributes('-fullscreen', True)

    bg_color = 'green' if status == 'granted' else 'red'
    root.configure(bg=bg_color)

    label = tk.Label(root, text="ACCESS GRANTED" if status == 'granted' else "ACCESS DENIED",
                     font=('Arial', 48, 'bold'), fg='white', bg=bg_color)
    label.pack(pady=50)

    if plate_number:
        plate_label = tk.Label(root, text=f"Plate: {plate_number}",
                               font=('Arial', 24), fg='white', bg=bg_color)
        plate_label.pack()

    root.after(3000, root.destroy)
    root.bind('<Key>', lambda e: root.destroy())
    root.bind('<Button-1>', lambda e: root.destroy())
    root.mainloop()

def process_plate_image(image_path):
    """Detect and extract plate number from an image"""
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not read captured image.")
        return None

    image = imutils.resize(image, width=500)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    gray = cv2.medianBlur(gray, 3)

    edged = cv2.Canny(gray, 170, 200)
    cnts = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:30]

    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(c)
            plate_img = image[y:y + h, x:x + w]

            gray_plate = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
            gray_plate = cv2.adaptiveThreshold(
                gray_plate, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )

            custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            plate_text = pytesseract.image_to_string(gray_plate, config=custom_config)
            print("Tesseract output:", plate_text)
            plate_text = ''.join(e for e in plate_text if e.isalnum())

            if plate_text:
                print(f"Detected License Plate: {plate_text}")
                plate_img_path = os.path.join('LicensePlatePictures', f'plate_{plate_text}.jpg')
                cv2.imwrite(plate_img_path, plate_img)
                print(f"Saved plate image to {plate_img_path}")
                return plate_text

    print("No license plate detected.")

    return None

# API Endpoints 

@app.route('/api/process-plate', methods=['POST'])
def api_process_plate():

    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'}), 400

        file = request.files['image']
        print("Image received:", file.filename)  

        
        access_method = 'automatic'
        



        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)

        plate_text = process_plate_image(temp_path)

        if not plate_text:
            return jsonify({'success': False, 'error': 'No plate detected'}), 400

        is_registered = check_plate_in_database(plate_text)
        log_plate_entry(plate_text, access_method)

        return jsonify({
            'success': True,
            'plate_number': plate_text,
            'status': 'granted' if is_registered else 'denied',
            'access_method': access_method,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT 
                el.id, 
                el.plate_number, 
                el.entry_time AS timestamp, 
                el.entry_status AS status,
                el.access_method AS access_method,
                COALESCE(CONCAT(vr.first_name, ' ', vr.last_name), 'Unknown') AS user_name
            FROM entry_logs el
            LEFT JOIN vehicle_registration vr ON el.plate_number = vr.numberplate
            ORDER BY el.entry_time DESC
            LIMIT 20
        ''')

        logs = cursor.fetchall()
        return jsonify({'success': True, 'logs': logs})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ---------- Main ----------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)