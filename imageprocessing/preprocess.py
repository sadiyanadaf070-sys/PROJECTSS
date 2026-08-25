import cv2
import numpy as np
import os

def medical_preprocessing(img):
    # 1. NOISE REDUCTION: Bilateral Filter (Smooths noise while keeping edges sharp)
    denoised = cv2.bilateralFilter(img, 9, 75, 75)

    # 2. HAIR REMOVAL: Morphological Black-Hat + Telea Inpainting
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    _, hair_mask = cv2.threshold(blackhat, 10, 255, cv2.THRESH_BINARY)
    hairless = cv2.inpaint(denoised, hair_mask, 1, cv2.INPAINT_TELEA)

    # 3. QUALITY ENHANCEMENT: CLAHE (Adaptive Contrast Enhancement)
    lab = cv2.cvtColor(hairless, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    enhanced = cv2.cvtColor(cv2.merge((l_enhanced, a, b)), cv2.COLOR_LAB2BGR)

    # 4. RESIZING: Standardize to 224x224 (Common for CNNs like ResNet/VGG)
    resized = cv2.resize(enhanced, (224, 224))

    # 5. NORMALIZATION: Scale pixel values to [0.0, 1.0] for the CNN model
    normalized = resized.astype('float32') / 255.0
    
    return enhanced, resized, normalized

def extract_skin_features(processed_img):
    # --- COLOR FEATURES ---
    # Statistical distribution of RGB channels
    mean_val, std_val = cv2.meanStdDev(processed_img)
    color_features = {"mean": mean_val.flatten(), "std": std_val.flatten()}

    # --- SHAPE FEATURES ---
    # Use Otsu's thresholding to isolate the lesion area
    gray = cv2.cvtColor(processed_img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    shape_features = {"area": 0, "asymmetry": 0}
    if contours:
        main_cnt = max(contours, key=cv2.contourArea)
        shape_features["area"] = cv2.contourArea(main_cnt)
        # Perimeter/Area ratio is a common proxy for border irregularity
        shape_features["perimeter"] = cv2.arcLength(main_cnt, True)
        
    return color_features, shape_features, thresh

# INTERFACE LOGIC
choice = input("1: Camera | 2: Upload File: ")
original = None

if choice == '1':
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        cv2.imshow('Space to Capture', frame)
        if cv2.waitKey(1) & 0xFF == 32:
            original = frame
            break
    cap.release()
else:
    filename = input("Filename (e.g. mole.jpg): ")
    original = cv2.imread(filename)

if original is not None:
    # RUN PIPELINE
    enhanced, resized, normalized = medical_preprocessing(original)
    color_f, shape_f, mask = extract_skin_features(resized)

    # PRINT DATA
    print(f"\n--- Extracted Data ---\nColor Mean (B,G,R): {color_f['mean']}\nLesion Area: {shape_f['area']}")

    # DISPLAY COMPARISON
    # Prepare original and result side-by-side (Resize original for matching display)
    orig_view = cv2.resize(original, (400, 400))
    proc_view = cv2.resize(enhanced, (400, 400))
    comparison = np.hstack((orig_view, proc_view))
    
    cv2.imshow('LEFT: Original | RIGHT: Preprocessed', comparison)
    cv2.waitKey(0)
    cv2.destroyAllWindows()