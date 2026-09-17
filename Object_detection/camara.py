import cv2

# Open the default webcam
cap = cv2.VideoCapture(0)

while True:
    # Read one frame from the webcam
    ret, frame = cap.read()

    # If frame wasn't captured, stop
    if not ret:
        print("Could not access the camera")
        break

    # Display the frame
    cv2.imshow("My Camera", frame)

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Release the camera
cap.release()

# Close all OpenCV windows
cv2.destroyAllWindows()