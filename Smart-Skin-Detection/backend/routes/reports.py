from flask import Blueprint, jsonify, send_file
from database import get_collection
from routes.auth import token_required
from config import Config
import os
import datetime

# ReportLab imports for generating professional PDF reports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String

reports_bp = Blueprint('reports', __name__)
predictions_col = get_collection('predictions')

# Standard treatments matrix
TREATMENTS = {
    "Acne Vulgaris": {
        "description": "Acne is a skin condition that occurs when your hair follicles become plugged with oil and dead skin cells.",
        "symptoms": "Whiteheads, blackheads, small red tender bumps, pimples.",
        "causes": "Excess oil production, clogged hair follicles, bacteria, inflammation.",
        "medicines": "Benzoyl peroxide, Salicylic acid, Adapalene (Retinoid), Clindamycin.",
        "precautions": "Avoid picking/squeezing, wash face twice daily, choose non-comedogenic cosmetics.",
        "remedies": "Tea tree oil, Aloe vera gel, warm compresses.",
        "eat": "Leafy greens, zinc-rich foods, whole grains.",
        "avoid": "Dairy products, high-glycemic processed foods, refined sugars.",
        "lifestyle": "Wash pillowcases regularly, clean phone screens, avoid touching the face.",
        "doctor": "When acne is cystic, painful, or causing permanent scarring."
    },
    "Psoriasis": {
        "description": "Psoriasis is a chronic autoimmune skin disease that speeds up the growth cycle of skin cells, leading to scales.",
        "symptoms": "Thick red patches of skin covered with silvery scales, dry cracked skin.",
        "causes": "Immune system dysfunction where white blood cells mistakenly attack skin cells.",
        "medicines": "Clobetasol Propionate, Calcipotriene, Coal Tar formulations.",
        "precautions": "Keep skin well-moisturized, avoid cold/dry weather, limit skin injuries.",
        "remedies": "Oatmeal baths, Epsom salt soaks, Aloe vera application.",
        "eat": "Omega-3 rich fish, olive oil, colorful berries.",
        "avoid": "Red meat, gluten products, alcohol, processed sugars.",
        "lifestyle": "Manage stress levels, practice light sun exposure (heliotherapy).",
        "doctor": "If joint pain develops (psoriatic arthritis) or patches spread over 10% of the body."
    },
    "Eczema (Atopic Dermatitis)": {
        "description": "Eczema is a condition that makes your skin red, dry, and extremely itchy. It is common in children.",
        "symptoms": "Severe itching, dry red to brownish patches, small bumps that leak fluid.",
        "causes": "Genetic skin barrier dysfunction, environmental irritants, allergies.",
        "medicines": "Hydrocortisone cream, Tacrolimus ointment, antihistamines.",
        "precautions": "Avoid harsh soaps, apply moisturizers immediately after bathing, wear cotton clothing.",
        "remedies": "Coconut oil, cold compresses, colloidal oatmeal baths.",
        "eat": "Anti-inflammatory foods, fatty fish, apples, yogurt.",
        "avoid": "Eggs, soy, wheat, dairy (if allergic triggers are identified).",
        "lifestyle": "Maintain indoor humidity, keep fingernails trimmed to prevent scratch wounds.",
        "doctor": "When skin looks infected (pus, red streaks) or prevents sleep."
    },
    "Melanoma (Malignant)": {
        "description": "Melanoma is the most serious and invasive type of skin cancer, arising from pigment cells (melanocytes).",
        "symptoms": "Evolving mole, irregular borders, multiple color shades, asymmetrical mole shape.",
        "causes": "DNA damage in skin cells caused by ultraviolet (UV) radiation from sunlight or tanning beds.",
        "medicines": "Undergo professional oncology review; surgical excision is primary.",
        "precautions": "Wear sunscreen SPF 50 daily, avoid peak sun hours, perform skin checks weekly.",
        "remedies": "None. Melanoma requires immediate, standard medical intervention.",
        "eat": "Antioxidant-rich foods, green tea, cruciferous vegetables.",
        "avoid": "Carcinogenic processed meats, high sugar items, alcohol.",
        "lifestyle": "Completely avoid tanning beds, wear UPF protective clothing.",
        "doctor": "Immediately. Any suspicious, changing, or bleeding mole requires biopsy."
    }
}

def get_treatment_recs(disease_name):
    # Fallback to general advice
    return TREATMENTS.get(disease_name, {
        "description": f"Condition details for {disease_name}.",
        "symptoms": "Redness, local irritation, swelling, skin changes.",
        "causes": "Environmental factors, immune response, infection.",
        "medicines": "Consult a healthcare provider for prescription meds.",
        "precautions": "Keep clean, avoid scratching, apply mild soothing lotions.",
        "remedies": "Cold compress, hydration, aloe vera.",
        "eat": "Fresh vegetables, water, clean protein.",
        "avoid": "Junk foods, allergens, sugar.",
        "lifestyle": "Manage stress, get adequate sleep, keep areas ventilated.",
        "doctor": "If the condition worsens, spreads, or doesn't heal within 7 days."
    })

def make_mock_qrcode(width, height):
    """Draws a mock barcode/QR code vector using ReportLab shapes to avoid qrcode package dependencies."""
    d = Drawing(width, height)
    # Draw border
    d.add(Rect(0, 0, width, height, fillColor=colors.white, strokeColor=colors.black, strokeWidth=1))
    
    # Draw some grids to look like QR
    step = 6
    for i in range(2, int(width-2), step):
        for j in range(2, int(height-2), step):
            if (i+j) % 4 == 0 or (i*j) % 5 == 0:
                d.add(Rect(i, j, step-1, step-1, fillColor=colors.black, strokeColor=colors.black))
                
    # Position corner marker boxes
    d.add(Rect(2, height - 16, 14, 14, fillColor=colors.black))
    d.add(Rect(4, height - 14, 10, 10, fillColor=colors.white))
    d.add(Rect(6, height - 12, 6, 6, fillColor=colors.black))
    
    d.add(Rect(width - 16, height - 16, 14, 14, fillColor=colors.black))
    d.add(Rect(width - 14, height - 14, 10, 10, fillColor=colors.white))
    d.add(Rect(width - 12, height - 12, 6, 6, fillColor=colors.black))
    
    d.add(Rect(2, 2, 14, 14, fillColor=colors.black))
    d.add(Rect(4, 4, 10, 10, fillColor=colors.white))
    d.add(Rect(6, 6, 6, 6, fillColor=colors.black))
    
    return d

@reports_bp.route('/generate/<pred_id>', methods=['GET'])
@token_required
def generate_pdf_report(current_user, pred_id):
    scan = predictions_col.find_one({'_id': pred_id, 'user_id': current_user['_id']})
    if not scan:
        return jsonify({'message': 'Scan record not found.'}), 404
        
    pdf_filename = f"report_{pred_id}.pdf"
    pdf_path = os.path.join(Config.REPORTS_FOLDER, pdf_filename)
    
    # Generate PDF Document
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom styled paragraph definitions
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F766E'),
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#374151')
    )
    
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    # 1. Header (Hospital / Project details)
    header_data = [
        [Paragraph("<b>SMART SKIN DISEASE DETECTOR</b><br/>Advanced Dermatological AI Lab", title_style), 
         make_mock_qrcode(50, 50)]
    ]
    header_table = Table(header_data, colWidths=[420, 100])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT')
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    
    # Divider line
    divider = Drawing(520, 2)
    divider.add(Rect(0, 0, 520, 2, fillColor=colors.HexColor('#1E3A8A'), strokeColor=None))
    story.append(divider)
    story.append(Spacer(1, 12))
    
    # 2. Patient Details Table
    date_str = datetime.datetime.fromisoformat(scan.get('date')).strftime('%d %B, %Y %I:%M %p')
    patient_data = [
        [Paragraph("<b>Patient Name:</b>", bold_label), Paragraph(scan.get('patient_name', 'N/A'), body_style),
         Paragraph("<b>Date:</b>", bold_label), Paragraph(date_str, body_style)],
        [Paragraph("<b>Age / Gender:</b>", bold_label), Paragraph(f"{scan.get('age', 'N/A')} / {scan.get('gender', 'N/A')}", body_style),
         Paragraph("<b>Report ID:</b>", bold_label), Paragraph(pred_id[:12], body_style)]
    ]
    patient_table = Table(patient_data, colWidths=[90, 170, 80, 180])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 15))
    
    # 3. Visuals section (Original, Preprocessed Segmentation, Heatmap)
    # Get physical paths of images
    orig_rel = scan.get('original_url')
    # Preprocessed steps array - 10th step segment URL
    seg_rel = next((s['url'] for s in scan.get('preprocessed_steps', []) if '10_skin_segmentation' in s['step']), None)
    heat_rel = scan.get('heatmap_url')
    
    # Base path folder mapping
    base_folder = os.path.dirname(Config.BASE_DIR) # go up to workspace or backend folder containing static
    
    orig_path = os.path.join(Config.BASE_DIR, orig_rel.lstrip('/')) if orig_rel else None
    seg_path = os.path.join(Config.BASE_DIR, seg_rel.lstrip('/')) if seg_rel else None
    heat_path = os.path.join(Config.BASE_DIR, heat_rel.lstrip('/')) if heat_rel else None
    
    images_row = []
    
    # Function to draw rounded images or fit standard bounds safely
    def add_image_safely(path):
        if path and os.path.exists(path):
            try:
                return RLImage(path, width=150, height=150)
            except Exception:
                return Paragraph("[Image Render Error]", body_style)
        return Paragraph("[Image Unavailable]", body_style)

    images_row = [
        add_image_safely(orig_path),
        add_image_safely(seg_path),
        add_image_safely(heat_path)
    ]
    
    image_table = Table([images_row], colWidths=[173, 173, 174])
    image_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(image_table)
    
    # Image Labels
    label_table = Table([[
        Paragraph("<b>Original Lesion</b>", body_style),
        Paragraph("<b>Otsu Segmented Skin</b>", body_style),
        Paragraph("<b>Grad-CAM Saliency</b>", body_style)
    ]], colWidths=[173, 173, 174])
    label_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 2)
    ]))
    story.append(label_table)
    story.append(Spacer(1, 15))
    
    # 4. CNN Prediction Diagnosis
    confidence = scan.get('confidence', 0)
    conf_percentage = f"{round(confidence * 100, 2)}%"
    
    severity = scan.get('severity', 'Mild')
    severity_colors = {
        'Mild': '#10B981',     # Green
        'Moderate': '#F59E0B', # Orange
        'Severe': '#EF4444'    # Red
    }
    sev_color = severity_colors.get(severity, '#10B981')
    
    diag_data = [
        [Paragraph("<b>Diagnosed Disease:</b>", bold_label), Paragraph(scan.get('prediction', 'Unknown'), body_style),
         Paragraph("<b>AI Confidence Score:</b>", bold_label), Paragraph(conf_percentage, body_style)],
        [Paragraph("<b>Estimated Severity:</b>", bold_label), Paragraph(f"<font color='{sev_color}'><b>{severity}</b></font>", body_style),
         Paragraph("<b>CNN Model Acc:</b>", bold_label), Paragraph(f"{round(scan.get('metrics', {}).get('accuracy', 0.94) * 100, 1)}%", body_style)]
    ]
    diag_table = Table(diag_data, colWidths=[120, 140, 120, 140])
    diag_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')), # Light blue fill
        ('PADDING', (0,0), (-1,-1), 7),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#BFDBFE')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 15))
    
    # PageBreak for recommendations if layout is tight, or keep it on one page
    # Since letter is 792 pt and margins consume 80, we have 712 pt printable height.
    # Image rows take ~180. Tables take ~150. We have ~350 pt left. We can fit recommendations.
    
    # 5. Treatment Recommendations
    recs = get_treatment_recs(scan.get('prediction'))
    story.append(Paragraph("Clinical Treatment Guidance", h2_style))
    
    recs_data = [
        [Paragraph("<b>Condition Description:</b>", bold_label), Paragraph(recs["description"], body_style)],
        [Paragraph("<b>Common Symptoms:</b>", bold_label), Paragraph(recs["symptoms"], body_style)],
        [Paragraph("<b>Primary Causes:</b>", bold_label), Paragraph(recs["causes"], body_style)],
        [Paragraph("<b>Recommended OTC Drugs:</b>", bold_label), Paragraph(recs["medicines"], body_style)],
        [Paragraph("<b>Dietary Recommendations:</b>", bold_label), Paragraph(f"<b>Eat:</b> {recs['eat']} <br/><b>Avoid:</b> {recs['avoid']}", body_style)],
        [Paragraph("<b>Precautions:</b>", bold_label), Paragraph(recs["precautions"], body_style)],
        [Paragraph("<b>When to consult Clinician:</b>", bold_label), Paragraph(recs["doctor"], body_style)]
    ]
    recs_table = Table(recs_data, colWidths=[130, 390])
    recs_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC'))
    ]))
    story.append(recs_table)
    story.append(Spacer(1, 15))
    
    # Footer disclaimer
    story.append(Paragraph("<b>Disclaimer:</b> This report is generated by a Convolutional Neural Network (CNN) trained for dermatology analysis. It is designed to assist clinical workflows and must not replace professional medical diagnosis, advice, or biopsy. Please consult a board-certified dermatologist for final verification.", ParagraphStyle('Disclaimer', parent=body_style, fontSize=7, leading=9, textColor=colors.HexColor('#9CA3AF'))))

    # Build PDF
    try:
        doc.build(story)
        return jsonify({
            'message': 'PDF report created successfully.',
            'url': f"/static/reports/{pdf_filename}"
        }), 200
    except Exception as e:
        print(f"[Error] Failed to build PDF: {e}")
        return jsonify({'message': f'PDF build error: {str(e)}'}), 500

@reports_bp.route('/download/<pred_id>', methods=['GET'])
def download_pdf_report(pred_id):
    pdf_filename = f"report_{pred_id}.pdf"
    pdf_path = os.path.join(Config.REPORTS_FOLDER, pdf_filename)
    if not os.path.exists(pdf_path):
        return jsonify({'message': 'PDF report file does not exist. Call generate first.'}), 404
        
    return send_file(pdf_path, as_attachment=True, download_name=f"skin_report_{pred_id[:8]}.pdf")
