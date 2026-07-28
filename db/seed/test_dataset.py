import os
import csv

def test_synthetic_dataset_integrity():
    csv_path = os.path.join(os.path.dirname(__file__), 'synthetic_projects.csv')
    assert os.path.exists(csv_path), f"Synthetic dataset CSV missing at {csv_path}"

    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    total_count = len(rows)
    assert total_count >= 1000, f"Expected at least 1000 records, found {total_count}"

    required_fields = [
        'project_id', 'project_type', 'county', 'nca_contractor_grade',
        'budget_ksh', 'planned_duration_days', 'completed_milestones_count',
        'total_milestones_count', 'current_delay_days', 'delayed', 'cost_overrun_pct'
    ]

    delayed_count = 0
    for r in rows:
        for field in required_fields:
            assert r[field] is not None and r[field] != '', f"Field '{field}' is empty in record {r.get('project_id')}"

        if int(r['delayed']) == 1:
            delayed_count += 1

    delay_rate = delayed_count / total_count
    print(f"[Dataset Stats] Total Records: {total_count} | Delay Rate: {delay_rate * 100:.1f}%")

    # Assert delay rate is calibrated within plausible Auditor-General range (35% to 50%)
    assert 0.35 <= delay_rate <= 0.50, f"[Calibration Error] Delay rate {delay_rate:.2f} outside target [0.35, 0.50]"
    print("[PASS] Synthetic dataset integrity and calibration test passed successfully!")

if __name__ == '__main__':
    test_synthetic_dataset_integrity()
