# Deploy web Amadeus lên Vercel

Bản production: **https://amadeus-sigma.vercel.app**, project `amadeus` trong
workspace `takeshis-projects-24f593d8`. Database `amadeus-db` dùng Turso Starter.
Mật khẩu đăng nhập được lưu riêng tại `.local/deploy/access.txt` trên máy triển khai;
file này được bỏ qua bởi Git và Vercel.

Vercel chạy FastAPI qua `app.py`, giao diện/model/voice từ thư mục `public/`
trên CDN. Lịch sử, ký ức, khóa hội thoại và giới hạn lượt nằm ở **Turso**,
không lưu database trong `/tmp` hoặc filesystem tạm của Function. Mỗi lần
cold start dùng cùng `AMADEUS_SESSION_SECRET` để giữ đăng nhập và danh tính.

## 1. Tạo database và đặt biến môi trường

Tạo database Turso tại [dashboard](https://app.turso.tech/) hoặc qua
[Vercel Marketplace](https://vercel.com/marketplace/turso). Đặt vùng gần
Tokyo nếu có; Function mặc định dùng `hnd1`. Lấy database URL và auth token.
Các bảng được tạo tự động lần đầu chạy, không cần chạy SQL thủ công.

Trong **Project → Settings → Environment Variables**, cấu hình cho Production
và Preview. Danh sách tên có trong [`.env.example`](../.env.example):

| Biến | Giá trị |
| --- | --- |
| `TURSO_DATABASE_URL` | URL `libsql://...turso.io` hoặc `https://...turso.io` |
| `TURSO_AUTH_TOKEN` | Token read/write của database |
| `AMADEUS_SESSION_SECRET` | Chuỗi ngẫu nhiên bí mật ít nhất 32 byte, giữ ổn định qua các lần deploy |
| `AMADEUS_WEB_PASSWORD` | Mật khẩu vào web, bắt buộc khi deploy |
| `AMADEUS_CHAT_MODEL` | `default/<model thực tế của provider>` |
| `AMADEUS_API_URL` | URL API công khai, ví dụ `https://<provider>/v1` |
| `AMADEUS_API_KEY` | API key của provider |
| `AMADEUS_API_TYPE` | `chat_completions` hoặc `responses` |
| `AMADEUS_ALLOWED_HOSTS` | Mặc định `*` trên Vercel: dùng được mọi domain đã gắn với project. Chỉ đặt danh sách phân cách bằng dấu phẩy nếu muốn chủ động giới hạn domain. |
| `AMADEUS_WEB_SEARCH_ENABLED` | `true` hoặc `false` |

Không gửi key/mật khẩu vào chat hoặc đưa `settings.toml` lên Vercel/Git.
Có thể tạo secret trên máy bằng `python -c "import secrets; print(secrets.token_urlsafe(48))"`
rồi nhập thẳng vào Vercel. Preview nên dùng database/token riêng nếu cần tách
dữ liệu thử khỏi production. Đổi secret hoặc mật khẩu sẽ yêu cầu đăng nhập lại.

Vercel bỏ qua cấu hình local `settings.toml`; AI endpoint phải truy cập được
từ Internet. Endpoint `localhost`, Ollama chỉ chạy trong LAN hoặc proxy chỉ
truy cập từ máy cá nhân sẽ không chạy được trên Vercel.

## 2. Chuẩn bị file public và deploy qua CLI

Bộ model/voice cần có trên máy như bản local đang chạy:

```powershell
# Nếu chưa chuẩn bị tài nguyên:
npm ci
python tools/prepare_assets.py
powershell -File tools/setup_anime_voice.ps1

# Mỗi lần sửa frontend hoặc đổi bộ voice:
python tools/prepare_vercel.py

# Chọn đúng workspace/project ở lần đầu:
npx vercel link --project amadeus --scope <workspace> --yes
npx vercel deploy --dry --json
npx vercel deploy --prod --verify
```

`public/` được tạo từ source, model/font/vendor đã chuẩn bị và chỉ các MP3
đang được manifest sử dụng; bản hiện tại khoảng 5 MiB. Nó được Git bỏ qua nhưng
**được đưa vào gói Vercel CLI**. `.vercelignore` loại cấu hình bí mật, database,
cache hàng trăm MB, công cụ tạo giọng, node_modules và file test local.
Không cần VOICEVOX, ffmpeg hoặc một GPU ở runtime trên Vercel.

Luồng này deploy **qua CLI từ máy đã chuẩn bị tài nguyên**. Chỉ import repository
GitHub trên Vercel mà không chuẩn bị `public/` sẽ thiếu model/voice. Nếu muốn
deploy tự động từ Git, cần bước CI chuẩn bị/khôi phục đúng gói tài nguyên trước
khi chạy Vercel CLI; không commit cache tạo giọng hoặc thông tin bí mật.
Project hiện đã ngắt auto deploy từ Git để một lần push chưa có gói tài nguyên
không ghi đè bản production đang chạy. Cập nhật bằng hai bước chuẩn bị `public/`
và `vercel deploy --prod` ở trên.

## 3. Kiểm tra sau deploy

Mở `/health`, đăng nhập web, gửi một tin rồi tải lại trang để kiểm tra lịch sử.
Thử đổi hai mode, xóa chat, lưu/xóa ghi chú và bật giọng Nhật. `/api/status`
không công khai key, endpoint provider, database token hoặc thông tin Telegram.
API dùng cookie HTTPS, kiểm tra Origin và không cho CDN cache dữ liệu riêng.
Các tài nguyên CDN có header CSP, nosniff và referrer policy tương ứng.

Lượt chat stream bằng SSE, Function giới hạn 180 giây; model mặc định 90 giây.
Khóa hội thoại được giữ trong database và hết hạn để phục hồi sau Function
bị dừng; không giữ transaction SQLite mở trong lúc chờ model. Retry kiểm tra
request ID đã lưu để trả lại kết quả cũ. Giới hạn cloud là 12 lượt/phút theo
cửa sổ phút và theo danh tính (đăng nhập giới hạn theo IP).

Lịch sử local không tự được tải lên cloud. Cookie thuộc domain local và domain
Vercel tạo hai không gian người dùng khác nhau.

## Telegram

Vercel chỉ chạy **web + API** của dự án. Telegram polling là tiến trình chạy
liên tục, nên bị tắt trong cấu hình Vercel. Giữ bot trên máy hiện tại/VPS hoặc
worker riêng; có thể cấu hình cùng Turso, nhưng không chạy hai poller cho một
token. Chưa có Telegram webhook endpoint trong bản này.

Tham khảo chính thức:
[FastAPI trên Vercel](https://vercel.com/docs/frameworks/backend/fastapi),
[SQL over HTTP của Turso](https://docs.turso.tech/sdk/http/reference).
