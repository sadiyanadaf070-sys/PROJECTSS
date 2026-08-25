# Smart Skin Disease Detection Using Image Preprocessing
An advanced AI-powered dermatology platform integrating 10-stage sequential OpenCV preprocessing, Convolutional Neural Networks (MobileNetV2), Explainable AI (Grad-CAM), and geospatial clinician mapping.

Designed and optimized for the **Smart India Hackathon (SIH)**, final year engineering capstone projects, and clinical research publications.

---

## 🌟 Key Capabilities
*   **10-Stage OpenCV Preprocessing Pipeline**: View sequential digital image transformations visually: Resize &rarr; Dull Razor Hair Removal &rarr; Gaussian Blur &rarr; Median Filter &rarr; Bilateral Edge Preservation &rarr; CLAHE Histogram Equalization &rarr; Linear Contrast Enhancement &rarr; Color Normalization &rarr; Canny Edge Detection &rarr; Otsu Lesion Segmentation.
*   **Deep Learning Classifier**: Leverages transfer learning with a MobileNetV2 backbone to output probability distributions for 14 target dermatological diseases (Acne, Psoriasis, Eczema, Melanoma, Basal Cell Carcinoma, Vitiligo, Rosacea, Ringworm, Impetigo, Cellulitis, Chickenpox, Warts, Lupus Rash, Herpes).
*   **Explainable AI (Grad-CAM)**: Backpropagates class gradients to compute attention heatmaps, showing users which pixels guided the neural network classification.
*   **Multi-Image Comparative Analysis**: Compare up to 10 lesion scans simultaneously in tabular formats.
*   **Geospatial Dermatologist Locator**: Geolocation-driven clinician finder mapping nearby doctors and clinics using Leaflet and OpenStreetMap.
*   **Progress Progression Tracker**: Log healing profiles week-over-week and view progress trends plotted using line charts.
*   **Multilingual Assistant**: Complete support for English, Hindi, Kannada, Tamil, Telugu, and Urdu.
*   **Automated PDF Report Compiler**: Downloads clinical dossiers with original/processed images, Grad-CAM overlays, dataset matches, OTC medical advice, and verification QR codes.
*   **Zero-Dependency Fallback Drivers**: Automatically falls back to local JSON database storage and deterministic mock inference if MongoDB or TensorFlow are missing on the target host machine.

---

## 💻 Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Chart.js (React-Chartjs-2), Leaflet Maps, Axios.
*   **Backend**: Python Flask REST API, ReportLab (PDF Compiler), bcrypt (Password security), PyJWT.
*   **Deep Learning & Image Processing**: OpenCV, NumPy, Scikit-Learn, Pillow, TensorFlow/Keras.
*   **Database**: MongoDB (PyMongo) with fallback local JSON store.

---

## 🚀 Setup & Execution Guide

### Prerequisite Checklist
*   Python 3.10+ (tested up to Python 3.14)
*   Node.js v18+ (npm v9+)
*   MongoDB Server (Optional - falls back to local JSON database automatically)

---

### Step 1: Backend API Configuration
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure variables in `config.py` (or set environmental variables):
    *   `MONGO_URI`: Set to your MongoDB connection string (e.g. `mongodb+srv://...`).
    *   `USE_FALLBACK_DB`: Set to `True` (default) if you wish to run with file-based storage, bypassing MongoDB installation.
4.  Boot up the Flask API server:
    ```bash
    python app.py
    ```
    The server launches on `http://localhost:5000`. You should see `[DB] Using JSON Fallback Database by configuration.` or connection confirmations.

---

### Step 2: React Frontend Configuration
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install node modules:
    ```bash
    npm install
    ```
3.  Launch the Vite development server:
    ```bash
    npm run dev
    ```
    The local dashboard boots on `http://localhost:5173`. Open this URL in your browser.

---

## 🧪 Verification & Diagnostics

To run the automated backend test suite, execute the following within the `backend` workspace:
```bash
python test_backend.py
```
This tests:
1.  Database driver configuration (fallback validation).
2.  OpenCV 10-stage preprocessing visual outputs.
3.  Classification calculations and Grad-CAM image saving.

---

## 🔬 Scientific Formulations

### 1. Dull Razor Hair Removal
Dull Razor uses a morphological black-hat operator to capture dark lines (hairs) matching structural elements. A binary mask is constructed and Telea inpainting interpolates missing pixels:
```
I_blackhat = morphological_blackhat(I_gray, Kernel_9x9)
Mask = threshold(I_blackhat, threshold_value)
I_inpainted = Telea_Inpaint(I_original, Mask, Radius=1)
```

### 2. Localized Contrast Equalization (CLAHE)
Standard histogram equalization alters global contrast, creating clipping noise. CLAHE segments the image into small tiles (e.g. 8x8) and redistributes localized histograms:
```
Y_equalized = CLAHE_Apply(Y_channel, ClipLimit=2.0, GridTile=(8,8))
```

### 3. CNN Classification Optimizer
The model utilizes cross-entropy loss tracking categorical distributions:
```
L = - ∑ (y_i * log(p_i))
```
Where `y_i` defines the gold label one-hot vector and `p_i` is the softmax activation.

---

## 🏆 Hackathon / Evaluation Cheat Sheet

For quick evaluation by SIH judges or engineering project panels:
1.  **Direct Admin Account**: The first user to signup via the register page is automatically elevated to **Admin** role status and marked as verified.
2.  **OTP Verification Demonstration**: During signup or forgot-password flows, a **Demo OTP** box is printed directly on the UI card so you don't need to configure active email SMTP servers.
3.  **Real-Time CNN Retraining**: Log in as an Admin, navigate to the **Admin Console** tab, and click **Initialize Retraining**. The background thread will dynamically spin epochs from `0%` to `100%`, logging metrics and updating validation charts live.
4.  **Local Map Simulation**: The Leaflet map dynamically tracks your location using Geolocation APIs. Click **Book Consultation** to schedule slots with mock dermatologists, and view confirmation bookings instantaneously.
5.  **Grad-CAM Slide Preview**: On the laboratory predictions panel, hovering your cursor over the uploaded lesion photo reveals the Grad-CAM activation heatmap overlay.
