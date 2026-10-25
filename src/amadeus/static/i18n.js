'use strict';

(() => {
  // Vietnamese is the source locale. Only authored UI is bound: conversation,
  // memory and reference content never passes through automatic translation.
  const english = {
    'Không gian lab': 'Lab space', 'Không gian lab.': 'Lab space.',
    'Chọn một cảnh. Bắt đầu một thí nghiệm.': 'Choose a scene. Start an experiment.',
    'Đang lắng nghe': 'Listening', 'Tò mò': 'Curious', 'Dịu dàng': 'Gentle', 'Hơi ngượng': 'A little flustered', 'Hờn nhẹ': 'Slightly annoyed', 'Vui vẻ': 'Happy',
    'Gọi Kurisu': 'Call Kurisu', 'Gợi ý chat': 'Chat idea', 'Tùy chỉnh không khí': 'Atmosphere settings',
    'Bấm hoặc nhấn Enter để gọi Kurisu': 'Click or press Enter to call Kurisu',
    'Khám phá cùng Kurisu': 'Explore with Kurisu', 'Nhập vai': 'Scenes', 'Thử thách': 'Challenges', 'Kỷ niệm': 'Moments', 'Không khí': 'Atmosphere',
    'Chọn bối cảnh để đưa vào ô soạn, rồi gửi để bắt đầu. Nội dung đang viết được giữ lại.': 'Choose a scene to add to your draft, then send to begin. Your existing draft is preserved.',
    'Mục tiêu: ': 'Goal: ', 'Soạn cảnh →': 'Compose scene →',
    'Làm lại': 'Try again', 'Đúng {count}/4 · Có thể thảo luận từng câu với Kurisu.': '{count}/4 correct · Discuss any challenge with Kurisu.',
    'Ẩn dãy & trả lời': 'Hide digits & answer', 'Thảo luận với Kurisu →': 'Discuss with Kurisu →',
    'Đúng rồi. Bằng chứng đứng về phía cậu.': 'Correct. The evidence is on your side.',
    'Chưa đúng. Cùng xem lại giả thuyết nhé.': 'Not quite. Let us revisit the hypothesis.',
    '☆ Lưu kỷ niệm': '☆ Save moment',
    'Bấm ☆ dưới câu trả lời để giữ một khoảnh khắc. Nhật ký chỉ lưu trên trình duyệt này, tách riêng khách và admin; không tự gửi vào cuộc trò chuyện.': 'Select ☆ below a reply to keep a moment. This journal stays in this browser, with separate guest and admin collections; it is not automatically sent to chat.',
    'Tải nhật ký JSON': 'Download journal JSON', '{count}/100 khoảnh khắc': '{count}/100 moments',
    'Chưa có kỷ niệm. Giữ lại một câu nói khiến cậu muốn đọc lần nữa.': 'No moments yet. Keep a line you would like to read again.',
    'Xóa kỷ niệm': 'Delete moment', 'Đã giữ khoảnh khắc trong nhật ký.': 'Moment saved to your journal.',
    'Khoảnh khắc này đã có trong nhật ký.': 'This moment is already in your journal.',
    'Nhật ký đã đủ 100 khoảnh khắc. Xóa bớt trước khi lưu thêm.': 'Your journal has 100 moments. Delete one before saving more.',
    'Không lưu được nhật ký. Kiểm tra quyền lưu trữ hoặc dung lượng trình duyệt.': 'Could not save the journal. Check browser storage permissions or available space.',
    'Không đọc được nhật ký. Dữ liệu cũ vẫn được giữ nguyên.': 'Could not read the journal. Your existing data has been preserved.',
    'Chưa thể soạn thêm. Hãy chờ trả lời xong hoặc rút ngắn nội dung trong ô chat.': 'Cannot add to the draft yet. Wait for the reply to finish or shorten the draft.',
    'Một chút không khí phòng lab. Âm nền và tín hiệu chỉ bật khi cậu chọn.': 'A little lab atmosphere. Background audio and signals only play if you enable them.',
    'Chế độ ban đêm': 'Night mode', 'Sắc xanh dịu cho những cuộc trò chuyện muộn.': 'Soft blue tones for late conversations.',
    'Giảm chuyển động': 'Reduce motion', 'Tự áp dụng nếu thiết bị yêu cầu giảm chuyển động.': 'Automatically respects your device’s reduced motion preference.',
    'Âm nền phòng lab': 'Lab ambience', 'Tiếng máy nhẹ; tự nhỏ lại khi Kurisu nói.': 'Quiet equipment hum; softens while Kurisu speaks.',
    'Âm lượng nền': 'Background volume', 'Âm báo kết nối': 'Connection sound', 'Một tín hiệu ngắn khi kết nối với model.': 'A short signal when the model connects.',
    'Âm nền và tín hiệu đang tắt.': 'Background audio and signals are off.',
    'Chạm vào trang để bật âm thanh phòng lab đã chọn.': 'Interact with the page to start your chosen lab audio.',
    'Âm nền phòng lab đang bật.': 'Lab ambience is on.', 'Âm báo kết nối đang bật.': 'Connection sound is on.',
    'Chưa bật được âm thanh phòng lab. Thử lại bằng nút bật âm nền.': 'Lab audio could not start. Try the ambience switch again.',
    'Amadeus — trò chuyện với một bản mô phỏng Makise Kurisu từ Steins;Gate.': 'Amadeus — chat with an AI recreation of Makise Kurisu from Steins;Gate.',
    'Danh sách hội thoại': 'Conversations', 'Amadeus — trang chính': 'Amadeus — home',
    'Logo Amadeus theo thiết kế Steins;Gate 0': 'Amadeus logo inspired by Steins;Gate 0',
    'Cuộc trò chuyện mới': 'New conversation', 'LỊCH SỬ': 'HISTORY',
    'Chưa có cuộc trò chuyện nào.': 'No conversations yet.',
    'Ký ức riêng': 'Personal memory', 'Hồ sơ Steins;Gate': 'Steins;Gate archive',
    'Hệ thống & nguồn': 'System & credits', 'Hệ thống': 'System',
    'Lịch sử chỉ trên trình duyệt': 'History in this browser only', 'KHÁCH': 'GUEST',
    'Mở lịch sử': 'Open history', 'Kết nối với Kurisu': 'Connected to Kurisu',
    'Chế độ Amadeus': 'Amadeus mode', 'Chuyển về hội thoại gần nhất của chế độ này': 'Open the latest conversation in this mode',
    'Amadeus · bản ký ức': 'Amadeus · memory snapshot', 'Amadeus · dữ liệu lab Alpha': 'Amadeus · Alpha lab data',
    'Hiện Kurisu': 'Show Kurisu', 'Ẩn Kurisu': 'Hide Kurisu', 'Tải hội thoại JSON': 'Download conversation as JSON',
    'Xóa cuộc hội thoại': 'Delete conversation', 'Xóa hội thoại': 'Delete conversation',
    'Xóa hội thoại: {title}': 'Delete conversation: {title}',
    'Chưa kết nối model. Điền thông tin AI trong': 'No model connected. Add your AI settings to',
    'rồi khởi động lại máy chủ.': 'and restart the server.',
    'Nội dung cuộc trò chuyện': 'Conversation', 'Ký ức không chỉ': 'Memories are more',
    'là những dữ liệu.': 'than just data.', '“Cậu đang nghĩ gì vậy?': '“What is on your mind?',
    'Nói ra thử xem. Chúng ta có thể bắt đầu từ đó.”': 'Tell me. We can start from there.”',
    '01 / ĐỜI THƯỜNG': '01 / EVERYDAY LIFE', 'Hôm nay tôi hơi mệt.': 'I feel a little tired today.',
    '02 / MỘT CÂU HỎI': '02 / A QUESTION', 'Ký ức có làm nên con người?': 'Do memories make us who we are?',
    '03 / PHÒNG THÍ NGHIỆM': '03 / THE LAB', 'D-mail và time leap khác gì?': 'D-mail vs. time leap?',
    '04 / CÙNG SUY NGHĨ': '04 / THINKING TOGETHER', 'Cùng giải quyết một vấn đề.': 'Let’s work through a problem.',
    'Hôm nay tôi hơi mệt. Nói chuyện với tôi một chút nhé?': 'I feel a little tired today. Will you talk with me for a bit?',
    'Kurisu, ký ức có đủ để định nghĩa một con người không?': 'Kurisu, are memories enough to define a person?',
    'Giải thích sự khác nhau giữa D-mail và time leap trong Steins;Gate đi.': 'Explain the difference between D-mail and time leap in Steins;Gate.',
    'Tôi đang học một điều mới nhưng hơi nản. Giúp tôi tìm cách học tốt hơn được không?': 'I am learning something new but feel discouraged. Can you help me find a better way to learn?',
    'Thử lại': 'Retry', 'Ẩn thông báo': 'Dismiss notification', 'Tra cứu mạng': 'Web search',
    'Amadeus · bản ký ức trước chuyến về Nhật': 'Amadeus · memories before returning to Japan',
    'Kurisu ở Alpha · những ngày tại Future Gadget Lab': 'Kurisu in Alpha · days at Future Gadget Lab',
    'Ký ức trước chuyến về Nhật · có thể học từ cuộc đối thoại này': 'Memories before Japan · learns from this conversation',
    'Tin nhắn cho Kurisu': 'Message Kurisu', 'Nói với Kurisu điều gì đó…': 'Tell Kurisu what is on your mind…',
    'Gửi tin nhắn': 'Send message', 'Dừng trả lời': 'Stop response',
    'Enter để gửi': 'Enter to send', 'Shift + Enter xuống dòng': 'Shift + Enter for a new line',
    'Chế độ nhập vai': 'Roleplay mode', 'Spoiler S;G & S;G 0': 'S;G & S;G 0 spoilers',
    'Kết nối hình ảnh với Kurisu': 'Visual connection with Kurisu', 'ĐANG KẾT NỐI': 'CONNECTING',
    'Đóng khung nhân vật': 'Close character panel', 'Model Live2D của Makise Kurisu': 'Makise Kurisu Live2D model',
    'Đang khởi tạo kết nối hình ảnh…': 'Initializing visual connection…',
    'Dừng giọng nói': 'Stop voice', 'Giọng nói Kurisu': 'Kurisu voice',
    'Bật giọng Nhật': 'Enable Japanese voice', 'Nghe thử': 'Preview', 'Nghe một câu ngẫu nhiên': 'Play a random line',
    'Chọn giọng anime': 'Choose an anime voice', 'Đang chuẩn bị giọng nói…': 'Preparing voice…',
    'Âm lượng': 'Volume', 'Thỉnh thoảng trò chuyện': 'Occasional idle chatter',
    'Giọng nhân vật anime tổng hợp. Phản ứng ngắn theo chat, kèm phụ đề Việt.': 'Synthesized anime voice. Short chat reactions with translated subtitles.',
    '“Cứ nói đi. Tôi đang nghe.”': '“Go on. I am listening.”',
    'Một bản ký ức.': 'A memory snapshot.', 'Một cuộc trò chuyện đang tiếp diễn.': 'A conversation still unfolding.',
    'Những điều cần nhớ.': 'Things to remember.', 'Đóng': 'Close',
    'Ghi chú cậu chủ động lưu sẽ được đưa vào các cuộc trò chuyện tiếp theo. Chúng tách riêng với ký ức nhân vật trong nguyên tác.': 'Notes you choose to save are included in future conversations. They are separate from the character’s original memories.',
    'Thêm một ghi chú': 'Add a note', 'Ví dụ: Cứ gọi tôi là Takeshi. Tôi đang học Python.': 'For example: Call me Takeshi. I am learning Python.',
    'Lưu ký ức': 'Save memory',
    'Ghi chú chỉ lưu trên trình duyệt này. Nội dung liên quan được gửi đến AI khi trò chuyện.': 'Notes stay in this browser. Relevant content is sent to the AI when you chat.',
    'Hồ sơ Steins;Gate.': 'Steins;Gate archive.',
    'Ghi chú tóm tắt có nguồn, phân biệt world line và phiên bản. Đây là dữ liệu tham chiếu, không phải toàn bộ kịch bản hay toàn bộ ký ức trực tiếp của Amadeus.': 'Sourced summaries distinguish world lines and versions. This is reference material, not the full script or Amadeus’s complete personal memories.',
    'Tìm trong hồ sơ': 'Search the archive', 'Tìm nhân vật, Amadeus, D-mail, world line…': 'Search characters, Amadeus, D-mail, world lines…',
    'Đăng nhập admin.': 'Admin sign-in.',
    'Nhập mật khẩu quản trị để mở lịch sử lưu trên máy chủ. Cậu vẫn có thể trò chuyện ở chế độ khách mà không đăng nhập.': 'Enter the admin password to open server history. You can still chat as a guest without signing in.',
    'Mật khẩu admin': 'Admin password', 'Đăng nhập →': 'Sign in →', 'Không gian admin.': 'Admin workspace.',
    'Hội thoại và ghi chú của admin được lưu trên máy chủ. Đăng nhập cùng mật khẩu trên thiết bị khác để tiếp tục trò chuyện.': 'Admin conversations and notes are saved on the server. Sign in with the same password on another device to continue.',
    'Chat khách vẫn ở riêng trên trình duyệt này. Đăng xuất sẽ quay về lịch sử khách, không xóa hội thoại admin.': 'Guest chats stay separate in this browser. Signing out returns to guest history and keeps admin conversations intact.',
    'Đăng xuất về chế độ khách': 'Sign out to guest mode', 'Amadeus — hệ thống & nguồn': 'Amadeus — system & credits',
    'Đây là giao diện trò chuyện nhập vai bằng AI. Kurisu duy trì điểm nhìn của Amadeus trong thế giới Steins;Gate; thông tin kỹ thuật của ứng dụng được trình bày ở đây, tách khỏi lời nhân vật.': 'This is an AI roleplay chat. Kurisu keeps Amadeus’s perspective within Steins;Gate; application details are presented here, separately from her dialogue.',
    'Model Live2D và logo:': 'Live2D model and logo:', '. Bản tài nguyên tối ưu cho web:': '. Web-optimized assets:',
    ', phi thương mại; không phải tài nguyên chính thức được MAGES. chứng thực.': ', non-commercial; these are not official assets endorsed by MAGES.',
    'Live2D Cubism © Live2D Inc.; Be Vietnam Pro và Barlow Condensed theo SIL Open Font License. Steins;Gate / nhân vật © các chủ sở hữu tương ứng. Mã ứng dụng theo AGPL v3; các tài nguyên trên giữ giấy phép riêng.': 'Live2D Cubism © Live2D Inc.; Be Vietnam Pro and Barlow Condensed are licensed under the SIL Open Font License. Steins;Gate and its characters belong to their respective owners. App code is licensed under AGPL v3; assets retain their own licenses.',
    'Giọng anime:': 'Anime voice:',
    '(Shikoku Metan), hai sắc thái ngọt ngào và tsundere. Chọn giọng ngay dưới model; lựa chọn được nhớ trong trình duyệt.': '(Shikoku Metan), with sweet and tsundere styles. Choose a voice below the model; your preference stays in this browser.',
    'Nguồn và điều khoản giọng': 'Voice credits and terms',
    '. Đây là giọng nhân vật tổng hợp, chưa phải giọng Kurisu gốc. Các câu ngắn được tạo trên máy và phát từ máy chủ dự án. Phụ đề Việt là bản dịch của câu đang phát; bản thử phản ứng theo chủ đề, chưa đọc toàn bộ câu trả lời AI. Kurisu chào một lần khi mở trang; nếu trình duyệt chặn âm thanh tự phát, hãy chạm vào trang để nghe. Lựa chọn tắt giọng được nhớ trên trình duyệt; có thể tắt nói lúc rảnh và chỉnh âm lượng ngay dưới model.': '. This is a synthesized character voice, not Kurisu’s original voice. Short lines are generated locally and served by the project. Subtitles translate the current line; reactions follow the chat topic rather than reading the entire AI reply. Kurisu greets you once per visit; if autoplay is blocked, interact with the page to hear it. Your mute preference is remembered in this browser; idle chatter and volume controls are below the model.',
    'Kurisu tại lab': 'Kurisu at the lab', 'CẬU': 'YOU', 'Sao chép': 'Copy', 'Đã sao chép.': 'Copied.',
    'Trình duyệt không cho sao chép. Cậu có thể chọn đoạn văn trực tiếp.': 'Your browser blocked copying. You can select the text directly.',
    'Tham chiếu {count} ghi chú ↗': '{count} reference notes ↗',
    'Những ghi chú được đưa vào prompt, không phải xác minh từng câu trả lời': 'Notes included in the prompt, not verification of every answer',
    'Chưa có cuộc trò chuyện nào. Bắt đầu bằng điều cậu đang nghĩ.': 'No conversations yet. Start with what is on your mind.',
    'Đã xóa hội thoại.': 'Conversation deleted.', 'Đã khôi phục câu trả lời đã lưu.': 'Saved reply restored.',
    'Không gửi được tin nhắn ({status}).': 'Could not send the message ({status}).',
    'Đang tra cứu tài liệu bên ngoài…': 'Searching external sources…', 'Đang suy nghĩ…': 'Thinking…',
    'Luồng kết nối bị ngắt. Cậu có thể thử lại cùng tin nhắn.': 'The connection was interrupted. You can retry the same message.',
    'Câu trả lời đã lưu. Danh sách lịch sử sẽ cập nhật khi tải lại trang.': 'Reply saved. Reload the page to refresh the history list.',
    'Lượt chưa xác nhận hoàn tất': 'Turn not confirmed complete',
    'Đã dừng nhận câu trả lời. Gửi lại sẽ kiểm tra kết quả đã lưu trước khi gọi model.': 'Response stopped. Retrying checks for a saved result before calling the model again.',
    'Chưa có ghi chú. Chỉ những điều cậu chủ động lưu mới được thêm vào đây.': 'No notes yet. Only things you choose to save appear here.',
    'Quên ghi chú: {content}': 'Forget note: {content}', 'Đã xóa ghi chú.': 'Note deleted.', 'Đã lưu ghi chú.': 'Note saved.',
    'Không có ghi chú khớp từ khóa này. Thử tên nhân vật hoặc thuật ngữ khác.': 'No matching notes. Try a character name or another term.',
    'Không gian admin': 'Admin workspace', 'Lịch sử lưu trên máy chủ': 'History saved on the server', 'Mở không gian admin': 'Open admin workspace',
    'Ghi chú admin được lưu trên máy chủ và gửi đến nhà cung cấp AI khi trả lời. Xóa ghi chú sẽ ngừng dùng nó cho các lượt mới.': 'Admin notes are saved on the server and sent to the AI provider when replying. Deleting a note stops its use in future turns.',
    'Ghi chú chỉ lưu trên trình duyệt này, không ghi vào máy chủ. Nội dung liên quan được gửi đến AI khi trò chuyện. Xóa dữ liệu trang sẽ xóa các ghi chú này.': 'Notes stay in this browser and are not saved on the server. Relevant content is sent to the AI when you chat. Clearing site data deletes these notes.',
    'SẴN SÀNG ĐỐI THOẠI': 'READY TO CHAT', 'CHỜ KẾT NỐI MODEL': 'WAITING FOR MODEL',
    'Không mở được không gian trò chuyện. ': 'Could not open the chat workspace. ',
    'Chưa có hội thoại để tải.': 'No conversation to download yet.',
    'Đã trở về không gian khách trên trình duyệt này.': 'Returned to guest history in this browser.',
    'Yêu cầu chưa thành công. Kiểm tra kết nối rồi thử lại.': 'Request failed. Check your connection and try again.',
    'Mật khẩu chưa đúng.': 'Incorrect password.', 'Chưa đặt mật khẩu admin trên máy chủ.': 'No admin password is configured on the server.',
    'Đăng nhập admin để mở lịch sử lưu trên máy chủ.': 'Sign in as admin to open server history.',
    'Nguồn yêu cầu không hợp lệ.': 'Invalid request origin.', 'Yêu cầu từ trang khác bị từ chối.': 'Cross-site request rejected.',
    'Yêu cầu quá lớn.': 'Request too large.', 'Yêu cầu không hợp lệ.': 'Invalid request.',
    'Không hoàn thành được lượt này. Hãy thử lại.': 'Could not complete this turn. Please try again.',
    'Không tìm thấy cuộc hội thoại.': 'Conversation not found.', 'Từ khóa tối đa 300 ký tự.': 'Search terms must be 300 characters or fewer.',
    'Chậm một chút nhé. Mỗi người tối đa 12 lượt mỗi phút.': 'Slow down a little. Each person can send up to 12 messages per minute.',
    'Chậm một chút nhé. Đã đạt giới hạn lượt trò chuyện trong một phút.': 'Slow down a little. The per-minute chat limit has been reached.',
    'Chưa kết nối AI. Điền provider và model trong settings.toml rồi khởi động lại.': 'AI is not connected. Configure the provider and model in settings.toml, then restart.',
    'Amadeus đang bận. Thử lại sau vài giây.': 'Amadeus is busy. Try again in a few seconds.',
    'Câu trả lời quá dài. Hãy thử một câu hỏi cụ thể hơn.': 'The reply is too long. Try a more specific question.',
    'Model trả lời trống. Hãy thử lại.': 'The model returned an empty reply. Please try again.',
    'Lượt trả lời quá thời gian chờ; chưa lưu vào lịch sử. Bạn có thể thử lại.': 'The response timed out and was not saved. You can try again.',
    'Tin nhắn cần từ 1 đến 6000 ký tự.': 'Messages must contain 1 to 6,000 characters.',
    'Cuộc hội thoại đang xử lý ở phiên khác. Thử lại sau vài giây.': 'This conversation is being processed in another session. Try again in a few seconds.',
    'Bạn đã có 100 cuộc hội thoại. Xóa bớt một cuộc trước khi tạo mới.': 'You already have 100 conversations. Delete one before creating another.',
    'Bộ nhớ có tối đa 50 ghi chú. Xóa bớt trước khi thêm.': 'You can save up to 50 notes. Delete some before adding another.',
    'Chưa cấu hình AI. Điền provider và model trong settings.toml rồi khởi động lại.': 'AI is not configured. Set the provider and model in settings.toml, then restart.',
    'Kết nối AI trả mã {status}. {hint}': 'The AI service returned status {status}. {hint}',
    'Kiểm tra key, URL và tên model.': 'Check the API key, URL and model name.', 'Thử lại sau một lát.': 'Try again in a moment.',
    'AI không hoàn thành câu trả lời. Bạn có thể gửi lại.': 'The AI did not complete its reply. You can try again.',
    'Câu trả lời vượt giới hạn model. Thử hỏi ngắn hơn hoặc tăng max_output_tokens.': 'The reply exceeded the model limit. Try a shorter question or increase max_output_tokens.',
    'Model không trả lời bằng văn bản. Kiểm tra model hoặc thử câu hỏi khác.': 'The model did not return text. Check the model or try another question.',
    'Luồng AI bị ngắt trước khi hoàn tất. Hội thoại chưa bị thay đổi; hãy thử lại.': 'The AI stream was interrupted before completion. The saved conversation is unchanged; please try again.',
    'Kết nối AI quá thời gian chờ. Hãy thử lại.': 'The AI connection timed out. Please try again.',
    'Không đọc được phản hồi từ nhà cung cấp AI. Kiểm tra cấu hình rồi thử lại.': 'Could not read the AI provider’s response. Check the configuration and try again.',
    'Trình duyệt đang chặn lưu lịch sử. Cho phép lưu dữ liệu trang để dùng chế độ khách.': 'Your browser is blocking history storage. Allow site storage to use guest mode.',
    'Không đọc được lịch sử trên trình duyệt. Hãy giữ lại dữ liệu trang trước khi đặt lại bộ nhớ.': 'Browser history could not be read. Preserve the site data before resetting storage.',
    'Không lưu được lịch sử trên trình duyệt. Hãy tải hoặc sao chép hội thoại cần giữ, rồi xóa bớt chat để có chỗ trống.': 'Could not save browser history. Download or copy conversations you want to keep, then delete some chats to free up space.',
    'Không tìm thấy cuộc hội thoại trên trình duyệt này.': 'Conversation not found in this browser.',
    'Đã có 100 hội thoại trên trình duyệt. Xóa bớt chat trước khi tạo mới.': 'This browser already has 100 conversations. Delete some before creating another.',
    'Chế độ hội thoại không hợp lệ.': 'Invalid conversation mode.', 'Ghi chú cần từ 1 đến 1000 ký tự.': 'Notes must contain 1 to 1,000 characters.',
    'Đã có 50 ghi chú. Xóa bớt trước khi thêm.': 'You already have 50 notes. Delete some before adding another.',
    'Thao tác lưu trữ khách không hợp lệ.': 'Invalid guest storage operation.', 'Mã gửi lại không khớp tin nhắn cũ.': 'The retry ID does not match the original message.',
    'Tắt giọng Kurisu': 'Disable Kurisu voice', 'Bật giọng Kurisu': 'Enable Kurisu voice', 'Giọng Nhật · bật': 'Japanese voice · on',
    'giọng nhân vật tổng hợp': 'synthesized character voice', 'Tiếng Nhật · phụ đề Việt': 'Japanese · English subtitles',
    'Giọng anime · bấm để bật': 'Anime voice · click to enable', 'Âm thanh đang tắt': 'Sound is off',
    'Chưa phát được âm thanh. Bấm bật giọng để thử lại.': 'Audio could not play. Enable voice to try again.',
    'Chạm vào trang để nghe lời chào của Kurisu.': 'Interact with the page to hear Kurisu’s greeting.',
    'Giọng Nhật thử nghiệm · bấm để bật': 'Japanese voice preview · click to enable', 'giọng nữ Nhật tổng hợp': 'synthesized Japanese female voice',
    'Chưa có bộ giọng. Xem Hệ thống & nguồn.': 'Voice pack unavailable. See System & credits.',
    'Metan · ngọt ngào': 'Metan · sweet', 'Metan · tsundere': 'Metan · tsundere',
    'Nanami · giọng nữ Nhật tổng hợp': 'Nanami · synthesized Japanese female voice',
    'Không tải được Cubism Core.': 'Could not load Cubism Core.', 'Chưa có bộ tài nguyên nhân vật.': 'Character assets are unavailable.',
    'Chuẩn bị tài nguyên bằng python tools/prepare_assets.py.': 'Prepare character assets with python tools/prepare_assets.py.',
    'Trình duyệt chưa hỗ trợ WebGL.': 'Your browser does not support WebGL.', 'Model Live2D không hợp lệ.': 'Invalid Live2D model.',
    'GPU không đủ kích thước texture cho model này.': 'This GPU cannot support the model’s texture size.',
    'Đang khôi phục hình ảnh…': 'Restoring visuals…', 'LIVE2D / KẾT NỐI': 'LIVE2D / CONNECTED', 'CHƯA CÓ KẾT NỐI HÌNH ẢNH': 'VISUAL CONNECTION UNAVAILABLE',
    'Kết nối rồi. Hôm nay cậu muốn nói chuyện gì?': 'We are connected. What would you like to talk about today?',
    'Chào cậu. Tôi vẫn đang nghe rõ đây.': 'Hello. I can hear you just fine.',
    'Không có gì. Giúp được cậu một chút là tốt rồi.': 'You are welcome. I am glad I could help a little.',
    'Đừng cố quá. Nghỉ một chút rồi cùng tôi nghĩ tiếp nhé.': 'Do not push yourself too hard. Take a break, then we can think it through together.',
    'Giả thuyết thú vị đấy. Nhưng trước hết phải kiểm tra bằng chứng đã.': 'An interesting hypothesis. But first, let us check the evidence.',
    'Không cần làm được tất cả ngay đâu. Mình cứ kiểm tra từng bước một.': 'You do not have to get everything right at once. Let us work through it step by step.',
    'Không phải Christina. Là Kurisu. Phải nhắc cậu bao nhiêu lần nữa đây?': 'Not Christina. Kurisu. How many times do I have to tell you?',
    'Đ-đừng đột nhiên nói như thế. Làm tôi mất tự nhiên đấy.': 'D-do not say things like that out of nowhere. You are throwing me off.',
    'Cậu nói Okabe à? Thật tình, người đó đúng là kỳ lạ.': 'You mean Okabe? Honestly, he really is a strange one.',
    'Tôi là Amadeus. Cứ gọi tôi là Kurisu cũng được.': 'I am Amadeus. You can call me Kurisu.',
    'Ngủ ngon. Nghỉ ngơi đàng hoàng cũng quan trọng đấy.': 'Good night. Getting proper rest matters too.',
    'Đó là suy nghĩ của tôi. Còn cậu thấy sao?': 'Those are my thoughts. What do you think?',
    'Này, có chỗ nào cậu còn thắc mắc thì cứ hỏi đi.': 'If there is anything you are still wondering about, just ask.',
    'Cùng sắp xếp lại từng ý, chắc chắn sẽ có điều sáng tỏ hơn.': 'If we organize our thoughts together, things should become clearer.',
    'Cậu đang suy nghĩ gì à? Khi nào muốn kể thì tôi nghe.': 'Thinking about something? I will listen whenever you want to talk.',
    'Cho mắt nghỉ một chút đi? Nhìn màn hình mãi cũng không tốt đâu.': 'Why not rest your eyes for a moment? Staring at a screen for too long is not good for you.',
    'Yên tĩnh thật. Một khoảng thời gian như thế này cũng không tệ.': 'It is quiet. Moments like this are not so bad.',
    'Thời gian kỳ lạ thật nhỉ. Nghĩ về nó rồi thì khó mà dừng lại.': 'Time is strange, is it not? Once you start thinking about it, it is hard to stop.',
    'G-gì vậy? Đừng đột nhiên nhìn tôi như thế chứ.': 'W-what? Do not suddenly stare at me like that.',
    'Tôi nghe mà. Cậu không cần gọi đi gọi lại đâu.': 'I can hear you. You do not have to keep calling me.',
  };
  const storageKey = 'amadeus.language';
  let language = 'vi';
  try { if (localStorage.getItem(storageKey) === 'en') language = 'en'; } catch { /* Preference is optional. */ }
  const bindings = new WeakMap();
  const attributes = new WeakMap();
  function t(source, values = {}) {
    let result = language === 'en' && Object.hasOwn(english, source) ? english[source] : source;
    // Server errors retain their source text, including status numbers.
    if (language === 'en' && result === source) {
      const status = /^Không gửi được tin nhắn \((\d+)\)\.$/.exec(source);
      if (status) return t('Không gửi được tin nhắn ({status}).', {status: status[1]});
      const provider = /^Kết nối AI trả mã (\d+)\. (.*)$/.exec(source);
      if (provider) return t('Kết nối AI trả mã {status}. {hint}', {status: provider[1], hint: t(provider[2])});
      const prefix = 'Không mở được không gian trò chuyện. ';
      if (source.startsWith(prefix)) return english[prefix] + t(source.slice(prefix.length));
    }
    const params = typeof values === 'function' ? values() : values;
    return result.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
  }
  function bind(node, source, values = {}) {
    bindings.set(node, {source, values});
    node.textContent = t(source, values);
    return node;
  }
  function attr(node, name, source, values = {}) {
    const map = attributes.get(node) || new Map();
    map.set(name, {source, values}); attributes.set(node, map);
    node.setAttribute(name, t(source, values));
  }
  // Capture only the initial HTML. Later user/model text is never discovered.
  const initial = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = initial.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const source = node.textContent.trim();
      if (Object.hasOwn(english, source)) {
        const leading = node.textContent.match(/^\s*/)[0], trailing = node.textContent.match(/\s*$/)[0];
        bindings.set(node, {source, values: {}, leading, trailing});
      }
    } else {
      for (const name of ['aria-label', 'title', 'placeholder', 'alt', 'data-prompt', 'content']) {
        const source = node.getAttribute(name);
        if (source && Object.hasOwn(english, source)) {
          const map = attributes.get(node) || new Map();
          map.set(name, {source, values: {}}); attributes.set(node, map);
        }
      }
    }
  }
  function apply() {
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current;
    while ((current = walker.nextNode())) {
      const binding = bindings.get(current);
      if (binding) current.textContent = (binding.leading || '') + t(binding.source, binding.values) + (binding.trailing || '');
      for (const [name, item] of attributes.get(current) || []) current.setAttribute(name, t(item.source, item.values));
    }
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
      toggle.textContent = language === 'vi' ? 'EN' : 'VI';
      toggle.lang = language === 'vi' ? 'en' : 'vi';
      toggle.setAttribute('aria-label', language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt');
      toggle.title = toggle.getAttribute('aria-label');
    }
  }
  function setLanguage(value, persist = true) {
    if (!['vi', 'en'].includes(value)) return;
    language = value;
    if (persist) try { localStorage.setItem(storageKey, value); } catch { /* Keep the in-page choice. */ }
    apply();
    document.dispatchEvent(new CustomEvent('amadeus:language', {detail: {language}}));
  }
  window.AmadeusI18n = Object.freeze({t, bind, attr, setLanguage,
    get language() {return language;}, get locale() {return language === 'en' ? 'en-US' : 'vi-VN';}});
  document.getElementById('language-toggle')?.addEventListener('click', () => setLanguage(language === 'vi' ? 'en' : 'vi'));
  window.addEventListener('storage', event => {if (event.key === storageKey) setLanguage(event.newValue === 'en' ? 'en' : 'vi', false);});
  apply();
})();
