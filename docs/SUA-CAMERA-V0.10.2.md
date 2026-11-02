# Sửa kích thước nhân vật và hoa sen quà 1 xu — 0.10.2

[Tải ZIP 0.10.2](https://github.com/npstorebinhduong-dev/temple-blessing/archive/refs/heads/codex/ganesha-live-v0.10.2.zip).

## Nguyên nhân đã tái hiện

Lần sửa 0.10.1 chỉ kiểm tra ma trận camera giữa các lớp, **bỏ sót kích thước vẽ nhân vật**. Nhân vật thường dùng `(245 + 105 × depth) × density`, còn `drawCeremony()` đổi sang `300 + 50 × depth`. Tại hàng trước, cơ thể đổi từ **257,6077 lên 350 đơn vị** ngay khi lên lễ, tăng khoảng **36%**; tại bàn thờ, thay vì **180,3254** lại vẽ **300**, lớn hơn khoảng **66%**. Hai nghi thức đặc biệt còn gán chiều cao riêng **250/282**. Đây là thay đổi trong thế giới game, cộng thêm vào camera; kiểm tra camera đơn thuần không phát hiện được.

Đã chạy nguyên bản **0.10.1 (`724944c`)** riêng để tái hiện qua đường TikFinity và ghi lệnh `drawImage`. Công thức phóng nhân vật khi dâng lễ cũng có trong **v0.8 (`4bf9b79`)**, nên chép nguyên source cũ không giải quyết phần này. Bản mới giữ đường camera v0.8, sửa cách dựng nhân vật; không rollback các nâng cấp.

Với Rose 1 xu, `ritualArt()` gọi `lotus(540, 1015, 1.25, t)`: một hoa sen lớn trên bàn thờ, trùng vùng Mushika. Lượt tái hiện cũ đã gọi hiệu ứng này **55 khung hình**. Không phải quà 1 xu bị nhận nhầm thành quà 299/1.000; lỗi nằm ngay trong nhánh hiệu ứng `lotus` của quà nhỏ.

## Đoạn xử lý thay đổi

- [actor-geometry.js](../live/actor-geometry.js): một công thức phối cảnh cho người ngồi, đi, dâng lễ, ghé tai và nhận phước. [overlay.js](../live/overlay.js) và [special-art.js](../live/special-art.js) dùng cùng kích thước này; bỏ các chiều cao riêng theo nghi thức. Kích thước thay đổi theo độ sâu và tư thế lạy vốn có, không thêm hệ số focus.
- `applyCamera()` chỉ ghi transform lên **`#world`**. Nền, sân, kiến trúc, tượng, tay, Mushika, người và vật phẩm nằm trong cùng container. Canvas chỉ có hệ số raster và phần đệm cố định; không nhận camera riêng. Tên và UI dùng tọa độ màn hình. Vùng canvas có phần đệm để hình Ganesha nằm ngoài x=0 không bị cắt trước khi camera đưa vào khung.
- Giữ `CameraController`, khóa lượt và FIFO hiện có. Camera dựng từ viewport đã lưu, không nhân tiếp lên khung trước; kết thúc/reset/mất target/lỗi render trả góc tổng. Giữ nguyên `ceremony-camera.js` của v0.8.
- [small-gift-effect.js](../live/small-gift-effect.js): Rose 1 xu chỉ có **8 hạt sáng nhỏ quanh người tặng trong 1,4 giây**. Không gọi hoa sen hoặc hào quang lớn tại bàn thờ; không phát mưa hạt từ quà này. Hiệu ứng sen của các quà khác và nghi thức đặc biệt được giữ.
- [special-rituals.js](../live/special-rituals.js): tính vị trí bàn chân để nhân vật có kích thước bình thường vẫn ghé đúng tai Mushika. Không thay kích thước/vị trí Mushika hay tượng. Luồng hồi đáp ánh sáng đi về đúng vị trí mới của người ghé tai. Carrier dùng đường chân đã căn theo atlas; tên người làm lễ được đặt ngoài vùng chuột thay vì bị ẩn.
- Không đổi xử lý giá, ID quà, combo, tính điểm, hàng chờ hoặc âm thanh Thái. Tên kỹ thuật `lotus` được giữ để cấu hình cũ vẫn tương thích; hiệu ứng quà 1 xu đã thay như trên.

## Kiểm chứng

Nguồn thử là WebSocket phát payload tương thích TikFinity vào **`connectTikFinity → createEventHandler → onGift → FIFO → overlay` trong chế độ LIVE**, không gọi đường tắt quà DEMO. Payload là mô phỏng; không phát sinh giao dịch TikTok thật.

Chạy Chromium ở **1080×1920**, đủ tám loại quà; 24 lượt gồm 20 quà thường và 4 nghi thức đặc biệt, nhiều người xen kẽ và cùng người liên tiếp. Thử cả nhân vật nam/nữ, người chưa có nhân vật, giữ góc rộng khi 299/1.000, sai ID/giá quà nhỏ, reset giữa zoom, mất target và lỗi vẽ có chủ đích. Kết quả số được lưu trong [báo cáo](verification/v0102/result.json), [lệnh vẽ thực](verification/v0102/draw-verification.json) và [phân tích chuyển động video](verification/v0102/video-motion.json).

**Kết quả:** 4.504 khung hình, 24 chủ camera đúng thứ tự; 3.232 lệnh vẽ người tặng đã đối chiếu trực tiếp, **0 lần sai kích thước theo phối cảnh**. Transform nền khớp viewport với sai số đo dưới 0,001 px. Tỷ lệ cục bộ của nhân vật trước/trong/sau focus là 1; hệ số raster được tách riêng. **0 lần gọi hoa sen lớn của quà 1 xu**. Camera cuối chuỗi trở lại chính xác `{scale: 0.84, x: 86.4, y: 270}`. Bộ kiểm thử Node gồm **59 ca đạt**, bao gồm đường camera cũ, hình thể, ánh xạ quà, hàng đợi và các kiểm tra âm thanh hiện có.

[Kiểm tra phục hồi](verification/v0102/recovery.json) xác nhận reset, mất nhân vật và lỗi vẽ đều bỏ chủ camera/trả đúng góc tổng; lượt mất target không tự giành lại. Đổi mức hiệu ứng khi đang focus giữ đúng chủ camera và tỷ lệ cục bộ. Corgi/Galaxy bị gửi sai giá 1 xu và quà 1 xu không rõ tên đều không chạy nghi thức đặc biệt.

Kiểm tra video dùng **SIFT/RANSAC** theo dõi các điểm kiến trúc/bàn thờ qua nhiều khung liên tiếp, độc lập với số camera do ứng dụng báo. Đo được các mức trung gian khi tiến gần/trả cảnh, đỉnh khoảng **1,55× cho Rose**, **1,45× cho Bó hoa**, rồi trở về **1,00×**. Đây không phải kết luận từ hai ảnh tĩnh. Các khung hình liên tiếp của clip cũng được xem lại để kiểm tra người, vật phẩm và bố cục.

Các chuyển động cúi lạy/đứng dậy vẫn làm tư thế cơ thể thay đổi. Phép kiểm tra kích thước độc lập dùng chiều ngang thực của lệnh vẽ và hệ tọa độ cục bộ, tránh nhầm chiều cao tư thế cúi lạy với hệ số phóng khi nhận quà.

## Video quay từ bản chạy

- [Rose 1 xu: góc tổng → camera tiến gần cả cảnh → trả góc tổng](videos/v0102/rose.mp4).
- [Bó hoa 100 xu: đứng lên, lên lễ, dâng, quay về; có số debug](videos/v0102/procession.mp4).
- [Corgi 299 xu: ghé tai và chuyển lời](videos/v0102/mushika.mp4).
- [Galaxy 1.000 xu: hình đứng và người nhận phước](videos/v0102/galaxy.mp4).

Video giữ timestamp thật, xuất 540×960. Máy cloud dựng hình phần mềm; file 30 FPS có khung lặp, không chứng nhận FPS trên máy Windows. Đợt này tắt tiếng để tập trung hai lỗi hình ảnh; không chứng nhận lại giọng Thái hay OBS/TikTok thật.

## Dùng và kiểm tra debug

Đóng server bản cũ, giải nén toàn bộ ZIP mới và chạy `CHAY-LIVE.bat`. Muốn giữ cấu hình/điểm, chép `live/data` từ bản cũ sau khi đã đóng server. Làm mới cache nguồn OBS hoặc `Ctrl+F5`; nguồn vẫn là `http://localhost:3000/live/overlay.html`, 1080×1920.

Để bật bảng phát triển: `http://localhost:3000/live/overlay.html?debugCamera=1`. Bảng ghi phiên bản, ID focus, chủ camera, hệ thống điều khiển, transform thế giới, tỷ lệ cục bộ trước/hiện tại và chiều cao phối cảnh. `window.__cameraDebug` có dữ liệu từng nhân vật. Bỏ tham số này khi phát; UI bình thường không có bảng debug.

Mã chạy lại: [verify-camera-live.py](../scripts/verify-camera-live.py), cần Python `playwright`, `websockets` và Chromium; chỉ dùng với server có `GANESHA_DATA_DIR` trỏ tới **thư mục thử riêng**, vì script reset dữ liệu của server thử. [verify-camera-video.py](../scripts/verify-camera-video.py) cần OpenCV/NumPy và thư mục frame do script đầu tạo. Các công cụ này không cần cài trên máy chạy LIVE thông thường.

[verify-camera-trace.py](../scripts/verify-camera-trace.py) đối chiếu lệnh vẽ thực và transform với dữ liệu `full-trace.json` do phiên kiểm tra tạo, gồm cả kích thước người trước/trong/sau lượt.
