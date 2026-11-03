# Ganesha Blessing · พระพิฆเนศ

Cảnh LIVE 2.5D bằng Canvas, khung 1080 × 1920, nội dung người xem bằng tiếng Thái. Bảng điều khiển bằng tiếng Việt. Không cần cài Unity hoặc một engine 3D.

## Bản 0.11

Dùng file `Ganesha-Blessing-0.11-review.zip` được bàn giao cùng bản nháp này; giải nén toàn bộ trước khi chạy. Đây là gói kiểm tra cục bộ, chưa xuất bản lên GitHub.

[Báo cáo triển khai, mapping và bằng chứng](docs/BAN-GIAO-V0.11.md). Có 13 nút nghi thức để thử; **Đèn 1, Hương tình yêu 5 và Tràng hoa 15 chưa có ID nguồn Thái được xác thực**, chỉ dùng demo cho tới khi gán ID. Corgi 299 vẫn là quà kích hoạt Mushika; Galaxy 1.000 giữ nguyên.

- Một camera trên gốc thế giới: sân, kiến trúc, tượng, người quỳ, hàng chờ và vật lễ cùng chuyển động. Tên được chiếu ra lớp UI riêng; không có hệ số phóng lớn nhân vật do quà.
- Giữ đường camera v0.8 cho sáu quà cũ; sửa kích thước nhân vật từ 0.10.2 và bỏ tăng kích thước lúc mới vào ở 0.11. Hai nghi thức đặc biệt giữ góc rộng để thấy đủ nhân vật và hướng truyền lời/ban phước.
- Sân trung tâm thoáng, 60 ghế chia hai bên. Điểm dâng sen nhỏ, lư hương và đèn cố định bên phải, tách khỏi Mushika.
- Quà và công đức chung một khung trong suốt, chữ Thái lớn, icon catalog thật khi có. Bảng thu gọn khi diễn ra nghi thức. Không dựng lại thông báo quà ×1 hoặc bình luận TikTok.
- Doughnut mở quyền lấy một bình luận của đúng người gửi trong 30 giây. Mỗi đơn vị quà một quyền, xử lý tuần tự, tối đa 100 cụm ký tự; chỉ render văn bản thuần.
- Hàng chờ giữ đủ dữ liệu, vẽ tối đa 88 nhân vật vai/đầu từ atlas game; không tải ảnh đại diện. Giới hạn particle, cache và tối đa 12 oscillator âm thanh.
- Chuyển động vào ghế theo thời gian thực, camera chờ nhân vật sẵn sàng. Lịch vẽ giữ nhịp 30 FPS; số đo cloud và giới hạn máy phát được ghi trong báo cáo.
- Lời ban phước Galaxy bằng Niwat nam tiếng Thái có MP3 cục bộ; lời cảm ơn theo tên dùng Edge trực tuyến. Giọng trực tuyến hỗ trợ proxy của máy nếu được cấu hình.

## Mở game

Windows: cài **Node.js 24+**, đóng server cũ, chạy `CHAY-LIVE.bat`. Lần đầu cần Internet để cài thư viện. Muốn giữ dữ liệu, chép `live/data` từ bản cũ sau khi đã đóng server. Làm mới cache nguồn OBS hoặc `Ctrl+F5` sau khi cập nhật.

```sh
cd live
npm ci --no-audit --no-fund
npm start
```

- Điều khiển: `http://localhost:3000/live/control.html`.
- Cửa sổ LIVE/OBS Browser Source: `http://localhost:3000/live/overlay.html`, rộng 1080, cao 1920.
- Debug phát triển: thêm `?debugCamera=1` vào URL overlay; hiện người focus, chủ camera, transform thế giới và kích thước cục bộ trước/trong/sau.
- Khung xem trước trong bảng điều khiển luôn tắt tiếng. Chỉ mở tiếng ở một cửa sổ LIVE/OBS để tránh đọc trùng. Nếu trình duyệt chặn tự phát, bấm `♫ เปิดเสียง`.

Hướng dẫn Windows: [HUONG-DAN-WINDOWS.txt](HUONG-DAN-WINDOWS.txt). Phiếu thử trên máy phát: [TEST-LIVE.md](TEST-LIVE.md).

## Thử và nối nguồn thật

Ứng dụng mở ở DEMO, tách dữ liệu khỏi LIVE. Dùng các nút quà để thử sáu món chính hoặc Corgi/Galaxy; nút chuỗi quà thử nhiều người xen kẽ. Với Doughnut, nhập bình luận bằng **cùng tên demo** đã tặng quà; ở LIVE, đối chiếu bằng uniqueId, không dựa vào tên hiển thị. Không gửi bình luận thì sau 30 giây hiện lời chúc mặc định tiếng Thái. Bấm 100/300/500 người để thử hàng chờ. Reset giữa nghi thức để kiểm tra camera và ánh sáng phục hồi.

Nối TikFinity: bật WebSocket server trong TikFinity, chọn TikFinity ở bảng điều khiển, nhập URL đúng của máy phát rồi Kết nối. Bridge trực tiếp TikTok cũng có trong bảng điều khiển; tính sẵn có tùy dịch vụ. Không tự mở LIVE thật hoặc gửi quà thật trong kiểm thử cloud.

Quà đi qua normalizer → nhận diện ID/giá một món → ghi công đức → xếp ghế → FIFO nghi thức → camera/âm thanh. Demo cũng qua normalizer và dispatch này. Ba món pending dùng ID `demo:<loại>` chỉ trong DEMO, không dùng làm ID TikTok.

Ưu tiên ID gán thủ công trong **Ánh xạ ID quà thật**, sau đó ID được bridge cung cấp/cấu hình và catalog. Các tên + giá chính xác của quà cũ được giữ để tương thích; không phân loại bằng giá đơn thuần. Khi một loại đã gán ID, tắt nhận diện theo tên cho loại đó. Quà chưa khớp vẫn cộng đủ công đức nhưng không chạy nhầm nghi thức lớn.

Combo loại streak chờ bản tin kết thúc. Có groupId/repeatId thì chỉ cộng phần tăng mới ở các bản tin kết thúc; cùng msgId bị lọc trùng. Ledger giữ qua reconnect trong cùng tiến trình. Bridge không gửi cả ID bản tin lẫn ID nhóm thì không bảo đảm chống replay; ledger chống trùng không lưu qua lần khởi động server mới.

## Quà, người và âm thanh

Xem bảng đầy đủ và nguồn ID trong [báo cáo 0.11](docs/BAN-GIAO-V0.11.md), [nguồn icon](assets/ganesha/gifts/README_VI.md), [đối chiếu Corgi/Galaxy](docs/QUA-MOI.md). Icon còn thiếu hiện ô trống có chữ Thái, không dùng emoji giả quà. Khi bridge gửi icon HTTPS cho quà đã nhận diện, metadata được lưu. Catalog công khai không bảo đảm quà đang bán trên tài khoản Thái cụ thể.

Mặc định có 10 nhân vật nền mang nhãn `บรรยากาศจำลอง`, không tạo quà/điểm/người tặng giả. Người tặng mới vào ghế 11–60. Khi đầy, người có lần tặng gần nhất cũ nhất rời đi; người đang làm lễ được bảo vệ. Người vào phòng đứng hàng dưới khi bật tùy chọn. Toàn bộ dữ liệu chờ được giữ; mỗi 12 giây chỉ luân phiên một hàng xa, mười vị trí gần ổn định. Bình luận `1` chọn nữ, `2` chọn nam; giữ lựa chọn khi lên ghế/làm lễ.

Nhạc **Eastern Serenity** dài 280 giây, lặp bằng AudioBufferSourceNode, nguồn Kevin MacLeod CC0; [giấy phép](assets/ganesha/music/LICENSE.txt). Đây là nhạc thiền Á Đông, không tuyên bố là nhạc nghi lễ Phật giáo Thái truyền thống. Có volume nhạc/giọng/hiệu ứng riêng, nhạc hạ khi đọc và tăng lại từ từ.

Giọng ban phước Galaxy cố định **th-TH-NiwatNeural**, tốc độ −12%, cao độ −6 Hz, bass nhẹ/reverb ngắn. Banner `พรจากพระพิฆเนศ` cùng tên người nhận/câu đọc, giữ 2,5 giây sau kết thúc âm thanh. Mất audio có nhánh thời hạn dự phòng để phục hồi cảnh. Lời cảm ơn thường dùng giọng Thái chọn trong điều khiển. Edge TTS cần Internet tới `speech.platform.bing.com`, không cần cài gói ngôn ngữ Windows. Cloud chưa nghe duyệt giọng Niwat thật.

Lúc vắng quà, nhắc tim/chia sẻ sau 10 giây; lần tiếp theo cách 10 giây **sau khi câu trước đọc xong**. Quà mới ngắt lời nhắc. Không có chuyển động nền nào tự giành camera.

## Dữ liệu và kiểm thử

`live/data/session.json` chứa cấu hình, điểm, người, hàng chờ ghế/đầu–vai, quyền lời cầu nguyện và lượt nghi thức LIVE. Không đưa dữ liệu riêng này vào Git/ZIP. `live/tts` là cache giọng. Có thể đổi thư mục dữ liệu bằng `GANESHA_DATA_DIR`. Khi phục hồi, lượt đang dở chạy lại từ đầu nhưng không cộng lại xu; kết nối nguồn/âm thanh phải mở lại.

```sh
cd live
npm test
```

Các script `scripts/verify-*-v011.py` chạy Chromium với server thử riêng và reset dữ liệu thử. Không trỏ chúng vào phiên LIVE đang phát. Video, môi trường đo và giới hạn nằm trong báo cáo. Kết quả cloud là mô phỏng TikFinity qua đường xử lý LIVE thật của phần mềm, **không phải quà từ một phiên TikTok LIVE thật**. Chất lượng giọng, font, nghi lễ và hiệu năng khi OBS encode cần duyệt trên máy phát.

Artwork cảnh/nhân vật dùng sprite 2.5D, chưa phải rig 3D; xem [ARTWORK.md](assets/ganesha/ARTWORK.md). Không có bộ tham chiếu `ganesha_gift_reference` hoặc video `1000086073.mp4` truy cập được trong workspace của đợt này; không tuyên bố đã đối chiếu những file đó.

Nền kết nối phát triển từ `kentjuno/chanh-dien-online`, theo MIT; giữ [LICENSE](LICENSE) và [UPSTREAM.md](UPSTREAM.md). Font Noto có giấy phép đi kèm. Logo/icon TikTok thuộc chủ sở hữu, không được đổi thành tài sản MIT/CC0 của dự án.
