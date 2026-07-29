import os
from datetime import datetime

DIGEST_MODEL_VERSION = "digest-nlp-v1.0.0"

class AIDigestEngine:
    def generate_digest(self, req) -> dict:
        """
        Synthesizes a structured AI Executive Digest Report (FR08)
        tailored to Kenyan construction stakeholders (NCA, Contractors, Govt).
        """
        p_name = req.project_name
        p_type = req.project_type
        county = req.county
        grade = req.nca_contractor_grade or "NCA 1"
        budget = float(req.budget_ksh)
        duration = int(req.planned_duration_days)
        completed_ms = int(req.completed_milestones_count)
        total_ms = max(int(req.total_milestones_count), 1)
        delay_days = int(req.current_delay_days)
        delay_prob = float(req.delay_risk_score if req.delay_risk_score is not None else 0.20)
        cost_pct = float(req.cost_overrun_pct if req.cost_overrun_pct is not None else 2.5)

        progress_pct = round((completed_ms / total_ms) * 100, 1)
        est_overrun_ksh = round(budget * (cost_pct / 100.0), 2)
        risk_level = "HIGH" if delay_prob >= 0.65 else ("MEDIUM" if delay_prob >= 0.35 else "LOW")

        # 1. Executive Summary
        exec_summary = (
            f"Project '{p_name}' is a {p_type} development situated in {county} County, executed by an {grade} "
            f"classified contractor with a total contract valuation of KSh {budget:,.2f}. The overall predictive "
            f"delay risk profile is currently assessed as {risk_level} ({delay_prob * 100:.1f}% risk score). "
            f"Milestone completion stands at {progress_pct}% ({completed_ms}/{total_ms} milestones completed). "
            f"Estimated financial cost overrun is projected at +{cost_pct:.1f}% (KSh {est_overrun_ksh:,.2f})."
        )

        # 2. Schedule Variance Analysis
        if delay_days > 0:
            sched_analysis = (
                f"The project exhibits a schedule slippage of {delay_days} days against planned duration "
                f"({duration} days). Delayed milestone execution in {county} presents severe critical path bottlenecks. "
                f"Without schedule compression or resource reallocation, project completion is estimated to slip by "
                f"{round(delay_days * 1.25)} calendar days."
            )
        else:
            sched_analysis = (
                f"The schedule progress aligns with planned duration targets ({duration} days). "
                f"No milestone delays recorded to date, reflecting smooth contractor throughput across the initial "
                f"{completed_ms} milestones."
            )

        # 3. Financial Overrun Forecast
        fin_forecast = (
            f"Based on XGBoost and LightGBM predictive models trained on historical Kenyan construction datasets, "
            f"the projected cost overrun is +{cost_pct:.1f}%, amounting to KSh {est_overrun_ksh:,.2f} above baseline budget. "
            f"Primary cost inflation factors include material price volatility, contractor grade overhead ({grade}), "
            f"and delay-induced site maintenance overheads."
        )

        # 4. Key Risk Drivers
        risk_drivers = []
        if delay_days > 0:
            risk_drivers.append(f"Milestone schedule slippage of {delay_days} days affecting critical path items.")
        if cost_pct > 10.0:
            risk_drivers.append(f"High continuous cost overrun expectation (+{cost_pct:.1f}% / KSh {est_overrun_ksh:,.2f}).")
        if grade in ['NCA 6', 'NCA 7', 'NCA 8']:
            risk_drivers.append(f"Contractor classification grade {grade} may experience capacity limits for large-scale operations.")
        if completed_ms < (total_ms * 0.3):
            risk_drivers.append("Low milestone completion progress (< 30%) increases early-stage vulnerability.")
        if not risk_drivers:
            risk_drivers.append("Minor county regulatory compliance check lead times.")

        # 5. Recommended Mitigations
        mitigations = []
        if delay_days > 0:
            mitigations.append("Implement fast-track milestone rescheduling and mobilize additional site labor shifts.")
        if cost_pct > 5.0:
            mitigations.append("Conduct an urgent cost audit and lock bulk supplier pricing contracts for raw steel and cement.")
        mitigations.append(f"Ensure continuous NCA compliance reporting and submit weekly site milestone progress updates.")
        mitigations.append("Establish a 5% contingency buffer reserved for material price fluctuations in Kenya.")

        return {
            "executive_summary": exec_summary,
            "schedule_variance_analysis": sched_analysis,
            "financial_overrun_forecast": fin_forecast,
            "key_risk_drivers": risk_drivers,
            "recommended_mitigations": mitigations,
            "model_version": DIGEST_MODEL_VERSION,
            "timestamp": datetime.utcnow().isoformat()
        }

digest_engine = AIDigestEngine()
