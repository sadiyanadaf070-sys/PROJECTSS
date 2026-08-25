from flask import Blueprint, request, jsonify
from routes.auth import token_required
import datetime

chatbot_bp = Blueprint('chatbot', __name__)

# Clinical bot knowledge base
CHAT_KNOWLEDGE = {
    "acne": {
        "text": "**Acne Vulgaris** is a skin condition that occurs when hair follicles become plugged with oil and dead skin cells.\n\n* **Causes**: Overproduction of sebum, bacteria (C. acnes), and hormones.\n* **Treatment**: Topical retinoids, salicylic acid, benzoyl peroxide. For severe cases, oral isotretinoin or antibiotics may be recommended.\n* **Skincare Tip**: Wash face twice daily with a gentle, non-comedogenic cleanser. Avoid popping pimples.",
        "keywords": ["acne", "pimple", "zit", "blackhead", "whitehead"]
    },
    "eczema": {
        "text": "**Eczema (Atopic Dermatitis)** is a condition that makes your skin red, itchy, and inflamed. It is common in children but can occur at any age.\n\n* **Causes**: Immune system activation, genetics, environmental triggers, and skin barrier dysfunction.\n* **Treatment**: Topical corticosteroid creams, thick moisturizers (emollients), and antihistamines. \n* **Skincare Tip**: Take lukewarm baths and apply a rich moisturizer within 3 minutes of drying off. Use fragrance-free soaps.",
        "keywords": ["eczema", "itch", "dermatitis", "dry patch", "flaking"]
    },
    "psoriasis": {
        "text": "**Psoriasis** is an autoimmune disease that causes skin cells to build up rapidly, leading to thick, silvery scales and itchy, dry, red patches.\n\n* **Causes**: Immune system dysfunction where T-cells attack healthy skin cells by mistake.\n* **Treatment**: Topical steroids, salicylic acid, coal tar, phototherapy, and systemic biologic drugs.\n* **Skincare Tip**: Keep skin moisturized. Avoid cold, dry weather and skin injuries (which can trigger flare-ups via the Koebner phenomenon).",
        "keywords": ["psoriasis", "silvery scales", "plaques", "red patches"]
    },
    "melanoma": {
        "text": "**Melanoma** is the most serious type of skin cancer, developing in the melanocytes (cells that produce melanin).\n\n* **Symptoms (ABCDE Rules)**:\n  * *A*symmetry: One half doesn't match the other.\n  * *B*order: Irregular, scalloped borders.\n  * *C*olor: Varied shades of brown/black.\n  * *D*iameter: Larger than 6mm (pencil eraser).\n  * *E*volving: Changing in size, shape, or color.\n* **Warning**: Please schedule a physical visit with a certified dermatologist immediately if you notice an evolving mole.",
        "keywords": ["melanoma", "cancer", "mole", "spot", "growth", "tumor"]
    },
    "vitiligo": {
        "text": "**Vitiligo** is a disease that causes loss of skin color in patches, occurring when pigment-producing cells die or stop functioning.\n\n* **Causes**: Autoimmune destruction of melanocytes.\n* **Treatment**: Corticosteroid creams, calcineurin inhibitors, phototherapy (UVB), or skin grafting in advanced cases.\n* **Skincare Tip**: Use sunscreen daily. Depigmented skin is highly susceptible to sunburns.",
        "keywords": ["vitiligo", "white patches", "loss of pigment", "depigmentation"]
    },
    "general_skincare": {
        "text": "**Essential Skin Care Tips (Daily Routine)**:\n\n1. **Cleanse**: Use a mild, pH-balanced cleanser twice daily.\n2. **Moisturize**: Keep skin hydrated based on your skin type (gel for oily, rich cream for dry).\n3. **Protect**: Always apply broad-spectrum sunscreen (SPF 30 or higher) daily.\n4. **Hydrate**: Drink plenty of water and maintain a vitamin-rich diet.",
        "keywords": ["routine", "skincare", "tips", "glow", "cleanse", "sunscreen", "daily", "dry skin", "oily skin"]
    }
}

@chatbot_bp.route('/message', methods=['POST'])
@token_required
def chat_message(current_user):
    data = request.get_json() or {}
    message = data.get('message', '').strip().lower()
    
    if not message:
        return jsonify({'message': 'Query content is empty.'}), 400

    response_text = ""
    matched = False
    
    # Simple semantic search through keyword lists
    for key, content in CHAT_KNOWLEDGE.items():
        for kw in content["keywords"]:
            if kw in message:
                response_text = content["text"]
                matched = True
                break
        if matched:
            break
            
    if not matched:
        # Default smart medical disclaimer and advice
        response_text = (
            "I am your AI Dermatology Assistant. I can help answer queries related to Acne, Eczema, Psoriasis, Vitiligo, and Melanoma.\n\n"
            "If you are concerned about a skin lesion, please navigate to our **Analyze Scan** portal to upload a photo for AI analysis, "
            "or use the **Doctor Locator** to schedule a consult with a nearby clinic.\n\n"
            "*Skincare Tip: Avoid scratching any rashes as this weakens your skin barrier and introduces bacterial infections.*"
        )

    # Return chatbot dialogue response
    return jsonify({
        'reply': response_text,
        'timestamp': datetime.datetime.now().isoformat(),
        'sender': 'AI Assistant'
    }), 200
