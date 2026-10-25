# Kurisu trên web: Live2D, nguồn và cách thay model

Web hiện dùng **model Live2D Cubism 5 thật**, không còn minh họa SVG cũ.
Adapter ở `src/amadeus/static/avatar.js` điều khiển mắt, góc đầu, nhịp thở và
miệng. Bộ giọng Nhật thử nghiệm phát câu ngắn kèm bong bóng tiếng Việt và điều
khiển miệng theo biên độ âm thanh; xem [cách dùng và thay giọng](VOICE.md).
Khi không hỗ trợ WebGL, giao diện báo lỗi và hiện logo dự phòng.

## Bộ model miễn phí đang dùng

- Tác giả gốc: **DSUV / ELVELT**, [RealAmadeus](https://github.com/dsuv-sg/RealAmadeus).
- Bộ tài nguyên tối ưu web: [JulienQ1 / AmadeusMobile](https://github.com/JulienQ1/AmadeusMobile),
  revision `eb95bd52fcac76d90109c2f3c4bd2c915be09d98`.
- Model, texture và logo fan theo **CC BY-NC 4.0**: chia sẻ/chỉnh sửa có ghi công,
  sử dụng phi thương mại. Đây không phải bộ asset chính thức do MAGES. cấp phép.
  Không suy ra quyền thương mại từ việc repository public.
- SDK [Cubism Framework](https://github.com/Live2D/CubismWebFramework), revision
  `01e64ba44fc29e5e7206f0c397ee532edf824ee9`; Cubism Core có giấy phép riêng.
  Core dùng bản phân phối trong Open-LLM-VTuber-Web đã ghim revision và SHA-256.
  [Trang SDK chính thức](https://www.live2d.com/en/sdk/download/web/) và
  [điều kiện phát hành](https://www.live2d.com/en/sdk/license/) là nơi đối chiếu
  trước khi phát hành sản phẩm. AGPL của ứng dụng không thay thế các giấy phép này.

Các file tải về nằm ở `runtime_assets/` được Git bỏ qua. `tools/assets.lock.json`
lưu URL và checksum; script từ chối nội dung đã thay đổi ngoài lock. Không tải
asset từ CDN mỗi lần người dùng mở web; tất cả được phục vụ cùng origin.

```powershell
npm ci
python tools/prepare_assets.py
```

Node/esbuild chỉ cần lúc chuẩn bị SDK. Chạy server sau đó chỉ cần Python.
Thư mục `runtime_assets/licenses/` chứa bản giấy phép tải cùng bộ asset.

## Tự tạo một model 2D đẹp hơn

1. Vẽ hoặc thuê vẽ Kurisu thành **PSD tách lớp**: tóc trước/sau, mặt, mắt trái/phải,
   mí, lông mày, miệng, cổ, thân, tay, áo. Các vùng bị che vẫn cần vẽ đủ để khi
   quay đầu không lộ khoảng trống. Một ảnh phẳng hoặc ảnh tạo sinh chưa phải model.
2. Nhập PSD vào [Live2D Cubism Editor](https://www.live2d.com/en/cubism/about/).
   Tạo ArtMesh và deformers, rig các góc đầu/thân, mắt, miệng và physics tóc/áo.
   Có bản FREE; giới hạn tính năng/bản quyền phát hành cần xem theo bản Editor
   và SDK đang sử dụng. Không bắt buộc thuê dịch vụ trả phí để thử bộ model hiện tại.
3. Export runtime gồm `.model3.json`, `.moc3`, texture và tùy chọn `.physics3.json`.
   File dự án `.cmo3` dùng để chỉnh rig, không phải file đưa thẳng lên browser.
4. Thay bộ file trong `runtime_assets/kurisu/`. Adapter hiện tải
   `kurisu.model3.json`, một texture, các tham số chuẩn `ParamAngleX/Y/Z`,
   `ParamEyeLOpen/ROpen`, `ParamEyeBallX/Y`, `ParamMouthOpenY`, `ParamBreath`.
   Model nhiều texture cần mở rộng phần tải/bind texture. Đổi framing ở
   `matrix.setHeight` và `matrix.translate` nếu tỷ lệ khác model hiện tại.
5. Nếu muốn chia sẻ bộ model mới, sửa manifest trong `tools/prepare_assets.py`,
   tạo lock mới sau khi kiểm tra nguồn, cập nhật ghi công và giấy phép.
   Chạy lại script mặc định sẽ khôi phục model đã ghim, nên giữ bản tự rig ở thư mục riêng.

Live2D phù hợp nhất với giao diện đối thoại 2D kiểu Amadeus. **VRM/VRoid là hướng
3D**, cần renderer và adapter khác, không dùng trực tiếp trong bộ tải Cubism này.
Nếu muốn nét giống anime hơn, phần quyết định vẫn là artwork tách lớp và chất
lượng rig; runtime không biến một hình vẽ kém thành model đẹp.
