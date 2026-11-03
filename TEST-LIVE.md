# Phiếu thử Ganesha Blessing 0.12 trên máy phát

Ghi cấu hình máy, trình duyệt/OBS, chế độ hiệu ứng và phiên bản bridge. Các kiểm tra cloud và video nằm trong [báo cáo](docs/BAN-GIAO-V0.12.md); đây là bước kiểm tra trên hệ thống phát thật.

1. **Mở bản mới:** đóng server cũ, giải nén đủ ZIP, chạy `CHAY-LIVE.bat`, refresh cache OBS. Xem 1080×1920 và điện thoại khoảng 360×640.
2. **Camera:** gửi quà nhỏ khi chưa có người tặng trong cảnh. Camera vào lối đi ngay, cả nền cùng chuyển. Thử 10 lượt liền: giữ cùng góc; không chồng người, tên đúng; hết hàng đợi mới về tổng. Không chờ giọng đọc hoặc banner. Reset giữa zoom phải về tổng và xóa hàng đợi.
3. **Năm món nhỏ:** Rose sen nhỏ trên bàn, không che Mushika; Đèn tại giá cố định; Love Perfume và Peach giữ hương nhẹ; Doughnut nhận bình luận đúng uniqueId. Đèn/Love Perfume chưa xác thực ID chỉ thử DEMO.
4. **Lời cầu nguyện:** một người khác bình luận không được lấy; chữ Thái dài không cắt dấu; HTML hiện như chữ. Sau 30 giây không gửi có câu mặc định. Tặng nhiều đơn vị tạo từng quyền nối tiếp.
5. **Bốn quà lớn:** Bouquet 100 và Love Balloon 500 giữ trình diễn/camera cũ. Corgi 6267 chuyển lời NGƯỜI → MUSHIKA → GANESHA → NGƯỜI. Galaxy 11046 có hình đứng riêng; tượng ngồi giữ nguyên; đủ vương miện/tay/bệ sen/người nhận. Quà nhỏ đến trong lễ lớn phải chờ. Reset giữa lễ thì sáng/camera/UI phục hồi.
6. **Đám đông:** thử 100/300/500 người, đầy 60 ghế. Chỉ 88 vai/đầu được vẽ, đủ dữ liệu chờ, không ảnh đại diện/ô chân dung. Giữ tên/ngoại hình, mười người gần ổn định. Người tặng vào sân, người tặng lâu nhất rời đi khi đầy; không tràn vào lối giữa.
7. **UI:** Đúng 9 mục, hai nhóm 5 nhỏ / 4 lớn. icon quà thật khi có, giá một món và tác dụng riêng bằng tiếng Thái. Bảng thu gọn trong nghi thức, không đè người/mặt tượng/Mushika; top không dài vô hạn. Điều chỉnh vùng tránh UI TikTok. Mục thiếu icon/ID chưa được coi là hoàn tất.
8. **Âm thanh:** thử chuông ở điều khiển, mở tiếng một overlay. Niwat nam nói đúng câu banner Galaxy, banner giữ thêm 2,5 giây. Nhạc 280 giây lặp, hạ khi giọng phát. 10 giây vắng quà có nhắc tim/share; câu tiếp cách 10 giây từ lúc câu trước kết thúc.
9. **Sự kiện thật:** xem nhật ký tên/giftId/giá. Rose 1 khác Rosa 10; các quà cùng giá khác ID không chạy nhầm. Combo tăng 1→2→3 rồi chốt chỉ tính 3; reconnect không phát lại cùng msgId/groupId. Bridge thiếu ID chống trùng vẫn là giới hạn cần ghi nhận.
10. **Độ bền:** chạy liên tục với OBS encode; ghi FPS/dropped frames, số cache/hạt/âm thanh qua debug. Mất mạng audio, lỗi ảnh, mất target hoặc reset không được kẹt cảnh tối/camera. Đo lại trên máy phát trước khi kết luận live mượt.

Trong LIVE, không tự giả lập người tặng/thông báo quà. Mười nhân vật nền có nhãn mô phỏng và không cộng quà/điểm. Bỏ `?debugCamera=1` khi phát chính thức.
