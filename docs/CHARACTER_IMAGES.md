# Ảnh hồ sơ nhân vật

20/24 hồ sơ nhân vật có ảnh, gồm ảnh Kurisu đã có và 19 ảnh mới. Các trang hành
trình của năm nhân vật chính dùng lại đúng ảnh của người đó. Ảnh nằm trong source,
không gọi máy chủ bên ngoài khi người dùng mở hồ sơ.

## Nguồn

- 15 ảnh lấy từ [mục nhân vật của trang Steins;Gate 0 TV chính thức](https://steinsgate0-anime.com/#character):
  Okabe, Mayuri, Daru, Moeka, Luka, Faris, Suzuha, Maho, Kagari, Yuki, Nae,
  Fubuki/Katsumi, Kaede, Leskinen và Reyes. File PNG gốc được giữ nguyên; CSS chỉ
  hiển thị ô chân dung đầu của tấm biểu cảm. Không hiển thị các biểu cảm bên dưới
  thay cho người khác. ©2018 MAGES./KADOKAWA/ STEINS;GATE 0 Partners.
- Yugo, Yukitaka, Eisuke và Nakabachi: chân dung anime từ
  [danh sách nhân vật Steins;Gate trên Animesc](https://www.animesc.com/en/details/3ow9CL/steins-gate).
  Bốn ảnh AVIF được kiểm tra trực quan trong trình duyệt và trích vùng ảnh đã
  hiển thị thành PNG 150×225, không kèm giao diện trình duyệt hay tăng độ phân giải.
- Kurisu: giữ nguyên ảnh người dùng đã chọn trước đó; xem
  [ảnh nguồn đã cung cấp](https://i.pinimg.com/1200x/55/f6/e7/55f6e73fad6fb0f6ea01dcdac39df8a0.jpg).

Nguồn tải, đường dẫn local và SHA-256 của 19 ảnh mới ở
`src/amadeus/resources/character_images.json`. Build kiểm tra đủ file và đúng
checksum trước khi đóng gói. Danh sách này cũng giới hạn đường dẫn ảnh được phép
lưu qua API biên tập; không mở quyền dùng URL ảnh tùy ý.

Kuroki, 4℃, bà của Mayuri và mẹ Okabe hiện chưa gắn chân dung vì chưa đối chiếu
được ảnh phù hợp với phạm vi anime. Đặc biệt, không tự dùng thiết kế từ VN cho
nhân vật chỉ có giọng nói mà không phân biệt nguồn, hoặc tự tạo khuôn mặt cho
người thân không được nêu tên.

Ảnh và thiết kế nhân vật thuộc các chủ sở hữu tương ứng của Steins;Gate.
Giấy phép AGPL của mã nguồn không áp dụng cho những hình ảnh này; việc ghi nguồn
không có nghĩa dự án được chủ sở hữu chứng thực hoặc ảnh có giấy phép mở.
