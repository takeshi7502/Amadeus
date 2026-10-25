# Giọng anime và phụ đề Việt

Bộ hiện tại dùng **VOICEVOX:四国めたん** — Shikoku Metan — có hai sắc thái:
**Metan · ngọt ngào** (あまあま, style 0, mặc định) và **Metan · tsundere**
(ツンツン, style 6). Đây là giọng nhân vật tổng hợp; chưa phải giọng Kurisu gốc.
[Nguồn và điều khoản](https://zunko.jp/con_ongen_kiyaku.html).

## Dùng trên web

- Bấm **Bật giọng Nhật** dưới model để nghe lời chào và thấy bản dịch Việt.
  Mỗi lần tải trang cần bấm bật một lần để cho phép trình duyệt phát âm thanh.
- **Nghe thử** phát một câu ngẫu nhiên. Bấm model khi đã bật giọng để nghe phản
  ứng ngắn; bấm nút × trên bong bóng để dừng câu đang phát.
- **Chọn giọng anime** dưới model để nghe cùng một câu chào bằng giọng vừa
  chọn. Lựa chọn được nhớ trong trình duyệt. Đổi giọng sẽ dừng câu đang phát.
- Mở dòng trạng thái dưới các nút để chỉnh âm lượng hoặc tắt **Thỉnh thoảng
  trò chuyện**. Hai lựa chọn này cũng được nhớ trong trình duyệt.
- Mỗi giọng có 20 câu viết riêng: lời chào, cảm ơn, quan tâm khi mệt, khoa học,
  học tập, trêu chọc, Okabe, giới thiệu và lời nói lúc rảnh. Khi chat trả lời
  xong, chọn phản ứng ngắn theo chủ đề tin nhắn. Phụ đề dịch đúng câu Nhật đang
  phát; **chưa đọc toàn bộ hoặc dịch toàn bộ câu trả lời AI**.
- Khi rảnh, khoảng 105–180 giây mới xét phát một câu; yêu cầu ít nhất 90 giây
  không tương tác. Không nói chen khi đang gõ bản nháp, đang chờ/nhận câu trả
  lời, mở dialog, ẩn trang hoặc đóng panel nhân vật trên màn hình nhỏ. Đổi chat,
  đổi mode hay tắt giọng sẽ ngắt câu hiện tại. Không phát lại các lượt lịch sử.

Âm thanh được tải từ máy chủ dự án, không gọi dịch vụ TTS trong lúc trò chuyện.
Nội dung chat không gửi đến dịch vụ tạo giọng. Web Audio đo biên độ tệp đang
phát để điều khiển `ParamMouthOpenY`; nếu không có Web Audio, miệng dùng nhịp
mô phỏng gắn với thời gian phát. Không cần micro.

## Tạo lại bộ giọng anime

Trên Windows x64, cần `uv` và `ffmpeg` có trong PATH:

```powershell
powershell -File tools/setup_anime_voice.ps1
```

Script tải VOICEVOX CORE 0.17.1 từ GitHub chính thức, kiểm tra SHA-256 của
downloader và wheel, tạo môi trường Python riêng ở `.cache/voicevox/venv`.
Downloader chính thức hiển thị điều khoản model/runtime trước khi tải từ điển,
ONNX Runtime 1.17.3 và VVM 0.17.0 (`0.vvm`). Không tải GPU runtime hoặc bộ model
đầy đủ. Tổng tải khoảng 90 MB; cache/môi trường đều nằm trong `.cache/` được
Git bỏ qua. Không cần cài thành phần vào web server hay mở dịch vụ mạng mới.

Sau lần chuẩn bị đầu, sửa cặp `ja`/`vi` trong `src/amadeus/static/voice-lines.json`
và tạo lại bằng:

```powershell
.cache/voicevox/venv/Scripts/python.exe tools/prepare_anime_voice.py
```

Script tạo toàn bộ âm thanh bằng CPU trên máy rồi dùng ffmpeg mã hóa MP3.
Không gửi câu thoại ra dịch vụ bên ngoài. Chỉnh style, tốc độ, cao độ và ngữ
điệu trong `PROFILES` của `tools/prepare_anime_voice.py` để tạo sắc thái khác.

MP3 và manifest được tạo tại `runtime_assets/voice/` (Git bỏ qua). Tên MP3 chứa
hash của nội dung, model và cấu hình profile; chạy lại dùng cache còn nguyên.
Manifest chỉ được thay khi tất cả clip hoàn thành. Chép cả thư mục này sang
máy triển khai cùng tài nguyên model. Không cần cài VOICEVOX để phát lại.
Giữ ghi công **VOICEVOX:四国めたん** và tuân thủ điều khoản khi chia sẻ âm thanh.
`VOICEVOX-TERMS.txt` được sao chép cạnh bộ giọng.

Manifest gồm `profiles`, mỗi profile có `id`, `label`, `credit` và `lines`.
`default_profile` chỉ giọng mặc định. Frontend vẫn đọc được schema một giọng cũ.
`group` chọn ngữ cảnh trong `voice.js`; thêm câu cùng nhóm giúp đa dạng hơn.
Chỉ nguồn `/runtime/voice/<tên-tệp>.mp3` từ cùng máy chủ được chấp nhận.

## Bộ Edge TTS cũ (tùy chọn)

`tools/prepare_voice.py` vẫn tạo được bộ Nanami cũ qua Microsoft Edge.
Lệnh này sẽ thay bank đang dùng bằng giọng cũ:

```powershell
uv sync --extra voice
uv run --extra voice python tools/prepare_voice.py --voice ja-JP-NanamiNeural --rate=+6% --pitch=+0Hz
```

Công cụ này gửi các câu viết sẵn trong catalog đến Microsoft, không gửi nội dung
chat. Không cần API key nhưng cần mạng và dịch vụ có thể thay đổi. Bộ Nanami
không phải lựa chọn mặc định của giao diện hiện tại.

## Dùng bản ghi riêng

Nếu có bộ ghi âm được phép dùng, thay `src` của từng câu trong các profile của
`runtime_assets/voice/bank.json` bằng MP3 tương ứng, cập nhật lời Nhật/Việt và
nhãn nguồn, ghi công. Không cần thay model Live2D. Giữ bản bank riêng trước khi
chạy lại script vì script sẽ tạo manifest từ catalog. Quyền sử dụng model
Live2D không đồng nghĩa có quyền sử dụng giọng nhân vật/diễn viên.
