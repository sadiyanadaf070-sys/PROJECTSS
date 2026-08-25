import os
import cv2
import numpy as np
import unittest
from config import Config
from database import db_manager, get_collection
from preprocessing import apply_preprocessing_pipeline
from classifier import classifier, DISEASES, HAS_TENSORFLOW

class TestSkinDetectionPipeline(unittest.TestCase):
    def setUp(self):
        # Create a dummy image for testing
        self.test_img_path = os.path.join(Config.BASE_DIR, 'test_lesion.jpg')
        dummy_img = np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8)
        cv2.imwrite(self.test_img_path, dummy_img)

    def tearDown(self):
        # Remove dummy testing images
        if os.path.exists(self.test_img_path):
            os.remove(self.test_img_path)

    def test_database_connection(self):
        """Verifies database manager can retrieve collection instances."""
        users = get_collection('users')
        self.assertIsNotNone(users)
        # Checking if fallback mode is active
        print(f"[Test] Database fallback mode active: {db_manager.fallback}")

    def test_image_preprocessing(self):
        """Verifies all 10 preprocessing steps are applied and output files written."""
        results = apply_preprocessing_pipeline(self.test_img_path, 'test_uuid')
        self.assertEqual(len(results), 10)
        for step in results:
            self.assertIn('step', step)
            self.assertIn('url', step)
            self.assertIn('base64', step)
            
            # Verify file exists on disk
            full_path = os.path.join(Config.BASE_DIR, step['url'].lstrip('/'))
            self.assertTrue(os.path.exists(full_path), f"File missing: {full_path}")
            
            # Clean step file
            if os.path.exists(full_path):
                os.remove(full_path)

    def test_cnn_classification(self):
        """Verifies classifier predicts disease classes and computes Grad-CAM maps."""
        # Ensure model is initialized if tensorflow is active
        if HAS_TENSORFLOW:
            self.assertIsNotNone(classifier.model)
        else:
            self.assertIsNone(classifier.model)
        
        # Run prediction
        result = classifier.predict(self.test_img_path)
        self.assertIn('prediction', result)
        self.assertIn('confidence', result)
        self.assertIn('severity', result)
        self.assertIn('heatmap_url', result)
        self.assertIn('dataset_matches', result)
        
        # Check output predictions size
        self.assertEqual(len(result['all_predictions']), len(DISEASES))
        
        # Clean Grad-CAM output
        full_path = os.path.join(Config.BASE_DIR, result['heatmap_url'].lstrip('/'))
        if os.path.exists(full_path):
            os.remove(full_path)

if __name__ == '__main__':
    print("[Test] Launching backend pipeline validation suites...")
    unittest.main()
