import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from config import Config
from classifier import DISEASES

def generate_mock_data(num_samples=140):
    """Generates synthetic image arrays and categorical labels for training demonstration."""
    print(f"[Training] Generating {num_samples} mock skin lesion samples...")
    # Generate random images (224x224 RGB)
    X = np.random.uniform(-1.0, 1.0, (num_samples, 224, 224, 3)).astype(np.float32)
    # Generate labels (10 samples per disease class)
    y = np.zeros((num_samples, len(DISEASES)), dtype=np.float32)
    for idx in range(num_samples):
        class_idx = idx % len(DISEASES)
        y[idx, class_idx] = 1.0
        
    return X, y

def train_model(epochs=3):
    """
    Initializes a transfer learning framework with MobileNetV2,
    trains it on synthetic/mock dermatological inputs, and saves to model store.
    """
    os.makedirs(Config.MODELS_FOLDER, exist_ok=True)
    
    # 1. Build Network
    print("[Training] Building MobileNetV2 Transfer Learning Architecture...")
    base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
    base_model.trainable = False  # Freeze convolutional base
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.25)(x)
    predictions = Dense(len(DISEASES), activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # 2. Get Data
    X_train, y_train = generate_mock_data()
    
    # 3. Train
    print(f"[Training] Training for {epochs} epochs on CPU/GPU...")
    model.fit(
        X_train, y_train,
        batch_size=16,
        epochs=epochs,
        validation_split=0.1
    )
    
    # 4. Save
    print(f"[Training] Saving calibrated model weights to {Config.MODEL_PATH}...")
    model.save(Config.MODEL_PATH)
    print("[Training] Complete. Model is ready for inference.")

if __name__ == '__main__':
    train_model(epochs=2)
