# Không gian lab

Mở **Không gian lab** ở cuối sidebar hoặc liên kết trên màn hình chào. Nút ♫
dưới model mở thẳng tab **Không khí**. Các màn hình hỗ trợ VI/EN; đổi ngôn ngữ
không dịch lại nội dung chat hay trích đoạn đã lưu.

## Cảnh và thử thách

- **Nhập vai**: một tối ở phòng lab, tập thuyết trình, và một D-mail kỳ lạ.
  Mỗi cảnh có bối cảnh và mục tiêu. **Soạn cảnh** thêm bối cảnh vào ô soạn hiện
  tại, giữ phần đang viết. Người dùng xem/sửa và gửi để bắt đầu; không tự tạo
  session rỗng hay đổi chế độ ký ức. AI tiếp tục cảnh bằng lịch sử chat thường.
- **Thử thách**: hộp dán nhãn sai, xác suất đồng xu, suy luận quy luật và nhớ
  sáu chữ số. Chấm một lần mỗi câu, có giải thích và nút thảo luận với Kurisu.
  Bài nhớ chỉ ẩn dãy khi người chơi chủ động bấm. **Làm lại** xóa điểm của lượt
  chơi và tạo dãy mới; điểm không gửi lên server và không tồn tại qua tải lại.
- **Gợi ý chat** dưới model soạn một câu hỏi ngẫu nhiên, tránh lặp ngay câu
  trước đó. Chỉ khi người dùng gửi mới gọi AI.

## Biểu cảm và tương tác

`presence.js` nhận sự kiện chat để chọn một trong bảy trạng thái: lắng nghe,
suy nghĩ, tò mò, dịu dàng, ngượng, hờn nhẹ, vui. Đây là bộ quy tắc chủ đề VI/EN
nhẹ ở frontend, chưa phải phân tích cảm xúc bằng một model AI riêng.
`avatar.js` phối tham số mắt, lông mày, má, miệng và góc đầu của model hiện có;
giữ lip-sync theo voice và giảm chuyển động khi được yêu cầu.

Bấm model hoặc **Gọi Kurisu** có câu phản hồi ngắn. Bấm liên tục chuyển sang
hờn nhẹ; có giới hạn tần suất, không làm gián đoạn AI hoặc chồng giọng đang phát.
Giọng dùng những clip Nhật hiện có, giữ đúng phụ đề của clip. Khi tắt giọng vẫn
có phản hồi chữ. Không thay model, không tạo thêm bản ghi giọng hay gọi TTS.

## Nhật ký và dữ liệu

**☆ Lưu kỷ niệm** xuất hiện dưới câu trả lời hoàn tất. Lưu tối đa 100 thẻ,
mỗi thẻ giữ tối đa 2.400 ký tự câu trả lời, 500 ký tự câu hỏi và thời điểm lưu.
Lưu lại cùng câu trong cùng chat không tạo thẻ trùng. Nhật ký vẫn còn nếu xóa
chat gốc; người dùng xóa từng thẻ hoặc tải JSON trong tab **Kỷ niệm**.

Các key `amadeus.guest.moments.v1` và `amadeus.admin.moments.v1` tách theo vai
trò trên trình duyệt. Đăng xuất đổi sang bộ khách, không hiển thị thẻ admin.
Nhật ký của cả hai vai trò chỉ lưu local, không đồng bộ thiết bị và không tự
đưa vào prompt; lịch sử chat admin vẫn lưu DB như trước. Xóa dữ liệu trang sẽ
xóa nhật ký. Trình duyệt khác có bộ nhật ký riêng. Lỗi dung lượng/quyền lưu trữ
được báo; JSON hỏng không bị ghi đè tự động. Trích đoạn dùng cùng bộ định dạng
Markdown an toàn với chat, không thực thi HTML hoặc tải ảnh từ nội dung chat.

## Không khí

Chế độ ban đêm, giảm chuyển động, tiếng nền máy nhẹ và âm báo kết nối được nhớ
qua `amadeus.atmosphere.*`. Tín hiệu và tiếng nền mặc định tắt. Web Audio tạo
âm thanh ngay trên trình duyệt, không tải thêm asset hoặc gửi dữ liệu. Lựa chọn
âm thanh đã lưu chờ tương tác người dùng khi quay lại. Tiếng nền nhỏ lại khi
clip voice đang phát, tạm dừng khi trang ẩn và giải phóng khi rời trang.

Thiết lập giảm chuyển động của hệ điều hành luôn được tôn trọng. Hiệu ứng quét
kết nối ngắn không chặn thao tác; không chạy khi giảm chuyển động.

## Cấu trúc frontend

- `experience-data.js`: dữ liệu cảnh, câu hỏi và bài tập song ngữ.
- `experience.js`: tab, bài tập, soạn nội dung và nhật ký local.
- `presence.js`: chọn biểu cảm và phản ứng tương tác; `avatar.js` hiển thị.
- `atmosphere.js`: tùy chọn giao diện và âm thanh nền độc lập với voice.
- `app.js`: cầu nối soạn tin nhắn và sự kiện lưu kỷ niệm; API chat giữ nguyên.

Không cần dependency mới. `tools/prepare_vercel.py` đóng gói các file static
cùng runtime hiện có. Các bài kiểm tra hành vi local nằm trong `.local/ui-tests/`.
