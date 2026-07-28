import os
import random
import csv
import math

# Set seed for exact reproducibility
random.seed(42)

COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos',
  'Uasin Gishu', 'Kilifi', 'Kajiado', 'Meru', 'Nyeri', 'Kakamega',
  'Murang\'a', 'Kericho', 'Bungoma', 'Laikipia'
]

PROJECT_TYPES = ['Commercial', 'Residential', 'Infrastructure', 'Industrial', 'Civil Works']
TYPE_WEIGHTS = [35, 30, 20, 10, 5]

NCA_GRADES = ['NCA 1', 'NCA 2', 'NCA 3', 'NCA 4', 'NCA 5', 'NCA 6', 'NCA 7', 'NCA 8']
GRADE_WEIGHTS = [25, 20, 15, 15, 10, 8, 4, 3]

def generate_synthetic_dataset(num_samples=1000, output_path=None):
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), 'synthetic_projects.csv')

    fieldnames = [
        'project_id', 'project_type', 'county', 'nca_contractor_grade',
        'budget_ksh', 'planned_duration_days', 'completed_milestones_count',
        'total_milestones_count', 'current_delay_days', 'delayed', 'cost_overrun_pct'
    ]

    records = []

    for i in range(1, num_samples + 1):
        p_id = f"PROJ-KE-{i:04d}"
        p_type = random.choices(PROJECT_TYPES, weights=TYPE_WEIGHTS, k=1)[0]
        county = random.choice(COUNTIES)
        grade = random.choices(NCA_GRADES, weights=GRADE_WEIGHTS, k=1)[0]

        # Log-normal budget sampling (between 5M and 2.5B KSh)
        raw_budget = math.exp(random.gauss(18.5, 1.2))
        budget = round(max(5000000.0, min(raw_budget, 2500000000.0)), 2)

        planned_duration = random.randint(90, 1095)
        total_milestones = random.randint(3, 15)
        completed_milestones = random.randint(0, total_milestones)

        # Current delay days
        if random.random() < 0.45:
            current_delay = random.randint(5, 120)
        else:
            current_delay = 0

        # Heuristic ground truth target modeling calibrated to Auditor-General estimates (~42% delay rate)
        grade_risk = (NCA_GRADES.index(grade) + 1) * 0.025
        duration_risk = (planned_duration / 1095) * 0.20
        delay_impact = (current_delay / max(planned_duration, 1)) * 1.2

        raw_prob = 0.15 + grade_risk + duration_risk + delay_impact + random.gauss(0, 0.07)
        prob = min(max(raw_prob, 0.05), 0.95)

        # Binary label for D3 XGBoost Classifier calibrated to ~42% delay rate
        is_delayed = 1 if prob >= 0.43 else 0

        # Regression label for E1 LightGBM Cost Overrun
        if is_delayed == 1:
            cost_overrun_pct = round(float(random.uniform(5.0, 38.0) + (current_delay * 0.1)), 2)
        else:
            cost_overrun_pct = round(float(max(random.gauss(1.2, 1.5), 0.0)), 2)

        records.append({
            'project_id': p_id,
            'project_type': p_type,
            'county': county,
            'nca_contractor_grade': grade,
            'budget_ksh': budget,
            'planned_duration_days': planned_duration,
            'completed_milestones_count': completed_milestones,
            'total_milestones_count': total_milestones,
            'current_delay_days': current_delay,
            'delayed': is_delayed,
            'cost_overrun_pct': cost_overrun_pct
        })

    # Write to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} synthetic project records saved to: {output_path}")
    return output_path

if __name__ == '__main__':
    generate_synthetic_dataset()
