import io
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from backend.ml.bis_screening import evaluate_bis_is_10500

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y' in footer."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b")) # slate-500

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 35, 572, 35)

        # Footer text
        footer_text = "AquaWatch AI • Smart Water Quality Intelligence Platform • Standards: BIS IS 10500:2012"
        self.drawString(40, 24, footer_text)

        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(572, 24, page_str)
        self.restoreState()


def build_pdf_report(
    samples: List[Any],
    mode: str = "ALL", # "ALL", "SINGLE", "SELECTED"
    title_suffix: str = ""
) -> io.BytesIO:
    """
    Builds a professional, vector-quality PDF water compliance report.
    Returns in-memory BytesIO buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom branding styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"), # slate-900
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0891b2"), # cyan-600
        spaceAfter=12
    )

    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    meta_val_style = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    section_heading = ParagraphStyle(
        "SecHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []

    # 1. Header Banner
    report_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    gen_time_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    if mode == "SINGLE" and len(samples) == 1:
        doc_heading = f"AquaWatch AI — Individual Sample Audit Report"
        doc_sub = f"Sample ID #{samples[0].id} • Comprehensive Physical, Chemical & ML Intelligence"
    elif mode == "SELECTED":
        doc_heading = f"AquaWatch AI — Custom Selected Samples Audit Report"
        doc_sub = f"Batch Report covering {len(samples)} selected water telemetry sample(s)"
    else:
        doc_heading = f"AquaWatch AI — Comprehensive Water Intelligence Report"
        doc_sub = f"Master Audit covering all {len(samples)} recorded water telemetry sample(s)"

    elements.append(Paragraph(doc_heading, title_style))
    elements.append(Paragraph(doc_sub, subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#06b6d4"), spaceAfter=10))

    # 2. Metadata Box
    meta_table_data = [
        [
            Paragraph("Report ID:", meta_label_style),
            Paragraph(report_id, meta_val_style),
            Paragraph("Generation Date:", meta_label_style),
            Paragraph(gen_time_str, meta_val_style),
        ],
        [
            Paragraph("Report Mode:", meta_label_style),
            Paragraph(f"{mode} ({len(samples)} sample{'s' if len(samples) != 1 else ''})", meta_val_style),
            Paragraph("Evaluation Standard:", meta_label_style),
            Paragraph("BIS IS 10500:2012 Drinking Water Specification", meta_val_style),
        ],
        [
            Paragraph("Platform:", meta_label_style),
            Paragraph("AquaWatch AI Telemetry System", meta_val_style),
            Paragraph("Machine Learning Engine:", meta_label_style),
            Paragraph("Balanced Random Forest Classifier", meta_val_style),
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[90, 175, 115, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")), # slate-50
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # 3. IF SINGLE SAMPLE MODE -> Detailed Full Audit Table with BIS limits
    if mode == "SINGLE" and len(samples) == 1:
        s = samples[0]

        # Extract sample values dictionary for BIS evaluation
        sample_dict = {
            "ph": s.ph,
            "hardness": s.hardness,
            "solids": s.solids,
            "chloramines": s.chloramines,
            "sulfate": s.sulfate,
            "conductivity": s.conductivity,
            "organic_carbon": s.organic_carbon,
            "trihalomethanes": s.trihalomethanes,
            "turbidity": s.turbidity
        }

        screening = evaluate_bis_is_10500(sample_dict)

        # Overview Card for Single Sample
        elements.append(Paragraph(f"Sample Overview (ID #{s.id})", section_heading))
        created_str = s.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(s.created_at, "strftime") else str(s.created_at)
        
        overview_data = [
            [
                Paragraph("Timestamp:", meta_label_style), Paragraph(created_str, meta_val_style),
                Paragraph("Telemetry Source:", meta_label_style), Paragraph(s.source or "Single API", meta_val_style)
            ],
            [
                Paragraph("ML Prediction:", meta_label_style),
                Paragraph(f"<font color='{'#059669' if s.is_potable else '#dc2626'}'><b>{s.verdict}</b></font> ({s.confidence*100:.1f}% confidence)", meta_val_style),
                Paragraph("Anomaly Status:", meta_label_style),
                Paragraph(f"<font color='{'#d97706' if s.is_anomaly else '#059669'}'><b>{'FLAGGED ANOMALY' if s.is_anomaly else 'NORMAL RANGE'}</b></font>", meta_val_style)
            ],
            [
                Paragraph("Scientific Screening:", meta_label_style),
                Paragraph(f"<b>{screening['assessment_outcome']}</b>", meta_val_style),
                Paragraph("Exceeded Parameters:", meta_label_style),
                Paragraph(", ".join(screening['exceeded_parameters']) if screening['exceeded_parameters'] else "None", meta_val_style)
            ]
        ]
        ov_table = Table(overview_data, colWidths=[100, 165, 115, 150])
        ov_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(ov_table)
        elements.append(Spacer(1, 10))

        # Scientific Parameter-Wise Audit Table
        elements.append(Paragraph("BIS IS 10500:2012 Parameter-Wise Evaluation", section_heading))
        
        param_table_headers = [
            Paragraph("Parameter", table_cell_bold),
            Paragraph("Measured Value", table_cell_bold),
            Paragraph("Acceptable Limit", table_cell_bold),
            Paragraph("Permissible Limit", table_cell_bold),
            Paragraph("Compliance Status", table_cell_bold),
            Paragraph("Scientific Note", table_cell_bold)
        ]
        
        param_table_rows = [param_table_headers]

        for p in screening["parameter_results"]:
            if p["measured_value"] is not None:
                val_display = f"{p['measured_value']:.2f} {p['unit']}"
            else:
                val_display = "Not Tested"

            status_color = "#059669" if p["status_code"] == "ACCEPTABLE" else ("#d97706" if p["status_code"] == "PERMISSIBLE" else ("#dc2626" if p["status_code"] == "EXCEEDS" else "#64748b"))
            status_para = Paragraph(f"<font color='{status_color}'><b>{p['status']}</b></font>", table_cell)

            param_table_rows.append([
                Paragraph(p["name"], table_cell_bold),
                Paragraph(val_display, table_cell),
                Paragraph(p["acceptable_limit"], table_cell),
                Paragraph(p["permissible_limit"], table_cell),
                status_para,
                Paragraph(p["explanation"], table_cell)
            ])

        param_table = Table(param_table_rows, colWidths=[105, 75, 75, 80, 85, 110])
        param_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(param_table)

    # 4. IF MULTIPLE / ALL SAMPLES -> Summary Ledger Table
    else:
        # Aggregated statistics for the requested subset
        total_sub = len(samples)
        potable_sub = sum(1 for s in samples if s.is_potable)
        anomaly_sub = sum(1 for s in samples if s.is_anomaly)
        potable_pct = (potable_sub / total_sub * 100) if total_sub > 0 else 0
        anomaly_pct = (anomaly_sub / total_sub * 100) if total_sub > 0 else 0

        # Calculate averages for numeric parameters
        ph_vals = [s.ph for s in samples if s.ph is not None]
        solids_vals = [s.solids for s in samples if s.solids is not None]
        turb_vals = [s.turbidity for s in samples if s.turbidity is not None]

        avg_ph = (sum(ph_vals) / len(ph_vals)) if ph_vals else 0
        avg_solids = (sum(solids_vals) / len(solids_vals)) if solids_vals else 0
        avg_turb = (sum(turb_vals) / len(turb_vals)) if turb_vals else 0

        elements.append(Paragraph(f"Batch Executive Summary ({total_sub} Samples)", section_heading))
        summary_data = [
            [
                Paragraph("Metric", table_cell_bold),
                Paragraph("Count / Value", table_cell_bold),
                Paragraph("Percentage", table_cell_bold),
                Paragraph("Regulatory Context", table_cell_bold)
            ],
            [
                Paragraph("Total Evaluated Samples", table_cell),
                Paragraph(str(total_sub), table_cell_bold),
                Paragraph("100%", table_cell),
                Paragraph("Exact sample subset requested", table_cell)
            ],
            [
                Paragraph("ML Potable (Safe for Consumption)", table_cell),
                Paragraph(str(potable_sub), table_cell_bold),
                Paragraph(f"{potable_pct:.1f}%", table_cell),
                Paragraph("Random Forest Model Output", table_cell)
            ],
            [
                Paragraph("ML Non-Potable (Unsafe)", table_cell),
                Paragraph(str(total_sub - potable_sub), table_cell_bold),
                Paragraph(f"{100 - potable_pct:.1f}%", table_cell),
                Paragraph("Treatment Recommended", table_cell)
            ],
            [
                Paragraph("Flagged Environmental Anomalies", table_cell),
                Paragraph(str(anomaly_sub), table_cell_bold),
                Paragraph(f"{anomaly_pct:.1f}%", table_cell),
                Paragraph("Breached Safety Thresholds", table_cell)
            ],
            [
                Paragraph("Average Parameter Profile", table_cell),
                Paragraph(f"pH: {avg_ph:.2f} | TDS: {avg_solids:.0f} ppm | Turbidity: {avg_turb:.2f} NTU", table_cell_bold),
                Paragraph("—", table_cell),
                Paragraph("Batch mean readings", table_cell)
            ]
        ]
        sum_table = Table(summary_data, colWidths=[160, 110, 80, 180])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0891b2")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 10))

        # Sample Ledger Table
        elements.append(Paragraph(f"Sample Ledger ({total_sub} Record{'s' if total_sub != 1 else ''})", section_heading))
        ledger_headers = [
            Paragraph("ID", table_cell_bold),
            Paragraph("Date", table_cell_bold),
            Paragraph("pH", table_cell_bold),
            Paragraph("Hardness", table_cell_bold),
            Paragraph("TDS (ppm)", table_cell_bold),
            Paragraph("Chloramines", table_cell_bold),
            Paragraph("Sulfate", table_cell_bold),
            Paragraph("Turbidity", table_cell_bold),
            Paragraph("ML Verdict", table_cell_bold),
            Paragraph("Conf.", table_cell_bold),
            Paragraph("Anomaly", table_cell_bold)
        ]
        ledger_rows = [ledger_headers]

        for s in samples:
            date_str = s.created_at.strftime("%Y-%m-%d") if hasattr(s.created_at, "strftime") else str(s.created_at)[:10]
            verdict_col = "#059669" if s.is_potable else "#dc2626"
            anom_col = "#d97706" if s.is_anomaly else "#64748b"

            ledger_rows.append([
                Paragraph(f"#{s.id}", table_cell_bold),
                Paragraph(date_str, table_cell),
                Paragraph(f"{s.ph:.2f}" if s.ph is not None else "—", table_cell),
                Paragraph(f"{s.hardness:.1f}" if s.hardness is not None else "—", table_cell),
                Paragraph(f"{s.solids:.0f}" if s.solids is not None else "—", table_cell),
                Paragraph(f"{s.chloramines:.2f}" if s.chloramines is not None else "—", table_cell),
                Paragraph(f"{s.sulfate:.1f}" if s.sulfate is not None else "—", table_cell),
                Paragraph(f"{s.turbidity:.2f}" if s.turbidity is not None else "—", table_cell),
                Paragraph(f"<font color='{verdict_col}'><b>{'POTABLE' if s.is_potable else 'UNSAFE'}</b></font>", table_cell),
                Paragraph(f"{s.confidence*100:.0f}%", table_cell),
                Paragraph(f"<font color='{anom_col}'><b>{'FLAG' if s.is_anomaly else 'OK'}</b></font>", table_cell)
            ])

        ledger_table = Table(ledger_rows, colWidths=[35, 55, 38, 48, 55, 52, 48, 48, 62, 38, 45], repeatRows=1)
        ledger_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(ledger_table)

    # 5. Scientific Limitations & Legal Notice (Keep Together)
    elements.append(Spacer(1, 12))
    notice_text = (
        "<b>Notice of Scientific Screening & Limitations:</b> This document was generated automatically by "
        "AquaWatch AI. Dual evaluation comprises: (1) Deterministic rule verification against Bureau of Indian Standards "
        "(BIS IS 10500:2012) drinking water specifications, and (2) Statistical inference via a Balanced Random Forest "
        "Classifier trained on multi-parameter environmental water bodies. Water potability cannot be certified without "
        "comprehensive microbiological examination (absence of E. coli / thermotolerant coliforms in 100 mL) and certified "
        "laboratory testing for heavy metals (Lead, Arsenic, Fluoride, Cadmium)."
    )
    elements.append(Paragraph(notice_text, body_style))

    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
