# Sửa camera Ganesha LIVE 0.10.1

[Tải bản ZIP 0.10.1](https://github.com/npstorebinhduong-dev/temple-blessing/archive/refs/heads/codex/ganesha-live-v0.10.1.zip).

## Nguyên nhân và bản đối chiếu

Trong v0.10 (`aae00fd`), nền/tượng/tay tượng/Mushika dùng viewport cố định, còn nhân vật và vật phẩm dùng viewport đang zoom. Hai phép biến đổi khác nhau làm nhân vật trông như tự phóng to, trượt khỏi cảnh. Không tìm thấy nhiều tween tranh nhau; lỗi chính nằm ở cách áp dụng camera giữa các lớp.

Đã lấy **v0.8, commit `4bf9b79`** trong Git để đối chiếu và chạy riêng bản đó trong Chromium. Bản này dùng cùng camera cho nền và nhân vật. `live/ceremony-camera.js` trong bản sửa **giống từng byte với v0.8**, SHA-256 `9bfb52c766230b26c64bf5440d03844e98b0d8ca1fa1ca312060ffb2146665ae`. Giữ đường chuyển, mức phóng, thời gian giữ và trả cảnh của sáu quà cũ; không thiết kế đường zoom khác.

Khung tổng và bố cục UI vẫn là của v0.10. Vì vậy bản sửa khôi phục hành vi camera cũ trong bố cục hiện tại, không tuyên bố toàn bộ ảnh giống từng pixel với v0.8. Corgi/Galaxy chưa có ở v0.8; hai nghi thức này giữ góc rộng của v0.10.

## Phần đã sửa

- Một `CameraController` nhận duy nhất lượt nghi thức đang hoạt động từ FIFO của server. Sự kiện quà đến không trực tiếp giành camera. Mỗi lượt có khóa gồm ID lượt và thời điểm bắt đầu.
- Nền, tượng, tay, Mushika, nhân vật và vật phẩm dùng cùng một ma trận ở cùng khung hình. Tọa độ nghi thức vẫn thuộc không gian cảnh. Không thay scale riêng vật thể để giả zoom. UI và đám đông mép dưới giữ tọa độ màn hình hiện có.
- Chỉ nhận focus khi đúng nhân vật có vị trí và ghế hợp lệ; bỏ cách tạo nhân vật thay thế tại tọa độ mặc định. Khi mất target, lượt đó nhả camera và không tự giành lại.
- Lưu viewport trước focus và dựng mỗi khung từ bản lưu đó; kết thúc trả đúng bản lưu. Reset, mất kết nối và lỗi render cũng giải phóng camera. Lỗi render dọn canvas/hiệu ứng dở để tránh giữ màn hình tối.
- Sửa thêm việc đổi mức hiệu ứng làm canvas reset ma trận về identity: áp dụng lại camera ngay sau đổi độ phân giải.
- Giữ asset, giao diện, hàng chờ, ánh xạ quà, nhạc và âm thanh tiếng Thái hiện có.

## Kiểm tra thực tế

Kết quả và dữ liệu tóm tắt nằm trong [báo cáo trình duyệt](verification/v0101/browser-check.json). Bộ kiểm thử Node gồm 55 ca; trong đó 126 mẫu camera lấy từ source v0.8, 40 lượt sở hữu/khôi phục viewport và các lỗi target/reset/hủy/tọa độ không hợp lệ.

**55/55 ca đạt.** Trong **4.959 khung hình** của chuỗi trình duyệt, có **0 lần lệch ma trận nền/nhân vật**, 24 chủ camera đúng 24 lượt. Cả hai loại đặc biệt giữ zoom tương đối 1.000 suốt nghi thức. Kết thúc trả chính xác `{scale: 0.84, x: 86.4, y: 270}`, không sai số tích lũy; khung UI không đổi vị trí/kích thước do zoom. Reset, mất target và lỗi render đều trả góc tổng, bỏ chủ camera; lượt đã hủy không tự giành lại. Không có lỗi JavaScript chưa được xử lý.

Trình duyệt Chromium chạy ứng dụng thật ở **1080×1920** với thời lượng nghi thức thật. Chuỗi kiểm tra gồm 24 lượt: **20 focus quà thường + 4 lượt đặc biệt**, đủ tám loại quà, cùng người gửi liên tục, nhiều người xen kẽ, quà thường xen Corgi/Galaxy, và người mới chưa có nhân vật. Ngoài chuỗi này còn thử reset giữa zoom, xóa target giữa zoom, lỗi render được tiêm có chủ đích và đổi mức hiệu ứng.

## Video 9:16 và ảnh

Video ghi từ cửa sổ ứng dụng: trước zoom → focus → trả góc tổng. Đã xem các khung hình liên tiếp trích từ video để đối chiếu chuyển động với bản cũ, cùng dữ liệu camera từng khung. Không dùng ảnh dựng làm minh chứng.

- [Rose — bản sửa](videos/v0101/camera-fixed-rose.mp4).
- [Rose — v0.8 nguyên bản](videos/v0101/camera-reference-v08.mp4).
- [Bó hoa 100 xu — lên lễ, giữ focus, trả cảnh](videos/v0101/camera-fixed-marigold.mp4).
- [500 xu đang dâng lễ](screenshots/v0101/royal-focus.jpg), [299 xu](screenshots/v0101/mushika-wide.jpg), [Galaxy](screenshots/v0101/galaxy-wide.jpg).

Cloud dựng hình bằng phần mềm; video xuất 30 FPS từ các khung chụp có timestamp thật, không phải bằng chứng máy phát thực đạt 30 FPS. Lượt kiểm tra camera dùng DEMO và tắt tiếng; không phát LIVE TikTok, không thay đổi hoặc chứng nhận lại chất lượng giọng Thái/OBS trên Windows.

## Cập nhật trên máy LIVE

Đóng server bản cũ, giải nén toàn bộ ZIP mới. Muốn giữ cấu hình/điểm thì chép `live/data` từ bản cũ sau khi đóng server; không chép `node_modules`. Chạy `CHAY-LIVE.bat`, làm mới bộ nhớ đệm Browser Source trong OBS hoặc `Ctrl+F5` cửa sổ LIVE. Nguồn vẫn là `http://localhost:3000/live/overlay.html`, **1080×1920**. Thử một quà DEMO để xác nhận máy đang dùng bản mới rồi kết nối TikFinity như cũ.
