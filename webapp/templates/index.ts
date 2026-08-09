export const documentTemplates: Record<string, { name: string; html: string }> = {
  bao_cao: {
    name: '01. Báo cáo',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">BÁO CÁO</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề Báo cáo]</p>
<p style="font-size: 14pt; margin-left: 40px; margin-bottom: 20px;"><strong>Kính gửi:</strong> [GIÁM ĐỐC / ĐƠN VỊ]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Thực hiện yêu cầu...</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">1. Nội dung báo cáo:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">[Nội dung chi tiết]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">2. Kết luận / Đề xuất:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">Kính báo cáo Giám đốc xem xét.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  to_trinh: {
    name: '02. Tờ trình',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">TỜ TRÌNH</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề Tờ trình]</p>
<p style="font-size: 14pt; margin-left: 40px; margin-bottom: 20px;"><strong>Kính trình:</strong> [GIÁM ĐỐC / ĐƠN VỊ]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Căn cứ...</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">1. Nội dung đề nghị:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">[Nội dung chi tiết]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">2. Đề xuất / Kiến nghị:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">Kính trình Giám đốc xem xét phê duyệt.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  cong_van: {
    name: '03. Công văn',
    html: `
<protected-header docNumber="" trichYeu="[Nhập trích yếu...]"></protected-header>
<p style="font-size: 14pt; margin-left: 40px; margin-top: 20px; margin-bottom: 20px;"><strong>Kính gửi:</strong> [TÊN ĐƠN VỊ NHẬN]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Căn cứ...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Trung tâm Hạ tầng trân trọng kính gửi Quý đơn vị nội dung như sau:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">[Nội dung chi tiết công văn]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-top: 20px;">Trân trọng cảm ơn sự phối hợp của Quý đơn vị.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  thong_bao: {
    name: '04. Thông báo',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">THÔNG BÁO</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề Thông báo]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Căn cứ tình hình thực tế...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Trung tâm Hạ tầng xin thông báo đến toàn thể [Đối tượng] về việc [Nội dung]:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">1. [Nội dung 1]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">2. [Nội dung 2]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-top: 20px;">Yêu cầu các cá nhân, đơn vị liên quan nghiêm túc thực hiện thông báo này.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  quyet_dinh: {
    name: '05, 06. Quyết định',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">QUYẾT ĐỊNH</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề Quyết định]</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px;">GIÁM ĐỐC TRUNG TÂM HẠ TẦNG</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px; font-style: italic;">Căn cứ...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px; font-style: italic;">Căn cứ...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 20px; font-style: italic;">Xét đề nghị của...</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px;">QUYẾT ĐỊNH:</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>Điều 1.</strong> [Nội dung điều 1]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>Điều 2.</strong> [Nội dung điều 2]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>Điều 3.</strong> Các bộ phận có liên quan chịu trách nhiệm thi hành Quyết định này. Quyết định này có hiệu lực kể từ ngày ký.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  vb_ban_hanh_kem_qd: {
    name: '07. VB ban hành kèm Quyết định',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 14pt; font-style: italic; margin-top: 10px; margin-bottom: 30px;">(Ban hành kèm theo Quyết định số: ... /QĐ-... ngày ... tháng ... năm ...)</p>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 20px;">QUY ĐỊNH / QUY CHẾ</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">Chương I. NHỮNG QUY ĐỊNH CHUNG</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>Điều 1. Phạm vi điều chỉnh</strong></p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>Điều 2. Đối tượng áp dụng</strong></p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung]</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  vb_phe_duyet_kem_qd: {
    name: '08. VB phê duyệt kèm Quyết định',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 14pt; font-style: italic; margin-top: 10px; margin-bottom: 30px;">(Được phê duyệt kèm theo Quyết định số: ... /QĐ-... ngày ... tháng ... năm ...)</p>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 20px;">KẾ HOẠCH / PHƯƠNG ÁN</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">I. MỤC ĐÍCH, YÊU CẦU</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">1. Mục đích: [Nội dung]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">2. Yêu cầu: [Nội dung]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">II. NỘI DUNG THỰC HIỆN</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">[Nội dung chi tiết]</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  giay_uy_quyen: {
    name: '09. Giấy ủy quyền',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 30px;">GIẤY ỦY QUYỀN</p>
<p style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">1. BÊN ỦY QUYỀN:</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Họ và tên: <strong>[Tên Người Ủy Quyền]</strong></p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Chức vụ: [Chức vụ]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Đơn vị công tác: [Đơn vị]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">2. BÊN NHẬN ỦY QUYỀN:</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Họ và tên: <strong>[Tên Người Nhận Ủy Quyền]</strong></p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Chức vụ: [Chức vụ]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- Đơn vị công tác: [Đơn vị]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">3. NỘI DUNG ỦY QUYỀN:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung công việc được ủy quyền]</p>
<p style="font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">4. THỜI HẠN ỦY QUYỀN:</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Từ ngày .../.../... đến ngày .../.../...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Bên nhận ủy quyền chịu trách nhiệm trước Bên ủy quyền và trước pháp luật về việc thực hiện các nội dung được ủy quyền nêu trên.</p>
<protected-signature signerRole="NGƯỜI ỦY QUYỀN" recipients="- Bên nhận uỷ quyền (để t/h);\\n- Lưu: VT, TTHT."></protected-signature>
`
  },
  chi_thi: {
    name: '10. Chỉ thị',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">CHỈ THỊ</p>
<p style="text-align: center; font-size: 14pt; font-weight: bold; margin-top: 0; margin-bottom: 30px;">Về việc [Tiêu đề Chỉ thị]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">Thời gian qua, công tác...</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 20px;">Để chấn chỉnh và nâng cao hiệu quả..., Giám đốc Trung tâm chỉ thị:</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>1. Đối với [Đơn vị 1]:</strong></p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung chỉ đạo]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 10px;"><strong>2. Đối với [Đơn vị 2]:</strong></p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung chỉ đạo]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-top: 20px;">Yêu cầu các đơn vị nghiêm túc triển khai thực hiện Chỉ thị này.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  giay_trieu_tap: {
    name: '11. Giấy triệu tập',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 30px;">GIẤY TRIỆU TẬP</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 20px;">Trung tâm Hạ tầng tổ chức cuộc họp về việc [Nội dung cuộc họp].</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px;"><strong>1. Thành phần tham dự:</strong></p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px; padding-left: 20px;">- [Thành phần 1]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 20px; padding-left: 20px;">- [Thành phần 2]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px;"><strong>2. Thời gian:</strong> ... giờ ... phút, ngày ... tháng ... năm ...</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px;"><strong>3. Địa điểm:</strong> [Phòng họp / Địa điểm]</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 20px;"><strong>4. Chuẩn bị:</strong> [Tài liệu cần mang theo]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm;">Đề nghị các đồng chí có mặt đầy đủ và đúng giờ.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  },
  ban_sao_vb_dien_tu: {
    name: '12. Bản sao văn bản điện tử',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 5px;">BẢN SAO VĂN BẢN ĐIỆN TỬ</p>
<p style="text-align: center; font-size: 14pt; margin-top: 0; margin-bottom: 30px;">(Sao y bản chính)</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Sao y từ văn bản số..., ngày... của...]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 10px;">[Nội dung trích sao]</p>
<protected-signature signerRole="NGƯỜI KÝ BẢN SAO"></protected-signature>
`
  },
  giay_moi: {
    name: '13. Giấy mời',
    html: `
<protected-header docNumber=""></protected-header>
<p style="text-align: center; font-size: 16pt; font-weight: bold; margin-top: 30px; margin-bottom: 30px;">GIẤY MỜI</p>
<p style="font-size: 14pt; margin-left: 40px; margin-bottom: 20px;"><strong>Kính gửi:</strong> [TÊN KHÁCH MỜI / ĐƠN VỊ]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-bottom: 20px;">Trung tâm Hạ tầng trân trọng kính mời [Đại diện / Ông/Bà] đến dự buổi họp/làm việc về nội dung [Nội dung].</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px;"><strong>- Thời gian:</strong> ... giờ ... phút, ngày ... tháng ... năm ...</p>
<p style="font-size: 14pt; text-align: justify; margin-bottom: 5px;"><strong>- Địa điểm:</strong> [Phòng họp / Địa điểm]</p>
<p style="font-size: 14pt; text-align: justify; text-indent: 1cm; margin-top: 20px;">Trân trọng kính mời./.</p>
<protected-signature signerRole="GIÁM ĐỐC TRUNG TÂM"></protected-signature>
`
  }
};
