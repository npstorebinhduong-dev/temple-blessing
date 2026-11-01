# Temple Blessing · Chánh điện online

Phát triển từ [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online), commit `bee578d267c52940da08bc16171cfe8392b69d17`. Giữ giấy phép MIT và bản quyền Kent Juno trong LICENSE. Hướng dẫn gốc: [UPSTREAM.md](UPSTREAM.md).

## Chạy trên máy livestream

Cài Node.js 24, mở terminal tại thư mục dự án:

```sh
cd live
npm ci
npm start
```

Mở bảng điều khiển tại `http://localhost:3000/live/control.html`.

1. Mở TikFinity Desktop trên **cùng máy**, kết nối kênh TikTok đang LIVE và bật WebSocket server của TikFinity.
2. Trong bảng điều khiển, chọn **TikFinity Desktop**, kiểm tra địa chỉ `ws://127.0.0.1:21213/` theo cổng được TikFinity cung cấp rồi bấm **Kết nối**. Không cần nhập username trong chế độ này.
3. Thêm Browser Source trong OBS với `http://localhost:3000/live/overlay.html`, kích thước 1080 × 1920. Bật âm thanh trong overlay nếu trình duyệt yêu cầu. LIVE Studio có thể dùng Window Capture.
4. Bình luận đưa người xem vào chánh điện; quà cập nhật công đức và hiệu ứng; lượt thích tạo hiệu ứng tim. Tùy chọn “Người vào phòng cũng được ngồi” áp dụng cho sự kiện vào phòng.

Tự thử lại sau 2 giây nếu mất kết nối TikFinity; bấm **Ngắt** để dừng. Trạng thái “đã kết nối” chỉ xác nhận kết nối tới TikFinity Desktop; cần kiểm tra TikFinity đang nhận sự kiện LIVE. Chế độ **TikTok trực tiếp** giữ cách kết nối của dự án gốc.

## Kiểm thử

```sh
cd live
npm test
```

Kiểm thử dùng WebSocket giả lập với gói `{ "event": "chat", "data": { "uniqueId": "an", "nickname": "An", "comment": "Bình an" } }`. Hỗ trợ `chat`, `gift`, `member`, `like` của TikFinity Desktop; quà dùng `giftType`, `repeatEnd`, `repeatCount`, `diamondCount`. Quà combo chỉ tính ở gói kết thúc; các gói có cùng `msgId` được lọc trùng trong 5 phút. Nếu nguồn không cung cấp `msgId`, không bảo đảm loại được các gói phát lại.

Kiểm thử tự động chưa xác nhận tương thích với phiên bản TikFinity thực tế của bạn. Cloud không truy cập được localhost máy livestream. Giọng đọc Edge TTS cần Internet và được kiểm tra riêng trên máy livestream; kiểm thử tự động không gọi dịch vụ giọng đọc.

## Nghi lễ quà tặng

- **Bó hoa · 100 xu/quà**: thắp đúng 3 cây hương lớn, khói hương và hào quang vàng.
- **Bong bóng tình yêu · 500 xu/quà**: dâng giỏ trái cây trên hoa sen nở, cánh sen bay khắp màn hình.
- Nhận diện theo tên quà (tiếng Việt hoặc Bouquet / Flower Bouquet, Love Balloon / Love Balloons) và giá trị **một quà**, không theo tổng công đức hoặc tổng xu combo. 100 hoa hồng 1 xu không kích hoạt lễ thắp hương.
- Combo được phát một nghi lễ khi chuỗi kết thúc. Các nghi lễ đến liên tiếp xếp hàng, mỗi nghi lễ hiển thị 12 giây; làm trống bồ đoàn sẽ xóa hàng đợi. Chế độ giảm chuyển động giữ nghi lễ tĩnh và làm cánh sen bay chậm hơn.
- Trong bảng điều khiển có nút thử **Bó hoa · 100 · Thắp hương** và **Bong bóng tình yêu · 500 · Dâng lễ**. Cần thử quà thực tế để xác nhận tên/giá mà phiên bản TikFinity của bạn gửi.
