import cv2
import imutils
import pytesseract
import os
# import winsound

os.makedirs('LicensePlatePictures', exist_ok=True)

pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'

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
        print("Image saved successfully")
        break

vid.release()
cv2.destroyAllWindows()

#reading image file
image = cv2.imread('LicensePlatePictures/car.jpg')
if image is None:
    print("Error: Could not read image.")
    exit()
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
count = 0
name = 1 #name of our cropped image

for i in cnts:
    perimeter = cv2.arcLength(i, True) #perimeter is also called arcLength
    approx = cv2.approxPolyDP(i, 0.02 * perimeter, True) #approx is the approximated contour
    if (len(approx) == 4): #4 means it has 4 corners
        NumberPlateCount = approx
        #cropping the rectangle part
        x, y, w, h = cv2.boundingRect(i)
        crp_img = image[y:y+h, x:x+w]
        cv2.imwrite(str(name)+ '.png', crp_img)
        name += 1

        break



