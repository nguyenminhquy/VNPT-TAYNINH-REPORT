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

-- 6. Danh sách các đầu việc giao ca (Sổ giao ca)
CREATE TABLE IF NOT EXISTS shift_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  shift_type INTEGER NOT NULL, -- 0: Tất cả các ca, 1: Ca 1, 2: Ca 2, 3: Ca 3
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed các đầu việc cố định (Cả 3 ca đều phải làm)
INSERT INTO shift_checklist_items (content, shift_type, display_order) VALUES
  ('Kiểm tra các phòng tại Host, ghi sổ', 0, 1),
  ('Kiểm tra số ca online', 0, 2),
  ('Kiểm tra phiếu TTS, đóng phiếu', 0, 3),
  ('Nhắc THT đóng phiếu', 0, 4),
  ('Kiểm tra email', 0, 5),
  ('Theo dõi camera OMC', 0, 6),
  ('Cập nhật số ca online', 0, 7)
ON CONFLICT DO NOTHING;

-- Seed các đầu việc CA 1
INSERT INTO shift_checklist_items (content, shift_type, display_order) VALUES
  ('Kiểm tra sự cố vô tuyến, comment FMS', 1, 8),
  ('Kiểm tra dự án vô tuyến', 1, 9),
  ('Kiểm tra truyền dẫn, cáp quang', 1, 10),
  ('Kiểm tra nghẽn thiết bị băng rộng cố định, xóa PMS', 1, 11),
  ('Kiểm tra OLT, SW', 1, 12),
  ('Thực hiện tích hợp thiết bị vô tuyến', 1, 13)
ON CONFLICT DO NOTHING;

-- Seed các đầu việc CA 2
INSERT INTO shift_checklist_items (content, shift_type, display_order) VALUES
  ('Kiểm camera IOT, báo TTVT xử lý', 2, 8),
  ('Lên phiên codan, ghi sổ', 2, 9),
  ('Giao công điện', 2, 10),
  ('Kiểm tra, xử lý báo hỏng KH VIP trên email, zalo, viber', 2, 11),
  ('Đổi port PON', 2, 12),
  ('Thực hiện biến động cố định 2 site (Ca tối)', 2, 13)
ON CONFLICT DO NOTHING;

-- Seed các đầu việc CA 3
INSERT INTO shift_checklist_items (content, shift_type, display_order) VALUES
  ('Kiểm tra camera OMC, báo TTVT xử lý', 3, 8),
  ('Duyệt phiếu hẹn (báo hỏng, lắp mới)', 3, 9),
  ('Kiểm tra biến động thuê bao Megawan, Metronet, TSL', 3, 10),
  ('Kiểm tra Báo hỏng mạng lớp trên', 3, 11),
  ('Đổi port PON', 3, 12),
  ('Test máy nổ (Thứ 2)', 3, 13)
ON CONFLICT DO NOTHING;

-- 7. Lịch sử phiếu giao ca (Sổ giao ca)
CREATE TABLE IF NOT EXISTS shift_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_type INTEGER NOT NULL, -- 1, 2, 3
  handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Lưu trạng thái tick của các mục
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Thêm cột is_admin vào bảng users (nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END
$$;
