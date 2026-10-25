# Deploy web Amadeus lên Vercel

Bản production: **https://amadeus-sigma.vercel.app**, project `amadeus` trong
workspace `takeshis-projects-24f593d8`. Database `amadeus-db` dùng Turso Starter.
Mật khẩu đăng nhập admin được lưu riêng tại `.local/deploy/access.txt` trên máy triển khai;
file này được bỏ qua bởi Git và Vercel.

Vercel chạy FastAPI qua `app.py`, giao diện/model/voice từ thư mục `public/`
trên CDN. Web mở công khai; lịch sử và ghi chú khách chỉ nằm trong localStorage
của từng trình duyệt/domain, không ghi vào DB. Lịch sử, ký ức, khóa hội thoại
và giới hạn lượt của **admin** nằm ở Turso, không lưu database trong `/tmp`
hoặc filesystem tạm của Function. Mỗi lần cold start dùng cùng
`AMADEUS_SESSION_SECRET` để giữ đăng nhập admin.

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
| `AMADEUS_WEB_PASSWORD` | Mật khẩu đăng nhập admin ở cuối sidebar; bắt buộc khi deploy, khách chat không cần mật khẩu |
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

## 2. Build tài nguyên và deploy

Bộ tài nguyên web cần thiết nằm trong `assets/runtime/` và được lưu trong Git:
logo, font, model/SDK Live2D, giấy phép và các clip giọng Nhật đang sử dụng.
`assets/runtime-manifest.json` kiểm tra SHA-256 của từng file.

Vercel chạy `python tools/prepare_vercel.py` qua `buildCommand` trong
`vercel.json` ở mỗi lần deploy, tạo `public/` để CDN phục vụ giao diện và tài
nguyên. Build không tải thêm model, chạy VOICEVOX, ffmpeg hay cần GPU. Nếu thiếu
file hoặc checksum sai, build dừng thay vì phát hành một trang thiếu tài nguyên.

Có thể deploy từ repository Git đã commit đủ `assets/` và công cụ build, hoặc
qua CLI:

```powershell
python tools/prepare_vercel.py
npx vercel link --project amadeus --scope <workspace> --yes
npx vercel deploy --dry --json
npx vercel deploy --prod --verify
```

`public/` là đầu ra build và bị Git bỏ qua; máy build tự tạo lại nó từ source
ở mỗi lần deploy. API cũng có đường dẫn phục vụ `assets/runtime/` để các file
vẫn truy cập được nếu CDN chưa nhận đầu ra build. `.vercelignore` vẫn loại cấu hình bí
mật, database, cache, công cụ tạo giọng và file test local.

Chỉ khi chủ động cập nhật model/giọng từ bộ đã tạo trên máy, chạy:

```powershell
python tools/prepare_vercel.py --refresh-runtime
```

Review rồi commit các thay đổi trong `assets/runtime/` và manifest cùng nhau.
Không commit `.cache/`, engine VOICEVOX, `runtime_assets/`, API key hay lịch sử
người dùng. Xem thêm [assets/README.md](../assets/README.md).

## 3. Kiểm tra sau deploy

Mở `/health`, vào web không đăng nhập, gửi một tin rồi tải lại trang để kiểm
tra lịch sử khách. Một trình duyệt khác phải có lịch sử khách trống. Bấm
**Đăng nhập admin** ở cuối sidebar, nhập mật khẩu hiện có rồi kiểm tra lịch
sử DB; đăng xuất phải trở về chat khách. Chat khách không tự tải lên DB.
Thử đổi hai mode, xóa chat, lưu/xóa ghi chú và bật giọng Nhật. `/api/status`
không công khai key, endpoint provider, database token hoặc thông tin Telegram.
API dùng cookie HTTPS, kiểm tra Origin và không cho CDN cache dữ liệu riêng.
Các tài nguyên CDN có header CSP, nosniff và referrer policy tương ứng.

Lượt chat stream bằng SSE, Function giới hạn 180 giây; model mặc định 90 giây.
Với admin, khóa hội thoại được giữ trong database và hết hạn để phục hồi sau Function
bị dừng; không giữ transaction SQLite mở trong lúc chờ model. Retry kiểm tra
request ID đã lưu để trả lại kết quả cũ. Giới hạn cloud là 12 lượt/phút theo
cửa sổ phút và theo danh tính (đăng nhập giới hạn theo IP). Khách dùng endpoint
stateless `/api/guest/messages`, gửi ngữ cảnh từ trình duyệt, lưu cặp hỏi/đáp
hoàn tất ở trình duyệt. Không tạo session, message, completion hay lease trong DB.
Giới hạn khách nằm trong RAM của từng Function: 12 lượt/phút theo cookie khách,
60 lượt/phút theo IP; bộ đếm không dùng chung giữa các Function/cold start.

Lịch sử khách thuộc từng origin của trình duyệt: domain mới có bộ nhớ khách
riêng, xóa dữ liệu trang sẽ mất bộ nhớ đó. Ngữ cảnh khách vẫn được gửi đến máy
chủ và provider để tạo câu trả lời, nhưng không ghi vào DB. Cookie admin chỉ
thuộc domain đang đăng nhập; đăng nhập lại trên domain khác sẽ mở cùng lịch sử
admin trong DB. Nếu còn cookie hợp lệ từ bản cũ, lịch sử cũ của trình duyệt
đó được chuyển vào không gian admin sau khi nhập đúng mật khẩu.

## Telegram

Vercel chỉ chạy **web + API** của dự án. Telegram polling là tiến trình chạy
liên tục, nên bị tắt trong cấu hình Vercel. Giữ bot trên máy hiện tại/VPS hoặc
worker riêng; có thể cấu hình cùng Turso, nhưng không chạy hai poller cho một
token. Chưa có Telegram webhook endpoint trong bản này.

Tham khảo chính thức:
[FastAPI trên Vercel](https://vercel.com/docs/frameworks/backend/fastapi),
[SQL over HTTP của Turso](https://docs.turso.tech/sdk/http/reference).
