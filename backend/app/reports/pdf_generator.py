import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.config import Config

# Brand colors
COLOR_FOREST = colors.HexColor("#2E4036")
COLOR_CLAY = colors.HexColor("#CC5833")
COLOR_CREAM = colors.HexColor("#F2F0E9")
COLOR_CHARCOAL = colors.HexColor("#1A1A1A")
COLOR_MUTED = colors.HexColor("#666666")
COLOR_BORDER = colors.HexColor("#D1D5DB")
COLOR_LIGHT_BG = colors.HexColor("#F9FAFB")

def generate_pdf_report(
    output_path: str,
    repository_data: Dict[str, Any],
    run_data: Dict[str, Any],
    interfaces_data: List[Dict[str, Any]],
    findings_data: List[Dict[str, Any]],
    cycles_data: List[Dict[str, Any]],
    change_points_data: List[Dict[str, Any]],
    explanations_data: List[Dict[str, Any]],
    evaluation_data: List[Dict[str, Any]] | None = None,
) -> str:
    """
    Generates a publication-grade PDF report adhering to the Software Architecture Field Journal design.
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=COLOR_FOREST,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=COLOR_CLAY,
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=COLOR_FOREST,
        spaceBefore=14,
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=COLOR_CHARCOAL,
        spaceBefore=8,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_CHARCOAL,
    )
    code_style = ParagraphStyle(
        "Code_Custom",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=COLOR_CHARCOAL,
    )
    badge_style = ParagraphStyle(
        "Badge_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.white,
    )

    elements = []

    # Header / Title banner
    elements.append(Paragraph("INTERFACEGUARD", subtitle_style))
    elements.append(Paragraph("Object-Oriented Interface Erosion Audit", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f"Repository: <b>{repository_data.get('name', 'N/A')}</b> &bull; "
        f"URL: {repository_data.get('github_url', 'N/A')} &bull; "
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        body_style
    ))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_FOREST, spaceAfter=14))

    # Section 1: Executive Summary & Project Erosion Index
    elements.append(Paragraph("1. Executive Summary & Project Erosion Index", h1_style))
    erosion_index = run_data.get("project_erosion_index", 100.0)
    
    summary_data = [
        [
            Paragraph("<b>Project Erosion Index</b>", h2_style),
            Paragraph(f"<font size=18 color='{COLOR_CLAY if erosion_index < 70 else COLOR_FOREST}'><b>{erosion_index:.1f} / 100</b></font>", body_style),
            Paragraph("<b>Status:</b>", body_style),
            Paragraph(f"<b>{'Eroded' if erosion_index < 70 else 'Healthy'}</b>", body_style),
        ],
        [
            Paragraph("<b>Analyzed Commits:</b>", body_style),
            Paragraph(str(run_data.get("processed_commits", 0)), body_style),
            Paragraph("<b>Tracked Interfaces:</b>", body_style),
            Paragraph(str(len(interfaces_data)), body_style),
        ],
        [
            Paragraph("<b>ISP Violations:</b>", body_style),
            Paragraph(str(len([f for f in findings_data if f.get("category") == "isp_violation"])), body_style),
            Paragraph("<b>Dependency Cycles:</b>", body_style),
            Paragraph(str(len(cycles_data)), body_style),
        ],
    ]
    summary_table = Table(summary_data, colWidths=[130, 130, 130, 140])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 1, COLOR_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Section 2: Interface Inventory & CK Metrics
    elements.append(Paragraph("2. Interface Inventory & CK Metrics", h1_style))
    elements.append(Paragraph(
        "CK metrics (CBO, LCOM, RFC, WMC, DIT) are aggregated across implementing classes. NOC represents the number of concrete implementing classes.",
        body_style
    ))
    elements.append(Spacer(1, 6))

    iface_table_data = [
        ["Interface", "Pkg", "Health", "Severity", "Methods", "CBO", "LCOM", "WMC", "NOC"]
    ]
    for iface in interfaces_data:
        snap = iface.get("latest_snapshot") or {}
        h_score = snap.get("health_score", 100.0)
        sev = snap.get("severity", "healthy")
        iface_table_data.append([
            Paragraph(f"<b>{iface.get('name')}</b>", body_style),
            Paragraph(iface.get("package", "")[:12], code_style),
            f"{h_score:.1f}",
            sev.upper(),
            str(snap.get("method_count", 0)),
            f"{snap.get('cbo', 0):.1f}",
            f"{snap.get('lcom', 0):.2f}",
            f"{snap.get('wmc', 0):.1f}",
            str(int(snap.get("noc", 0))),
        ])

    if len(iface_table_data) > 1:
        iface_table = Table(iface_table_data, colWidths=[110, 75, 45, 55, 50, 45, 45, 45, 40])
        iface_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_FOREST),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_BG]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(iface_table)
    else:
        elements.append(Paragraph("<i>No interfaces discovered in this analysis run.</i>", body_style))
    elements.append(Spacer(1, 14))

    # Section 3: Interface Segregation Principle (ISP) Violations
    elements.append(Paragraph("3. Interface Segregation Principle (ISP) Violations", h1_style))
    isp_findings = [f for f in findings_data if f.get("category") == "isp_violation"]
    if isp_findings:
        isp_table_data = [["Rule / Indicator", "Class", "Method", "Evidence"]]
        for f in isp_findings[:15]:
            isp_table_data.append([
                Paragraph(f"<b>{f.get('rule_name')}</b>", body_style),
                Paragraph(f.get("class_name") or "", code_style),
                Paragraph(f.get("method_name") or "", code_style),
                Paragraph(f.get("evidence") or "", body_style),
            ])
        isp_table = Table(isp_table_data, colWidths=[130, 110, 110, 180])
        isp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_CLAY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_BG]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(isp_table)
    else:
        elements.append(Paragraph("<i>No ISP violation stubs detected.</i>", body_style))
    elements.append(Spacer(1, 14))

    # Section 4: Design Smells & Dependency Cycles
    elements.append(Paragraph("4. Design Smells & Dependency Cycles", h1_style))
    other_findings = [f for f in findings_data if f.get("category") != "isp_violation"]
    if other_findings or cycles_data:
        findings_table_data = [["Category", "Rule Name", "Severity", "Target", "Details"]]
        for f in other_findings[:15]:
            findings_table_data.append([
                f.get("category", "").replace("_", " ").title(),
                Paragraph(f"<b>{f.get('rule_name')}</b>", body_style),
                f.get("severity", "").upper(),
                Paragraph(f.get("class_name") or f.get("file_path", "")[:20], code_style),
                Paragraph(f.get("description", ""), body_style),
            ])
        for c in cycles_data[:5]:
            findings_table_data.append([
                "Cycle",
                Paragraph("<b>Circular Dependency</b>", body_style),
                "CRITICAL",
                Paragraph("Cycle", code_style),
                Paragraph(f"Cycle path: {c.get('cycle_path') or c.get('source_name')}", body_style),
            ])
        f_table = Table(findings_table_data, colWidths=[80, 110, 60, 110, 170])
        f_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_FOREST),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_BG]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(f_table)
    else:
        elements.append(Paragraph("<i>No additional design smells or dependency cycles detected.</i>", body_style))
    elements.append(Spacer(1, 14))

    # Section 5: Historical Evolution & Change Points
    elements.append(Paragraph("5. Historical Evolution & Statistical Change Points", h1_style))
    if change_points_data:
        cp_table_data = [["Commit", "Date", "Author", "Score Drop", "Description"]]
        for cp in change_points_data:
            score_b = cp.get("score_before", 0)
            score_a = cp.get("score_after", 0)
            drop_str = f"{score_b:.1f} &rarr; {score_a:.1f}" if score_b else "N/A"
            cp_table_data.append([
                Paragraph(str(cp.get("commit_hash", ""))[:8], code_style),
                str(cp.get("commit_date", ""))[:10],
                Paragraph(str(cp.get("author", "unknown"))[:15], body_style),
                Paragraph(drop_str, body_style),
                Paragraph(str(cp.get("description", "")), body_style),
            ])
        cp_table = Table(cp_table_data, colWidths=[70, 70, 90, 80, 220])
        cp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_CLAY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_BG]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(cp_table)
    else:
        elements.append(Paragraph("<i>No abrupt statistical change points detected in the analyzed commit window.</i>", body_style))
    elements.append(Spacer(1, 14))

    # Section 6: AI-Assisted Architecture Recommendations
    elements.append(Paragraph("6. AI-Assisted Architecture & Refactoring Recommendations", h1_style))
    if explanations_data:
        for exp in explanations_data[:3]:
            elements.append(Paragraph(f"<b>Diagnosis ({exp.get('provider', 'AI Engine')}):</b>", h2_style))
            elements.append(Paragraph(exp.get("explanation_text") or exp.get("explanation") or "", body_style))
            elements.append(Spacer(1, 4))
            elements.append(Paragraph("<b>Refactoring Plan & Responsibility Separation:</b>", h2_style))
            elements.append(Paragraph(exp.get("refactoring_recommendation") or exp.get("recommendation") or exp.get("suggestion_text") or "", body_style))
            elements.append(Spacer(1, 4))
            elements.append(Paragraph(f"<b>Risks & Trade-offs:</b> {exp.get('risk_analysis') or exp.get('risks') or 'Ensure unit tests cover all client callsites.'}", body_style))
            elements.append(Spacer(1, 8))
    else:
        elements.append(Paragraph("<i>No AI explanations generated for this run.</i>", body_style))
    elements.append(Spacer(1, 14))

    # Section 7: Evaluation & Methodology Limitations
    elements.append(Paragraph("7. Methodology & Known Limitations", h1_style))
    methodology_text = (
        "<b>Methodology:</b> InterfaceGuard analyzes Java source code across Git history using JavaParser AST parsing "
        "and PyDriller. Metric extraction includes Chidamber & Kemerer (CK) metrics aggregated over implementing classes, "
        "interface cohesion metrics, ISP violation heuristics (empty/no-op/exception/placeholder stubs), and NetworkX cycle analysis. "
        "<br/><br/>"
        "<b>Limitations:</b> Dynamic runtime reflection and bytecode manipulation are out of scope. Statistical change-point detection "
        "highlights sudden score deteriorations but does not prove intent. All recommendations should be reviewed by engineering teams."
    )
    elements.append(Paragraph(methodology_text, body_style))

    doc.build(elements)
    return output_path
