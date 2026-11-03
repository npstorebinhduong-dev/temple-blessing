# Ganesha Blessing 0.12 — chín quà, camera lối đi

Đợt này tinh gọn danh mục và sửa thời điểm camera quà nhỏ. Không thay asset cảnh, âm nhạc, giọng Thái hoặc bốn nghi thức lớn. Code chạy Canvas/DOM 2.5D; một transform trên `#world` điều khiển toàn bộ không gian.

## Chín phân loại thực tế

| Nhóm | Quà TikTok | Xu/món | giftId mặc định | Tác dụng tiếng Thái |
|---|---|---:|---|---|
| Nhỏ | Rose | 1 | 5655 | ดอกบัว — sen nhỏ cố định trên bàn |
| Nhỏ | Lamp | 1 | **Chưa xác thực** | จุดประทีป — sáng đèn cố định |
| Nhỏ | Love Perfume | 5 | **Chưa xác thực** | กำยาน — khói hương nhẹ |
| Nhỏ | Doughnut / Donut | 30 | 5879 | กดแล้วส่งข้อความ — quyền bình luận 30 giây |
| Nhỏ | Peach | 5 | 14786 | กำยาน — giữ tác dụng dâng hương đã cấu hình |
| Lớn | Bouquet | 100 | 10994 | ดาวเรือง — dâng vòng hoa vạn thọ |
| Lớn | Corgi | 299 | 6267 | ส่งคำขอ — chuyển lời qua Mushika |
| Lớn | Love Balloon | 500 | Giữ mapping tên + giá cũ; chưa có ID mặc định | มหาบูชา — đại lễ dâng phẩm vật |
| Lớn | Galaxy | 1.000 | 11046 | รับพร — Ganesha đứng ban phước |

Bốn quà lớn giữ ID tùy chỉnh và metadata hợp lệ của phiên đã lưu. Corgi là quà 299 đang cấu hình, không đổi về “Bạn đồng hành”. Các ID catalog là dữ liệu đã có của dự án, không phải xác thực mới bằng tài khoản TikTok Thái trong đợt này.

Đèn và Love Perfume chỉ có demo cho đến khi người vận hành gán ID thật. Bảng hướng dẫn vẫn đủ chín mục, hai mục này ghi **รอยืนยัน**. Không bịa ID. ID 900101/900105 trong kiểm thử là fixture ở thư mục dữ liệu tạm, **không đi vào cấu hình mặc định hoặc dùng nhận LIVE thật**. Love Perfume giữ icon catalog ứng viên cũ; Lamp và Love Balloon còn thiếu icon chuẩn nếu bridge chưa cung cấp. Giữ ô chữ thay vì vẽ icon giả.

Đã bỏ OK, Shamrock, Garland 15 và Perfume 20 khỏi catalog, nút thử, mô phỏng tự động, alias, timing và đường kích hoạt. Khi mở dữ liệu cũ, lọc các mapping/lượt nghi thức đã bỏ, giữ tổng đóng góp. Các quà khác vẫn cộng đủ xu và ghi nhật ký, không thay bằng nghi thức còn lại.

## Nguyên nhân và phần sửa

Trước đây `Room.advance()` chỉ mở lượt khi người tặng đã ngồi; overlay lại đợi người ở trạng thái `sit`. Camera nhận lệnh từ lượt nghi thức, nên người mới phải đi về ghế trước rồi camera mới chạy. Một số quà tại bàn còn đợi thêm 4,2 giây mới bắt đầu zoom.

- `server.mjs`, `ganesha.mjs`: sự kiện quà phát ngay; lượt nhỏ được chạy khi người còn đang vào, đồng thời gửi danh sách người đang chờ. Giữ FIFO và quyền của nghi thức lớn.
- `camera-controller.js`: nhận tín hiệu quà nhỏ trước khi có target; chuyển 350 ms tới cùng góc chính diện. Giữ một chủ camera `aisle` trong chuỗi nhỏ, không khởi động lại tween. Hết hành động/hàng đợi thì về góc tổng; không đợi TTS.
- Camera nhỏ tương đối: scale 1,2, x −108, y −292; ghép với góc tổng đúng một lần. Không thêm scale cho nhân vật, Mushika, tượng hoặc đồ thờ. Quà lớn giữ công thức camera cũ và thời lượng 23/28/16/20 giây.
- `small-procession.js`, `overlay.js`: chuẩn bị 0,4 giây → đi theo lối giữa → quỳ/dâng tại điểm lễ → về ghế; tổng 10 giây. Chỉ một người chờ mới bước vào sân mỗi lượt; không teleport về điểm dâng. Tỷ lệ chỉ theo phối cảnh vốn có.
- `gift-catalog.js`, `gift-rituals.mjs`, `ritual-queue.js`: danh mục chín loại, loại bỏ đường cũ; lượt được phục hồi dùng cấu hình nghi thức hiện tại, tránh mang choreography cũ vào phiên mới.
- Donut vẫn mở từng quyền bình luận cho đúng uniqueId, 30 giây/quyền. Banner có hàng đợi riêng, không mở thêm lượt camera và tạm nhường nghi thức lớn. Không gửi chữ thì vẫn hiện câu Thái mặc định; camera đã về tổng.
- `info-panel.js`, `ganesha.css`: chia rõ 5 nhỏ / 4 lớn, luân phiên hai mục mỗi nhóm; banner lời nguyện gọn hơn. Bảng quà chỉ mở rộng khi camera đã về tổng.
- Quà nhỏ bỏ burst cánh hoa; một tiếng nhấn khi dâng. Sen nhỏ chỉ ở bàn, khói/đèn có số lượng cố định. Giữ hiệu ứng lớn; hạn chế hạt tim/follow phụ trong cao trào.
- Đồng bộ thông tin debug ngay khi reset, tránh một mẫu debug còn mang camera cũ trong khi cảnh đã về tổng.

Đối chiếu cơ chế lớn với bản bàn giao 0.11, commit `da486856df89e9dbd08de316ef89769b13ac5f0a`, cùng fixture camera v0.8 đã có trong dự án. Góc nhỏ là cơ chế mới theo yêu cầu lần này; không tuyên bố khôi phục góc nhỏ của bản cũ.

## Kiểm tra thực tế

Môi trường: Node 24.19, Chromium 154.0.8037.57 headless trên Linux cloud, GPU phần mềm SwiftShader, quota 4 CPU. Khung 1080×1920; kiểm tra thêm trình duyệt thực ở 360×640. Sự kiện TikFinity **mô phỏng** đi qua connector, normalizer, `onGift` và FIFO của ứng dụng. Không có quà trả tiền hay phiên TikTok LIVE thật trong kiểm thử.

- **69/69 bài Node đạt**, gồm mapping, combo/reconnect, quyền bình luận, FIFO, khôi phục cấu hình cũ, camera lớn và xử lý lỗi.
- Chạy 25 lượt qua bridge: 23 lượt kết thúc, hai lượt dành cho reset/mất target. Đủ năm quà nhỏ và bốn quà lớn.
- Mười quà nhỏ liên tiếp từ năm người: góc lối đi ổn định, không zoom ra/vào giữa lượt; tên theo đúng ID.
- Năm người hoàn toàn mới tặng trong lễ Corgi: ghi nhận đủ, chờ ngoài sân; sau lễ chỉ người đến lượt bước lên.
- Đo riêng không screencast: nhận tại frame 26, camera bắt đầu tại **frame 27**, mẫu quan sát sau 52,9 ms trên máy thử. Tween thiết kế 350 ms. Khi vừa chạy vừa quay 1080p, mẫu chuyển đầu sau 58–84 ms; khung ghi nhận đã tới góc sau 418–458 ms. Đây là số đo cloud, không cam kết độ trễ máy OBS.
- Kiểm tra **6.443 lệnh `drawImage` thực tế** ở đủ chín loại: scale cục bộ ≈1; sai lệch phép biến đổi nền so với camera dưới 0,001 px. Không chỉ dựa vào giá trị debug tự báo.
- Đối chiếu **1.208 khung video** bằng SIFT/RANSAC trên kiến trúc/tượng: nền tăng tới khoảng 1,200 lần rồi về 1,000 lần. Có các khung trung gian khi tiến/lùi.
- Bốn quà lớn xen quà nhỏ: giữ owner/công thức riêng, không bị cắt ngang; chuyển tiếp về góc nhỏ sau lễ.
- Quà đã bỏ/ngoài danh sách: bốn sự kiện vẫn cộng **36 xu**, không có nghi thức hay camera mới.
- Rose: sen 56×34 đơn vị thế giới ở bàn bên phải, không tại vị trí Mushika. Không gọi sen khổng lồ.
- Donut: nhận đúng người; hết 30 giây có câu mặc định; camera không bị giữ theo thời hạn bình luận. Reset/mất target trả về `{scale:0.84,x:86.4,y:270}`.
- Đã rà chuỗi khung chuyển động theo thời gian. Qua rà hình, phát hiện bảng hướng dẫn mở sớm trong lúc camera lùi; đã sửa và quay lại video cuối. Kiểm tra lại nội dung chữ của bảng: không mở rộng trong khi camera còn zoom.

Bằng chứng: [kết quả Node](verification/v012/node-tests.txt), [trace/draw](verification/v012/trace-verification.json), [đo khung video](verification/v012/video-motion.json), [kiểm tra bản cuối](verification/v012/extra-result.json), [video bản cuối](verification/v012/final-video-result.json).

## Video và cách thử

Mở [trang video](videos/v012/index.html) sau khi giải nén:

1. `final-rose.mp4`: góc tổng → dấu thời điểm nhận quà → camera vào lối đi → dâng sen → về ghế → góc tổng.
2. `final-corgi-to-small.mp4`: Corgi giữ góc riêng; Peach đến trong lễ, đợi; kết thúc lễ chuyển sang lối đi rồi về tổng.

Video 1080×1920 ghi hình trình duyệt, không ghép ảnh tĩnh. Nhạc/giọng được tắt trong hai clip để tập trung kiểm tra camera; âm thanh ứng dụng không bị xóa hay đổi nguồn.

Windows: đóng server cũ, giải nén toàn bộ gói vào thư mục mới, chép `live/data` từ bản cũ nếu cần giữ phiên, chạy `CHAY-LIVE.bat`, rồi Ctrl+F5 cửa sổ LIVE/refresh cache OBS. Node 24+; lần đầu cần mạng để cài thư viện. Không chạy đè hai server trên cổng 3000.

Điều khiển: `http://localhost:3000/live/control.html`; OBS 1080×1920: `http://localhost:3000/live/overlay.html`. Dùng chín nút demo; Donut gửi bình luận bằng cùng tên demo; ở LIVE dùng uniqueId. Bấm nhiều quà nhỏ liên tiếp, quà nhỏ trong lễ lớn, rồi Reset demo. Xem [phiếu thử máy phát](../TEST-LIVE.md).

Giới hạn còn lại: ID Thái của Đèn/Love Perfume và các icon nêu trên; chưa kiểm tra quà thật/loa/OBS trên máy Windows. Không gán hai ID fixture thành quà thật để bỏ qua việc xác thực.
