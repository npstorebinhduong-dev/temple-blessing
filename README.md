# Ganesha LIVE · พระพิฆเนศ

Cảnh livestream tương tác 1080 × 1920 dành cho người xem Thái: Ganesha ở trung tâm, nhân vật áo trắng/vàng đi vào, quỳ chắp tay và cúi lạy, bảng tên, xếp hạng, mục tiêu và sáu hiệu ứng dâng lễ, nhân vật nam/nữ và lời cầu chúc tiếng Thái. Bảng điều khiển bằng tiếng Việt cho người vận hành.

## Chạy bản 0.5.1

Bản 0.5.1 sửa nhân vật biến mất khi quỳ/cúi lạy do ảnh tải chưa xong đã bị lưu thành khung trống. Nhân vật giữ tư thế quỳ trong lúc chờ ảnh lạy; áp dụng cho cả nam/nữ và nhân vật dâng lễ.

Cài **Node.js 24 trở lên**. Trên Windows, giải nén toàn bộ gói và chạy `CHAY-LIVE.bat`. Hướng dẫn thao tác đầy đủ trong [HUONG-DAN-WINDOWS.txt](HUONG-DAN-WINDOWS.txt).

Hoặc từ thư mục dự án:

```sh
cd live
npm ci --no-audit --no-fund
npm start
```

Bảng điều khiển: `http://localhost:3000/live/control.html`.
Nguồn Browser Source cho OBS: `http://localhost:3000/live/overlay.html`, rộng **1080**, cao **1920**. Với LIVE Studio, dùng nguồn trình duyệt nếu có; hoặc chụp cửa sổ overlay và thu âm thanh của trình duyệt. Tắt tiếng các cửa sổ overlay dư để không phát âm thanh hai lần.

Ứng dụng khởi động ở **DEMO** với 10 nhân vật nền, chưa có người tặng và chưa có điểm. Dùng các nút quà hoặc chạy mô phỏng để kiểm tra. Nút **50 · đầy chỗ** thêm người thử vào 50 chỗ còn lại; nút **80 · thử hàng chờ** kiểm tra người cũ đi ra, người mới vào. Bản xem trước trong bảng điều khiển luôn tắt tiếng. Cửa sổ overlay có nút mở âm thanh nếu trình duyệt chặn tự phát.

## Kiểm tra khi không nghe tiếng

1. Bấm **Thử loa / chuông**: từ v0.2.1, chuông thử phát ngay tại bảng điều khiển, không cần mở overlay. Tăng thanh âm lượng nếu đang bằng 0.
2. Nếu chuông thử cũng im, kiểm tra tab trình duyệt có bị tắt tiếng; trên Windows, mở Bộ trộn âm lượng (Volume mixer), kiểm tra âm lượng Edge/Chrome và thiết bị đầu ra. Thử video YouTube trên cùng trình duyệt.
3. Bấm **Lưu cấu hình**, mở **Mở màn hình LIVE**, bấm nút Thái **♫ เปิดเสียง**. Sẽ có một tiếng chuông xác nhận. Nút tự hiện lại nếu trình duyệt tạm dừng âm thanh. Khung xem trước trong bảng điều khiển luôn tắt tiếng.
4. Nếu chuông/âm nền có tiếng nhưng giọng Thái im, bấm **Thử giọng Thái**, chờ tối đa 15 giây và xem Nhật ký phiên. Kiểm tra Internet nếu nhật ký báo lỗi Edge TTS.
5. Trong OBS, âm thanh có thể vào mixer nhưng không phát ra loa máy; dùng Audio Monitoring để nghe thử và tránh thu trùng hai lần.

## Kết nối thật

1. Mở TikFinity Desktop trên **cùng máy** chạy Ganesha LIVE.
2. Kết nối TikFinity với kênh đang LIVE và bật WebSocket server.
3. Chọn TikFinity Desktop, dùng địa chỉ nó cung cấp (thường `ws://127.0.0.1:21213/`), bấm **Kết nối LIVE**.
4. Ứng dụng đổi sang dữ liệu LIVE riêng, bỏ nhân vật demo khỏi màn hình. Bình luận tạo nhân vật; quà kích hoạt hiệu ứng và cộng xu. Lượt thích tạo tim; lượt theo dõi tạo điểm sáng. Có thể bật cho người vừa vào phòng xuất hiện.
5. Thử một bình luận và một quà thật. “Đã kết nối nguồn” chỉ xác nhận kết nối tới TikFinity, chưa xác nhận kênh đang phát sự kiện.

TikFinity tự kết nối lại sau 2 giây khi mất socket. Chế độ TikTok trực tiếp là lựa chọn thử nghiệm, phụ thuộc thư viện và dịch vụ bên ngoài; cần kết nối lại thủ công khi bị ngắt. Không nhập hoặc lưu cookie, mật khẩu TikTok trong ứng dụng.

## Quy tắc quà

| Quà TikTok đã chọn | Xu mỗi món | Hiệu ứng |
| --- | ---: | --- |
| Hoa hồng · Rose | 1 | `lotus` · Dâng hoa sen |
| Quả đào · Peach | 5 | `incense` · Dâng hương |
| OK | 5 | `garland` · Dâng vòng hoa |
| Cỏ 4 lá · Clover | 10 | `aarti` · Nghi lễ ánh sáng |
| Bó hoa · Bouquet | 100 | `marigold` · **Golden Marigold Offering** · 20 giây |
| Bóng tình yêu · Love Balloon | 500 | `royal` · **Royal Ganesha Offering** · 24 giây |

Với Bó hoa, nhân vật mang vòng hoa vạn thọ vàng cam lên bàn thờ, quỳ nâng hoa, rồi trở về chỗ. Với Bóng tình yêu, nhân vật mang mâm vàng/đỏ gồm Modak, trái cây, dừa, hoa vạn thọ và đèn lễ; có ánh sáng, cánh hoa vàng, đèn hai bên và chuông trầm riêng. Nghi lễ hoạt động cho cả nhân vật nam và nữ. Từ v0.3, góc nhìn phóng theo nhân vật khi đi lên (1,45× với 100 xu; 1,62× với 500 xu), giữ cảnh cận khi dâng rồi trở về toàn cảnh. Tượng, nền và nhân vật phóng đồng bộ; bảng quà, xếp hạng và chữ trên màn hình giữ vị trí. Có thể tắt zoom. Thiết lập Giảm chuyển động của trình duyệt sẽ tắt zoom và giảm mưa hoa.

Quà 500 xu có mưa hoa vàng/hồng phủ toàn màn hình, cùng một đợt hoa bung khi nâng mâm. Giới hạn 320 cánh hoa để giữ tài nguyên ổn định; chế độ Nhẹ và thiết lập giảm chuyển động của trình duyệt giảm số cánh hoa. Khi kết thúc, hoa mờ hết trong khoảng 2 giây; đổi DEMO/LIVE hoặc tải lại sẽ xóa toàn bộ hiệu ứng.

Nhận diện bằng **đúng tên quà + giá một món**, hỗ trợ tên tiếng Anh/Thái/Việt. Giá trên là cấu hình bạn đã chọn; kiểm tra lại dữ liệu TikFinity trên kênh thật vì danh mục có thể thay đổi. Combo 500 Hoa hồng 1 xu vẫn tạo hoa sen, cộng đủ 500 xu. Combo chỉ tính khi kết thúc (`giftType`, `repeatEnd`, `repeatCount`). Các gói cùng `msgId` được lọc trùng trong 5 phút; không có ID thì không đảm bảo chống phát lại. Bộ nhớ chống trùng không giữ qua lần khởi động server mới.

Lấy ID từ nhật ký rồi vào **Cảnh & âm thanh → Ánh xạ ID quà thật**, nhập `ID=loại` bằng ID số thật. Ví dụ cú pháp `123456=marigold` (ID minh họa). ID vẫn cần đúng giá một món. Khi một loại đã gán ID, nhận diện bằng tên cho loại đó được tắt. Quà chưa khớp vẫn cộng điểm và có lời cảm ơn; nhật ký ghi “chưa gán hiệu ứng”. Các nút demo luôn thử được sáu loại, kể cả khi đã cài ID thật.

Hàng đợi ưu tiên nghi lễ 100/500 xu sau lượt đang chạy. Tối đa 8 hiệu ứng cơ bản chờ 40 giây và 64 nghi lễ đặc biệt chờ 30 phút; gộp quà cùng người/cùng loại đang chờ. Quà cơ bản không đẩy nghi lễ đặc biệt ra khỏi hàng đợi. Khi quá giới hạn, có thể bỏ hiệu ứng hình ảnh; điểm quà luôn được tính độc lập. Hàng chờ nghi lễ chạy trên máy chủ; tải lại overlay tiếp tục nghi lễ đang diễn ra và giữ hàng chờ. Đổi DEMO/LIVE, dọn cảnh hoặc khởi động lại máy chủ sẽ xóa hiệu ứng đang chờ. Lưu cấu hình giữ nghi lễ đang chạy.

## Nhạc nền đi kèm

**Eastern Serenity**, dài **4 phút 40 giây**, là bản ghép nhạc thiền Á Đông từ hai bản thu của **Kevin MacLeod**: *The Hidden Valley of Shambhala* và *Midnight in the Green House*. Bản mới thay Thai Dawn của các phiên bản trước. Hai nguồn được phát hành trong danh mục FreePD dưới CC0 / Public Domain; nguồn cố định, SHA-256 và các chỉnh sửa được ghi trong [thông tin nhạc](assets/ganesha/music/LICENSE.txt), kèm toàn văn [CC0](assets/ganesha/music/CC0-1.0.txt).

- Nhạc và **Lặp nhạc liên tục** bật sẵn khi cài mới. File MP3 đi kèm gói, không cần Internet để phát. Khi nâng cấp, giữ nguyên lựa chọn bật/tắt và âm lượng đã lưu của bạn.
- Hai đoạn được cân âm lượng, chuyển tiếp trong 8 giây và xử lý nối đầu/cuối trong 8 giây; vòng phát cuối cùng dài 280 giây. Đây là bản ghép từ các tác phẩm có sẵn, không phải bản thu nghi lễ Phật giáo Thái truyền thống.
- Chỉnh **Âm lượng nhạc nền** độc lập với âm lượng tổng. Khi giọng cầu chúc phát, nhạc tự hạ còn 20% mức đã chọn rồi tăng trở lại.
- **Nghe thử nhạc tại đây** phát ngay tại bảng điều khiển. Dừng nghe thử trước khi dùng nguồn LIVE để tránh thu hai nguồn cùng lúc.
- **Phát lại nhạc trên LIVE** đưa nhạc về đầu. Lưu cấu hình không tạo thêm bản nhạc chồng tiếng và không cắt nghi lễ.
- Tắt **Lặp nhạc liên tục** thì nhạc dừng khi hết 4:40; bật lại hoặc bấm Phát lại để tiếp tục.
- Mã chuẩn bị nhạc tại `scripts/prepare-eastern-serenity.py`; chỉ cần NumPy/ffmpeg nếu muốn tái tạo MP3 từ hai nguồn đã ghi, không cần để chạy LIVE.

## Nhân vật, lời cầu chúc và lúc vắng quà

- Mặc định xen kẽ nhân vật nam/nữ theo mã người xem. Gõ đúng `ชาย` (nam) hoặc `หญิง` (nữ) để đổi nhân vật; cũng nhận `male`, `female`, `nam`, `nữ`. Đây là lựa chọn avatar, không suy đoán giới tính thật. Có thể chọn toàn nam/toàn nữ cho người mới trong bảng điều khiển.
- Mỗi sự kiện quà đã chốt tạo lời cảm ơn và cầu chúc tiếng Thái; hai nghi lễ lớn có lời riêng. Giọng **bật sẵn**, dùng Edge TTS với Premwadee (nữ) hoặc Niwat (nam). Cần Internet, không cần cài gói tiếng Thái trên Windows hay mở Edge.
- Sau **10 giây không có quà**, cảnh nhắc thả tim và chia sẻ LIVE, lặp mỗi 10 giây. Quà mới đặt lại bộ đếm. Giọng người tặng được ưu tiên: cắt lời nhắc đang đọc và bỏ lời nhắc đang chờ. Khi giọng bận, lời nhắc chỉ hiện chữ; không xếp chồng tiếng.
- Cảnh bắt đầu với **10 nhân vật nền**, phân bố trên sàn, tại chỗ số 1–10. Các nhân vật này **giữ nguyên khi có quà**; không tên, có nhãn Thái `บรรยากาศจำลอง` và **không cộng vào người tương tác, xu, quà, tim hay xếp hạng**.
- **60 chỗ cố định**: người tặng quà mới vào từ chỗ 11–60. Người đã có mặt tặng tiếp vẫn giữ chỗ. Mặc định bình luận chỉ hiện trên nhân vật đã có mặt và cho phép chọn nam/nữ; có thể bật **Cho người bình luận vào hàng chờ** hoặc **Người vừa vào phòng cũng xuất hiện**.
- Khi đủ chỗ, người mới vào hàng chờ theo thứ tự đến. Người **ngồi lâu nhất** đứng dậy, đi ra trong khoảng 5 giây, rồi người đang chờ mới vào chỗ vừa trống; không xếp lại các chỗ khác. Tối đa hai lượt rời chỗ đồng thời. Cả nhân vật nền cũng nhường chỗ và không tự quay lại. Người mới có ít nhất 12 giây ngồi trước khi nhường; người đang/chờ làm lễ được giữ chỗ cho đến khi hết lượt hiệu ứng.
- Hàng chờ chỗ ngồi tối đa 500 người, mỗi người một lượt; quà tiếp theo cập nhật cùng người. Khi đầy hàng chờ, vẫn cộng xu và đọc cầu chúc, nhưng chưa thêm nhân vật. Nếu người đang đi ra tặng tiếp, họ hoàn tất lượt đi ra rồi vào cuối hàng chờ. Bảng điều khiển hiển thị số người trong cảnh, đang chờ và đang rời chỗ.
- Nam và nữ có chuỗi động tác **quỳ chắp tay → hạ hai tay, cúi đầu sát sàn → ngẩng lên**, lấy cảm hứng cách lạy năm điểm của Thái; lặp ba lần rồi nghỉ ngắn, mỗi người một nhịp. Đây là hoạt ảnh sprite, cần người hiểu nghi lễ Thái duyệt sắc thái động tác trước khi phát chính thức.
- Tay cầm sen và tay cầm búa vàng/khí cụ của Ganesha chuyển động lệch nhịp, giữ cố định khớp vai, kèm hào quang. Từ v0.5, mặc định **Rõ trên điện thoại**, biên độ khoảng 10–13 độ thay mức 1–2 độ trước đây; có thêm **Nhẹ** và **Mạnh**. Lưu cấu hình sau khi chỉnh. Có thể tắt bằng **Tay cầm sen và búa vàng chuyển động**. Thiết lập Giảm chuyển động của hệ thống giữ tư thế chắp tay và tắt chuyển động tay/zoom; bảng điều khiển hiện hướng dẫn khi máy đang bật chế độ này.
- Âm thanh chỉ phát ở overlay/OBS đã mở tiếng. Hàng đợi lời cầu chúc giới hạn 5 câu chờ; đợt quà quá dày có thể bỏ câu mới, vẫn tính đủ xu. Lỗi mạng TTS có timeout 15 giây và nghỉ 30 giây trước khi thử tiếp. Các câu nhắc được lưu đệm cục bộ.

## Dữ liệu và âm thanh

- Demo và LIVE có nhân vật, điểm và bảng xếp hạng riêng. Các nút thử quà bị khóa trong chế độ LIVE.
- Cấu hình và số liệu LIVE được lưu tại `live/data/session.json`; không đưa file này lên Git hay chia sẻ trong gói phát hành. Có thể đổi thư mục bằng `GANESHA_DATA_DIR`.
- Khi khởi động lại, chọn **Xem phiên LIVE đã lưu** hoặc kết nối nguồn để phục hồi điểm. Kết nối nguồn và âm thanh phải khởi động lại. Nhân vật quay lại khi có sự kiện mới; bảng xếp hạng đã lưu vẫn còn.
- **Dọn nhân vật** giữ nguyên điểm, dọn hàng chờ và trở về 10 nhân vật nền nếu đang bật tính năng. **Bắt đầu phiên mới** xóa số liệu của chế độ đang chọn và chỉ cho phép khi đã ngắt nguồn.
- Cảnh hiện tối đa 60 nhân vật, tính cả nhân vật nền và người đang đi ra. Việc rời chỗ không xóa điểm hoặc bảng xếp hạng. Chỗ ngồi/hàng chờ không lưu qua lần khởi động máy chủ mới.
- Hình ảnh, font Thái, bản nhạc MP3 và chuông chạy cục bộ; chuông được tổng hợp bằng Web Audio. Nhạc nền hiện tại là bản ghép CC0, độc lập với concept trước.
- Edge TTS cần truy cập `speech.platform.bing.com`. File âm thanh tạm ở `live/tts/`, không đưa vào Git hay gói chia sẻ. Khi nâng dữ liệu v0.1 lên v0.2, giọng được bật một lần; các lần sau giữ lựa chọn của bạn.

## Kiểm thử và giới hạn bản 0.5.1

```sh
cd live
npm test
```

Bộ kiểm thử dùng TikFinity giả lập và đồng hồ xác định để kiểm tra sáu quà, combo, ID, nam/nữ, 10 nhân vật nền, chỗ 11–60, hàng chờ 500 người, nhường chỗ theo thời gian ngồi, các pha lạy/tay tượng, các pha nghi lễ, zoom, giới hạn mưa hoa, lặp nhạc, nhạc nhỏ khi đọc giọng, nhắc 10 giây, ưu tiên giọng, reconnect, demo/LIVE, lưu/khôi phục và HTTP/WebSocket cục bộ. Test chạy với `GANESHA_OFFLINE_AUDIO=1` để không gọi dịch vụ giọng; biến này chỉ dùng cho kiểm thử. Không chứng minh tương thích phiên bản TikFinity trên máy người dùng hoặc giọng Edge TTS qua Internet.

Bộ hình nền, lớp tay tượng, hai atlas đi/quỳ, atlas cúi lạy, atlas nâng lễ và lễ vật được tạo bằng AI. Đây là cảnh 2.5D dùng sprite, chưa khớp mọi chuyển động/hiệu ứng của video tham chiếu. Nội dung tiếng Thái và âm thanh cần được nghe/đọc duyệt trong lần chạy thử. Bản phát nhắm 30 khung hình/giây; khung xem trước nhỏ chạy 15 khung hình/giây để giảm tải. Kiểm tra hiệu năng với OBS/LIVE Studio đang encode trên máy phát thực tế. Nếu máy chậm, chọn mưa hoa Nhẹ, tắt zoom/chuyển động tay và đóng các overlay dư. Cảnh dùng cố định 60 chỗ; không đổi mật độ khi người mới đến.

Các bước kiểm tra trước LIVE trong [TEST-LIVE.md](TEST-LIVE.md).

## Nguồn

Nền kết nối và các nguyên lý tương tác phát triển từ `kentjuno/chanh-dien-online`, theo MIT. Giữ nguyên [LICENSE](LICENSE) và thông tin [UPSTREAM.md](UPSTREAM.md). Concept và giao diện hiện tại đã chuyển sang Ganesha. Font Noto có giấy phép đi kèm trong `assets/ganesha/fonts/LICENSE.txt`.
