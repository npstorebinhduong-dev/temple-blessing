# Bàn giao Ganesha LIVE 0.10 — 02/11/2026

[Tải ZIP bản 0.10](https://github.com/npstorebinhduong-dev/temple-blessing/archive/refs/heads/codex/ganesha-live-v0.10.zip). Nhánh `codex/ganesha-live-v0.10`, giữ engine Canvas 2.5D hiện có.

## Đã sửa

- **Corgi 299 xu, ID 6267** thay “Bạn đồng hành”, kích hoạt Mushika; **Galaxy 1.000 xu, ID 11046** giữ nguyên. Đã đối chiếu ID/giá/URL icon ở hai danh mục công khai. Nâng dữ liệu cũ sẽ đổi các gán Mushika cũ sang Corgi một lần; những lần chỉnh tay sau đó và sáu quà cũ/Galaxy được giữ. [Nguồn](QUA-MOI.md).
- **Một khung quà/công đức**: nền tối 20%, blur 3 px, viền vàng mảnh, chữ/icon không giảm opacity. Dành dải phía trên tượng; top ba, Corgi/Galaxy luôn ở hàng đầu, sáu quà còn lại đổi nhóm mỗi 8 giây. Chỉnh ngang/dọc trong bảng điều khiển; giới hạn giữ khung ngoài vương miện và khu quỳ. Nếu nâng cao, ẩn phần chữ phụ để không chồng. Cao trào Galaxy thu gọn rồi khôi phục vị trí.
- **Đám đông đầu–vai**: dùng đúng atlas nam/nữ của game, bốn lớp so le, người gần lớn hơn, thở/nghiêng nhẹ lệch nhịp; không tải avatar TikTok. Giữ toàn bộ hồ sơ, lựa chọn nhân vật và logic hàng chờ; chỉ vẽ 88 người (49 Nhẹ), tám sprite dùng lại. Mười người gần ổn định; hồ sơ xa luân phiên mỗi 12 giây. Tên xa luân phiên cặp mỗi 6 giây, tên gần lớn; người tới lượt có đánh dấu và tên đầy đủ. Tên người quỳ cũng tránh chồng và tránh chuột.
- **Mushika 16 giây**: ghé/khum tay tại tai 3,6 giây → tụ sáng → ngẩng đầu → ngọc/vòng hoa văn → dải vàng uốn nhiều lớp và cánh hoa tới Ganesha → quầng tiếp nhận/mandala/chuông → luồng hồi đáp/hoa sen dưới chân → wai/về ghế. Có bốn cue âm riêng và góc rộng thấy cả hành trình.
- **Ganesha đứng mới cho Galaxy**: PNG alpha tạo mới, có đủ hai chân/bàn chân, bốn tay, vương miện và bàn tay ban phước. Hình đứng ở trái, người nhận ở phải; tượng ngồi ở sau giữ nguyên. Nền dịu tối 1,8 giây; sen/mandala hiện trước, hình hiện từ chân lên đầu; halo nhiều lớp/tia sáng phía sau, cánh hoa trước/sau tránh mặt. Tay và luồng ban phước đi theo thời điểm giọng/banner; hình tan dần rồi trả cảnh.
- **Tượng ngồi cố định**: nền và tượng giữ cùng vị trí/kích thước trong mọi lượt. Sáu quà cũ vẫn có camera phóng nhân vật; hai quà mới giữ toàn cảnh. Tay tượng ngồi tạm giữ khi làm hai nghi thức mới, sau đó tiếp tục mượt.
- Giữ nguyên câu Thái, Niwat nam −12%/−6 Hz, vang/bass nhẹ; banner theo phát tiếng thực, giữ 2,5 giây rồi mờ 0,7 giây, nhạc tự hạ. FIFO, combo ×N, chống trùng ID sự kiện, tiếp nhận quà lúc đang làm lễ, nhường ghế và lưu phiên vẫn hoạt động. Reset thu hồi tiếng, ánh sáng, cánh hoa, banner/UI.

## Chạy thử

1. Đóng `CHAY-LIVE` cũ, giải nén toàn bộ ZIP vào thư mục mới. Cần Node.js 24+. Muốn giữ điểm/cấu hình, chép `live/data` từ bản cũ sau khi đã đóng server; không chép `node_modules`.
2. Chạy `CHAY-LIVE.bat`, mở `http://localhost:3000/live/control.html`; mở màn hình LIVE riêng và bật tiếng. Preview điều khiển luôn im.
3. Trong DEMO bấm **Corgi · ghé tai Mushika**, **Thiên hà · thử nghi thức**, thử nữ/nam, 100/300/500 người chờ, đủ ghế và năm lượt liên tiếp. Người mới chờ khoảng 8 giây vào chỗ trước khi làm lễ.
4. OBS Browser Source: `http://localhost:3000/live/overlay.html`, **1080×1920**. Làm mới bộ nhớ đệm nguồn sau nâng cấp; chỉ thu một nguồn âm thanh. Tiếp tục [phiếu test máy phát](../TEST-LIVE.md) trước khi bật LIVE thật.

## Kết quả kiểm tra

- **52/52 kiểm thử Node đạt**: cú pháp tất cả module trình duyệt, tám quà, Corgi đúng ID/giá, combo Corgi ×3 chỉ ghi một lần, nâng cấu hình cũ, giữ sửa tay qua restart, giới hạn vị trí bảng, tuyến truyền/hồi đáp, 60 vị trí đi/về, FIFO và các kiểm thử LIVE/âm thanh cũ.
- Đã chạy Chromium thật ở **1080×1920**, xem ảnh cảnh thường, 100/300/500 người chờ, Mushika nữ/nam, hình đứng đang xuất hiện, banner ban phước và sau nghi thức. Đã xem viewport **390×844**. Qua xem ảnh đã sửa tên chồng, ẩn tên người ngoài nghi thức trong Galaxy, giữ bệ sen/banner tách nhau và tăng độ dày dải truyền sáng. Ảnh là chụp ứng dụng với DEMO, không phải LIVE TikTok thật.
- Thao tác form thật: lưu vị trí, kiểm tra ID mặc định, chuyển ba nhóm quà, 500 người chờ/50 người quỳ, chọn nam và chạy đủ **Mushika → Galaxy → Rose ×3 → Galaxy → Mushika**, tổng **2.601 xu**. Tượng giữ cùng transform, UI/camera trở về sau lượt.
- Ba lượt Galaxy bằng **MP3 tín hiệu thử 7,8 giây** qua Audio/Web Audio và thông báo bắt đầu/kết thúc thật. Banner vẫn còn sau 2,1 giây từ khi tiếng kết thúc, sau đó giữ/mờ theo lịch; nhạc/ánh sáng/camera trở lại, không còn oscillator sau reset. Lượt đầu trên cloud có trễ xử lý, thời gian giữa receipt bắt đầu/kết thúc khoảng 9,87 giây; hai lượt sau khoảng 7,88 giây. MP3 thử chỉ ở thư mục kiểm thử ngoài gói, không giả làm tiếng Thái.
- Đã chặn PNG hình đứng để thử lỗi tải: cảnh giảm tối tối đa 28%, vẫn kết thúc nghi thức và khôi phục UI. Tải lại khi ảnh có trở lại đã phục hồi hình đứng/banner; Reset giữa ban phước trả cảnh bình thường, không lỗi JavaScript. Một lỗi khai báo biến ở hiệu ứng đánh dấu người chờ được phát hiện trong vòng kiểm tra cuối, đã sửa và bổ sung kiểm tra cú pháp trước đóng gói.
- Cache có giới hạn: tám sprite đầu–vai, tối đa 176 bảng tên đám đông; cùng 113 phần tử DOM với 100/300/500 người. JS heap sau thu gom rác trong sáu lần đo khoảng **3,77–3,85 MB**. Đây là kiểm tra ngắn hạn, chưa chứng minh ổn định liên tục nhiều giờ.

### Hiệu năng đo thực tế

Chromium headless Linux cloud, dựng hình phần mềm, một overlay 1080×1920, đủ 60 nhân vật; chưa chạy OBS encoder. Mỗi lượt chờ tải 9 giây rồi đo khoảng 6–7 giây, tính từ số khung thực đã vẽ. Không bật chụp màn hình trong khoảng đo.

| Người chờ được giữ | Rực rỡ: 88 hình | Nhẹ: 49 hình |
| ---: | ---: | ---: |
| 100 | 9,98 FPS | 21,53 FPS |
| 300 | 15,76 FPS | 15,94 FPS |
| 500 | 20,45 FPS | 20,14 FPS |

Tốc độ dao động theo tải của bộ dựng hình cloud; số liệu này **chưa xác nhận 30 FPS ổn định** và không suy ra tốc độ Windows. Chọn Nhẹ nếu máy phát cần giảm tải và kiểm tra dropped frames khi OBS/LIVE Studio đang encode.

Số đo gốc: [hình ảnh](verification/v010/visual-check.json), [điều khiển/hiệu năng](verification/v010/control-performance.json), [âm thanh](verification/v010/audio-playback.json), [phục hồi](verification/v010/recovery.json).

## Phần cần anh kiểm tra trên máy LIVE

- **Danh mục thật và icon**: Corgi/Galaxy đã có ID/giá/icon từ nguồn công khai, nhưng chưa kết nối tài khoản Thái của anh. CDN TikTok bị chặn trong cloud nên ảnh kiểm tra hiện dấu `✧` thay cho hai icon; máy LIVE tải URL đã cấu hình. Không bịa tên Thái chính thức hoặc ghép icon giả vào ảnh.
- **Giọng Thái thật**: cloud không truy cập được Edge TTS, chưa nghe duyệt phát âm/âm sắc. Luồng TTS/banner được kiểm tra bằng fixture. Internet máy LIVE cần tạo tiếng lần đầu; không cần cài tiếng Thái Windows. Gói không chứa bản thu mới; có thể dùng bản thu đúng nguyên văn tại `assets/ganesha/audio/ganesha-blessing-th.mp3`.
- Chưa thử Windows, OBS/LIVE Studio, TikTok thật hoặc buổi phát nhiều giờ. Đây là bản cập nhật để anh test và duyệt phát thực; chưa coi là chứng nhận không cần kiểm tra. Hình sprite 2.5D và diễn giải nghi thức cần anh duyệt trực quan/văn hóa.

## Ảnh trực tiếp từ ứng dụng

- [100 người chờ](screenshots/v010/crowd-100.jpg) · [300 người](screenshots/v010/crowd-300.jpg) · [500 người](screenshots/v010/crowd-500.jpg).
- [Bố cục điện thoại](screenshots/v010/phone-normal.jpg).
- [Mushika truyền sáng](screenshots/v010/mushika-transfer.jpg) · [nhân vật nam ghé tai](screenshots/v010/mushika-male.jpg).
- [Ganesha đang hiện từ chân lên](screenshots/v010/standing-appearance.jpg) · [ban phước và banner](screenshots/v010/standing-blessing.jpg).
- [Sau nghi thức](screenshots/v010/after-ritual.jpg).
