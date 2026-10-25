# Amadeus · Makise Kurisu

Chat AI tiếng Việt trên **web và Telegram**, kế thừa chọn lọc cấu hình/provider
của waku-bot. Persona duy trì điểm nhìn Amadeus tại Viktor Chondria University:
AI từ ký ức Kurisu, có Leskinen và Maho trong nhóm phát triển, không tự giới
thiệu là nhóm fan hay LLM. Biết dữ liệu Steins;Gate / Steins;Gate 0 có spoiler,
phân biệt snapshot và world line; vẫn giải đáp lập trình, khoa học và đời sống.
Đây là ứng dụng nhập vai AI; thông tin kỹ thuật nằm trong mục Hệ thống & nguồn.

## Chạy

Python 3.12+, [uv](https://docs.astral.sh/uv/), Node/npm để chuẩn bị Live2D một lần.

```powershell
cd D:\project2026\Amadeus
uv sync --frozen
npm ci
uv run python tools/prepare_assets.py
# Chỉ sao chép khi chưa có settings.toml; giữ file riêng đang dùng.
Copy-Item settings.ex.toml settings.toml
# Điền agent_chat_model và agent_providers trong settings.toml
uv run python -m amadeus
```

Mở **http://127.0.0.1:8017**. Sau khi sửa source Python hoặc persona, khởi động
lại tiến trình; với CSS/JS, tải lại trang. Chưa cấu hình model vẫn xem được UI
và hồ sơ, chat báo chưa kết nối. Live2D không có asset/WebGL sẽ báo nguyên nhân.

Nếu chưa có cấu hình, có thể dùng importer thay cho Copy-Item:

```powershell
uv run python tools/import_waku.py --source D:\project2026\waku-bot\settings.toml
```

Importer từ chối ghi đè, không đổi Waku và không nhập token Telegram/lịch sử.
Schema `provider/model` hỗ trợ tên model có `/`, Chat Completions và Responses.
Key có thể để trong biến môi trường qua `api_key_env`; không gửi key xuống web.

## Source và dữ liệu

```text
src/amadeus/          Python package, API, bot và frontend
  resources/         Persona + ghi chú canon có nguồn
  static/            HTML/CSS/JS, adapter Live2D và icon
tools/               Chuẩn bị asset có checksum; nhập cấu hình Waku
docs/                Tài liệu sử dụng/phát triển
settings.ex.toml     Cấu hình mẫu không có secret
pyproject.toml       Dependencies và Python packaging
uv.lock              Lock Python
package*.json        Toolchain build SDK, không cần lúc chạy server
Dockerfile           Image chạy ứng dụng
compose.yaml         Mount cấu hình, dữ liệu và asset

# Được Git bỏ qua:
settings.toml        Key và token riêng
data/                Database, lịch sử, cookie signing key
runtime_assets/      Model/logo/font/SDK tải hoặc build lại
.cache/              Source SDK tải về để bundle
.local/              Test, eval, report, screenshot và helper chạy local
.venv/, node_modules/, dist/, logs/
```

Chỉ mã ứng dụng, tài liệu, manifest và cấu hình mẫu được đưa vào source. Asset
ngoài được tái tạo bằng `tools/prepare_assets.py`, không commit bản tải về.
Kiểm tra local hiện có: `uv sync --dev` rồi `uv run pytest -q`. `.local/` không
nằm trong Git hoặc gói phát hành theo yêu cầu tách đồ kiểm thử local.

## Hội thoại và tra cứu

Deploy web lên Vercel dùng Turso để lưu dữ liệu bền vững:
[hướng dẫn Vercel](docs/VERCEL.md). Chạy `python tools/prepare_vercel.py` trước
khi deploy CLI để đóng gói Live2D và voice; không tải cấu hình/database local lên.

Web có [giọng Nhật thử nghiệm và bong bóng phụ đề Việt](docs/VOICE.md): bấm
**Bật giọng Nhật** dưới model hoặc **Nghe thử**. Hai sắc thái VOICEVOX Shikoku
Metan: **ngọt ngào** (mặc định) và **tsundere**, chọn ngay dưới model. Tạo bộ giọng
bằng `powershell -File tools/setup_anime_voice.ps1`. Mỗi giọng có 20 câu phản ứng
và lời nói lúc rảnh; chưa phải giọng Kurisu gốc hay đọc toàn bộ chat.

- `amadeus`: snapshot trước chuyến về Nhật; không nhận ký ức Alpha là đã trải qua.
- `lab`: vẫn là AI Amadeus, bổ sung lớp tham chiếu dữ liệu Kurisu ở lab Alpha.
- Web nhớ hội thoại gần nhất cho từng chế độ. Đổi chế độ và mở cuộc trò chuyện
  mới không tạo mục lịch sử trống; bản nháp chỉ được lưu khi gửi tin đầu tiên.
  Icon thùng rác bên phải mỗi dòng xóa hội thoại ngay, không hỏi xác nhận.
- **Tra cứu mạng**: bật checkbox trước khi gửi. Chỉ câu hỏi hiện tại được gửi
  tới công cụ tìm kiếm DDGS/DuckDuckGo, không gửi lịch sử hay ghi chú riêng.
  Model nhận tối đa 4 trích đoạn và URL; không phải đã đọc toàn văn các trang.
  Nguồn hiện dưới câu trả lời. Mạng lỗi/không có kết quả được báo vào ngữ cảnh,
  không tạo kết quả giả. Có thể tắt bằng `web_search_enabled = false`.
- Ký ức riêng chỉ lưu khi chủ động thêm; mỗi browser/Telegram user tách riêng.
  Lịch sử và ghi chú gửi đến provider AI đã cấu hình khi tạo câu trả lời.
- Gửi lại dùng request ID để tránh gọi model và lưu tin nhắn trùng. Dừng stream
  không đồng nghĩa xóa một kết quả đã hoàn tất; Retry kiểm tra kết quả trước.
- RAG là 34 ghi chú tóm tắt có nguồn, không phải toàn bộ kịch bản/ký ức nguyên tác.
  Persona và chất lượng trả lời còn phụ thuộc model đã chọn, không bảo đảm đúng mọi lượt.

## Telegram

Điền `telegram_token` của bot Amadeus riêng và `telegram_enabled = true`.
`telegram_allowed_users = [ID]` giới hạn người dùng; rỗng cho phép mọi DM.
Chạy một tiến trình cho mỗi bot token; không dùng chung token với Waku đang chạy.

`/new`, `/mode amadeus`, `/mode lab`, `/search <câu hỏi>`, `/remember <ghi chú>`,
`/memories`, `/forget <ID>`, `/reset`, `/help`. Bot chỉ nhận chat riêng và văn bản.
Web và Telegram dùng cùng engine/persona, lịch sử tách theo người và nền tảng.

## Model nhân vật và giấy phép

Đã tích hợp Kurisu **Live2D Cubism 5** từ DSUV/ELVELT RealAmadeus, asset web
qua JulienQ1 AmadeusMobile. Chớp mắt, chuyển động nhẹ, nhìn theo con trỏ;
chuyển động miệng theo trạng thái văn bản, chưa có giọng nói. Adapter giảm
chuyển động theo thiết lập hệ thống và ngừng render khi tab/khung không hiển thị.

**Model/logo CC BY-NC 4.0, dùng phi thương mại và có ghi công.** SDK, font và
nhân vật giữ quyền/giấy phép riêng. Xem [hướng dẫn model và tự tạo Live2D](docs/AVATAR.md)
và [ghi công nguồn](THIRD_PARTY_NOTICES.md). Mã ứng dụng theo AGPL-3.0-or-later.

## Docker

Chuẩn bị `runtime_assets/` ở host như trên, điền `settings.toml`, rồi đặt
`AMADEUS_WEB_PASSWORD` và chạy `docker compose up --build -d`. Compose bind
`127.0.0.1:8017`, mount asset read-only và dùng volume dữ liệu riêng. Node không
cần trong container. Image standalone cần mount `runtime_assets` vào `/app/runtime_assets`.
Chưa chạy kiểm tra Docker thì không suy ra image đã được xác minh trên máy này.

Muốn bind ra mạng, đặt mật khẩu, khai báo `allowed_hosts` đúng host và dùng HTTPS
qua reverse proxy (`secure_cookie = true`). Mặc định chỉ bind localhost. Cookie
HttpOnly/SameSite, kiểm tra origin và tách owner áp dụng cho API. Xóa `data/`
sẽ làm mất lịch sử/ký ức và khóa phiên, không phải thao tác reset giao diện.
