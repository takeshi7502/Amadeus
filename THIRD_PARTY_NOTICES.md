# Nguồn gốc và giấy phép

Amadeus là dự án phái sinh có chọn lọc từ **waku-bot**, bản local tại
`D:\project2026\waku-bot`, snapshot Git
`0674c738e3da2047c8ce0f2b576b43c7d7a9fff6` (có tham khảo trạng thái working tree).
Waku phát triển từ [kmua-bot của Krau](https://github.com/krau/kmua-bot).
Giữ giấy phép GNU AGPL v3 của mã nguồn trong [LICENSE](LICENSE).

Các phần kế thừa cụ thể:

- `src/amadeus/provider.py`: các hàm `_parse_spec`, `_ollama_root`,
  `_openai_base_url` được trích và điều chỉnh từ
  `waku/plugins/agent/provider.py`.
- `src/amadeus/config.py`: schema provider và quy ước cấu hình `provider/model`
  theo `waku/config/__init__.py`.
- Thiết kế lưu lịch sử, khóa hội thoại, giới hạn lượt và tách nền tảng tham
  khảo `waku/plugins/agent/history.py`, `user_memory.py`, `quota.py`,
  `waku/discordbot/agent.py`. Cơ chế SQLite, HTTP, xác thực web, Telegram
  Bot API và frontend của Amadeus được viết riêng; không cần import Waku
  khi chạy.

Không sao chép database, session Telegram, log, bộ nhớ người dùng hay token
Telegram của Waku. Công cụ import chỉ chuyển thiết lập AI sang file riêng
được Git bỏ qua; khóa API không được gửi xuống trình duyệt.

Steins;Gate, Steins;Gate 0, Amadeus và Makise Kurisu thuộc các chủ sở hữu
tương ứng. Đây là dự án fan độc lập, không được chứng thực bởi MAGES.,
Nitroplus hay Spike Chunsoft. Không bao gồm kịch bản, nhạc, giọng lồng tiếng
hoặc ảnh cắt từ trò chơi/anime. Các đoạn ví dụ tiếng Việt được viết mới.

Giọng anime hiện tại: **VOICEVOX:四国めたん** (Shikoku Metan), style あまあま
(0) và ツンツン (6). [Điều khoản thư viện giọng](https://zunko.jp/con_ongen_kiyaku.html).
Tạo trên máy bằng [VOICEVOX CORE](https://github.com/VOICEVOX/voicevox_core) 0.17.1
(MIT), model VVM 0.17.0 và VOICEVOX ONNX Runtime 1.17.3 có điều khoản riêng.
Các file ở `.cache/voicevox/core/` giữ giấy phép/điều khoản tương ứng. Khi chia sẻ
âm thanh, giữ ghi công VOICEVOX:四国めたん và tuân thủ điều khoản thư viện giọng;
AGPL không thay thế quyền đối với các model/âm thanh này.

Công cụ giọng cũ (tùy chọn) dùng Nanami (`ja-JP-NanamiNeural`) được tạo qua
[edge-tts](https://github.com/rany2/edge-tts) (thư viện Python theo LGPL v3),
sử dụng dịch vụ TTS trực tuyến của Microsoft Edge. Không dùng bản ghi lồng tiếng
gốc hoặc mô hình clone giọng Kurisu/diễn viên. Các câu Nhật và bản dịch Việt
trong `voice-lines.json` được viết riêng cho ứng dụng. MP3 tạo ra là tài nguyên
runtime riêng, không nằm trong giấy phép mã AGPL; giấy phép thư viện không
thay thế các điều khoản của dịch vụ tạo giọng. Xem [docs/VOICE.md](docs/VOICE.md).

Model Kurisu Live2D và logo fan theo thiết kế Amadeus được tải riêng từ
[RealAmadeus — DSUV / ELVELT](https://github.com/dsuv-sg/RealAmadeus), qua bản web
[AmadeusMobile — JulienQ1](https://github.com/JulienQ1/AmadeusMobile), theo
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Không đưa các
asset này vào giấy phép AGPL hoặc khẳng định được MAGES. chứng thực. Bản tối ưu
web dùng texture 4096; adapter điều khiển và giao diện ứng dụng được viết riêng.

Live2D Cubism Core © Live2D Inc. theo Live2D Proprietary Software License;
[CubismWebFramework](https://github.com/Live2D/CubismWebFramework) theo Live2D
Open Software License. Core lấy từ bản phân phối Open-LLM-VTuber-Web đã ghim
revision/checksum. Giấy phép tải trong `runtime_assets/licenses/`; xem
[điều kiện SDK](https://www.live2d.com/en/sdk/license/). Be Vietnam Pro và Barlow
Condensed theo SIL Open Font License 1.1, lấy từ Google Fonts. Nguồn và checksum
từng file trong `tools/assets.lock.json`. File tải/bundle ở `runtime_assets/`
được Git bỏ qua, không nằm trong wheel/sdist của mã ứng dụng.

`canon.json` chứa bản tóm tắt ngắn viết lại bằng tiếng Việt, có liên kết
nguồn tham chiếu và phân biệt dữ kiện với diễn giải tính cách. Nguồn Wikipedia
được ghi nhận theo [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/);
những phần nội dung được chuyển thể từ nguồn này tiếp tục theo CC BY-SA 4.0.
Giấy phép mã nguồn AGPL không thay thế quyền đối với nhân vật hoặc nội dung
của nguồn tham chiếu. Trang giới thiệu Spike Chunsoft chỉ hỗ trợ thông tin
tổng quan về tác phẩm, không phải nguồn cho tất cả chi tiết từng route.
