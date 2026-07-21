-- Supabase SQL Schema cho VNPT Report Hub
-- Chạy script này trong Supabase SQL Editor

-- 1. Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng 8 nguồn báo cáo
CREATE TABLE IF NOT EXISTS report_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  blob_url TEXT,
  blob_pathname TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cache dữ liệu đã parse từ Excel (toàn bộ dashboard JSON)
CREATE TABLE IF NOT EXISTS report_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ giữ 1 bản cache mới nhất (trigger tự xóa bản cũ)
CREATE OR REPLACE FUNCTION trim_report_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM report_data_cache
  WHERE id NOT IN (
    SELECT id FROM report_data_cache ORDER BY generated_at DESC LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trim_report_cache_trigger
AFTER INSERT ON report_data_cache
FOR EACH ROW EXECUTE FUNCTION trim_report_cache();

-- 4. Lịch sử upload
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL,
  source_label TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploader_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  file_name TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT
);

-- 5. Lịch sử xuất Word
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  exporter_name TEXT,
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  blob_url TEXT,
  blob_pathname TEXT,
  filename TEXT,
  file_size INTEGER,
  week_label TEXT
);

-- Seed 8 nguồn báo cáo ban đầu
INSERT INTO report_sources (key, label, owner, filename) VALUES
  ('mbb',      'BÁO CÁO MBB',          'Hưng',    '1. BÁO CÁO MBB_HUNG.xlsx'),
  ('fbb',      'BÁO CÁO FBB',          'Bảo',     '2. BÁO CÁO FBB_BAO.xlsx'),
  ('mytv',     'BÁO CÁO MyTV',         'Tân',     '3. BÁO CÁO MYTV_TÂN.xlsx'),
  ('mll',      'BÁO CÁO MLL',          'Khánh',   '4. BÁO CÁO MLL_KHANH.xlsx'),
  ('ispeed',   'BÁO CÁO i-Speed',      'Quốc',    '5. BÁO CÁO ISPEED_QUOC.xlsx'),
  ('5s',       'BÁO CÁO 5S NHÀ TRẠM', 'Tân',     '6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx'),
  ('xlsc',     'BÁO CÁO XLSC',         'Tuấn',    '7.BÁO CÁO XLSC_TUẤN.xlsx'),
  ('appendix', 'PHỤ LỤC 1',            'Phụ lục', 'PHỤ LỤC 1.xlsx')
ON CONFLICT (key) DO NOTHING;
