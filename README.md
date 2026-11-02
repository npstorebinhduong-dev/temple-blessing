# Ganesha LIVE · พระพิฆเนศ

Cảnh livestream tương tác 1080 × 1920 dành cho người xem Thái: Ganesha ở trung tâm, nhân vật áo trắng/vàng đi vào, quỳ chắp tay và cúi lạy, bảng tên, xếp hạng, mục tiêu và tám nghi thức dâng lễ, nhân vật nam/nữ và lời cầu chúc tiếng Thái. Bảng điều khiển bằng tiếng Việt cho người vận hành.

## Chạy bản 0.10.2

[Tải ZIP bản 0.10.2](https://github.com/npstorebinhduong-dev/temple-blessing/archive/refs/heads/codex/ganesha-live-v0.10.2.zip) · giải nén toàn bộ trước khi chạy.

Bản 0.10.2 bỏ kích thước nhân vật riêng khi lên lễ, chỉ zoom container toàn cảnh và bỏ hoa sen lớn của quà 1 xu; [nguyên nhân, video chuyển động và kiểm thử](docs/SUA-CAMERA-V0.10.2.md). Giữ các nâng cấp v0.10: gộp quà/công đức trong khung kính mờ ở vùng trên, thay hàng avatar bằng đám đông nam/nữ từ vai trở lên, nâng chuỗi truyền lời Mushika và dùng **asset Ganesha đứng mới** cho Galaxy. Trong hai nghi thức đặc biệt, tượng ngồi giữ cố định; ban phước có giọng/banner tiếng Thái, FIFO và dữ liệu LIVE được giữ.

**Corgi 299 xu, ID 6267** thay “Bạn đồng hành” và kích hoạt Mushika. **Galaxy 1.000 xu, ID 11046** giữ nguyên. ID/giá/icon trùng nhau ở hai danh mục công khai; chưa xác nhận danh mục của tài khoản Thái cụ thể. Khi nâng cấu hình cũ, các ánh xạ Mushika cũ được thay bằng Corgi một lần; sáu quà cũ/Galaxy và các lần sửa thủ công sau đó được giữ. [Nguồn đối chiếu](docs/QUA-MOI.md).

Báo cáo, ảnh chụp và giới hạn kiểm thử: [BÀN GIAO 0.10](docs/BAN-GIAO-V0.10.md). Giọng Niwat dùng dịch vụ Edge TTS; cloud chưa truy cập được dịch vụ để nghe duyệt chất giọng thật.

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
4. Ứng dụng đổi sang dữ liệu LIVE riêng, bỏ nhân vật demo khỏi màn hình. Mặc định quà mới đưa người vào cảnh, kích hoạt hiệu ứng và cộng xu; bình luận 1/2 chọn nhân vật trước hoặc sau khi tặng. Lượt thích tạo tim; lượt theo dõi tạo điểm sáng. Người vừa vào phòng đứng ở mép dưới khi TikFinity gửi sự kiện `member` có ID; không tự vào ghế.
5. Thử một bình luận và một quà thật. “Đã kết nối nguồn” chỉ xác nhận kết nối tới TikFinity, chưa xác nhận kênh đang phát sự kiện.

TikFinity tự kết nối lại sau 2 giây khi mất socket. Chế độ TikTok trực tiếp là lựa chọn thử nghiệm, phụ thuộc thư viện và dịch vụ bên ngoài; cần kết nối lại thủ công khi bị ngắt. Không nhập hoặc lưu cookie, mật khẩu TikTok trong ứng dụng.

## Quy tắc quà

| Quà TikTok đã chọn | Xu mỗi món | Hiệu ứng |
| --- | ---: | --- |
| Hoa hồng · Rose | 1 | `lotus` · Hạt sáng nhỏ quanh người tặng |
| Quả đào · Peach | 5 | `incense` · Dâng hương |
| OK | 5 | `garland` · Dâng vòng hoa |
| Cỏ 4 lá · Shamrock / Clover | 10 | `aarti` · Nghi lễ ánh sáng |
| Bó hoa · Bouquet | 100 | `marigold` · **Golden Marigold Offering** · 23 giây |
| Bóng tình yêu · Love Balloon | 500 | `royal` · **Royal Ganesha Offering** · 28 giây |
| Corgi · ID công khai 6267 | 299 | `mushika` · Ghé tai Mushika · 16 giây |
| Galaxy · ID công khai 11046 | 1.000 | `galaxy` · Ganesha hiển linh · khoảng 20 giây, theo độ dài âm thanh |

Với Bó hoa, nhân vật mang vòng hoa vạn thọ vàng cam lên bàn thờ, quỳ nâng hoa, rồi trở về chỗ. Với Bóng tình yêu, nhân vật mang mâm vàng/đỏ gồm Modak, trái cây, dừa, hoa vạn thọ và đèn lễ; có ánh sáng, cánh hoa vàng, đèn hai bên và chuông trầm riêng. Nghi lễ hoạt động cho cả nhân vật nam và nữ. Từ v0.3, góc nhìn phóng theo nhân vật khi đi lên (1,45× với 100 xu; 1,62× với 500 xu), giữ cảnh cận khi dâng rồi trở về toàn cảnh. Bản 0.10.2 giữ đường camera v0.8 trên container gốc của cả cảnh. Nhân vật đi, ngồi, dâng lễ, ghé tai và nhận phước dùng chung kích thước phối cảnh; bỏ các chiều cao riêng 300–350/250/282 px của nghi thức. Hai nghi thức 299/1.000 giữ góc rộng hiện tại. Bảng thông tin giữ vị trí. Bốn quà cơ bản cũng zoom theo đúng nhân vật đang đi vào hoặc đang ngồi. Thời lượng v0.7: Hoa hồng 4,5 giây (1,55×), Đào 5,5 giây (1,6×), OK 6 giây (1,6×), Cỏ bốn lá 8 giây (1,7×). Mỗi lượt gồm chuyển vào và thu về; quà 100/500 kéo dài thành 23/28 giây. Thời gian tăng thêm nằm ở đoạn giữ cận cảnh; nhịp đi lên và trở về giữ nguyên. Khi có nhiều quà, camera theo hàng đợi hiệu ứng, không nhảy qua người khác giữa lượt. Có thể tắt zoom. Thiết lập Giảm chuyển động của trình duyệt sẽ tắt zoom và giảm mưa hoa.

Quà 500 xu có mưa hoa vàng/hồng phủ toàn màn hình, cùng một đợt hoa bung khi nâng mâm. Giới hạn 320 cánh hoa để giữ tài nguyên ổn định; chế độ Nhẹ và thiết lập giảm chuyển động của trình duyệt giảm số cánh hoa. Khi kết thúc, hoa mờ hết trong khoảng 2 giây; đổi DEMO/LIVE hoặc tải lại sẽ xóa toàn bộ hiệu ứng.

Nhận diện bằng **đúng tên quà + giá một món**, hỗ trợ tên tiếng Anh/Thái/Việt. Giá trên là cấu hình bạn đã chọn; kiểm tra lại dữ liệu TikFinity trên kênh thật vì danh mục có thể thay đổi. Combo 500 Hoa hồng 1 xu vẫn chỉ tạo hạt sáng của quà nhỏ, cộng đủ 500 xu; không chạy nghi thức 500 xu. Combo chỉ tính khi kết thúc (`giftType`, `repeatEnd`, `repeatCount`). Các gói cùng `msgId` được lọc trùng trong 5 phút; không có ID thì không đảm bảo chống phát lại. Bộ nhớ chống trùng không giữ qua lần khởi động server mới.

**Shamrock ID 9875, giá 10 xu** đã được nhận sẵn, kể cả khi tên được TikTok dịch sang ngôn ngữ khác. Khi nâng dữ liệu cũ lên 0.7, các dòng ID đã gán cho Cỏ bốn lá được sửa một lần thành `9875=aarti`; các ánh xạ khác được giữ lại. Những lần sửa ID thủ công sau nâng cấp được giữ nguyên. Không dùng riêng mức giá 10 xu để nhận quà: Rosa và các quà 10 xu khác không bị gán nhầm.

Lấy ID từ nhật ký rồi vào **Cảnh & âm thanh → Ánh xạ ID quà thật**, nhập `ID=loại` bằng ID số thật. Ví dụ cú pháp `123456=marigold` (ID minh họa). ID vẫn cần đúng giá một món. Khi một loại đã gán ID, nhận diện bằng tên cho loại đó được tắt. Quà chưa khớp vẫn cộng điểm và có lời cảm ơn; nhật ký ghi “chưa gán hiệu ứng”. Các nút demo luôn thử được tám loại, kể cả khi đã cài ID thật.

**Một combo chốt = một lượt có nhãn ×N**, tính đủ N món. Mỗi sự kiện kết thúc khác nhau giữ một lượt riêng, kể cả cùng người/cùng loại. Chống phát lại theo `msgId` như trước. Camera và vị trí nghi thức chỉ phục vụ một lượt, theo **thứ tự nhận**, không ưu tiên quà lớn vượt hàng. Không gộp, xóa do quá hạn hoặc bỏ lượt hợp lệ vì đầy hàng hình ảnh. Người chưa có ghế chờ được ngồi trước khi đến lượt. Chỉ người đang làm lễ và người kế tiếp được giữ ghế để tránh kẹt khi khu quỳ đầy.

Hàng chờ, ghế, lựa chọn nhân vật và lượt nghi thức LIVE được lưu cùng số liệu. Đổi chế độ tạm dừng lượt đang chạy và giữ lại để chạy từ đầu khi quay lại; tải lại overlay đang kết nối thì tiếp tục cùng thời gian của server. Dọn cảnh / reset mới xóa hàng đợi. Sau sự cố khởi động lại, lượt dở chạy lại từ đầu; tổng quà không được cộng lại.

Mushika nằm trên bệ thấp gần chân Ganesha. Corgi tạo nghi thức 16 giây: ghé tai/khum tay 3,6 giây → tụ sáng → chuột ngẩng đầu → ngọc sáng và vòng hoa văn → dải vàng nhiều lớp uốn tới Ganesha → hào quang/mandala/chuông → ánh sáng trở về, sen dưới chân → wai và về ghế. Âm hiệu ứng riêng cho tụ sáng, truyền, tiếp nhận và hồi đáp. Góc rộng giữ trọn đường truyền.

Galaxy tạo **Ganesha đứng riêng** bên trái, người nhận bên phải; có chân/bàn chân, bốn tay, bàn tay ban phước và bệ sen. Nền dịu tối trong 1,8 giây, hình hiện từ chân lên vương miện, mandala hai lớp/tia sáng ở phía sau, cánh hoa trước/sau tránh mặt. Tượng ngồi không đổi vị trí/kích thước; tay tượng ngồi tạm giữ trong hai nghi thức đặc biệt rồi tiếp tục mượt. Khung quà/công đức thu gọn và các tên người ngoài nghi thức tạm ẩn trong Galaxy, khôi phục khi kết thúc. Hình đứng tan dần, ánh sáng trở lại. Hai nghi thức dùng cả nam/nữ.

Nghi thức Galaxy dùng đúng câu:

> ขอให้เจ้ามีจิตใจที่สงบ มีปัญญาก้าวผ่านอุปสรรค และพบกับการเริ่มต้นที่ดี

Tên người nhận là trường riêng. Giọng **th-TH-NiwatNeural**, tốc độ −12%, cao độ −6 Hz, bass nhẹ và vang ngắn. Banner “พรจากพระพิฆเนศ” mở theo tín hiệu bắt đầu phát, giữ **2,5 giây sau khi đọc xong** rồi tan trong 0,7 giây; camera/nhân vật chờ hết câu. Nhạc tự nhỏ khi giọng phát; các lời cảm ơn/nhắc khác không chồng lên. Nếu mất tiếng, banner hiển thị bản chữ 8,5 giây rồi giữ thêm 2,5 giây. Nhạc, hiệu ứng và giọng có âm lượng và bật/tắt riêng.

Nội dung là một diễn giải nghệ thuật nhằm gửi lời động viên, không phải lời kinh hay bản ghi lời thần linh. Không có cam kết lời cầu xin được thực hiện. Có thể thay bằng bản thu Thái đúng nguyên văn ở `assets/ganesha/audio/ganesha-blessing-th.mp3` (tự tạo thư mục `audio`); gói này không chứa tệp thu đó. Khi không có tệp, ứng dụng dùng Niwat qua Internet và lưu đệm kết quả.

## Nhạc nền đi kèm

**Eastern Serenity**, dài **4 phút 40 giây**, là bản ghép nhạc thiền Á Đông từ hai bản thu của **Kevin MacLeod**: *The Hidden Valley of Shambhala* và *Midnight in the Green House*. Bản mới thay Thai Dawn của các phiên bản trước. Hai nguồn được phát hành trong danh mục FreePD dưới CC0 / Public Domain; nguồn cố định, SHA-256 và các chỉnh sửa được ghi trong [thông tin nhạc](assets/ganesha/music/LICENSE.txt), kèm toàn văn [CC0](assets/ganesha/music/CC0-1.0.txt).

- Nhạc và **Lặp nhạc liên tục** bật sẵn khi cài mới. File MP3 đi kèm gói, không cần Internet để phát. Khi nâng cấp, giữ nguyên lựa chọn bật/tắt và âm lượng đã lưu của bạn.
- Hai đoạn được cân âm lượng, chuyển tiếp trong 8 giây và xử lý nối đầu/cuối trong 8 giây; vòng phát cuối cùng dài 280 giây. Đây là bản ghép từ các tác phẩm có sẵn, không phải bản thu nghi lễ Phật giáo Thái truyền thống.
- Chỉnh **Âm lượng nhạc nền** độc lập với âm lượng tổng. Khi giọng cầu chúc phát, nhạc tự hạ còn 20% mức đã chọn rồi tăng trở lại.
- **Nghe thử nhạc tại đây** phát ngay tại bảng điều khiển. Dừng nghe thử trước khi dùng nguồn LIVE để tránh thu hai nguồn cùng lúc.
- **Phát lại nhạc trên LIVE** đưa nhạc về đầu. Lưu cấu hình không tạo thêm bản nhạc chồng tiếng và không cắt nghi lễ.
- Tắt **Lặp nhạc liên tục** thì nhạc dừng khi hết 4:40; bật lại hoặc bấm Phát lại để tiếp tục.
- Mã chuẩn bị nhạc tại `scripts/prepare-eastern-serenity.py`; chỉ cần NumPy/ffmpeg nếu muốn tái tạo MP3 từ hai nguồn đã ghi, không cần để chạy LIVE.

## Khung quà và công đức

Cùng khung nền tối 20%, blur 3 px (tắt blur ở mức Nhẹ), viền vàng mảnh; chữ/icon giữ độ sáng. Corgi 299 và Galaxy 1.000 cố định ở hàng đầu, sáu quà còn lại luân phiên theo nhóm mỗi 8 giây. Mô tả tác dụng ngắn bằng tiếng Thái, giá xu rõ; top ba người và hướng dẫn bình luận 1/2 cùng khung. Hai icon mới dùng URL TikTok từ danh mục công khai; nếu mạng không tải được, hiện dấu trang trí `✧`, không giả làm icon quà.

**Cảnh & âm thanh → Khung thông tin** cho chỉnh ngang 18–90 px, dọc 140–235 px trên khung 1080×1920, rồi Lưu. Giới hạn giữ bảng trên vương miện/khu quỳ. Khi nâng bảng trên mốc 200 px, mục tiêu/phụ đề/nhãn quà ở đầu tạm ẩn để tránh chồng; tên người làm lễ vẫn trên cảnh/banner. Trong Galaxy, bảng thu gọn rồi khôi phục đúng vị trí. Tên người quỳ ở xa luân phiên theo cặp để tránh đè; tên người làm lễ được ưu tiên đầy đủ.

## Hàng người mới vào phòng

- Sự kiện `member` có tên/ID tạo nhân vật nam/nữ từ đầu/cổ/vai và tên trong dải dưới, độc lập với 60 chỗ quỳ. Follow/like không tạo người vào hàng; người đã có ghế không bị nhân bản. Điều kiện vào ghế vẫn là tặng quà, trừ khi người vận hành bật vào bằng bình luận.
- Giữ tất cả dữ liệu người chờ trên server, không tự xóa sau vài phút. Render tối đa **88 nhân vật đầu–vai** (10 ở lớp gần, 78 phía xa), hoặc **49** khi chọn mức Nhẹ. Mỗi 12 giây luân phiên một hàng xa. Người mới được đưa vào một vị trí xa, những người còn lại giữ vị trí. Người cũ trở lại hàng dữ liệu, không mất thông tin.
- Không tải ảnh đại diện TikTok. Dùng tám sprite từ hai atlas game, bốn lớp người so le, vai bị hàng trước che, thở/đổi trọng tâm nhẹ lệch nhịp. Tên gần lớn; tên xa luân phiên cặp mỗi 6 giây trong dải riêng, rút gọn theo cụm dấu Thái. Người lên lễ có đánh dấu/tên đầy đủ. Cache tên tối đa 176, không tạo DOM theo số người chờ.
- Số Thái ở mép dưới là **số người đang nằm trong hàng chờ**, không phải số người online. Không luôn có sự kiện rời phòng nên dữ liệu được giữ đến khi vào ghế hoặc dọn/reset. Không cộng hàng chờ vào xu/top hay số người quỳ. DEMO có nhãn riêng và tổng demo riêng.
- Tặng quà sẽ chuyển lên khu quỳ theo lượt; đủ 60 ghế thì chờ người tặng lâu nhất rời đi. Comment **1 = nữ, 2 = nam** được nhớ khi ở hàng và khi làm lễ.
- Các nút **100 / 300 / 500 người chờ**, hai quà mới, **5 lượt liên tiếp** và **Reset demo** nằm trong bảng điều khiển. Nút thử dùng cùng hàm xử lý sự kiện thật; dữ liệu demo tách khỏi LIVE.
- Bật/tắt bằng **Người vừa vào phòng đứng xếp hàng ở mép dưới**. Tắt dọn hàng đứng, giữ ghế và điểm. Dọn nhân vật dọn cả hàng và nghi thức nhưng giữ điểm. Tải lại overlay hoặc mở lại server khôi phục hàng LIVE đã lưu.

## Nhân vật, lời cầu chúc và lúc vắng quà

- Mặc định xen kẽ nhân vật nam/nữ theo mã người xem. Bình luận đúng **`1` = nữ, `2` = nam** để chọn hoặc đổi ngay, kể cả trong lúc dâng lễ; hướng dẫn tiếng Thái nằm đầu bảng quà. Lựa chọn trước khi tặng quà được nhớ trong phiên, chưa đưa người xem vào cảnh. Chỉ nhận một số riêng lẻ, không lấy số từ bình luận dài. Vẫn nhận `หญิง` (nữ), `ชาย` (nam), `female`, `male`, `nữ`, `nam` và chữ số Thái `๑` / `๒`. Đây là lựa chọn avatar, không suy đoán giới tính thật. Có thể chọn toàn nam/toàn nữ cho người mới trong bảng điều khiển.
- Mỗi sự kiện quà đã chốt tạo lời cảm ơn và cầu chúc tiếng Thái; hai nghi lễ lớn có lời riêng. Giọng **bật sẵn**, dùng Edge TTS với Premwadee (nữ) hoặc Niwat (nam). Cần Internet, không cần cài gói tiếng Thái trên Windows hay mở Edge.
- Sau **10 giây không có quà**, bắt đầu lời nhắc thả tim và chia sẻ LIVE. Câu tiếp theo chờ **10 giây từ lúc câu trước đọc xong**, lấy tín hiệu kết thúc âm thanh từ cửa sổ LIVE/OBS. Ví dụ đọc từ giây 10 đến 17 thì câu tiếp theo sớm nhất ở giây 27. Quà mới cắt lời nhắc, bỏ lời nhắc đang chờ và tính lại từ quà mới nhất. Khi còn lời cầu chúc, đợi đọc xong để không chồng tiếng. Có thể chỉnh khoảng chờ trong bảng điều khiển; mặc định 10 giây cho cả hai mốc.
- Chỉ cửa sổ đã mở tiếng và bật giọng tham gia tính thời điểm đọc xong; khung xem trước không ảnh hưởng. Nếu mở nhiều cửa sổ có tiếng, chờ tất cả đọc xong. Đóng cửa sổ, tắt giọng hoặc lỗi phát âm thanh không làm bộ đếm kẹt. Khi tắt giọng, lời nhắc chữ vẫn xuất hiện theo khoảng chờ.
- Cảnh bắt đầu với **10 nhân vật nền**, phân bố trên sàn, tại chỗ số 1–10. Các nhân vật này **giữ nguyên khi có quà**; không tên, có nhãn Thái `บรรยากาศจำลอง` và **không cộng vào người tương tác, xu, quà, tim hay xếp hạng**.
- **60 chỗ cố định**: người tặng quà mới vào từ chỗ 11–60. Người đã có mặt tặng tiếp vẫn giữ chỗ. Mặc định bình luận chỉ hiện trên nhân vật đã có mặt và cho phép chọn nam/nữ; có thể bật **Cho người bình luận vào hàng chờ** để bình luận cũng được vào ghế. Tùy chọn **Người vừa vào phòng đứng xếp hàng ở mép dưới** chỉ tạo người ở hàng đứng, không tự cấp ghế.
- Khi đủ chỗ, người mới vào hàng chờ theo thứ tự đến. Người có **lần tặng quà gần nhất cũ nhất** đứng dậy, đi ra trong khoảng 5 giây, rồi người đang chờ mới vào chỗ vừa trống; không xếp lại các chỗ khác. Tối đa hai lượt rời chỗ đồng thời. Tặng thêm bất kỳ quà nào cập nhật mốc này; bình luận/đổi tên không cập nhật. Người chưa có quà và nhân vật nền dùng mốc vào ngồi. Cả nhân vật nền cũng nhường chỗ và không tự quay lại. Người mới có ít nhất 12 giây ngồi trước khi nhường; người đang làm lễ và người đứng đầu hàng nghi thức được giữ chỗ; các lượt còn lại vẫn được lưu và tạo lại nhân vật nếu cần.
- Hàng chờ ghế giữ toàn bộ người tặng, mỗi người một hồ sơ; quà tiếp theo cập nhật người đó nhưng vẫn tạo lượt nghi thức riêng. Khi đang đi ra mà tặng thêm, nhân vật hoàn tất đi ra rồi vào lại hàng chờ. Số actor trên sàn vẫn bị giới hạn ở 60.
- Nam và nữ có chuỗi động tác **quỳ chắp tay → hạ hai tay, cúi đầu sát sàn → ngẩng lên**, lấy cảm hứng cách lạy năm điểm của Thái; lặp ba lần rồi nghỉ ngắn, mỗi người một nhịp. Đây là hoạt ảnh sprite, cần người hiểu nghi lễ Thái duyệt sắc thái động tác trước khi phát chính thức.
- Tay cầm sen và tay cầm búa vàng/khí cụ của Ganesha chuyển động lệch nhịp, giữ cố định khớp vai, kèm hào quang. Từ v0.5, mặc định **Rõ trên điện thoại**, biên độ khoảng 10–13 độ thay mức 1–2 độ trước đây; có thêm **Nhẹ** và **Mạnh**. Lưu cấu hình sau khi chỉnh. Có thể tắt bằng **Tay cầm sen và búa vàng chuyển động**. Thiết lập Giảm chuyển động của hệ thống giữ tư thế chắp tay và tắt chuyển động tay/zoom; bảng điều khiển hiện hướng dẫn khi máy đang bật chế độ này.
- Âm thanh chỉ phát ở overlay/OBS đã mở tiếng. Hàng đợi lời cầu chúc giới hạn 5 câu chờ; đợt quà quá dày có thể bỏ câu mới, vẫn tính đủ xu. Lỗi mạng TTS có timeout 15 giây và nghỉ 30 giây trước khi thử tiếp. Các câu nhắc được lưu đệm cục bộ.

## Dữ liệu và âm thanh

- Demo và LIVE có nhân vật, điểm và bảng xếp hạng riêng. Các nút thử quà bị khóa trong chế độ LIVE.
- Cấu hình và số liệu LIVE được lưu tại `live/data/session.json`; không đưa file này lên Git hay chia sẻ trong gói phát hành. Có thể đổi thư mục bằng `GANESHA_DATA_DIR`.
- Khi khởi động lại, chọn **Xem phiên LIVE đã lưu** hoặc kết nối nguồn để phục hồi điểm. Kết nối nguồn và âm thanh phải khởi động lại. Ghế, hàng chờ và nghi thức đang chờ được phục hồi; lượt dở bắt đầu lại từ đầu. Không cộng lại xu.
- **Dọn nhân vật** giữ nguyên điểm, dọn hàng chờ và trở về 10 nhân vật nền nếu đang bật tính năng. **Bắt đầu phiên mới** xóa số liệu của chế độ đang chọn và chỉ cho phép khi đã ngắt nguồn.
- Khu quỳ hiện tối đa 60 nhân vật, tính cả nhân vật nền và người đang đi ra; hàng dưới chỉ vẽ tối đa 88 nhân vật đầu–vai. Việc rời chỗ không xóa điểm hoặc bảng xếp hạng. Chỗ ngồi/hàng chờ được lưu qua lần khởi động máy chủ mới.
- Hình ảnh, font Thái, bản nhạc MP3 và chuông chạy cục bộ; chuông được tổng hợp bằng Web Audio. Nhạc nền hiện tại là bản ghép CC0, độc lập với concept trước.
- Edge TTS cần truy cập `speech.platform.bing.com`. File âm thanh tạm ở `live/tts/`, không đưa vào Git hay gói chia sẻ. Khi nâng dữ liệu v0.1 lên v0.2, giọng được bật một lần; các lần sau giữ lựa chọn của bạn.

## Kiểm thử và giới hạn bản 0.10

```sh
cd live
npm test
```

Bộ kiểm thử dùng TikFinity giả lập và đồng hồ xác định để kiểm tra tám nghi thức, combo, ID, nam/nữ, 10 nhân vật nền, chỗ 11–60, giữ hàng chờ lớn với lượng nhân vật vẽ giới hạn, nhường chỗ theo lần tặng gần nhất, các pha lạy/tay tượng, các pha nghi lễ, zoom, giới hạn mưa hoa, lặp nhạc, nhạc nhỏ khi đọc giọng, nhắc sau 10 giây vắng quà, nghỉ 10 giây sau sự kiện đọc xong, đóng/mở cửa sổ âm thanh, ưu tiên giọng, reconnect, demo/LIVE, lưu/khôi phục và HTTP/WebSocket cục bộ. Các test phiên chạy với `GANESHA_OFFLINE_AUDIO=1`; test lịch đọc dùng một bản sao máy chủ với TTS và đồng hồ giả lập cục bộ. Cả hai không gọi dịch vụ giọng thật. Không chứng minh tương thích phiên bản TikFinity trên máy người dùng hoặc giọng Edge TTS qua Internet.

Bộ hình nền, lớp tay tượng, hai atlas đi/quỳ, atlas cúi lạy, atlas nâng lễ, Mushika, Ganesha hiển linh, atlas ghé tai và lễ vật được tạo bằng AI. Đây là cảnh 2.5D dùng sprite, chưa khớp mọi chuyển động/hiệu ứng của video tham chiếu. Nội dung tiếng Thái và âm thanh cần được nghe/đọc duyệt trong lần chạy thử. Bản phát nhắm 30 khung hình/giây; khung xem trước nhỏ chạy 15 khung hình/giây để giảm tải. Kiểm tra hiệu năng với OBS/LIVE Studio đang encode trên máy phát thực tế. Nếu máy chậm, chọn mức hiệu ứng Nhẹ (giảm độ phân giải lớp hình và số hạt, vẫn giữ chữ/bảng tên đúng độ phân giải đầu ra), tắt zoom/chuyển động tay và đóng các overlay dư. Cảnh dùng cố định 60 chỗ; không đổi mật độ khi người mới đến.

Các bước kiểm tra trước LIVE trong [TEST-LIVE.md](TEST-LIVE.md).

## Nguồn

Nền kết nối và các nguyên lý tương tác phát triển từ `kentjuno/chanh-dien-online`, theo MIT. Giữ nguyên [LICENSE](LICENSE) và thông tin [UPSTREAM.md](UPSTREAM.md). Concept và giao diện hiện tại đã chuyển sang Ganesha. Font Noto có giấy phép đi kèm trong `assets/ganesha/fonts/LICENSE.txt`.
