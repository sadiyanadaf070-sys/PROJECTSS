import cv2
import os

# 1. Setup Camera
cap = cv2.VideoCapture(0)

print("--- Camera Interface ---")
print("Press SPACE to Capture & Process")
print("Press ESC to Close")
while True:
    ret, frame = cap.read()
    if not ret: 
        break
    
    cv2.imshow('Take a Photo', frame)

    key = cv2.waitKey(1)
    if key % 256 == 27: # ESC pressed
        print("Closing...")
        break
    elif key % 256 == 32: # SPACE pressed
        # --- STEP 1: UPLOAD/SAVE RAW ---
        raw_name = "user_upload_raw.jpg"
        cv2.imwrite(raw_name, frame)
        print(f"Image uploaded to: {raw_name}")
        
        # --- STEP 2: PREPROCESS ---
        # A. Grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # B. Resize (Standard 224x224 for AI)
        final_processed = cv2.resize(gray, (224, 224))
        
        # C. Save Preprocessed result
        processed_name = "preprocessed_result.jpg"
        cv2.imwrite(processed_name, final_processed)
        
        print(f"Preprocessing complete! Result saved as: {processed_name}")
        break

cap.release()
cv2.destroyAllWindows()
