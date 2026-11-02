# Bàn giao Ganesha LIVE 0.9 — 02/11/2026

Bản nâng cấp dùng engine Canvas 2.5D hiện có, giữ sáu quà cũ và bổ sung hai nghi thức. Mã nguồn và tài nguyên nằm trên nhánh `codex/ganesha-live-v0.9`; không gộp vào `main`.

## Đã thực hiện

- Hàng chờ bằng avatar/tên nhiều lớp ở mép dưới: giữ toàn bộ hồ sơ, chỉ vẽ tối đa 88 avatar (49 ở mức Nhẹ), 10 vị trí gần ổn định, hàng xa luân phiên. Cache ảnh thu nhỏ tối đa 112, tải đồng thời tối đa 4; ảnh lỗi dùng chữ đầu tên. Số người thật và DEMO tách riêng.
- Bảng tên người quỳ tăng từ 18 lên 22 px, đậm, nền tối; giữ nét 1080×1920 kể cả mức Nhẹ, tách khỏi tư thế cúi lạy và nằm trên lớp nhân vật. Rút gọn theo cụm Unicode; người được focus có tên đầy đủ. Tránh vùng hình tượng hiển linh, người nhận và động tác ghé tai.
- Bảng công đức có nền 20%, blur 3 px, viền vàng mảnh, chữ không bị giảm opacity. Mức Nhẹ tắt blur. Bảng quà mới gọn hơn, có hướng dẫn bình luận 1/2.
- Mushika 299: artwork chuột riêng, atlas tư thế nam/nữ, đi tới vị trí tai, khum tay/ghé 3,6 giây, luồng sáng, hoa sen, chắp tay và quay về. Camera riêng; toàn nghi thức 14 giây.
- Galaxy 1.000: artwork Ganesha bốn tay riêng, bàn tay ban phước chuyển động, mandala hai lớp, ánh sáng tới người nhận, hoa sen/cánh hoa, dịu ánh sáng nền và thu hồi hiệu ứng. Thời lượng tối thiểu 20 giây, kéo dài theo tiếng nói.
- Luồng giọng nam Thái Niwat đã nối vào Edge TTS của ứng dụng, kèm bass/vang nhẹ. Một câu Thái dùng chung cho giọng và banner; tên người nhận riêng. Banner theo sự kiện phát thật, giữ thêm 2,5 giây rồi tan 0,7 giây; nếu tiếng lỗi/tắt, dùng bản chữ đủ thời gian đọc. Nhạc tự nhỏ; nhạc, hiệu ứng, giọng có âm lượng và bật/tắt riêng.
- Mỗi sự kiện quà kết thúc giữ một lượt, kể cả cùng người; một combo ×N là một nghi thức ×N và tính đủ N món. Chạy FIFO, không hết hạn, không tranh camera. Người mới vẫn vào hàng trong lúc làm lễ. Người chờ đầu hàng được cấp ghế hợp lệ trước khi bắt đầu.
- Giữ ghế/hàng chờ/lượt quà qua khởi động lại; lượt đang dở chạy lại từ đầu, không cộng lại xu. Chế độ DEMO độc lập. Reset dọn camera, banner, giọng, ánh sáng và hiệu ứng.
- Đã kèm ba PNG alpha mới, font Thái, nhạc thiền Á Đông 4:40 lặp sẵn, tám nút quà, 100/300/500 avatar, năm lượt liên tiếp và Reset demo.

## Chạy và thử

1. Giải nén **toàn bộ** ZIP vào thư mục mới. Cài Node.js 24+, chạy `CHAY-LIVE.bat`; giữ cửa sổ lệnh mở.
2. Mở `http://localhost:3000/live/control.html`, mở cửa sổ LIVE riêng và bấm mở tiếng. Khung xem trước luôn im lặng.
3. Trong DEMO chọn nam/nữ, bấm **Bạn đồng hành · thử nghi thức** hoặc **Thiên hà · thử nghi thức**. Người chưa có ghế cần khoảng 8 giây vào chỗ trước khi đến lượt làm lễ.
4. Bấm **500 avatar**, **50 · đầy chỗ**, **5 lượt liên tiếp · cùng người**, rồi **Reset demo** để thử áp lực và dọn cảnh. Các nút đi qua cùng bộ xử lý với nguồn sự kiện.
5. OBS Browser Source: `http://localhost:3000/live/overlay.html`, 1080×1920. Mở tiếng trong đúng nguồn dùng phát, tránh thu hai cửa sổ. Xem [hướng dẫn Windows](../HUONG-DAN-WINDOWS.txt) và [phiếu test trên máy LIVE](../TEST-LIVE.md).

Khi nâng cấp, có thể chép `live/data/session.json` từ bản cũ **sau khi đóng server cũ** để giữ cấu hình/điểm. Không chép `node_modules`; bản mới tự cài lại. Không đưa dữ liệu phiên cá nhân vào ZIP chia sẻ.

## Đã kiểm thử và phạm vi kết luận

- **49/49 kiểm thử Node đạt**, gồm nguồn TikFinity giả lập qua WebSocket thật, tám loại quà, ID/giá/combo/chống lặp trong phiên, FIFO lớn, 2.001 người chờ ghế, 500–1.200 người chờ avatar, thứ tự nhường chỗ, phục hồi, nam/nữ, chuyển động, giới hạn hạt, nhạc lặp và lịch lời nhắc.
- Kiểm tra đường đi từ cả 60 ghế với bước thời gian 16 ms; tọa độ hữu hạn, không nhảy vị trí; giữ pha ghé tai 3,6 giây. Đây là kiểm tra kỹ thuật kết hợp xem ảnh, không thay thế việc xem chuyển động trên máy phát.
- Chromium thực ở 1080×1920: 60 nhân vật, 500 hồ sơ qua nguồn giả lập, avatar ảnh cục bộ và ảnh hỏng, 88/49 hình được vẽ đúng, không tăng DOM theo số người, không lỗi JavaScript. Đã xem khung điện thoại 390×844. Ảnh trong thư mục dưới là **ảnh chụp ứng dụng**, dữ liệu người xem là fixture/DEMO, không phải LIVE TikTok thật.
- Ba lượt Galaxy liên tiếp dùng **MP3 tín hiệu thử 7,8 giây**, phát qua Audio/Web Audio thật và thông báo bắt đầu/kết thúc thật. Banner vẫn hiện sau 2,1 giây kể từ `ended`, sau đó giữ/mờ theo lịch; camera/ánh sáng về bình thường. JS heap cuối lượt khoảng 4,71 / 4,73 / 4,73 MB, cache sprite 175 và bảng tên 51 ổn định, không còn âm hiệu ứng sau reset. Số liệu ngắn hạn này không chứng minh LIVE nhiều giờ không tăng bộ nhớ.
- Đã bấm các nút qua giao diện điều khiển thật: lưu ID/âm lượng, 500 avatar, 50 người quỳ, chọn nam, Mushika, Galaxy, reset giữa lúc ban phước và gửi năm lượt liên tiếp. Đủ năm lượt, tổng 2.601 xu, không lỗi JavaScript.
- File MP3 thử chỉ nằm ngoài bản phát hành. **Không dùng tín hiệu thử để giả làm giọng Thái.** Test TTS kiểm tra đúng tên Niwat, đúng câu, tốc độ/cao độ, cache và đồng bộ; chưa nghe được kết quả dịch vụ Thái thật từ cloud.

### Hiệu năng đã đo

Chromium headless trên Linux cloud, giới hạn CPU 4 lõi, đồ họa phần mềm, khung 1080×1920; chưa chạy OBS encoder. FPS tính bằng số khung thực sự vẽ chia thời gian `performance.now()`, không suy ra từ giá trị cấu hình 30 FPS.

| Cảnh thử | Thời gian đo | FPS thực tế |
| --- | ---: | ---: |
| 60 nhân vật + 500 hồ sơ, Rực rỡ, lần đầu sau nạp hàng loạt | 9,62 giây | 0,42 |
| Cùng lượt thử, Galaxy Rực rỡ | 6,02 giây | 16,10 |
| Cùng lượt thử, cảnh thường Nhẹ | 8,03 giây | 9,59 |
| Cùng lượt thử, Galaxy Nhẹ | 6,11 giây | 9,65 |
| Lượt riêng, 60 nhân vật + 500 DEMO, đã chờ tải 20 giây, Rực rỡ | 8,08 giây | 8,54 |
| Lượt chẩn đoán riêng, một cửa sổ overlay, 60 nhân vật + 500 DEMO, Rực rỡ | 6,18 giây | 23,46 |
| Lượt chẩn đoán riêng, cùng cảnh ở mức Nhẹ | 6,01 giây | 20,30 |

Lượt chẩn đoán ghi thời gian JavaScript khoảng 0,33–0,44 giây trong 6 giây; phần lớn tải nằm ở trình dựng hình phần mềm. Có khựng rõ khi nạp hàng loạt và tốc độ còn dao động trên môi trường này. **Chưa đạt hoặc xác nhận 30 FPS ổn định.** Mức Nhẹ giảm ảnh/hạt/blur nhưng không đảm bảo nhanh hơn trong mọi lần đo trên bộ dựng đồ họa phần mềm. Cần chạy phiếu test với OBS/LIVE Studio trên máy Windows thật; bản bàn giao không phải chứng nhận sẵn sàng LIVE không cần thử.

Các số đo gốc: [hiệu năng](verification/performance.json), [kiểm tra giao diện](verification/control-check.json), [ba lượt âm thanh](verification/audio-playback.json), [chẩn đoán dựng hình](verification/render-profile.txt).

## Còn cần đối chiếu trên máy anh

- **Quà 299:** chưa xác minh được ID, tên Thái, icon “Bạn đồng hành”; để trống mặc định. DEMO dùng ngay. Khi có sự kiện thật, gắn ID tại **Hai quà mới**; không dùng mọi quà 299 để kích hoạt.
- **Galaxy:** ID **11046**, giá **1.000**, icon đối chiếu từ hai bộ dữ liệu công khai. Chưa xác nhận có trên tài khoản Thái của anh; chưa có tên Thái chính thức. [Nguồn và cách cấu hình](QUA-MOI.md). Bảng quà LIVE chỉ thêm mục khi có tên và ID; sự kiện LIVE khớp ID có tên Thái có thể tự điền ô tên còn trống.
- **Giọng Niwat thật:** cloud không truy cập được dịch vụ Edge TTS. Ứng dụng đã cấu hình dịch vụ, không cần cài tiếng Thái Windows, nhưng cần Internet để tạo tiếng lần đầu. Anh nghe thử và duyệt phát âm/âm sắc. Không có bản thu Thái tạo sẵn trong gói; có thể đặt bản thu đúng nguyên văn tại `assets/ganesha/audio/ganesha-blessing-th.mp3`.
- Chưa kết nối tài khoản TikTok thật, chưa thử Windows/OBS/LIVE Studio và chưa thử phát liên tục nhiều giờ. Chống trùng dùng ID sự kiện trong kết nối hiện tại; không cam kết chống phát lại từ nguồn không có ID hoặc sau khi nguồn khởi động lại.
- Hình là sprite 2.5D; tư thế và nội dung nghi thức cần anh duyệt về hình ảnh/văn hóa. Nhạc đi kèm là bản ghép thiền Á Đông CC0, không được giới thiệu là bản thu nghi lễ Thái chính thức.

## Ảnh chụp

- [Hàng 500 người DEMO, 60 nhân vật — 1080×1920](screenshots/crowd-1080.png)
- [Nam ghé tai Mushika — 1080×1920](screenshots/mushika-1080.png)
- [Ganesha hiển linh và banner — 1080×1920](screenshots/galaxy-1080.png)
- [Kiểm tra bố cục trong viewport điện thoại 390×844](screenshots/phone-390.png)
