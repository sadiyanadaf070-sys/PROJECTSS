import cv2
import numpy as np
from ultralytics import YOLO
from sort import Sort


# -----------------------------
# Calculate IoU between two boxes
# -----------------------------
def calculate_iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    # Find intersection
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_width = max(0, inter_x2 - inter_x1)
    inter_height = max(0, inter_y2 - inter_y1)

    intersection_area = inter_width * inter_height

    # Areas of both boxes
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)

    # Union
    union_area = area_a + area_b - intersection_area

    if union_area == 0:
        return 0

    return intersection_area / union_area


# -----------------------------
# Load YOLO model
# -----------------------------
model = YOLO("yolo11n.pt")

# Create SORT tracker
tracker = Sort()

# Open webcam
cap = cv2.VideoCapture(0)


# -----------------------------
# Main loop
# -----------------------------
while True:

    ret, frame = cap.read()

    if not ret:
        print("Could not access the camera")
        break

    # -----------------------------
    # YOLO detection
    # -----------------------------
    results = model(frame)

    detections = []
    class_names = []

    for box in results[0].boxes:

        x1, y1, x2, y2 = box.xyxy[0]

        confidence = float(box.conf[0])

        class_id = int(box.cls[0])

        class_name = model.names[class_id]

        detections.append([
            float(x1),
            float(y1),
            float(x2),
            float(y2),
            confidence
        ])

        class_names.append(class_name)


    # -----------------------------
    # Convert detections for SORT
    # -----------------------------
    if len(detections) > 0:
        detections_array = np.array(detections)
    else:
        detections_array = np.empty((0, 5))


    # -----------------------------
    # SORT tracking
    # -----------------------------
    tracks = tracker.update(detections_array)


    # -----------------------------
    # Match SORT tracks to YOLO
    # detections using IoU
    # -----------------------------
    for track in tracks:

        x1, y1, x2, y2, track_id = track

        track_box = [x1, y1, x2, y2]

        track_id = int(track_id)

        best_iou = 0
        best_class = "Object"


        # Compare this track with every YOLO detection
        for i, detection in enumerate(detections):

            dx1, dy1, dx2, dy2, confidence = detection

            detection_box = [
                dx1,
                dy1,
                dx2,
                dy2
            ]

            iou = calculate_iou(
                track_box,
                detection_box
            )


            # Keep the best matching detection
            if iou > best_iou:

                best_iou = iou

                best_class = class_names[i]


        # Only accept a reasonably good match
        if best_iou < 0.3:
            best_class = "Object"


        # Convert coordinates to integers
        x1 = int(x1)
        y1 = int(y1)
        x2 = int(x2)
        y2 = int(y2)


        # -----------------------------
        # Draw bounding box
        # -----------------------------
        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )


        # -----------------------------
        # Draw object name + ID
        # -----------------------------
        label = f"{best_class} | ID: {track_id}"


        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )


    # -----------------------------
    # Display result
    # -----------------------------
    cv2.imshow(
        "YOLO + SORT Object Tracking",
        frame
    )


    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# -----------------------------
# Cleanup
# -----------------------------
cap.release()

cv2.destroyAllWindows()