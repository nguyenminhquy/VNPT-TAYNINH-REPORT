from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data sample"
OUTPUT_FILE = ROOT / "frontend" / "data" / "report-data.js"


def load_sheet(filename: str, sheet_name: str) -> pd.DataFrame:
    df = pd.read_excel(DATA_DIR / filename, sheet_name=sheet_name, header=None)
    return df.where(pd.notna(df), None)


def text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    raw = text(value)
    if not raw:
        return None
    raw = raw.replace("%", "").replace(",", "").strip()
    match = re.search(r"-?\d+(?:\.\d+)?", raw)
    if not match:
        return None
    return float(match.group())


def percent(value: Any) -> float | None:
    numeric = number(value)
    if numeric is None:
        return None
    if abs(numeric) <= 1:
        return numeric * 100
    return numeric


def last_number(value: Any) -> float | None:
    raw = text(value)
    if not raw:
        return None
    matches = re.findall(r"-?\d+(?:\.\d+)?", raw.replace(",", ""))
    if not matches:
        return None
    return float(matches[-1])


def pct(value: float | None, digits: int = 2) -> str:
    if value is None:
        return "-"
    return f"{value:.{digits}f}%"


def decimal(value: float | None, digits: int = 2) -> str:
    if value is None:
        return "-"
    return f"{value:.{digits}f}"


def whole(value: float | int | None) -> str:
    if value is None:
        return "-"
    return f"{int(round(float(value))):,}".replace(",", ".")


def tone_from_ratio(value: float, warning: float, critical: float) -> str:
    if value <= critical:
        return "critical"
    if value <= warning:
        return "warning"
    return "positive"


def tone_from_score(value: float, warning: float, critical: float) -> str:
    if value < critical:
        return "critical"
    if value < warning:
        return "warning"
    return "positive"


def top_n(items: list[dict[str, Any]], key: str, limit: int = 5, reverse: bool = True) -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: item.get(key, 0), reverse=reverse)[:limit]


def rows_between(df: pd.DataFrame, start_row: int, end_row: int | None = None) -> list[list[str]]:
    end = end_row if end_row is not None else len(df)
    output: list[list[str]] = []
    for idx in range(start_row, end):
        row = [text(value) for value in df.iloc[idx].tolist()]
        if any(cell for cell in row):
            output.append(row)
    return output


def build_mbb_report() -> dict[str, Any]:
    filename = "1. BÁO CÁO MBB_HUNG.xlsx"
    overview_df = load_sheet(filename, "Kết quả chung")
    comparison_df = load_sheet(filename, "So sánh các tỉnh")
    detail_df = load_sheet(filename, "Kết quả chi tiết")
    qos_note_df = load_sheet(filename, "Giải trình QoS")
    plan_df = load_sheet(filename, "Dự kiến tuần 30")
    feedback_df = load_sheet(filename, "Phản ánh khách hàng (PAKH)")
    qoe_note_df = load_sheet(filename, "Giải trình QoE")

    overview_rows = []
    for row_index in range(4, len(overview_df)):
        unit = text(overview_df.iat[row_index, 1])
        if unit:
            overview_rows.append(
                {
                    "unit": unit,
                    "qos": percent(overview_df.iat[row_index, 2]) or 0,
                    "qoe": percent(overview_df.iat[row_index, 3]) or 0,
                }
            )

    national = next(item for item in overview_rows if item["unit"] == "Toàn quốc")
    tay_ninh = next(item for item in overview_rows if item["unit"] == "Tây Ninh")

    comparison = []
    for row_index in range(3, len(comparison_df)):
        province = text(comparison_df.iat[row_index, 0])
        if province:
            comparison.append(
                {
                    "label": province,
                    "qosText": text(comparison_df.iat[row_index, 1]),
                    "qoeText": text(comparison_df.iat[row_index, 2]),
                    "value": last_number(comparison_df.iat[row_index, 1]) or 0,
                }
            )

    detail_groups: list[dict[str, Any]] = []
    current_group: dict[str, Any] | None = None
    for row_index in range(3, len(detail_df)):
        group_name = text(detail_df.iat[row_index, 1])
        component_name = text(detail_df.iat[row_index, 2])
        if group_name:
            current_group = {
                "name": group_name,
                "scoreText": text(detail_df.iat[row_index, 5]),
                "scoreValue": percent(detail_df.iat[row_index, 5]) or 0,
                "rating": text(detail_df.iat[row_index, 6]),
                "rank": text(detail_df.iat[row_index, 7]),
                "items": [],
            }
            detail_groups.append(current_group)
        if current_group and component_name:
            current_group["items"].append(
                {
                    "name": component_name,
                    "value": text(detail_df.iat[row_index, 3]),
                }
            )

    qos_actions = []
    for row_index in range(4, len(qos_note_df)):
        area = text(qos_note_df.iat[row_index, 0])
        if area:
            qos_actions.append(
                {
                    "area": area,
                    "station": text(qos_note_df.iat[row_index, 1]),
                    "cause": text(qos_note_df.iat[row_index, 2]),
                    "status": text(qos_note_df.iat[row_index, 3]),
                }
            )

    next_week = []
    for row_index in range(3, len(plan_df)):
        area = text(plan_df.iat[row_index, 0])
        if area:
            next_week.append(
                {
                    "Khu vực": area,
                    "Trạm": text(plan_df.iat[row_index, 1]),
                    "Nguyên nhân": text(plan_df.iat[row_index, 2]),
                    "Hướng xử lý": text(plan_df.iat[row_index, 3]),
                }
            )

    feedback_items = []
    feedback_total = 0
    for row_index in range(2, len(feedback_df)):
        item = text(feedback_df.iat[row_index, 1])
        count = number(feedback_df.iat[row_index, 2])
        if item and count is not None:
            if "Tổng số lượng phản ánh" in item:
                feedback_total = int(count)
            feedback_items.append(
                {
                    "label": item,
                    "value": int(count),
                }
            )

    qoe_notes = []
    for row_index in range(2, len(qoe_note_df)):
        area = text(qoe_note_df.iat[row_index, 0])
        if area:
            qoe_notes.append(
                {
                    "area": area,
                    "station": text(qoe_note_df.iat[row_index, 1]),
                    "cause": text(qoe_note_df.iat[row_index, 2]),
                    "status": text(qoe_note_df.iat[row_index, 3]),
                }
            )

    qoe_gap = tay_ninh["qoe"] - national["qoe"]
    summary = (
        f"Tây Ninh đạt QoS {pct(tay_ninh['qos'])} và QoE {pct(tay_ninh['qoe'])}. "
        f"QoE thấp hơn trung bình toàn quốc {abs(qoe_gap):.2f} điểm."
    )

    insights = [
        f"Cả MBB QoS và MBB QoE đều được đánh giá Đạt; xếp hạng lần lượt {detail_groups[0]['rank']} và {detail_groups[1]['rank']}.",
        f"Ghi nhận {feedback_total} phản ánh khách hàng, trong đó {feedback_items[2]['value']} phản ánh còn hạn xử lý trong tuần tới.",
        f"Kế hoạch tuần 30 tập trung vào {', '.join(item['Khu vực'] for item in next_week[:4])}.",
    ]

    return {
        "id": "mbb",
        "group": "service",
        "title": "Chất lượng MBB",
        "kicker": "Di động băng rộng",
        "tone": tone_from_score(tay_ninh["qoe"], 99, 98),
        "summary": summary,
        "metrics": [
            {"label": "QoS Tây Ninh", "value": pct(tay_ninh["qos"]), "tone": tone_from_score(tay_ninh["qos"], 99, 98)},
            {"label": "QoE Tây Ninh", "value": pct(tay_ninh["qoe"]), "tone": tone_from_score(tay_ninh["qoe"], 99, 98)},
            {"label": "QoE Toàn quốc", "value": pct(national["qoe"]), "tone": "info"},
            {"label": "PAKH tiếp nhận", "value": whole(feedback_total), "tone": "info"},
        ],
        "insights": insights,
        "chart": {
            "title": "So sánh kết quả các tỉnh",
            "items": [
                {
                    "label": item["label"],
                    "value": item["value"],
                    "display": item["qosText"],
                    "note": item["qoeText"],
                    "tone": "positive" if "Hạng 01" in item["qosText"] else "info",
                }
                for item in comparison
            ],
        },
        "table": {
            "title": "Kế hoạch tuần 30",
            "columns": ["Khu vực", "Trạm", "Nguyên nhân", "Hướng xử lý"],
            "rows": next_week,
        },
        "list": {
            "title": "Điểm giải trình nổi bật",
            "items": [
                f"{item['area']}: {item['cause']}" for item in qos_actions[:3]
            ] + [
                f"{item['area']}: {item['cause']}" for item in qoe_notes[:2]
            ],
        },
        "raw": {
            "detailGroups": detail_groups,
            "feedback": feedback_items,
        },
    }


def build_fbb_report() -> dict[str, Any]:
    filename = "2. BÁO CÁO FBB_BAO.xlsx"
    overview_df = load_sheet(filename, "Thông tin chung")
    loss_df = load_sheet(filename, "Suy hao thuê bao")
    qos_df = load_sheet(filename, "Chi tiết QoS FBB")
    qoe_df = load_sheet(filename, "Chi tiết QoE FBB")

    qos_total = percent(overview_df.iat[1, 5]) or 0
    qoe_total = percent(overview_df.iat[7, 5]) or 0
    qos_rating = text(overview_df.iat[1, 6])
    qoe_rating = text(overview_df.iat[7, 6])

    loss_rows = []
    for row_index in range(2, len(loss_df)):
        team = text(loss_df.iat[row_index, 1])
        center = text(loss_df.iat[row_index, 2])
        loss_ratio = percent(loss_df.iat[row_index, 4])
        if team and center and loss_ratio is not None:
            loss_rows.append(
                {
                    "THT": team,
                    "TTVT": center,
                    "Thuê bao suy hao": int(number(loss_df.iat[row_index, 3]) or 0),
                    "Tỷ lệ suy hao": pct(loss_ratio, 3),
                    "ratioValue": loss_ratio,
                    "Đánh giá": text(loss_df.iat[row_index, 6]),
                }
            )

    worst_losses = top_n(loss_rows, "ratioValue", 5)

    qos_narrative = text(qos_df.iat[1, 0])
    issue_count_match = re.search(r"(\d+)\s+phiếu", qos_narrative)
    issue_count = int(issue_count_match.group(1)) if issue_count_match else 0

    uplink_issue = {
        "Ngày": text(qos_df.iat[5, 0]),
        "OLT": text(qos_df.iat[5, 1]),
        "Uplink nghẽn": whole(number(qos_df.iat[5, 3])),
        "Nguyên nhân": text(qos_df.iat[5, 4]),
        "Giải pháp": text(qos_df.iat[5, 5]),
        "Tình trạng": text(qos_df.iat[5, 6]),
    }

    qos_by_team = []
    for row_index in range(9, 17):
        team = text(qos_df.iat[row_index, 1])
        score = percent(qos_df.iat[row_index, 2])
        if team and score is not None:
            qos_by_team.append(
                {
                    "label": team,
                    "value": score,
                    "display": pct(score),
                    "note": text(qos_df.iat[row_index, 3]),
                    "tone": "warning",
                }
            )

    qoe_by_team = []
    for row_index in range(2, 10):
        team = text(qoe_df.iat[row_index, 1])
        score = percent(qoe_df.iat[row_index, 2])
        if team and score is not None:
            qoe_by_team.append(
                {
                    "THT": team,
                    "FBB QoE": pct(score),
                    "Đánh giá": text(qoe_df.iat[row_index, 3]),
                }
            )

    worst_team = min(qos_by_team, key=lambda item: item["value"])
    summary = (
        f"FBB QoS đạt {pct(qos_total)} và không đạt mục tiêu, trong khi FBB QoE đạt {pct(qoe_total)}."
    )

    return {
        "id": "fbb",
        "group": "service",
        "title": "Chất lượng FBB",
        "kicker": "Cố định băng rộng",
        "tone": "warning",
        "summary": summary,
        "metrics": [
            {"label": "FBB QoS", "value": pct(qos_total), "tone": "warning"},
            {"label": "FBB QoE", "value": pct(qoe_total), "tone": "positive"},
            {"label": "Trạng thái QoS", "value": qos_rating, "tone": "warning"},
            {"label": "Phiếu suy hao", "value": whole(issue_count), "tone": "critical"},
        ],
        "insights": [
            f"Tất cả 7 tổ hạ tầng đều chưa đạt QoS; thấp nhất là {worst_team['label']} với {worst_team['display']}.",
            f"Điểm nghẽn BRCĐ nổi bật tại OLT {uplink_issue['OLT']} do {uplink_issue['Nguyên nhân'].lower()}.",
            f"QoE vẫn đạt {qoe_rating.lower()} trên toàn tỉnh, giữ mặt bằng từ {pct(min(percent(row['FBB QoE']) for row in qoe_by_team if row['FBB QoE'] != '-'))} trở lên.",
        ],
        "chart": {
            "title": "Top TTVT có tỷ lệ suy hao cao",
            "items": [
                {
                    "label": item["TTVT"],
                    "value": item["ratioValue"],
                    "display": item["Tỷ lệ suy hao"],
                    "note": item["THT"],
                    "tone": "critical" if index < 2 else "warning",
                }
                for index, item in enumerate(worst_losses)
            ],
        },
        "table": {
            "title": "FBB QoE theo tổ hạ tầng",
            "columns": ["THT", "FBB QoE", "Đánh giá"],
            "rows": qoe_by_team,
        },
        "list": {
            "title": "Điểm cần xử lý",
            "items": [
                qos_narrative.split("\n")[0],
                uplink_issue["Giải pháp"],
                "Đôn đốc xử lý suy hao thuê bao và tách port > 50 thuê bao.",
            ],
        },
        "raw": {
            "lossRows": loss_rows,
            "qosByTeam": qos_by_team,
        },
    }


def build_mytv_report() -> dict[str, Any]:
    filename = "3. BÁO CÁO MYTV_TÂN.xlsx"
    df = load_sheet(filename, "Sheet1")

    qos_score = percent(df.iat[1, 6]) or 0
    qos_rank = text(df.iat[1, 7])
    qoe_score = percent(df.iat[5, 6]) or 0
    qoe_rank = text(df.iat[5, 7])

    qos_items = []
    for row_index in range(1, 5):
        label = text(df.iat[row_index, 3])
        value = text(df.iat[row_index, 4])
        if label:
            qos_items.append({"label": label, "value": value})

    qoe_items = []
    for row_index in range(5, 15):
        label = text(df.iat[row_index, 3])
        value = text(df.iat[row_index, 4])
        if label:
            qoe_items.append({"label": label, "value": value})

    component_table = [
        {"Nhóm": "QoS", "Chỉ số": item["label"], "Kết quả": item["value"]} for item in qos_items
    ] + [
        {"Nhóm": "QoE", "Chỉ số": item["label"], "Kết quả": item["value"]} for item in qoe_items[:5]
    ]

    return {
        "id": "mytv",
        "group": "service",
        "title": "Chất lượng MyTV",
        "kicker": "Truyền hình số",
        "tone": tone_from_score(qos_score, 99, 98),
        "summary": (
            f"MyTV QoS đạt {pct(qos_score)} xếp hạng {qos_rank}, trong khi MyTV QoE chạm {pct(qoe_score)} và đứng hạng {qoe_rank}."
        ),
        "metrics": [
            {"label": "MyTV QoS", "value": pct(qos_score), "tone": tone_from_score(qos_score, 99, 98)},
            {"label": "Xếp hạng QoS", "value": qos_rank, "tone": "warning"},
            {"label": "MyTV QoE", "value": pct(qoe_score), "tone": "positive"},
            {"label": "Xếp hạng QoE", "value": qoe_rank, "tone": "positive"},
        ],
        "insights": [
            "QoE đang giữ mức tối đa 100%, toàn bộ 10 chỉ số thành phần đều đạt tuyệt đối.",
            f"QoS còn dư địa cải thiện ở chỉ số Tỷ lệ mất gói với kết quả {qos_items[2]['value']}.",
            "Các chỉ số OTT Live/TVoD về độ trễ và rung pha vẫn nằm trong vùng an toàn.",
        ],
        "chart": {
            "title": "Các nhóm chỉ số MyTV",
            "items": [
                {
                    "label": "MyTV QoS",
                    "value": qos_score,
                    "display": pct(qos_score),
                    "note": f"Hạng {qos_rank}",
                    "tone": tone_from_score(qos_score, 99, 98),
                },
                {
                    "label": "MyTV QoE",
                    "value": qoe_score,
                    "display": pct(qoe_score),
                    "note": f"Hạng {qoe_rank}",
                    "tone": "positive",
                },
            ],
        },
        "table": {
            "title": "Chi tiết chỉ số thành phần",
            "columns": ["Nhóm", "Chỉ số", "Kết quả"],
            "rows": component_table,
        },
        "list": {
            "title": "Điểm nhấn",
            "items": [
                "5 chỉ số thành phần QoE đầu tiên đều đạt 100%.",
                "Tỷ lệ nghẽn kết nối QoS đạt 100%.",
                "Tỷ lệ mất gói OTT Live/TVoD cần tiếp tục theo dõi.",
            ],
        },
    }


def build_mll_report() -> dict[str, Any]:
    filename = "4. BÁO CÁO MLL_KHANH.xlsx"
    weekly_df = load_sheet(filename, "BC MLL tuần")
    ontime_df = load_sheet(filename, "XLSC Đúng hạn")
    incident_df = load_sheet(filename, "Trạm theo NV")
    trend_df = load_sheet(filename, "TH")

    category_headers = []
    for column_index in range(3, weekly_df.shape[1]):
        parent = text(weekly_df.iat[1, column_index])
        child = text(weekly_df.iat[2, column_index])
        label = f"{parent} {child}".strip()
        if label:
            category_headers.append((column_index, label))

    province_total = 0.0
    cause_totals = []
    for column_index, label in category_headers:
        value = number(weekly_df.iat[3, column_index]) or 0
        province_total += value
        cause_totals.append({"label": label, "value": value})

    team_totals = []
    for row_index in range(4, 11):
        team = text(weekly_df.iat[row_index, 1])
        if not team:
            continue
        total = sum((number(weekly_df.iat[row_index, column_index]) or 0) for column_index, _ in category_headers)
        team_totals.append(
            {
                "label": team,
                "value": total,
                "display": f"{decimal(total)} phút",
                "note": f"{whole(number(weekly_df.iat[row_index, 2]))} BTS",
                "tone": "critical" if total > 500 else "warning",
            }
        )

    ontime_rows = []
    for row_index in range(4, 11):
        team = text(ontime_df.iat[row_index, 1])
        rate = percent(ontime_df.iat[row_index, 5])
        if team and rate is not None:
            ontime_rows.append(
                {
                    "THT": team,
                    "Tỷ lệ hoàn thành": pct(rate),
                    "Sự cố > 120 phút": whole(number(ontime_df.iat[row_index, 3])),
                    "Đánh giá": text(ontime_df.iat[row_index, 7]),
                    "rateValue": rate,
                }
            )

    worst_ontime = min(ontime_rows, key=lambda item: item["rateValue"])

    incidents = []
    for row_index in range(1, len(incident_df)):
        station = text(incident_df.iat[row_index, 1])
        duration = number(incident_df.iat[row_index, 6])
        if station and duration is not None:
            incidents.append(
                {
                    "BTS/Node": station,
                    "Loại trạm": text(incident_df.iat[row_index, 2]),
                    "Máy nổ": text(incident_df.iat[row_index, 3]),
                    "Bắt đầu": text(incident_df.iat[row_index, 4]),
                    "Kết thúc": text(incident_df.iat[row_index, 5]),
                    "MLL thực tế": f"{decimal(duration)} phút",
                    "durationValue": duration,
                }
            )

    top_incidents = top_n(incidents, "durationValue", 5)
    top_cause = max(cause_totals, key=lambda item: item["value"])

    monthly_totals = []
    month_headers = [text(trend_df.iat[1, column_index]) for column_index in range(2, 8)]
    province_trend_values = [number(trend_df.iat[2, column_index]) or 0 for column_index in range(2, 8)]
    for month, value in zip(month_headers, province_trend_values, strict=True):
        monthly_totals.append(
            {
                "label": month,
                "value": value,
                "display": whole(value),
                "note": "phút MLL",
                "tone": "info",
            }
        )

    return {
        "id": "mll",
        "group": "operation",
        "title": "Mất liên lạc mạng di động",
        "kicker": "MLL tuần 28",
        "tone": "warning",
        "summary": (
            f"Tổng thời gian MLL quy đổi tuần 28 là {whole(province_total)} phút; nguyên nhân lớn nhất là {top_cause['label'].lower()}."
        ),
        "metrics": [
            {"label": "MLL toàn tỉnh", "value": f"{whole(province_total)} phút", "tone": "warning"},
            {"label": "Nguyên nhân lớn nhất", "value": top_cause["label"], "tone": "critical"},
            {"label": "Tỷ lệ đúng hạn thấp nhất", "value": worst_ontime["Tỷ lệ hoàn thành"], "tone": "warning"},
            {"label": "Tổ cần chú ý", "value": worst_ontime["THT"], "tone": "critical"},
        ],
        "insights": [
            f"Đội có tổng MLL cao nhất là {max(team_totals, key=lambda item: item['value'])['label']}.",
            f"Tổ {worst_ontime['THT']} là đơn vị duy nhất không đạt mục tiêu 98% ở chỉ tiêu hoàn thành đúng hạn.",
            f"Sự cố dài nhất tuần nằm trên {top_incidents[0]['BTS/Node']} với {top_incidents[0]['MLL thực tế']}.",
        ],
        "chart": {
            "title": "MLL theo tổ hạ tầng",
            "items": sorted(team_totals, key=lambda item: item["value"], reverse=True),
        },
        "table": {
            "title": "Sự cố MLL kéo dài nổi bật",
            "columns": ["BTS/Node", "Loại trạm", "Máy nổ", "Bắt đầu", "Kết thúc", "MLL thực tế"],
            "rows": [{key: row[key] for key in ["BTS/Node", "Loại trạm", "Máy nổ", "Bắt đầu", "Kết thúc", "MLL thực tế"]} for row in top_incidents],
        },
        "list": {
            "title": "Xu hướng 6 tháng",
            "items": [f"{item['label']}: {item['display']} phút" for item in monthly_totals],
        },
        "raw": {
            "ontimeRows": ontime_rows,
        },
    }


def build_ispeed_report() -> dict[str, Any]:
    filename = "5. BÁO CÁO ISPEED_QUOC.xlsx"
    overview_df = load_sheet(filename, "Báo cáo")
    sum_df = load_sheet(filename, "SUM")

    team_rows = []
    for row_index in range(1, 8):
        team = text(overview_df.iat[row_index, 1])
        if not team:
            continue
        ispeed_ratio = percent(overview_df.iat[row_index, 5]) or 0
        speedtest_ratio = percent(overview_df.iat[row_index, 8]) or 0
        ratio_5g = percent(overview_df.iat[row_index, 10]) or 0
        team_rows.append(
            {
                "label": team,
                "value": ispeed_ratio,
                "display": pct(ispeed_ratio),
                "note": f"Speedtest {pct(speedtest_ratio)} | 5G {pct(ratio_5g)}",
                "tone": tone_from_ratio(ispeed_ratio, 45, 30),
                "ispeedDone": int(number(overview_df.iat[row_index, 4]) or 0),
                "speedtestDone": int(number(overview_df.iat[row_index, 7]) or 0),
                "ratio5g": ratio_5g,
            }
        )

    total_ispeed = int(number(overview_df.iat[8, 4]) or 0)
    total_ispeed_goal = int(number(overview_df.iat[8, 3]) or 0)
    total_speedtest = int(number(overview_df.iat[8, 7]) or 0)
    total_speedtest_goal = int(number(overview_df.iat[8, 6]) or 0)
    total_5g = int(number(overview_df.iat[8, 9]) or 0)
    total_5g_ratio = percent(overview_df.iat[8, 10]) or 0
    date_range = text(overview_df.iat[11, 1])

    averages: dict[str, dict[str, float]] = defaultdict(lambda: {"ispeed": 0.0, "speedtest": 0.0, "count": 0.0})
    for row_index in range(4, len(sum_df)):
        team = text(sum_df.iat[row_index, 1]).replace("Tổ Hạ tầng ", "")
        ispeed_download = number(sum_df.iat[row_index, 7])
        speedtest_download = number(sum_df.iat[row_index, 9])
        if team and ispeed_download is not None and speedtest_download is not None:
            averages[team]["ispeed"] += ispeed_download
            averages[team]["speedtest"] += speedtest_download
            averages[team]["count"] += 1

    average_rows = []
    for team, values in averages.items():
        if values["count"] <= 0:
            continue
        average_rows.append(
            {
                "THT": team,
                "i-Speed DL TB": f"{decimal(values['ispeed'] / values['count'])} Mbps",
                "Speedtest DL TB": f"{decimal(values['speedtest'] / values['count'])} Mbps",
            }
        )
    average_rows = sorted(
        average_rows,
        key=lambda item: number(item["Speedtest DL TB"]) or 0,
        reverse=True,
    )

    weakest_team = min(team_rows, key=lambda item: item["value"])

    return {
        "id": "ispeed",
        "group": "operation",
        "title": "Tiến độ đo kiểm i-Speed",
        "kicker": "Đo kiểm chất lượng vô tuyến",
        "tone": "critical",
        "summary": (
            f"Đã hoàn thành {whole(total_ispeed)}/{whole(total_ispeed_goal)} mẫu i-Speed và "
            f"{whole(total_speedtest)}/{whole(total_speedtest_goal)} mẫu Speedtest trong giai đoạn {date_range}."
        ),
        "metrics": [
            {"label": "Tỷ lệ i-Speed", "value": pct(percent(overview_df.iat[8, 5]) or 0), "tone": "critical"},
            {"label": "Tỷ lệ Speedtest", "value": pct(percent(overview_df.iat[8, 8]) or 0), "tone": "critical"},
            {"label": "Mẫu 5G", "value": whole(total_5g), "tone": "info"},
            {"label": "Tỷ lệ 5G", "value": pct(total_5g_ratio), "tone": "warning"},
        ],
        "insights": [
            f"Đức Hòa đang thấp nhất với tiến độ i-Speed {weakest_team['display']}.",
            f"Tổ có tỷ lệ 5G cao nhất là {max(team_rows, key=lambda item: item['ratio5g'])['label']} ({pct(max(team_rows, key=lambda item: item['ratio5g'])['ratio5g'])}).",
            "Khoảng cách lớn giữa số mẫu cần đo và số mẫu hoàn thành cho thấy cần siết lịch đo theo ngày.",
        ],
        "chart": {
            "title": "Tiến độ i-Speed theo tổ",
            "items": sorted(team_rows, key=lambda item: item["value"], reverse=True),
        },
        "table": {
            "title": "Tốc độ download trung bình",
            "columns": ["THT", "i-Speed DL TB", "Speedtest DL TB"],
            "rows": average_rows,
        },
        "list": {
            "title": "Điểm cần ưu tiên",
            "items": [
                f"Bù tiến độ cho {', '.join(item['label'] for item in sorted(team_rows, key=lambda row: row['value'])[:3])}.",
                "Nâng tỷ lệ mẫu 5G vượt ngưỡng 60% ở các tổ còn thấp.",
                "Theo dõi chặt chẽ nhóm chưa có dữ liệu ở một số lượt đo đầu tuần.",
            ],
        },
        "raw": {
            "totals": {
                "ispeedDone": total_ispeed,
                "ispeedGoal": total_ispeed_goal,
                "speedtestDone": total_speedtest,
                "speedtestGoal": total_speedtest_goal,
                "sample5g": total_5g,
            }
        },
    }


def build_5s_report() -> dict[str, Any]:
    filename = "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx"
    df = load_sheet(filename, "Sheet1")

    def extract_progress(start_row: int, total_row: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        rows = []
        for row_index in range(start_row, total_row):
            team = text(df.iat[row_index, 1]).strip()
            value = percent(df.iat[row_index, 5])
            if team and value is not None:
                rows.append(
                    {
                        "label": team,
                        "value": value,
                        "display": pct(value),
                        "note": f"{whole(number(df.iat[row_index, 3]))}/{whole(number(df.iat[row_index, 2]))}",
                        "tone": tone_from_ratio(value, 35, 15),
                    }
                )
        total_value = percent(df.iat[total_row, 5]) or 0
        total = {
            "totalSites": int(number(df.iat[total_row, 2]) or 0),
            "done": int(number(df.iat[total_row, 3]) or 0),
            "pending": int(number(df.iat[total_row, 4]) or 0),
            "ratio": total_value,
        }
        return rows, total

    house_rows, house_total = extract_progress(2, 9)
    ac_rows, ac_total = extract_progress(15, 22)
    ap_rows, ap_total = extract_progress(27, 34)
    survey_rows, survey_total = extract_progress(39, 46)

    return {
        "id": "5s",
        "group": "operation",
        "title": "Tiến độ 5S nhà trạm",
        "kicker": "5S, máy lạnh, AP/OTB",
        "tone": "critical",
        "summary": (
            f"5S nhà trạm mới đạt {pct(house_total['ratio'])} ({whole(house_total['done'])}/{whole(house_total['totalSites'])} trạm). "
            f"Vệ sinh máy lạnh đạt {pct(ac_total['ratio'])}, trong khi AP/OTB đạt {pct(ap_total['ratio'])}."
        ),
        "metrics": [
            {"label": "5S nhà trạm", "value": pct(house_total["ratio"]), "tone": "critical"},
            {"label": "Vệ sinh máy lạnh", "value": pct(ac_total["ratio"]), "tone": "warning"},
            {"label": "5S AP/OTB", "value": pct(ap_total["ratio"]), "tone": "positive" if ap_total["ratio"] >= 50 else "warning"},
            {"label": "Khảo sát phụ trợ", "value": pct(survey_total["ratio"]), "tone": "positive"},
        ],
        "insights": [
            f"Tổ thấp nhất ở 5S nhà trạm là {min(house_rows, key=lambda item: item['value'])['label']} ({min(house_rows, key=lambda item: item['value'])['display']}).",
            f"Vệ sinh máy lạnh đang chậm nhất tại {min(ac_rows, key=lambda item: item['value'])['label']}.",
            f"Khảo sát phụ trợ đã hoàn thành 100% trên toàn bộ {whole(survey_total['totalSites'])} trạm.",
        ],
        "chart": {
            "title": "Tiến độ 5S nhà trạm theo tổ",
            "items": sorted(house_rows, key=lambda item: item["value"], reverse=True),
        },
        "table": {
            "title": "Tổng hợp 3 chương trình song song",
            "columns": ["Hạng mục", "Đã thực hiện", "Tổng", "Tỷ lệ"],
            "rows": [
                {"Hạng mục": "Vệ sinh máy lạnh", "Đã thực hiện": whole(ac_total["done"]), "Tổng": whole(ac_total["totalSites"]), "Tỷ lệ": pct(ac_total["ratio"])},
                {"Hạng mục": "5S AP/OTB", "Đã thực hiện": whole(ap_total["done"]), "Tổng": whole(ap_total["totalSites"]), "Tỷ lệ": pct(ap_total["ratio"])},
                {"Hạng mục": "Khảo sát phụ trợ", "Đã thực hiện": whole(survey_total["done"]), "Tổng": whole(survey_total["totalSites"]), "Tỷ lệ": pct(survey_total["ratio"])},
            ],
        },
        "list": {
            "title": "Điểm hành động",
            "items": [
                f"Đẩy nhanh tiến độ tại {', '.join(item['label'] for item in sorted(house_rows, key=lambda row: row['value'])[:3])}.",
                "Tách riêng các đội có tiến độ máy lạnh dưới 15% để bám theo tuần.",
                "Tiếp tục khai thác quán tính tốt của AP/OTB và khảo sát phụ trợ.",
            ],
        },
    }


def build_xlsc_report() -> dict[str, Any]:
    filename = "7.BÁO CÁO XLSC_TUẤN.xlsx"
    mane_df = load_sheet(filename, "XLSC MANE")
    access_df = load_sheet(filename, "XLSC ACCESS")
    radio_df = load_sheet(filename, "XLSC VÔ TUYẾN")
    overdue_df = load_sheet(filename, "PHIẾU QUÁ HẠN")

    def summary_row(df: pd.DataFrame) -> dict[str, Any]:
        return {
            "Tổng giao": int(number(df.iat[9, 1]) or 0),
            "Hoàn thành": int(number(df.iat[9, 2]) or 0),
            "Đúng hạn": percent(df.iat[9, 5]) or 0,
            "Tồn quá hạn": int(number(df.iat[9, 8]) or 0),
            "Tỷ lệ tồn quá hạn": percent(df.iat[9, 9]) or 0,
        }

    summaries = {
        "MANE": summary_row(mane_df),
        "ACCESS": summary_row(access_df),
        "Vô tuyến": summary_row(radio_df),
    }

    chart_items = []
    for network_name, summary in summaries.items():
        chart_items.append(
            {
                "label": network_name,
                "value": summary["Đúng hạn"],
                "display": pct(summary["Đúng hạn"]),
                "note": f"Tồn quá hạn {whole(summary['Tồn quá hạn'])}",
                "tone": "warning" if summary["Tồn quá hạn"] > 0 else "positive",
            }
        )

    overdue_records = []
    current_type = ""
    header_seen = False
    for row_index in range(len(overdue_df)):
        first_cell = text(overdue_df.iat[row_index, 0])
        if "phiếu quá hạn" in first_cell.lower() and "Mã phiếu" not in first_cell:
            current_type = first_cell.split("—")[0].strip()
            header_seen = False
            continue
        if first_cell == "Mã phiếu":
            header_seen = True
            continue
        if header_seen and first_cell:
            team_name = text(overdue_df.iat[row_index, 8]) or "Chưa gán THT"
            overdue_records.append(
                {
                    "Loại mạng": current_type,
                    "Mã phiếu": first_cell,
                    "Trạng thái": text(overdue_df.iat[row_index, 1]),
                    "Cảnh báo": text(overdue_df.iat[row_index, 2]),
                    "Bắt đầu": text(overdue_df.iat[row_index, 3]),
                    "Kết thúc": text(overdue_df.iat[row_index, 4]),
                    "Tổ Hạ tầng": team_name,
                }
            )

    overdue_by_team = Counter(record["Tổ Hạ tầng"] for record in overdue_records)
    table_rows = [
        {
            "Tổ Hạ tầng": team,
            "Phiếu quá hạn": whole(count),
        }
        for team, count in overdue_by_team.most_common()
    ]

    total_overdue = sum(overdue_by_team.values())
    biggest_bucket = max(summaries.items(), key=lambda item: item[1]["Tồn quá hạn"])

    return {
        "id": "xlsc",
        "group": "operation",
        "title": "Xử lý sự cố tuần",
        "kicker": "XLSC MANE, ACCESS, Vô tuyến",
        "tone": "warning",
        "summary": (
            f"Tổng cộng có {whole(total_overdue)} phiếu quá hạn, trong đó nhóm {biggest_bucket[0]} chiếm tỷ trọng lớn nhất."
        ),
        "metrics": [
            {"label": "MANE đúng hạn", "value": pct(summaries['MANE']['Đúng hạn']), "tone": "positive"},
            {"label": "ACCESS đúng hạn", "value": pct(summaries['ACCESS']['Đúng hạn']), "tone": "positive"},
            {"label": "Vô tuyến đúng hạn", "value": pct(summaries['Vô tuyến']['Đúng hạn']), "tone": "warning"},
            {"label": "Phiếu quá hạn", "value": whole(total_overdue), "tone": "critical"},
        ],
        "insights": [
            f"Vô tuyến đang có nhiều phiếu tồn quá hạn nhất với {whole(summaries['Vô tuyến']['Tồn quá hạn'])} phiếu.",
            f"Tổ có số phiếu quá hạn nhiều nhất là {table_rows[0]['Tổ Hạ tầng']}.",
            "MANE và ACCESS giữ mặt bằng đúng hạn trên 97%, nhưng vẫn cần kéo nốt các tồn quá hạn mở.",
        ],
        "chart": {
            "title": "Tỷ lệ hoàn thành đúng hạn theo nhóm mạng",
            "items": chart_items,
        },
        "table": {
            "title": "Phiếu quá hạn theo tổ hạ tầng",
            "columns": ["Tổ Hạ tầng", "Phiếu quá hạn"],
            "rows": table_rows,
        },
        "list": {
            "title": "Điểm cần bám",
            "items": [
                "Ưu tiên bóc 36 phiếu quá hạn của lớp vô tuyến.",
                "Giữ trạng thái không phát sinh tồn quá hạn mới ở MANE và ACCESS.",
                "Rà lại các phiếu Kiến Tường, Đức Hòa và Tân An xuất hiện nhiều trong danh sách quá hạn.",
            ],
        },
        "raw": {
            "totalOverdue": total_overdue,
        },
    }


def build_appendix_report() -> dict[str, Any]:
    filename = "PHỤ LỤC 1.xlsx"
    df = load_sheet(filename, "Báo Cáo Sự Cố Trạm")

    incidents = []
    causes = Counter()
    statuses = Counter()
    for row_index in range(3, len(df)):
        station = text(df.iat[row_index, 1])
        duration = number(df.iat[row_index, 3])
        cause = text(df.iat[row_index, 4])
        if station and duration is not None:
            causes[cause] += 1
            statuses[text(df.iat[row_index, 9])] += 1
            incidents.append(
                {
                    "Tên NE": station,
                    "Thời gian sự cố": text(df.iat[row_index, 2]),
                    "MLL (phút)": whole(duration),
                    "Nguyên nhân": cause,
                    "Khắc phục": text(df.iat[row_index, 6]),
                    "Trạng thái": text(df.iat[row_index, 9]),
                    "durationValue": duration,
                }
            )

    incidents = top_n(incidents, "durationValue", 6)
    cause_items = [
        {
            "label": cause,
            "value": count,
            "display": whole(count),
            "note": "sự cố",
            "tone": "warning" if index == 0 else "info",
        }
        for index, (cause, count) in enumerate(causes.most_common(5))
    ]

    return {
        "id": "appendix",
        "group": "operation",
        "title": "Giải trình sự cố trạm",
        "kicker": "Phụ lục MLL",
        "tone": "info",
        "summary": (
            f"Phụ lục sự cố cho thấy nhóm nguyên nhân xuất hiện nhiều nhất là {cause_items[0]['label'].lower()}."
        ),
        "metrics": [
            {"label": "Số sự cố ghi nhận", "value": whole(sum(causes.values())), "tone": "info"},
            {"label": "Nguyên nhân nhiều nhất", "value": cause_items[0]["label"], "tone": "warning"},
            {"label": "Đã xử lý", "value": whole(statuses.get('Đã xử lý', 0)), "tone": "positive"},
            {"label": "Top MLL", "value": f"{incidents[0]['MLL (phút)']} phút", "tone": "warning"},
        ],
        "insights": [
            "Nguồn điện và truyền dẫn là hai lớp nguyên nhân lặp lại nhiều nhất trong phụ lục.",
            f"Sự cố lớn nhất hiện diện trên {incidents[0]['Tên NE']}.",
            "Các khuyến nghị xử lý đều nghiêng về kiểm tra định kỳ nguồn điện, máy nổ và lớp truyền dẫn.",
        ],
        "chart": {
            "title": "Nhóm nguyên nhân lặp lại nhiều",
            "items": cause_items,
        },
        "table": {
            "title": "Các sự cố cần xem lại",
            "columns": ["Tên NE", "Thời gian sự cố", "MLL (phút)", "Nguyên nhân", "Khắc phục", "Trạng thái"],
            "rows": [{key: row[key] for key in ["Tên NE", "Thời gian sự cố", "MLL (phút)", "Nguyên nhân", "Khắc phục", "Trạng thái"]} for row in incidents],
        },
        "list": {
            "title": "Khuyến nghị",
            "items": [
                "Kiểm tra định kỳ máy nổ, accu đề và nguồn AC ở các trạm có lặp sự cố.",
                "Rà soát lớp truyền dẫn SW lớp trên tại các khu vực Gò Dầu và Đức Hòa.",
                "Chuẩn hóa mẫu giải trình để bám sát nguyên nhân chi tiết và bước khắc phục.",
            ],
        },
    }


def build_dashboard_data() -> dict[str, Any]:
    mbb = build_mbb_report()
    fbb = build_fbb_report()
    mytv = build_mytv_report()
    mll = build_mll_report()
    ispeed = build_ispeed_report()
    progress_5s = build_5s_report()
    xlsc = build_xlsc_report()
    appendix = build_appendix_report()

    all_reports = [mbb, fbb, mytv, mll, ispeed, progress_5s, xlsc, appendix]

    hero_stats = [
        {"label": "Nguồn Excel", "value": "8", "tone": "info"},
        {"label": "Phiếu quá hạn", "value": whole(xlsc["raw"]["totalOverdue"]), "tone": "critical"},
        {
            "label": "Mẫu i-Speed xong",
            "value": whole(ispeed["raw"]["totals"]["ispeedDone"]),
            "tone": "warning",
        },
        {"label": "5S nhà trạm", "value": progress_5s["metrics"][0]["value"], "tone": "warning"},
    ]

    signal_bands = [
        {"label": "MBB QoE", "value": mbb["metrics"][1]["value"], "tone": mbb["metrics"][1]["tone"], "note": "Di động băng rộng"},
        {"label": "FBB QoS", "value": fbb["metrics"][0]["value"], "tone": fbb["metrics"][0]["tone"], "note": "Cố định băng rộng"},
        {"label": "MyTV QoE", "value": mytv["metrics"][2]["value"], "tone": mytv["metrics"][2]["tone"], "note": "Truyền hình số"},
        {"label": "MLL toàn tỉnh", "value": mll["metrics"][0]["value"], "tone": mll["metrics"][0]["tone"], "note": "Tuần 28"},
        {"label": "Tiến độ i-Speed", "value": ispeed["metrics"][0]["value"], "tone": ispeed["metrics"][0]["tone"], "note": "01/07 - 17/07"},
        {"label": "Tiến độ 5S", "value": progress_5s["metrics"][0]["value"], "tone": progress_5s["metrics"][0]["tone"], "note": "Quý 3/2026"},
    ]

    action_items = [
        {
            "title": "Điều chuyển tài nguyên 5G tại các điểm tải cao",
            "detail": "MBB tuần 30 đang tập trung Tân Ninh, Cầu Khởi, Thủ Thừa và Gia Lộc để share tải cho 4G.",
            "tone": "warning",
        },
        {
            "title": "Giảm suy hao FBB và mở rộng uplink nghẽn",
            "detail": "2051 phiếu suy hao thuê bao cần được kéo giảm song song với phương án mở rộng uplink 10G tại Gò Đen.HU65.",
            "tone": "critical",
        },
        {
            "title": "Bù tiến độ đo kiểm i-Speed",
            "detail": "Đức Hòa, Tân Châu và Kiến Tường đang là ba đơn vị có tiến độ đo thấp nhất, cần khóa KPI theo ngày.",
            "tone": "critical",
        },
        {
            "title": "Chốt dứt điểm phiếu quá hạn vô tuyến",
            "detail": "Trong 46 phiếu quá hạn, nhóm vô tuyến đang chiếm phần lớn và là điểm nghẽn cần xử lý trước.",
            "tone": "warning",
        },
        {
            "title": "Đẩy 5S nhà trạm tại các tổ chậm",
            "detail": "Gò Dầu, Tân Ninh và Tân Châu có tiến độ 5S thấp nhất, cần tách lịch kiểm tra hiện trường theo cụm.",
            "tone": "warning",
        },
    ]

    sources = [
        {"name": "1. BÁO CÁO MBB_HUNG.xlsx", "tag": "MBB"},
        {"name": "2. BÁO CÁO FBB_BAO.xlsx", "tag": "FBB"},
        {"name": "3. BÁO CÁO MYTV_TÂN.xlsx", "tag": "MyTV"},
        {"name": "4. BÁO CÁO MLL_KHANH.xlsx", "tag": "MLL"},
        {"name": "5. BÁO CÁO ISPEED_QUOC.xlsx", "tag": "i-Speed"},
        {"name": "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx", "tag": "5S"},
        {"name": "7.BÁO CÁO XLSC_TUẤN.xlsx", "tag": "XLSC"},
        {"name": "PHỤ LỤC 1.xlsx", "tag": "Phụ lục"},
    ]

    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "hero": {
            "eyebrow": "VNPT TAY NINH WEEKLY REPORT HUB",
            "title": "Landing page tổng hợp báo cáo tuần từ thư mục data sample",
            "subtitle": "Giao diện gom toàn bộ dữ liệu mẫu MBB, FBB, MyTV, MLL, i-Speed, 5S và XLSC thành một trang theo tông xanh VNPT để theo dõi nhanh chỉ số, điểm nghẽn và kế hoạch xử lý.",
            "stats": hero_stats,
        },
        "signalBands": signal_bands,
        "serviceReports": [mbb, fbb, mytv],
        "operationReports": [mll, ispeed, progress_5s, xlsc, appendix],
        "actionItems": action_items,
        "sources": sources,
    }


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = build_dashboard_data()
    payload = "window.VNPT_REPORT_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT_FILE.write_text(payload, encoding="utf-8")
    print(f"Generated {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
