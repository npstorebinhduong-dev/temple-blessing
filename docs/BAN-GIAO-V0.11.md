# Ganesha Blessing 0.11 — bản kiểm tra bàn giao

Kiểm tra ngày **03/11/2026 (giờ Việt Nam)**. Code và asset nằm trong bản nháp hiện tại; gói `Ganesha-Blessing-0.11-review.zip` được tạo để tải về kiểm tra. Chưa push hoặc xuất bản.

**Đã chạy và xác nhận camera biến đổi cả cảnh, không thêm scale riêng cho người tặng; sen Rose không che Mushika; camera phục hồi khi reset/lỗi.** Các chức năng, âm thanh và giao diện dưới đây đã được kiểm tra mô phỏng. Ba mapping mới vẫn chờ ID Thái; chưa thực hiện phiên TikTok LIVE thật trên máy phát.

## Nguyên nhân và thay đổi camera/chuyển động

Engine: Canvas 2.5D + DOM, Node.js/WebSocket. Luồng nhận quà: TikFinity/direct connector → `createEventHandler` → `onGift` → công đức/ghế → `RitualQueue` → overlay → `CameraController` → `#world`. Người tặng được chọn bằng uniqueId.

Đối chiếu Git: **4bf9b79 (v0.8)**, **724944c (v0.10.1 lỗi)**, **a5e272b (v0.10.2)**. Bản cũ dùng chiều cao thường `(245 + 105 × depth) × density`, nhưng lúc dâng lễ dùng `300 + 50 × depth`, hai lễ đặc biệt dùng 250/282. Nhân vật có thể tăng khoảng 36–66% trong thế giới rồi còn chịu zoom. Vì cơ chế phóng người này cũng có trong v0.8, không sao chép nguyên bản cũ. Giữ đường chuyển camera cũ cho sáu quà cũ và dùng chung `actorGeometry` cho mọi tư thế. Chi tiết lịch sử: [báo cáo 0.10.2](SUA-CAMERA-V0.10.2.md).

Trong bản nháp còn hai lỗi nhịp đã sửa tiếp:

- Nhân vật vào ghế tích phân theo delta khung hình bị chặn ở 0,1 giây, trong khi server mở nghi thức sau 8 giây thực. Ở FPS thấp, nhân vật chưa tới chỗ thì lượt focus đã mở. `arrivalPose` nay chạy theo thời gian thực; overlay chờ nhân vật ngồi sẵn và có ảnh trước khi nhận quyền camera. Đã thử trì hoãn RAF 230 ms, khoảng 4 FPS: mọi khung focus đều bắt đầu ở trạng thái ngồi.
- Lịch render tính từ khung vừa vẽ, làm mất phần thời gian dư và bỏ thêm khung khi RAF đến hơi muộn. Lịch mới giữ mốc 30 FPS, bỏ backlog khi trang bị treo; không sửa đường zoom. Bỏ blend multiply toàn cảnh gây tốn compositor, giữ lớp màu xanh phủ thống nhất cả nền và tay tượng.

Một controller giữ camera theo turn + thời điểm bắt đầu server, lưu snapshot trước focus và khôi phục đúng sau lượt. Hàng đợi cấp một lượt hoạt động; quà nhỏ không cắt 299/1.000. Reset, mất target, ảnh thiếu hoặc lỗi vẽ giải phóng camera. Không có tween riêng kéo camera về sau khi đã chuyển lượt.

`#world` chứa kiến trúc, sân, tượng, nhân vật, vật thờ, hiệu ứng gắn cảnh và hàng chờ. UI cùng bảng tên chiếu ra lớp riêng. Các quà thường zoom vào người và nền; **Corgi/Galaxy giữ góc rộng của bố cục hiện có** để thấy đường truyền/hình đứng, không thêm kiểu zoom sát mới. Vị trí và tỷ lệ tượng ngồi, Mushika và vật thờ giữ cố định trong thế giới.

File chính: [overlay.js](../live/overlay.js), [actor-geometry.js](../live/actor-geometry.js), [camera-controller.js](../live/camera-controller.js), [seating.js](../live/seating.js), [ceremony-camera.js](../live/ceremony-camera.js).

## Cảnh, nghi thức, UI và hàng chờ

- Sân chia hai bên với 60 ghế, chừa lối giữa. Mười người nền không được tính thành người tặng. Người tặng vào slot 11–60 trước; ghế đầy thì người có lần tặng cũ nhất nhường chỗ, bảo vệ người đang làm lễ.
- Sen Rose nhỏ tại điểm lễ cố định `(718,1158)`, giới hạn 56 × 34; tách khỏi hộp Mushika. Không gọi sen lớn cho quà 1 xu.
- Bàn vàng, giá đèn và lư hương có tọa độ cố định. Đèn/hương/vòng hoa/khay đèn có pha đi–quỳ–dâng–đứng–trở lại; vật phẩm đặt về mặt bàn. Đèn không sinh vô hạn, khói và ánh sáng có giới hạn. Đây là hoạt ảnh sprite 2.5D, chưa phải rig cơ thể 3D.
- Corgi 299 giữ chuỗi người → Mushika → Ganesha → người, có đầu sáng/đuôi/cánh hoa và chuông theo pha. Nếu atlas thì thầm lỗi, dùng nhân vật cơ bản để người tặng vẫn hiện và camera phục hồi.
- Galaxy dùng asset Ganesha đứng riêng, giữ tượng ngồi, có mandala/hào quang/ánh sáng trả xuống người nhận; hai mặt không chồng nhau. Khung chứa vương miện, bàn tay, bệ sen và người nhận. Âm thanh lỗi vẫn kết thúc và cảnh sáng lại.
- Hàng chờ dùng vai/đầu nhân vật trong game, không avatar. Giữ đủ 100/300/500 dữ liệu, vẽ tối đa 88 người. Mười vị trí gần ổn định; một hàng xa luân phiên mỗi 12 giây. Hàng ngay sau hàng gần được lấp trước để 11–36 người không có khoảng trống dưới vai. Slot giữ tọa độ khi số người tăng; tên/ngoại hình đi cùng ID.
- Quà và top chung khung nền 20% độ đục, viền vàng mảnh; icon 64 px, tác dụng Thái 30 px, giá 33 px. Top giới hạn ba người. Corgi/Galaxy cố định, quà thường đổi trang mỗi 8 giây. Khi làm lễ, khung thu gọn ở vùng trên bên trái. Đã kiểm tra khung 360 × 640.
- Tên người focus rõ nhất, tên khác nhỏ hơn/giảm số lượng. Font Thái, tách dấu đúng, bảng tên không phóng lớn cùng camera. Comment `1` chọn nữ, `2` chọn nam. Không dựng lại quà ×1 hoặc bình luận TikTok. Có điều chỉnh vùng tránh UI trên/dưới; cần cân theo giao diện TikTok trên máy phát.

## Mapping và icon

Có ID trong catalog công khai không đồng nghĩa quà đang bán trên tài khoản Thái cụ thể. Không nhận diện chỉ bằng giá; giá dưới đây là giá một món, không phải tổng combo.

| Quà TikTok | Xu | giftId | Tác dụng Thái | Xác minh / icon |
|---|---:|---|---|---|
| Rose | 1 | 5655 | ดอกบัว | Hai catalog; icon gốc cục bộ |
| Lamp | 1 | null | จุดประทีป | **Chỉ demo**, thiếu ID/icon |
| Love Perfume | 5 | null | กำยาน | **Chỉ demo**; icon ứng viên JP, chưa bật ID 919386 |
| Garland | 15 | null | ถวายพวงมาลัย | **Chỉ demo**, thiếu ID/icon |
| Perfume | 20 | 5658 | อารตีไฟ | Hai catalog; icon gốc cục bộ |
| Doughnut | 30 | 5879 | กดแล้วส่งข้อความ | Hai catalog; icon gốc cục bộ |
| Peach | 5 | 14786 | กำยาน | Catalog; icon gốc cục bộ |
| OK | 5 | null | มาลัย | Giữ tên chính xác + giá cũ; chờ ID/icon bridge |
| Shamrock | 10 | 9875 | อารตี | ID anh đã cung cấp từ nhật ký LIVE; chờ icon |
| Bouquet | 100 | 10994 | ดาวเรือง | Catalog JP + tên/giá cũ; icon gốc cục bộ |
| Love Balloon | 500 | null | มหาบูชา | Giữ tên chính xác + giá cũ; chờ ID/icon bridge |
| Corgi | 299 | 6267 | ส่งคำขอ | Giữ lựa chọn Corgi trước đây; hai catalog/icon cục bộ |
| Galaxy | 1.000 | 11046 | รับพร | Hai catalog; icon gốc cục bộ |

Rose 1 khác Rosa 10. Ba mapping mới chưa xác thực không hiện trên hướng dẫn LIVE; demo dùng ID `demo:...` riêng, đi cùng normalizer/dispatch. Gán ID đồng bộ hướng dẫn và nhận quà; đổi ID không giữ nhầm ảnh quà cũ. Icon HTTPS từ bridge được lưu đúng ID. Tám WebP gốc tải từ TikTok CDN, có SHA-256/nguồn; atlas cũ là fallback. Không vẽ lại icon bằng AI hoặc emoji. Nguồn: [README icon](../assets/ganesha/gifts/README_VI.md), [manifest WebP](../assets/ganesha/gifts/local-icons.json).

Tham chiếu truy cập được: `video_2026-11-02_00-09-34.mp4`, gần 13 giây, Ganesha ngồi giữa điện vàng và nhiều người mặc trắng quỳ. Dùng để tham khảo bố trí; không sao chép tên kênh/dữ liệu người xem. **Chưa nhận được file `1000086073.mp4` và bộ `ganesha_gift_reference` 20 crop**, nên không tuyên bố đã đối chiếu chính xác đoạn 3–5/12–14 của file đó hoặc nhập đủ bộ icon.

## Lời cầu nguyện, combo và âm thanh

Doughnut cấp một quyền mỗi đơn vị quà, lưu gọn combo lớn. Chỉ nhận bình luận hợp lệ đầu tiên từ đúng uniqueId trong 30 giây sau mở lượt. Tin cũ có timestamp bị loại; nhiều quyền xử lý tuần tự. Giới hạn 100 cụm Unicode, giữ dấu Thái, dùng `textContent`; HTML chỉ là chữ. Hết hạn dùng lời chúc Thái mặc định. Bridge không gửi timestamp thì dùng giờ nhận; không thể xác định tuổi tin trễ thiếu timestamp/ID.

Combo streak đợi kết thúc; có groupId/repeatId thì chỉ tính phần tăng. Ledger giữ qua reconnect trong cùng tiến trình, kể cả tổng combo tăng nhưng msgId không đổi. Không bảo đảm replay khi bridge thiếu cả ID bản tin/nhóm; ledger chống trùng chưa lưu qua khởi động lại server.

Nhạc thiền Á Đông dài 280 giây, lặp liên tục, Kevin MacLeod CC0: [giấy phép](../assets/ganesha/music/LICENSE.txt). Âm đèn/hương/vòng hoa/khay đèn khác nhau, tối đa 12 oscillator. Lời Galaxy bằng nam Thái `th-TH-NiwatNeural`, −12%, −6 Hz; MP3 cục bộ dài 6,504 giây. Banner có tên và đúng câu, giữ thêm 2,5 giây. Nhạc hạ 80% khi giọng đọc rồi phục hồi mềm. Câu theo tên người tặng dùng Edge trực tuyến; WebSocket TTS nay dùng proxy/NO_PROXY của máy nếu có. Lỗi TTS trực tuyến có thời gian chờ thử lại 30 giây; file Galaxy cục bộ vẫn phát trong thời gian chờ này, đã có kiểm thử server cho trường hợp đó.

Đã phát và thu **âm thanh thật** trong Chromium: câu Niwat trực tuyến và file ban phước, sự kiện bắt đầu/kết thúc, hạ nhạc/phục hồi. Đã chặn file MP3 để kiểm tra fallback. Chưa kiểm tra âm ra loa/OBS Windows hay duyệt chất giọng bằng tai trên máy phát. [Nguồn giọng](../assets/ganesha/audio/README_VI.md).

## Bằng chứng kiểm thử

- **65/65 kiểm thử Node đạt**: camera, ghế/hàng chờ, ID/giá, combo/reconnect, prayer/Unicode, audio/banner và lưu/khôi phục. Unit audio dùng fixture; kiểm tra trình duyệt bên dưới dùng MP3 Niwat thật.
- **24 lượt qua socket TikFinity mô phỏng → connector/normalizer/dispatch LIVE của chương trình**: 20 lượt focus thường + 4 đặc biệt; nhiều người xen kẽ/cùng người liên tiếp, người chưa có nhân vật, 100/500 xen 299/1.000. Không phải quà nhận từ TikTok thật.
- 7,090 khung render, 5,208 lệnh `drawImage` người tặng kiểm tra độc lập; 24 chủ camera, scale cục bộ 1, không sai chiều rộng. Sai số phép biến đổi thế giới tối đa 0.000357 px. Snapshot cuối đúng `{scale:0.84,x:86.4,y:270}`. Reset/mất target/lỗi vẽ phục hồi.
- Sáu quà chính được chạy và quay; prayer lấy đúng người, HTML không thực thi, timeout thật 30 giây. Đã bấm đủ 13 nút quà, 100/300/500, chuỗi xen kẽ, reset giữa zoom và lưu vùng tránh UI trên bảng điều khiển thật.
- Thiếu ảnh nhân vật, Ganesha đứng, atlas thì thầm hoặc file audio: không kẹt camera; atlas thì thầm có nhân vật dự phòng. Có báo lỗi tiếng Thái.
- 300 yêu cầu chuông: tối đa 12 oscillator, kết thúc còn 0. Nhạc decode 280 giây, loop bật. Cache sprite/tên và số người vẽ nằm trong giới hạn.

Số đo: [LIVE](verification/v011/result.json), [lệnh vẽ](verification/v011/draw-verification.json), [arrival 4 FPS](verification/v011/arrival.json), [demo/prayer](verification/v011/demo.json), [nút điều khiển](verification/v011/control.json), [tải](verification/v011/load.json), [audio thật](verification/v011/audio.json).

## Video và kiểm tra chuyển động

Mở [trang video kiểm tra](videos/v011/index.html). Video đều **1080 × 1920**, giữ thời gian capture thực:

- [Rose: góc tổng → focus cả người/nền → trở lại](videos/v011/camera-rose.mp4).
- [100 xu: đi lên → dâng → trở lại](videos/v011/camera-100.mp4).
- [Corgi 299 / Mushika](videos/v011/mushika-299.mp4).
- [Galaxy 1.000 / hình đứng](videos/v011/galaxy-1000.mp4).
- [Galaxy có âm thanh Niwat thu từ trình duyệt](videos/v011/galaxy-thai-audio.mp4).
- Đèn/hương/tràng hoa/khay đèn/prayer/OK có clip riêng trên trang video.

Đã xem lại chuỗi khung hình từ bản ghi và bản thu nhỏ, sửa khoảng trống dưới vai đám đông rồi quay lại 299/1.000. Đo SIFT/RANSAC trên kiến trúc/bậc thềm trong **400 khung Rose và 698 khung 100 xu**, độc lập với debug. Zoom nền đạt 1.54984× / 1.45015×; cuối về 1.000000× / 1.000015×, sai số dịch cuối dưới 0,01 px trên bản phân tích 540 × 960. Có các khung chuyển tiếp, không chỉ hai ảnh trước/sau. [Kết quả theo khung](verification/v011/video-motion.json).

FPS mã hóa của MP4 là 30, có thể lặp khung theo tốc độ capture; không dùng số này để tuyên bố FPS game. Ảnh 360 × 640 chỉ dùng đánh giá chữ/bố cục: [góc tổng](verification/v011/phone-wide.png), [focus](verification/v011/phone-focus.png), [500 người](verification/v011/phone-crowd-500.png), [các nghi thức chính](verification/v011/six-gifts-phone.jpg).

## Hiệu năng và phần còn cần xác nhận

Linux cloud 6.18.57 x86_64, Node 24.19, Chromium 154.0.8037.57 headless, ANGLE/SwiftShader (dựng hình phần mềm); 5 CPU hiển thị, quota 4 CPU, không chạy OBS encoder. 1080 × 1920, chế độ Nhẹ, 60 người trên sân + 88 người chờ được vẽ. Mỗi mức làm nóng 10 giây, đo 12 giây, không quay video cùng lúc.

| Dữ liệu người chờ | Người chờ vẽ | FPS trung bình | p95 khoảng khung |
|---:|---:|---:|---:|
| 100 | 88 | 29.96 | 50.1 ms |
| 300 | 88 | 30.00 | 50.1 ms |
| 500 | 88 | 29.92 | 50.1 ms |

Trước sửa lịch vẽ, cùng môi trường đo 23,5–24,4 FPS. Bản mới đạt khoảng 30 FPS trung bình; p95 50 ms cho thấy vẫn có khung đến muộn. Cần đo thêm với OBS/LIVE Studio đang encode trên Windows/GPU thật.

Chưa chốt: ba ID Thái mới, năm icon còn thiếu (Lamp/Garland/OK/Shamrock/Love Balloon), bộ tham chiếu chưa được cung cấp, danh mục quà tài khoản Thái và đầu ra âm thanh/FPS trên máy live. Không gọi đây là phiên LIVE thật đã nghiệm thu. Các nghi thức có thể thử đầy đủ bằng demo trong gói.

## Cách chạy / chạy lại kiểm thử

Đóng server cũ, giải nén toàn bộ ZIP vào thư mục mới, chạy `CHAY-LIVE.bat` (Node.js 24+). Hoặc `cd live`, `npm ci --no-audit --no-fund`, `npm start`. Điều khiển: `http://localhost:3000/live/control.html`. Cửa sổ LIVE/OBS: `http://localhost:3000/live/overlay.html`, 1080 × 1920. Bấm mở tiếng trong overlay nếu trình duyệt yêu cầu. [Hướng dẫn Windows](../HUONG-DAN-WINDOWS.txt), [phiếu test máy phát](../TEST-LIVE.md).

Script kiểm thử cần Python Playwright/websockets + Chromium; phân tích video thêm OpenCV/NumPy, xuất MP4 dùng ffmpeg. Chỉ dùng server thử với `GANESHA_DATA_DIR` riêng vì script có reset: `verify-live-v011.py` dùng 31944/fixture31945; `verify-demo-v011.py` và `verify-control-v011.py` dùng 31946; `verify-load-v011.py` dùng 31948. Các server này bật `GANESHA_OFFLINE_AUDIO=1`. `verify-audio-v011.py` dùng 31950 với `GANESHA_OFFLINE_AUDIO=0` để kiểm tra giọng thật. `verify-trace-v011.py` và `verify-video-v011.py` đọc thư mục trace/frame đã quay. Người chỉ chạy game không cần Python.
