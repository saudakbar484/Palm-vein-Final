import os
import re
import csv
from collections import Counter, defaultdict

import pandas as pd
from PIL import Image

IMG_ROOT = r"Version_1/img"
MAP_PATH = r"Version_1/folder_mapping.csv"
OUT_XLSX = r"Version_1/dataset_report.xlsx"


def load_mapping(map_path: str):
    mapping = {}
    with open(map_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        field0 = reader.fieldnames[0]
        for row in reader:
            fid = str(row[field0]).strip()
            mapping[fid] = {
                'person_name': (row.get('Person Name') or row.get('Person') or row.get('Name') or ''),
                'session': row.get('Session') or ''
            }
    return mapping


def infer_session_from_filename(fn: str):
    if fn.startswith('S1_'):
        return 'S1'
    if fn.startswith('S2_') or re.match(r'^\d{6}', fn):
        return 'S2'
    return 'Unknown'


def main():
    mapping = load_mapping(MAP_PATH)

    subject_folders = [d for d in os.listdir(IMG_ROOT) if os.path.isdir(os.path.join(IMG_ROOT, d))]
    try:
        subject_folders = sorted(subject_folders, key=lambda x: int(x))
    except Exception:
        subject_folders = sorted(subject_folders)

    # Collect per-image records (path + side + inferred session)
    records = []
    for sid in subject_folders:
        sid = str(sid).strip()
        for side in ['Left', 'Right']:
            side_dir = os.path.join(IMG_ROOT, sid, side)
            if not os.path.isdir(side_dir):
                continue
            for fn in os.listdir(side_dir):
                if not fn.lower().endswith('.png'):
                    continue
                records.append({
                    'subject_id': sid,
                    'side': side,
                    'filename': fn,
                    'session_infer': infer_session_from_filename(fn),
                    'path': os.path.join(IMG_ROOT, sid, side, fn)
                })

    # Dimension stats
    sizes = Counter()
    for r in records:
        try:
            with Image.open(r['path']) as im:
                sizes[im.size] += 1
        except Exception:
            pass

    # Aggregate per (subject_id, side)
    agg = defaultdict(lambda: Counter())
    files_by_key = defaultdict(list)

    for r in records:
        key = (r['subject_id'], r['side'])
        agg[key]['total'] += 1
        agg[key]['count_' + r['session_infer']] += 1
        files_by_key[key].append(r['filename'])

    all_total = len(records)
    left_total = sum(1 for r in records if r['side'] == 'Left')
    right_total = all_total - left_total
    sess_counter = Counter(r['session_infer'] for r in records)

    existing_ids = set(str(d).strip() for d in subject_folders)
    mapped_subjects = set(mapping.keys())
    named_class_count = len(existing_ids & mapped_subjects)
    unmapped_subject_count = len(existing_ids - mapped_subjects)

    # Details sheet (per subject + side)
    details_rows = []
    for (sid, side), c in agg.items():
        person = mapping.get(sid, {}).get('person_name', '')
        mapped_session = mapping.get(sid, {}).get('session', '')
        fn_list = sorted(files_by_key[(sid, side)])

        details_rows.append({
            'subject_id': sid,
            'person_name': person,
            'mapped_session': mapped_session,
            'side': side,
            'images_total': int(c['total']),
            'images_S1': int(c.get('count_S1', 0)),
            'images_S2': int(c.get('count_S2', 0)),
            'images_Unknown': int(c.get('count_Unknown', 0)),
            'min_filename': fn_list[0] if fn_list else '',
            'max_filename': fn_list[-1] if fn_list else '',
            'sample_filenames_5': ', '.join(fn_list[:5])
        })

    df_details = pd.DataFrame(details_rows).sort_values(['subject_id', 'side'])

    # PerClass sheet (subject-level combined Left + Right)
    perclass = []
    for sid in sorted(existing_ids & mapped_subjects, key=lambda x: int(x) if str(x).isdigit() else x):
        person = mapping[sid].get('person_name', '')
        mapped_session = mapping[sid].get('session', '')
        left = sum(1 for r in records if r['subject_id'] == sid and r['side'] == 'Left')
        right = sum(1 for r in records if r['subject_id'] == sid and r['side'] == 'Right')
        perclass.append({
            'subject_id': sid,
            'person_name': person,
            'mapped_session': mapped_session,
            'images_left': left,
            'images_right': right,
            'images_total': left + right
        })

    df_perclass = pd.DataFrame(perclass).sort_values(['images_total'], ascending=False)

    # Summary sheet
    common_size = str(sizes.most_common(1)[0][0]) if sizes else ''
    top10 = '; '.join([f"{k}:{v}" for k, v in sizes.most_common(10)])

    df_summary = pd.DataFrame([
        ('dataset_root', IMG_ROOT),
        ('subject_folders_total', len(subject_folders)),
        ('classes_named_in_mapping', named_class_count),
        ('subject_folders_unmapped', unmapped_subject_count),
        ('images_total', all_total),
        ('images_left', left_total),
        ('images_right', right_total),
        ('images_S1_inferred', sess_counter.get('S1', 0)),
        ('images_S2_inferred', sess_counter.get('S2', 0)),
        ('images_Unknown_inferred', sess_counter.get('Unknown', 0)),
        ('most_common_image_size', common_size),
        ('unique_image_sizes', len(sizes)),
        ('dimension_size_counts_top10', top10),
    ], columns=['metric', 'value'])

    # Write Excel with 3 sheets: Summary, Details, PerClass
    with pd.ExcelWriter(OUT_XLSX, engine='openpyxl') as writer:
        df_summary.to_excel(writer, sheet_name='Summary', index=False)
        df_details.to_excel(writer, sheet_name='Details', index=False)
        df_perclass.to_excel(writer, sheet_name='PerClass', index=False)

    print(f"WROTE {OUT_XLSX} | images={all_total} | detail_rows={len(df_details)} | perclass_rows={len(df_perclass)}")


if __name__ == '__main__':
    main()

