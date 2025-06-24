import cv2
import imutils
import pytesseract
import os
import mysql.connector
from datetime import datetime
import tkinter as tk
# import winsound

os.makedirs('LicensePlatePictures', exist_ok=True)

pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'

# MySQL Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'parking_system'
}

# Global variable to track capture count for each plate
plate_capture_count = {}

def show_status_window(status):
    """Show a full-screen window with green (accepted) or red (rejected) background"""
    root = tk.Tk()
    root.title("Access Status")
    
    # Get screen dimensions
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    
    # Set window to full screen
    root.geometry(f"{screen_width}x{screen_height}+0+0")
    root.attributes('-fullscreen', True)
    
    # Set background color based on status
    if status == 'accepted':
        root.configure(bg='green')
        status_text = "ACCESS GRANTED"
    else:
        root.configure(bg='red')
        status_text = "ACCESS DENIED"
    
    # Create label with status text
    label = tk.Label(root, text=status_text, font=('Arial', 48, 'bold'), 
                    fg='white', bg=root.cget('bg'))
    label.pack(expand=True)
    
    # Auto-close after 3 seconds
    root.after(3000, root.destroy)
    
    # Also close on any key press
    root.bind('<Key>', lambda e: root.destroy())
    root.bind('<Button-1>', lambda e: root.destroy())
    
    root.mainloop()

# Database functions for car_logs table
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

def check_plate_exists(number_plate):
    conn = get_db_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    # Check if number plate exists in vehicle_registration table
    cursor.execute('SELECT * FROM vehicle_registration WHERE number_plate = %s', (number_plate,))
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    return result is not None

def insert_entry_log(number_plate, entry_time, date):
    conn = get_db_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    # Check if vehicle is registered to determine status
    is_registered = check_plate_exists(number_plate)
    status = 'accepted' if is_registered else 'rejected'
    
    cursor.execute('''
        INSERT INTO car_logs (number_plate, entry_time, date, status)
        VALUES (%s, %s, %s, %s)
    ''', (number_plate, entry_time, date, status))
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Entry logged: {number_plate} entered at {entry_time}, Status: {status}")
    
    # Show status window
    show_status_window(status)
    
    # Reset capture count if status is rejected
    if status == 'rejected':
        if number_plate in plate_capture_count:
            plate_capture_count[number_plate] = 0
            print(f"Capture count reset for rejected vehicle {number_plate}")

def update_exit_time(number_plate, exit_time, date):
    conn = get_db_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    # Check if this plate has been captured before (has an entry record)
    cursor.execute('SELECT * FROM car_logs WHERE number_plate = %s AND exit_time IS NULL', (number_plate,))
    result = cursor.fetchone()
    
    if result:
        # Plate was captured before, update exit time
        cursor.execute('''
            UPDATE car_logs 
            SET exit_time = %s 
            WHERE number_plate = %s AND exit_time IS NULL
        ''', (exit_time, number_plate))
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Exit logged: {number_plate} exited at {exit_time}")
        
        # Reset capture count for this plate
        if number_plate in plate_capture_count:
            plate_capture_count[number_plate] = 0
            print(f"Capture count reset for {number_plate}")
    else:
        cursor.close()
        conn.close()
        print(f"No previous entry found for {number_plate}")

vid = cv2.VideoCapture(0)
if not vid.isOpened():
    print("Error: Could not open video.")
    exit()

while(True):
    ret,image = vid.read()
    if not ret:
        print("Error: Could not read frame.")
        break
    cv2.imshow('image', image)
    if cv2.waitKey(1) & 0xFF == ord('c'): #press c to capture
        save_path = os.path.abspath('LicensePlatePictures/car.jpg')
        print(f"Saving image to: {save_path}")
        cv2.imwrite('LicensePlatePictures/car.jpg', image) #saves image in this location
        # Record the timestamp
        capture_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        capture_date = datetime.now().strftime('%Y-%m-%d')
        print(f"Image saved successfully at {capture_time}")
        # Optionally, save the timestamp to a file
        with open('LicensePlatePictures/capture_time.txt', 'w') as f:
            f.write(f"Capture time: {capture_time}\n")
        break

vid.release()
cv2.destroyAllWindows()

#reading image file
print("Reading image file...")
image = cv2.imread('LicensePlatePictures/car.jpg')
if image is None:
    print("Error: Could not read image.")
    exit()
print("Image read successfully")

#resizing & standardising our image to 500
image = imutils.resize(image, width = 500)
cv2.imshow("Original Image", image) #displaying original image
#cv2.waitKey(0)

#converting image to grey scale => reduces dimension & complexity of image
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
cv2.imshow("Gray Scale Image", gray)
#cv2.waitKey(0)

#reducing the noise from the image
gray = cv2.bilateralFilter(gray,11,17,17)
cv2.imshow("Smoother Image", gray)
#cv2.waitKey(0)

#finding the edges of the image
edge = cv2.Canny(gray,170,200)
cv2.imshow("Canny edge", edge)
#cv2.waitKey(0)

#finding the contours based on the image
cnts, new = cv2.findContours(edge.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
#cnts = Contours is like the curve joining all the continour points
#new is the heirachy-relationship
#RETR_LIST - retrieves all the contours 
#CHAIN_APPROX_SIMPLE - removes all the redundant points and compress the contour by saving memory

#creating a copy of our original image to draw all the contours
image1 = image.copy()
cv2.drawContours(image1, cnts, -1, (0,255,0), 3)
cv2.imshow("Canny After Contouring", image1)
#cv2.waitKey(0)

#finding the number plate using maximum areas, selecting top 30
cnts = sorted(cnts, key = cv2.contourArea, reverse = True)[:30]
NumberPlateCount = None

#drawing top 30 contours using orginal image
image2 = image.copy()
cv2.drawContours(image2, cnts, -1, (0,255,0), 3)
cv2.imshow("Top 30 Contours", image2)
#cv2.waitKey(0)

#running a loop on the contours to find the best possible contour of our numberplate
print("Looking for number plate...")
count = 0
name = 1 #name of our cropped image
detected_plate = None

for i in cnts:
    perimeter = cv2.arcLength(i, True) #perimeter is also called arcLength
    approx = cv2.approxPolyDP(i, 0.02 * perimeter, True) #approx is the approximated contour
    print("Contour with corners:", len(approx))
    if (len(approx) == 4): #4 means it has 4 corners
        print("Number plate found")
        NumberPlateCount = approx
        #cropping the rectangle part
        x, y, w, h = cv2.boundingRect(i)
        crp_img = image[y:y+h, x:x+w]
        cv2.imwrite(str(name)+ '.png', crp_img)

        #text recognition
        #converting the cropped image to grey scale
        print("Starting text recognition...")
        gray_crp = cv2.cvtColor(crp_img, cv2.COLOR_BGR2GRAY)
        #applying threshold to the binary image
        _, binary = cv2.threshold(gray_crp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        #using tesseract to read the text from the image
        text = pytesseract.image_to_string(binary, config='--psm 7')
        detected_plate = text.strip()
        print("Detected Text:", detected_plate)
        
        # Track capture count for this plate
        if detected_plate:
            if detected_plate not in plate_capture_count:
                plate_capture_count[detected_plate] = 0
            plate_capture_count[detected_plate] += 1
            
            print(f"Capture count for {detected_plate}: {plate_capture_count[detected_plate]}")
            
            if plate_capture_count[detected_plate] == 1:
                # First capture - log entry
                insert_entry_log(detected_plate, capture_time, capture_date)
                print(f"Vehicle {detected_plate} ENTRY logged")
            elif plate_capture_count[detected_plate] == 2:
                # Second capture - log exit
                update_exit_time(detected_plate, capture_time, capture_date)
                print(f"Vehicle {detected_plate} EXIT logged")

        name += 1
        break
    else:
        print("No number plate found")

print("Press any key to exit...")
cv2.waitKey(0)
cv2.destroyAllWindows()


