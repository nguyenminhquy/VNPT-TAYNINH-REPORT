import copy
import json
from pathlib import Path
from typing import Dict, Any

from docx import Document
from docx.document import Document as DocumentType
from openpyxl import load_workbook

# Re‑use helper functions from existing monthly generator
from generate_monthly_report import (
    find_table_by_tag,
    write_table_matrix,
    raw_matrix,
)

# ---------------------------------------------------------------------------
# Configuration – template discovery
# ---------------------------------------------------------------------------
_CUR_DIR = Path(__file__).resolve().parent
_ROOT = _CUR_DIR.resolve().parents[1]
_WEEKLY_TEMPLATE_CANDIDATES = [
    _CUR_DIR / "templates" / "MAT_LIEN_LAC" / "TTHT_BC_KTHT_MLL.docx",
    _ROOT / "templates" / "MAT_LIEN_LAC" / "TTHT_BC_KTHT_MLL.docx",
]
WEEKLY_TEMPLATE = next((p for p in _WEEKLY_TEMPLATE_CANDIDATES if p.is_file()), _WEEKLY_TEMPLATE_CANDIDATES[0])

EXPORT_DIR = _ROOT / "exports"
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Helper – download Excel blobs (mirrors logic in fastapi_cd5.py)
# ---------------------------------------------------------------------------
import httpx
import asyncio
from datetime import datetime

async def _download_excel(blob_url: str, dest: Path, key: str):
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(blob_url)
        resp.raise_for_status()
        dest.write_bytes(resp.content)

# ---------------------------------------------------------------------------
# Core – load sources
# ---------------------------------------------------------------------------
def load_weekly_sources(blob_urls: Dict[str, str]) -> Dict[str, Any]:
    """Download two Excel files (keys ``weekly1`` and ``weekly2``) into ``DATA_DIR``
    and load them with ``openpyxl``.
    """
    data_dir = _ROOT / "data sample"
    data_dir.mkdir(parents=True, exist_ok=True)

    sources: Dict[str, Any] = {}
    for key, filename in {"weekly1": "weekly1.xlsx", "weekly2": "weekly2.xlsx"}.items():
        url = blob_urls.get(key)
        if not url:
            raise ValueError(f"Missing Blob URL for {key}")
        dest = data_dir / filename
        # Run async download in a fresh event loop
        asyncio.run(_download_excel(url, dest, key))
        sources[key] = load_workbook(dest, data_only=True, read_only=True)
    return sources

# ---------------------------------------------------------------------------
# Update Word document with data from the two Excel sources
# ---------------------------------------------------------------------------
def update_weekly_report(document: DocumentType, sources: Dict[str, Any]) -> None:
    """Populate tables B1‑B7 in the weekly template.

    * ``weekly1`` provides data for tables B1‑B4.
    * ``weekly2`` provides data for tables B5‑B7.
    """
    # Locate tables by tag "(B1)" … "(B7)"
    tables = []
    for i in range(1, 8):
        tbl = find_table_by_tag(document, f"(B{i})")
        if tbl is None:
            raise RuntimeError(f"Could not locate table with tag (B{i}) in template.")
        tables.append(tbl)

    # First Excel → tables 0‑3 (B1‑B4)
    sheet1 = sources["weekly1"].active
    matrix1 = raw_matrix(sheet1, 1, sheet1.max_row, 1, sheet1.max_column)
    for tbl in tables[:4]:
        write_table_matrix(tbl, matrix1, start_row=0)

    # Second Excel → tables 4‑6 (B5‑B7)
    sheet2 = sources["weekly2"].active
    matrix2 = raw_matrix(sheet2, 1, sheet2.max_row, 1, sheet2.max_column)
    for tbl in tables[4:]:
        write_table_matrix(tbl, matrix2, start_row=0)

# ---------------------------------------------------------------------------
# Public API – generate the report and return the Path
# ---------------------------------------------------------------------------
def export_weekly(blob_urls: Dict[str, str]) -> Path:
    """Create the weekly loss‑of‑contact Word report.

    Returns the absolute path of the generated ``.docx`` file.
    """
    document = Document(str(WEEKLY_TEMPLATE))
    sources = load_weekly_sources(blob_urls)
    update_weekly_report(document, sources)

    out_path = EXPORT_DIR / f"Mất_liên_lạc_Tuần_{datetime.now():%Y%m%d}.docx"
    document.save(str(out_path))
    return out_path
