import cv2
import numpy as np
import os
import uuid
import base64
from config import Config

def get_base64_img(img):
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def apply_preprocessing_pipeline(image_path, unique_id=None):
    """
    Applies the 10 sequential preprocessing stages to the input image, 
    saves them to static/preprocessed, and returns a dictionary of 
    base64 data and file paths for frontend display.
    """
    if unique_id is None:
        unique_id = str(uuid.uuid4())
        
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image from path: " + image_path)

    steps = {}
    
    # 1. Resize
    # Standardize image size for CNN model (224x224)
    img_resized = cv2.resize(img, (224, 224))
    steps['1_resize'] = img_resized.copy()

    # 2. Hair Removal (Dull Razor Algorithm)
    # Convert to grayscale, apply black hat morphological filter to highlight dark hairs
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    # Threshold the blackhat to get a binary mask of hairs
    _, mask = cv2.threshold(blackhat, 10, 255, cv2.THRESH_BINARY)
    # Inpaint the original image using the hair mask
    img_hair_removed = cv2.inpaint(img_resized, mask, 1, cv2.INPAINT_TELEA)
    steps['2_hair_removal'] = img_hair_removed.copy()

    # 3. Gaussian Blur
    # Smooths image and reduces high frequency noise
    img_gaussian = cv2.GaussianBlur(img_hair_removed, (5, 5), 0)
    steps['3_gaussian_blur'] = img_gaussian.copy()

    # 4. Median Filter
    # Reduces salt-and-pepper type artifact noise while preserving edges
    img_median = cv2.medianBlur(img_gaussian, 5)
    steps['4_median_filter'] = img_median.copy()

    # 5. Noise Removal
    # Apply bilateral filter to remove background noise while maintaining crisp borders
    img_noise_removed = cv2.bilateralFilter(img_median, 9, 75, 75)
    steps['5_noise_removal'] = img_noise_removed.copy()

    # 6. Histogram Equalization
    # Apply CLAHE on YCrCb space for localized contrast optimization
    ycrcb = cv2.cvtColor(img_noise_removed, cv2.COLOR_BGR2YCrCb)
    y, cr, cb = cv2.split(ycrcb)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    y_eq = clahe.apply(y)
    img_equalized = cv2.merge((y_eq, cr, cb))
    img_equalized = cv2.cvtColor(img_equalized, cv2.COLOR_YCrCb2BGR)
    steps['6_histogram_equalization'] = img_equalized.copy()

    # 7. Contrast Enhancement
    # Linear scale to amplify brightness and contrast variations
    img_contrast = cv2.convertScaleAbs(img_equalized, alpha=1.15, beta=5)
    steps['7_contrast_enhancement'] = img_contrast.copy()

    # 8. Color Normalization
    # Normalizes pixel intensity ranges to standardized skin tones
    norm_img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.normalize(img_contrast, norm_img, 0, 255, cv2.NORM_MINMAX)
    steps['8_color_normalization'] = norm_img.copy()

    # 9. Edge Detection
    # Canny filter to identify structural bounds of the lesion
    gray_norm = cv2.cvtColor(norm_img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray_norm, 30, 100)
    # Convert single channel to 3 channels for rendering uniformity
    img_edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    steps['9_edge_detection'] = img_edges.copy()

    # 10. Skin Segmentation
    # Isolating the primary lesion using HSV thresholding and Otsu segmentation
    hsv = cv2.cvtColor(norm_img, cv2.COLOR_BGR2HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    mask_skin = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Otsu thresholding on grayscale normalized to refine lesion bounds
    _, otsu_thresh = cv2.threshold(gray_norm, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Combine masks and extract region of interest
    final_mask = cv2.bitwise_and(mask_skin, otsu_thresh)
    img_segmented = cv2.bitwise_and(norm_img, norm_img, mask=final_mask)
    
    # If segmenting yields completely dark image, fallback to Otsu mask
    if np.sum(img_segmented) == 0:
        img_segmented = cv2.bitwise_and(norm_img, norm_img, mask=otsu_thresh)
        
    steps['10_skin_segmentation'] = img_segmented.copy()

    # Save images and prepare base64 map for response
    preprocessed_results = []
    
    descriptions = {
        '1_resize': 'Resized the input image to a standard 224x224 resolution for uniform neural network processing.',
        '2_hair_removal': 'Applied Dull Razor blackhat morphologic filter to construct hair masks and Telea inpainting to smooth hair tracks.',
        '3_gaussian_blur': 'Utilized Gaussian filtering with a 5x5 kernel to clear out high-frequency noise and pixel distortions.',
        '4_median_filter': 'Processed with 5px Median Blur to filter salt-and-pepper artifacts while preserving structural bounds.',
        '5_noise_removal': 'Employed Bilateral Filtering to achieve smoothing of textures without degrading edge definitions.',
        '6_histogram_equalization': 'Applied Contrast Limited Adaptive Histogram Equalization (CLAHE) to fix lighting imbalances.',
        '7_contrast_enhancement': 'Refined scale brightness metrics manually to highlight subtle color transitions in skin tissue.',
        '8_color_normalization': 'Scaled pixel channel intensity values uniformly between 0-255 boundary limits.',
        '9_edge_detection': 'Executed Canny Edge Detection to define physical structures and outer contours of the skin lesion.',
        '10_skin_segmentation': 'Segmented the lesion out of general skin surface utilizing Otsu thresholding and HSV channels.'
    }

    titles = {
        '1_resize': 'Image Resizing (224x224)',
        '2_hair_removal': 'Dull Razor Hair Removal',
        '3_gaussian_blur': 'Gaussian Noise Blur',
        '4_median_filter': 'Median Filter Denoise',
        '5_noise_removal': 'Bilateral Edge Preservation',
        '6_histogram_equalization': 'CLAHE Histogram Eq',
        '7_contrast_enhancement': 'Contrast Tuning',
        '8_color_normalization': 'Color Normalization',
        '9_edge_detection': 'Canny Edge Outline',
        '10_skin_segmentation': 'Otsu Lesion Segmentation'
    }

    for step_key in sorted(steps.keys()):
        filename = f"{unique_id}_{step_key}.jpg"
        filepath = os.path.join(Config.PREPROCESSED_FOLDER, filename)
        cv2.imwrite(filepath, steps[step_key])
        
        # Relative URL for web serving
        web_url = f"/static/preprocessed/{filename}"
        
        preprocessed_results.append({
            "step": step_key,
            "title": titles[step_key],
            "description": descriptions[step_key],
            "url": web_url,
            "base64": get_base64_img(steps[step_key])
        })

    return preprocessed_results
