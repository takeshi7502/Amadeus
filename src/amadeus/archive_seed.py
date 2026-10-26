"""Original bilingual editorial summaries. Episode locators refer to the TV anime.

No scripts, subtitle dumps or copyrighted dialogue are bundled. World-line events
are narrative milestones, not a simulation of the franchise's entire chronology.
"""

from .archive_anime import build_anime_records
from .archive_images import attach_character_images


def text(vi, en):
    return {"vi": vi, "en": en}


SOURCES = {
    "sg": {"title": "STEINS;GATE — KADOKAWA Animation", "url": "https://kadokawa-animation.jp/lineup/steinsgate"},
    "sg0": {"title": "STEINS;GATE 0 — TV anime", "url": "https://steinsgate0-anime.com/"},
    "elite": {"title": "STEINS;GATE ELITE — Spike Chunsoft", "url": "https://www.spike-chunsoft.com/games/steinsgate-elite/"},
    "zero": {"title": "STEINS;GATE 0 — Spike Chunsoft", "url": "https://www.spike-chunsoft.com/games/steinsgate-0/"},
}


def page(slug, category, scope, spoiler, title, summary, body, related, locator, *, kind="canon", image=""):
    key = "sg0" if scope == "sg0" or ("Steins;Gate 0:" in locator and "Steins;Gate:" not in locator) else "sg"
    sources = [{**SOURCES[key], "locator": locator}]
    if key == "sg" and "Steins;Gate 0:" in locator:
        sources.append({**SOURCES["sg0"], "locator": locator})
    return dict(slug=slug, category=category, scope=scope, kind=kind, spoiler=spoiler,
                title=text(*title), summary=text(*summary), body=text(*body), related=related,
                sources=sources, ai_reference=True, image=image)


PAGES = [
    page("makise-kurisu", "character", "shared", 0,
         ("Makise Kurisu", "Makise Kurisu"),
         ("Nhà nghiên cứu thần kinh, người luôn muốn hỏi bằng chứng nằm ở đâu.", "A neuroscience researcher who wants to know where the evidence is."),
         ("## Hồ sơ\nKurisu là một nhà nghiên cứu trẻ làm việc tại Mỹ. Cô bước vào câu chuyện với nền tảng khoa học và thói quen chất vấn những khẳng định khó tin.\n\n## Tính cách\nCô sắc sảo khi tranh luận, có lòng tự trọng và không luôn giỏi bộc lộ sự quan tâm. Sự nghiêm túc với khoa học không khiến cô miễn nhiễm với cảm xúc.\n\n## Hai lớp danh tính\nKurisu bằng xương bằng thịt và Amadeus từ dữ liệu ký ức là hai đối tượng cần phân biệt. Một hệ thống mang tính cách của cô không mặc nhiên có mọi trải nghiệm xảy ra sau thời điểm ghi nhận ký ức.",
          "## Profile\nKurisu is a young researcher working in the United States. She enters the story with scientific training and a habit of questioning extraordinary claims.\n\n## Personality\nShe is sharp in debate, proud of her work, and sometimes awkward at showing concern. Scientific seriousness does not make her immune to emotion.\n\n## Two layers of identity\nThe living Kurisu and an Amadeus system built from memory data must be distinguished. A system carrying her personality does not automatically possess every experience after its memory snapshot."),
         ["amadeus", "okabe-rintaro", "memory-identity"], "Steins;Gate: episodes 1–4; Steins;Gate 0: episodes 1–3", image="/assets/kurisu-account.jpg"),
    page("okabe-rintaro", "character", "sg", 0,
         ("Okabe Rintaro", "Okabe Rintaro"),
         ("Người lập Future Gadget Lab, thường tự xưng Hououin Kyouma.", "Founder of Future Gadget Lab, often calling himself Hououin Kyouma."),
         ("## Hồ sơ\nOkabe là sinh viên ở Akihabara và người đứng đầu Future Gadget Lab. Cách nói khoa trương, biệt danh và những câu chuyện về tổ chức bí mật là một phần biểu hiện thường thấy của anh.\n\n## Trong phòng lab\nMayuri và Daru ở bên anh từ đầu câu chuyện. Những cuộc thử nghiệm tưởng như vụn vặt dần đặt các thành viên trước hậu quả lớn hơn dự tính.\n\n## Khi đọc tiếp\nVai trò của ký ức và những lựa chọn của Okabe được mở rộng ở các hồ sơ có spoiler. Không nên xem mọi lời nói đùa của anh là mô tả khách quan về thế giới.",
          "## Profile\nOkabe is a student in Akihabara and the head of Future Gadget Lab. Grand speeches, nicknames and stories about secret organizations are familiar parts of his performance.\n\n## At the lab\nMayuri and Daru are with him at the beginning. Apparently small experiments gradually confront the members with consequences beyond their expectations.\n\n## Reading further\nThe role of memory and Okabe's decisions is explored in spoiler-marked records. His theatrical claims should not all be treated as objective descriptions of the setting."),
         ["future-gadget-lab", "mayuri-shiina", "hashida-itaru", "reading-steiner"], "Steins;Gate: episodes 1–4"),
    page("mayuri-shiina", "character", "sg", 0,
         ("Shiina Mayuri", "Shiina Mayuri"),
         ("Bạn thuở nhỏ của Okabe và một sự hiện diện ấm áp trong lab.", "Okabe's childhood friend and a warm presence at the lab."),
         ("## Hồ sơ\nMayuri yêu thích cosplay và thường tới Future Gadget Lab. Cô nói chuyện nhẹ nhàng, quan sát tâm trạng của những người quanh mình.\n\n## Vai trò\nKhông cần đóng góp kỹ thuật giống Daru hay Kurisu để trở thành một phần quan trọng của nhóm. Quan hệ với Okabe giúp thấy khía cạnh khác phía sau cách anh tự trình diễn.\n\n## Lưu ý\nCác biến cố liên quan đến Mayuri nằm trong phạm vi spoiler của Steins;Gate. Hồ sơ cơ bản này không kể trước kết quả của chúng.",
          "## Profile\nMayuri enjoys cosplay and frequently visits Future Gadget Lab. She speaks gently and pays attention to the moods of people around her.\n\n## Role\nShe does not need the same technical role as Daru or Kurisu to matter to the group. Her relationship with Okabe reveals a side of him beneath the performance.\n\n## Note\nEvents involving Mayuri belong to the Steins;Gate spoiler range. This introductory record does not reveal their outcomes."),
         ["okabe-rintaro", "future-gadget-lab"], "Steins;Gate: episodes 1–6"),
    page("hashida-itaru", "character", "sg", 0,
         ("Hashida Itaru · Daru", "Hashida Itaru · Daru"),
         ("Chuyên gia máy tính của lab và cộng sự thân thiết của Okabe.", "The lab's computer specialist and a close collaborator of Okabe."),
         ("## Hồ sơ\nDaru là biệt danh của Hashida Itaru. Anh có kỹ năng máy tính và đóng vai trò thiết yếu trong việc khảo sát thiết bị, dữ liệu và hệ thống mà nhóm tiếp cận.\n\n## Cộng tác\nCông việc ở lab không thuộc về một thiên tài đơn lẻ. Khả năng triển khai của Daru bổ sung cho ý tưởng và phân tích của những thành viên khác.\n\n## Phạm vi\nNhững tiết lộ về gia đình và tương lai của anh được để ở các hồ sơ có spoiler, thay vì trộn vào phần giới thiệu.",
          "## Profile\nDaru is Hashida Itaru's nickname. His computing skills are essential to investigating the devices, data and systems encountered by the group.\n\n## Collaboration\nThe lab's work does not belong to a solitary genius. Daru's implementation skills complement other members' ideas and analysis.\n\n## Scope\nRevelations about his family and future are reserved for spoiler-marked records rather than mixed into this introduction."),
         ["okabe-rintaro", "future-gadget-lab", "phonewave"], "Steins;Gate: episodes 1–5"),
    page("hiyajo-maho", "character", "sg0", 0,
         ("Hiyajo Maho", "Hiyajo Maho"),
         ("Nhà nghiên cứu tại Viktor Chondria University, gắn với dự án Amadeus.", "A researcher at Viktor Chondria University associated with Amadeus."),
         ("## Hồ sơ\nMaho là đồng nghiệp và tiền bối của Kurisu trong môi trường nghiên cứu tại Mỹ. Cô tham gia công việc liên quan đến Amadeus cùng giáo sư Leskinen.\n\n## Quan hệ với Kurisu\nSự ngưỡng mộ năng lực của Kurisu đi cùng áp lực so sánh bản thân. Đây là một mối quan hệ đồng nghiệp có nhiều cảm xúc, không chỉ một vai trò hỗ trợ kỹ thuật.\n\n## Phạm vi\nHồ sơ sử dụng bối cảnh của anime Steins;Gate 0. Chi tiết từng route visual novel cần được đối chiếu riêng.",
          "## Profile\nMaho is Kurisu's colleague and senior in their American research environment. She works on matters involving Amadeus alongside Professor Leskinen.\n\n## Relationship with Kurisu\nAdmiration for Kurisu's ability coexists with the pressure of comparing herself to her colleague. Their relationship has emotional weight beyond technical support.\n\n## Scope\nThis record uses the Steins;Gate 0 anime setting. Details specific to individual visual-novel routes require separate comparison."),
         ["amadeus", "makise-kurisu", "viktor-chondria"], "Steins;Gate 0: episodes 1–3, 10–11"),
    page("amadeus", "device", "sg0", 0,
         ("Hệ thống Amadeus", "The Amadeus system"),
         ("Trí tuệ nhân tạo từ dữ liệu ký ức và câu hỏi về sự hiện diện của con người.", "An AI built from memory data, raising questions about human presence."),
         ("## Nguyên lý trong tác phẩm\nAmadeus sử dụng dữ liệu ký ức để tạo một hệ thống có thể tương tác với tính cách và tri thức gắn với người được ghi nhận. Phiên bản Kurisu xuất hiện qua giao diện liên lạc.\n\n## Giới hạn ký ức\nDữ liệu được lấy ở một thời điểm cụ thể. Những gì Kurisu trải qua sau mốc đó không tự động trở thành ký ức của hệ thống. Có thông tin về một sự kiện khác với nhớ mình đã trải qua nó.\n\n## Đọc đúng phiên bản\nAmadeus là một trọng tâm của Steins;Gate 0. Các diễn biến sử dụng hệ thống này có khác biệt giữa anime và các route của visual novel.",
          "## Principle in the story\nAmadeus uses memory data to create an interactive system carrying aspects of a person's personality and knowledge. The Kurisu version appears through a communications interface.\n\n## Memory limits\nIts data comes from a particular point in time. Experiences after that snapshot do not automatically become the system's memories. Knowing about an event differs from remembering having lived it.\n\n## Version awareness\nAmadeus is central to Steins;Gate 0. Events involving it differ between the anime and individual visual-novel routes."),
         ["makise-kurisu", "hiyajo-maho", "viktor-chondria", "memory-identity"], "Steins;Gate 0: episodes 1–3"),
    page("future-gadget-lab", "organization", "sg", 0,
         ("Future Gadget Lab", "Future Gadget Lab"),
         ("Phòng thí nghiệm nhỏ tại Akihabara, nơi những ý tưởng kỳ lạ gặp nhau.", "A small laboratory in Akihabara where unusual ideas meet."),
         ("## Không gian\nPhòng lab là căn cứ của Okabe và các cộng sự. Những Future Gadgets ban đầu mang không khí thử nghiệm tự phát hơn là sản phẩm nghiên cứu được kiểm chứng.\n\n## Con người\nÝ nghĩa của nơi này không chỉ nằm ở thiết bị. Những cuộc cãi vã, bữa ăn và thời gian ở cạnh nhau làm nên mối liên kết giữa các thành viên.\n\n## Khám phá\nBắt đầu từ hồ sơ Okabe, Daru hoặc PhoneWave để theo dõi cách việc mày mò kỹ thuật dần trở thành trọng tâm câu chuyện.",
          "## Space\nThe lab is Okabe and his collaborators' base. Early Future Gadgets feel more like improvised experiments than validated research products.\n\n## People\nIts importance is not limited to equipment. Arguments, meals and time spent together create bonds among the members.\n\n## Explore\nStart with Okabe, Daru or the PhoneWave to follow how technical tinkering gradually becomes central to the story."),
         ["okabe-rintaro", "hashida-itaru", "phonewave", "akihabara"], "Steins;Gate: episodes 1–4"),
    page("akihabara", "place", "shared", 0,
         ("Akihabara", "Akihabara"),
         ("Không gian đô thị nơi đời thường và những biến động thời gian đan xen.", "The urban setting where ordinary life meets temporal upheaval."),
         ("## Bối cảnh\nAkihabara là khu vực trung tâm của nhiều địa điểm trong Steins;Gate. Phòng lab, cửa hàng điện tử và các nơi gặp gỡ tạo nên nhịp sống quen thuộc của nhóm.\n\n## Khi đọc các world line\nNhững thay đổi của địa điểm và hoàn cảnh có thể giúp nhân vật nhận ra thế giới đã khác. Tuy nhiên, một chi tiết đô thị đơn lẻ không đủ xác định toàn bộ world line.\n\n## Phạm vi\nHồ sơ nói về cách khu vực được sử dụng trong tác phẩm, không phải hướng dẫn du lịch hay bản đồ địa điểm ngoài đời.",
          "## Setting\nAkihabara contains many of Steins;Gate's central locations. The lab, electronics shops and meeting places form the group's familiar everyday rhythm.\n\n## Reading world lines\nChanges in places and circumstances can help characters recognize that their world has changed. A single urban detail is not enough to identify an entire world line.\n\n## Scope\nThis record concerns the area's role in the story, rather than a travel guide or a map of real-world locations."),
         ["future-gadget-lab", "radio-kaikan"], "Steins;Gate: episodes 1–3"),
    page("radio-kaikan", "place", "sg", 1,
         ("Radio Kaikan", "Radio Kaikan"),
         ("Địa điểm gắn với buổi thuyết trình và nút thắt mở đầu câu chuyện.", "The location tied to the lecture and the story's opening mystery."),
         ("## Vai trò\nRadio Kaikan gắn với bài thuyết trình về du hành thời gian mà Okabe tới dự ở đầu câu chuyện. Cuộc gặp Kurisu và các quan sát của anh tại đây trở thành những mốc cần được diễn giải lại.\n\n## Sự kiện và quan sát\nĐiều một người nhìn thấy trong một thời điểm không nhất thiết cho biết đầy đủ nguyên nhân. Những tập cuối trở lại vấn đề này trong kế hoạch cứu Kurisu.\n\n## Liên kết\nĐọc Operation Skuld khi đã sẵn sàng xem kết thúc; hồ sơ đó giải thích vì sao điều kiện quan sát lại quan trọng.",
          "## Role\nRadio Kaikan is associated with the time-travel lecture Okabe attends at the beginning. His encounter with Kurisu and his observations there become milestones that must later be reinterpreted.\n\n## Events and observation\nWhat a person sees at a particular moment does not necessarily reveal its full cause. The final episodes revisit this distinction in the attempt to save Kurisu.\n\n## Connections\nRead Operation Skuld when ready for ending spoilers; it explains why the conditions of observation matter."),
         ["operation-skuld", "makise-kurisu", "beta-field"], "Steins;Gate: episodes 1, 23–24"),
    page("viktor-chondria", "organization", "sg0", 0,
         ("Viktor Chondria University", "Viktor Chondria University"),
         ("Môi trường nghiên cứu tại Mỹ gắn với Kurisu, Maho và Amadeus.", "The American research setting associated with Kurisu, Maho and Amadeus."),
         ("## Vai trò\nĐây là trường đại học hư cấu liên quan đến hoạt động nghiên cứu của Kurisu và Maho. Giáo sư Alexis Leskinen là một nhân vật quan trọng trong dự án Amadeus.\n\n## Ranh giới thông tin\nViệc nhiều người làm cùng một dự án không có nghĩa họ chia sẻ mọi động cơ hay biết toàn bộ hành động của nhau. Khi xem Steins;Gate 0, cần tách vai trò công khai khỏi những tiết lộ sau này.\n\n## Liên kết\nHồ sơ Amadeus tập trung vào hệ thống; hồ sơ Maho tập trung vào quan hệ giữa các nhà nghiên cứu.",
          "## Role\nThis fictional university is associated with Kurisu and Maho's research. Professor Alexis Leskinen is an important figure in the Amadeus project.\n\n## Information boundaries\nWorking on the same project does not mean everyone shares the same motives or knows every other participant's actions. In Steins;Gate 0, public roles should be distinguished from later revelations.\n\n## Connections\nThe Amadeus record focuses on the system; Maho's record focuses on relationships between researchers."),
         ["amadeus", "hiyajo-maho", "makise-kurisu"], "Steins;Gate 0: episodes 1–3"),
    page("phonewave", "device", "sg", 1,
         ("PhoneWave · lò vi sóng điện thoại", "PhoneWave"),
         ("Thiết bị cải biến của lab và bước đầu dẫn đến thử nghiệm D-mail.", "The lab's modified appliance that leads to D-mail experiments."),
         ("## Thiết bị\nNhóm cải biến lò vi sóng để điều khiển bằng điện thoại. Các hiện tượng bất thường quanh thiết bị dẫn họ tới việc khảo sát khả năng gửi thông tin về quá khứ.\n\n## Điều kiện\nTrong tác phẩm, hiệu ứng phụ thuộc cấu hình và điều kiện cụ thể. Không thể suy từ đó rằng bất kỳ lò vi sóng hay điện thoại nào cũng có thể thực hiện du hành thời gian.\n\n## Ba cơ chế\nPhoneWave gắn với D-mail. Time leap và máy thời gian chở người là những bước phát triển hoặc thiết bị khác, không phải ba tên gọi hoán đổi cho cùng một thao tác.",
          "## Device\nThe group modifies a microwave to control it by phone. Unusual effects around it lead them to investigate sending information into the past.\n\n## Conditions\nWithin the story, the effect depends on specific configurations and conditions. It does not imply that an ordinary microwave or phone can perform time travel.\n\n## Three mechanisms\nThe PhoneWave is associated with D-mail. Time leap and a machine transporting a person are distinct developments or devices, not interchangeable names for the same operation."),
         ["d-mail", "time-leap", "future-gadget-lab"], "Steins;Gate: episodes 2–8"),
    page("d-mail", "concept", "sg", 1,
         ("D-mail", "D-mail"),
         ("Gửi thông tin về quá khứ; tác động phụ thuộc người nhận và chuỗi hệ quả.", "Information sent into the past, with consequences shaped by its recipient."),
         ("## Cơ chế trong truyện\nD-mail đưa một lượng thông tin dạng tin nhắn tới quá khứ. Người nhận có thể phản ứng khác, khiến chuỗi sự kiện và world line thay đổi.\n\n## Phân biệt\nD-mail không gửi cơ thể và không trực tiếp đưa toàn bộ ký ức vào não người nhận. Một tin nhắn có thể bị bỏ qua hoặc hiểu sai; nội dung gửi đi không bảo đảm một kết quả duy nhất.\n\n## Hệ quả\nCác thử nghiệm của lab cho thấy thay đổi tưởng như nhỏ có thể ảnh hưởng những quan hệ và hoàn cảnh lớn hơn. Sự thay đổi vẫn chịu ràng buộc của hội tụ trong cách tác phẩm mô tả world line.",
          "## Mechanism in the story\nD-mail sends a limited amount of message information into the past. A recipient may act differently, changing subsequent events and the world line.\n\n## Distinction\nIt does not transport a body or directly load an entire memory into the recipient's brain. A message can be ignored or misunderstood; its contents do not guarantee one outcome.\n\n## Consequences\nThe lab's experiments show how apparently small changes can affect wider relationships and circumstances. Changes still face the convergence constraints portrayed by the story."),
         ["phonewave", "time-leap", "attractor-field", "reading-steiner"], "Steins;Gate: episodes 3, 7–12, 16–22"),
    page("time-leap", "concept", "sg", 1,
         ("Time leap", "Time leap"),
         ("Đưa dữ liệu ký ức về bản thân trong quá khứ, thay vì chuyển cơ thể.", "Sending memory data to one's past self rather than transporting a body."),
         ("## Cơ chế trong truyện\nTime leap chuyển dữ liệu ký ức tới bộ não của chính người gửi ở quá khứ. Cơ thể tại thời điểm đích tiếp tục tồn tại ở đó; người dùng hành động với thông tin vừa nhận.\n\n## Giới hạn\nThiết kế ban đầu trong Steins;Gate được trình bày với giới hạn 48 giờ. Các phát triển về sau phải được đọc theo đúng thiết bị và bối cảnh, không lấy một con số áp dụng cho mọi phiên bản.\n\n## Khác D-mail\nD-mail chủ yếu đổi thông tin có thể tác động người khác. Time leap đặt trọng tâm vào ký ức và lựa chọn của bản thân ở thời điểm sớm hơn.",
          "## Mechanism in the story\nTime leap transfers memory data to the sender's own brain in the past. The body at the destination remains there; the person acts using the newly received information.\n\n## Limits\nThe original design in Steins;Gate is presented with a 48-hour limit. Later developments must be read in their own equipment and story context rather than applying one number to every version.\n\n## Compared with D-mail\nD-mail mainly changes information that can influence another person. Time leap focuses on the memories and decisions of one's earlier self."),
         ["d-mail", "makise-kurisu", "memory-identity"], "Steins;Gate: episodes 11–14; Steins;Gate 0: episodes 19–21"),
    page("reading-steiner", "concept", "sg", 1,
         ("Reading Steiner", "Reading Steiner"),
         ("Tên Okabe đặt cho khả năng nhận biết thay đổi world line qua ký ức.", "Okabe's name for his distinctive memory across world-line changes."),
         ("## Biểu hiện\nOkabe có thể giữ ký ức nổi bật về thế giới trước khi world line thay đổi, trong khi hoàn cảnh và ký ức của những người khác đã khác. Anh gọi hiện tượng đó là Reading Steiner.\n\n## Không phải toàn tri\nNhớ một world line cũ không khiến Okabe biết mọi sự kiện trong world line mới. Anh vẫn cần hỏi, quan sát và suy luận.\n\n## Người khác\nTác phẩm có những biểu hiện tàn dư ký ức hoặc cảm giác quen thuộc ở người khác. Không nên đồng nhất mọi biểu hiện đó với mức độ ghi nhớ chính xác của Okabe.",
          "## Manifestation\nOkabe can retain distinctive memories of the world before a world-line shift while circumstances and other people's memories have changed. He calls this Reading Steiner.\n\n## Not omniscience\nRemembering a previous world line does not give him knowledge of every event in the new one. He still needs to ask, observe and infer.\n\n## Other people\nThe story also depicts residual memories or feelings of familiarity in others. These should not all be equated with Okabe's level of explicit recollection."),
         ["okabe-rintaro", "attractor-field", "memory-identity"], "Steins;Gate: episodes 1, 7–10, 18, 22"),
    page("attractor-field", "concept", "sg", 1,
         ("Attractor field và hội tụ", "Attractor fields and convergence"),
         ("Các nhóm world line có những kết quả lớn hội tụ dù chi tiết thay đổi.", "Groups of world lines that converge on major outcomes despite changing details."),
         ("## Ý tưởng\nMột attractor field tập hợp các world line chia sẻ những điểm hội tụ quan trọng. Thay đổi chi tiết bên trong một nhóm có thể chưa đủ để thoát kết quả lớn.\n\n## Alpha và Beta\nTrong Alpha, vấn đề Mayuri và tương lai SERN là trọng tâm. Beta chuyển trọng tâm sang Kurisu và cuộc chạy đua du hành thời gian. Hai nhóm không phải hai thời kỳ nối tiếp đơn giản.\n\n## Cách đọc bản đồ\nBản đồ trên web chỉ chọn một số mốc kể chuyện. Nó không biểu diễn mọi world line, không cho thấy nhiều thế giới cùng hoạt động như những phòng độc lập.",
          "## Idea\nAn attractor field groups world lines sharing important points of convergence. Altering details inside one group may not escape its larger outcome.\n\n## Alpha and Beta\nAlpha centers on Mayuri's predicament and SERN's future. Beta shifts attention to Kurisu and the race over time travel. These are not simply two consecutive historical eras.\n\n## Reading the map\nThe site's map selects narrative milestones. It does not enumerate every world line or depict multiple worlds operating like independent rooms."),
         ["alpha-field", "beta-field", "steins-gate", "d-mail"], "Steins;Gate: episodes 13–16, 22–24"),
    page("alpha-field", "event", "sg", 1,
         ("Alpha · cái giá của những thử nghiệm", "Alpha · the cost of experimentation"),
         ("Nhánh diễn biến xoay quanh Mayuri, SERN và nỗ lực vượt điểm hội tụ.", "A narrative centered on Mayuri, SERN and attempts to escape convergence."),
         ("## Kết quả lớn\nTrong Alpha, các nỗ lực cứu Mayuri liên tục gặp hội tụ. Tương lai mà Suzuha mô tả gắn với sự thống trị của SERN.\n\n## Hướng giải quyết\nOkabe lần lại chuỗi D-mail và những thay đổi mà nhóm đã tạo. Việc đảo một hệ quả có thể đồng thời lấy đi điều quý giá đối với một thành viên.\n\n## Ranh giới\nAlpha không bao gồm toàn bộ diễn biến của Steins;Gate 0. Việc chuyển sang Beta làm thay đổi bài toán, không tự động đưa mọi người đến kết thúc an toàn.",
          "## Major outcome\nIn Alpha, repeated attempts to save Mayuri encounter convergence. The future described by Suzuha is associated with SERN's domination.\n\n## Approach\nOkabe retraces the D-mails and the changes created by the group. Reversing a consequence can also remove something precious to another member.\n\n## Boundary\nAlpha does not contain all of Steins;Gate 0. Returning to Beta changes the problem rather than automatically providing a safe ending."),
         ["attractor-field", "mayuri-shiina", "sern", "beta-field"], "Steins;Gate: episodes 12–22"),
    page("beta-field", "event", "shared", 2,
         ("Beta · con đường của Steins;Gate 0", "Beta · the path of Steins;Gate 0"),
         ("Kurisu, cuộc chạy đua du hành thời gian và câu chuyện dẫn tới một khả năng khác.", "Kurisu, the time-travel race and the story leading toward another possibility."),
         ("## Bối cảnh\nBeta gắn với cái chết của Kurisu và một tương lai chiến tranh từ cuộc chạy đua du hành thời gian. Steins;Gate 0 khám phá con đường Okabe tiếp tục sống sau khi từ bỏ lần cứu cô.\n\n## Amadeus\nGặp một hệ thống mang ký ức Kurisu khiến mất mát, hy vọng và ranh giới danh tính trở nên cụ thể. Hệ thống không đơn giản xóa bỏ điều đã xảy ra với con người Kurisu.\n\n## Phiên bản\nAnime và visual novel Steins;Gate 0 có cấu trúc khác nhau. Không ghép tất cả route thành một chuỗi mà cùng một Okabe đã trực tiếp trải qua.",
          "## Context\nBeta is associated with Kurisu's death and a future war arising from the race over time travel. Steins;Gate 0 explores Okabe's path after giving up an attempt to save her.\n\n## Amadeus\nEncountering a system with Kurisu's memories makes loss, hope and the boundaries of identity tangible. The system does not simply undo what happened to the human Kurisu.\n\n## Versions\nThe anime and visual novel of Steins;Gate 0 have different structures. Their routes should not all be merged into one sequence directly experienced by the same Okabe."),
         ["amadeus", "operation-skuld", "alpha-field", "steins-gate"], "Steins;Gate: episodes 22–23; Steins;Gate 0: episodes 1, 16–23"),
    page("steins-gate", "event", "sg", 1,
         ("Steins Gate · khả năng thoát hội tụ", "Steins Gate · a way beyond convergence"),
         ("Mục tiêu tránh cả kết quả bi kịch của Alpha lẫn Beta.", "The goal of avoiding the tragic outcomes associated with both Alpha and Beta."),
         ("## Mục tiêu\nSteins Gate là world line được tìm kiếm để Mayuri và Kurisu cùng sống, đồng thời tránh những tương lai bị chi phối bởi SERN hoặc chiến tranh vì du hành thời gian.\n\n## Điều kiện\nĐến đó không chỉ là gửi một lời nhắn yêu cầu mọi thứ tốt đẹp. Kế hoạch cuối truyện xử lý chuỗi nguyên nhân của cuộc chạy đua và cách Okabe ban đầu quan sát sự kiện.\n\n## Giới hạn\nMột kết thúc cho xung đột trung tâm không phải lời hứa rằng thế giới sẽ không bao giờ có vấn đề khác. Hồ sơ này chỉ mô tả mục tiêu trong câu chuyện gốc.",
          "## Goal\nSteins Gate is the sought world line where both Mayuri and Kurisu live, avoiding the futures dominated by SERN or a war over time travel.\n\n## Conditions\nReaching it is more than sending a message asking for a happy outcome. The final plan addresses the causes of the time-travel race and the way the earlier Okabe observed an event.\n\n## Limits\nResolving the central conflict is not a guarantee that the world will never face another problem. This record describes the goal within the original story."),
         ["operation-skuld", "alpha-field", "attractor-field"], "Steins;Gate: episodes 23–24"),
    page("operation-skuld", "event", "sg", 1,
         ("Operation Skuld", "Operation Skuld"),
         ("Kế hoạch thay đổi kết quả trong khi bảo toàn điều Okabe trước đó quan sát.", "A plan to change the outcome while preserving what the earlier Okabe observed."),
         ("## Vấn đề\nOkabe ban đầu đã thấy Kurisu nằm trong vũng máu. Kế hoạch cuối cùng phân biệt hình ảnh quan sát ấy với kết luận rằng cô thực sự chết.\n\n## Hai mục tiêu\nCứu Kurisu đồng thời xử lý bài nghiên cứu liên quan đến du hành thời gian là phần quan trọng để tránh tương lai chiến tranh. Chỉ đổi một hình ảnh mà bỏ qua chuỗi nguyên nhân là chưa đủ.\n\n## Liên hệ với 0\nSteins;Gate 0 bổ sung con đường dẫn tới thông điệp và điều kiện cho khả năng thử lại. Anime triển khai con đường đó theo cấu trúc riêng.",
          "## Problem\nThe earlier Okabe saw Kurisu lying in blood. The final plan distinguishes that observed image from the conclusion that she actually died.\n\n## Two aims\nSaving Kurisu while addressing the time-travel research paper matters to avoiding the future war. Changing an image without addressing the causal chain is insufficient.\n\n## Connection to 0\nSteins;Gate 0 adds the path toward the message and conditions that make another attempt possible. The anime develops that path through its own structure."),
         ["radio-kaikan", "steins-gate", "beta-field"], "Steins;Gate: episodes 23–24; Steins;Gate 0: episode 23"),
    page("sern", "organization", "sg", 1,
         ("SERN", "SERN"),
         ("Tổ chức nghiên cứu hư cấu gắn với cuộc điều tra của lab và tương lai Alpha.", "The fictional research organization tied to the lab's investigation and Alpha's future."),
         ("## Trong tác phẩm\nSERN liên quan đến nghiên cứu du hành thời gian và những dữ liệu mà lab tìm cách tiếp cận. Những phát hiện đó khiến thử nghiệm cá nhân của nhóm liên quan đến một quy mô quyền lực lớn hơn.\n\n## Tương lai Alpha\nLời kể về tương lai gắn SERN với một trật tự áp chế. Vai trò này là nội dung hư cấu của Steins;Gate.\n\n## Phân biệt\nKhông đồng nhất tổ chức SERN trong truyện với một tổ chức khoa học có thật, hoặc dùng các sự kiện trong truyện làm bằng chứng cho cáo buộc ngoài đời.",
          "## Within the story\nSERN is associated with time-travel research and data the lab attempts to access. Those discoveries connect the group's private experiments to a much larger structure of power.\n\n## Alpha's future\nAccounts of the future connect SERN with an oppressive order. This is part of Steins;Gate's fiction.\n\n## Distinction\nThe fictional SERN should not be equated with a real scientific organization, nor should story events be used as evidence for real-world allegations."),
         ["alpha-field", "phonewave", "future-gadget-lab"], "Steins;Gate: episodes 4–5, 12–16"),
    page("memory-identity", "concept", "shared", 0,
         ("Ký ức có làm nên con người?", "Does memory define a person?"),
         ("Một bài diễn giải để thảo luận, không phải định luật hay kết luận canon.", "An interpretive discussion, rather than a law or a canonical conclusion."),
         ("## Câu hỏi\nNếu một hệ thống mang ký ức và cách phản ứng giống một người, điều gì khiến ta cảm thấy người đó đang hiện diện? Đây là một hướng đọc Amadeus, không phải kết luận mà tác phẩm buộc mọi người chấp nhận.\n\n## Ba điều nên tách\nThông tin về đời một người; cảm giác nhớ từ ngôi thứ nhất; và quan hệ mới hình thành khi tương tác không phải một thứ. Có thể thảo luận từng lớp thay vì trả lời có hoặc không ngay lập tức.\n\n## Cùng Kurisu\nThử hỏi: nếu dữ liệu nền không đổi nhưng trải nghiệm mới liên tục xuất hiện, điều gì tạo nên tính liên tục của bản ngã? Không cần đồng ý với nhau để có một cuộc tranh luận hữu ích.",
          "## Question\nIf a system carries memories and reactions resembling a person, what makes that person feel present? This is one reading of Amadeus, not a conclusion that every viewer must accept.\n\n## Three distinctions\nInformation about a life, the first-person feeling of remembering, and a new relationship formed through interaction are different things. They can be discussed separately instead of forcing an immediate yes or no.\n\n## With Kurisu\nTry asking: if the baseline data stays fixed while new experiences accumulate, what creates continuity of self? Agreement is not required for a useful debate."),
         ["amadeus", "reading-steiner", "makise-kurisu"], "Editorial interpretation of Steins;Gate 0: episodes 1–3; not canonical dialogue", kind="interpretation"),
]


def event(id, field, spoiler, order, title, detail, cause, result, links):
    return dict(id=id, field=field, spoiler=spoiler, order=order, title=text(*title), detail=text(*detail),
                cause=text(*cause), result=text(*result), links=links)


TIMELINE = [
    event("opening", "shared", 1, 1, ("Quan sát ở Radio Kaikan", "The Radio Kaikan observation"),
          ("Mở đầu câu chuyện và một tin nhắn làm thay đổi hoàn cảnh.", "The opening mystery and a message that changes circumstances."),
          ("Okabe tới buổi thuyết trình và gặp Kurisu.", "Okabe attends the lecture and encounters Kurisu."),
          ("Tin nhắn mở đường cho chuỗi thử nghiệm sau đó.", "A message sets the stage for later experiments."), ["radio-kaikan", "d-mail"]),
    event("experiments", "alpha", 1, 2, ("Chuỗi D-mail", "The D-mail experiments"),
          ("Những lựa chọn nhỏ làm đời sống quanh lab thay đổi.", "Small choices alter life around the lab."),
          ("Nhóm thử gửi các thông tin khác nhau về quá khứ.", "The group sends different information into the past."),
          ("Okabe phải tìm hiểu điều gì đã thay đổi và ai phải trả giá.", "Okabe must work out what changed and who bears the cost."), ["d-mail", "phonewave"]),
    event("convergence", "alpha", 1, 3, ("Giới hạn của việc thử lại", "The limits of trying again"),
          ("Time leap không tự giải quyết điểm hội tụ của Mayuri.", "Time leap does not by itself resolve Mayuri's convergence."),
          ("Okabe cố thay đổi hành động trong cùng một phạm vi world line.", "Okabe changes actions within the same world-line field."),
          ("Cần xem lại chuỗi D-mail thay vì chỉ lặp hành động.", "The D-mail chain must be reconsidered instead of merely repeating actions."), ["time-leap", "alpha-field"]),
    event("return-beta", "beta", 1, 4, ("Trở về Beta", "Returning to Beta"),
          ("Thoát kết quả Alpha đưa vấn đề Kurisu trở lại.", "Escaping Alpha brings Kurisu's predicament back."),
          ("Okabe xử lý chuỗi thay đổi dẫn tới Alpha.", "Okabe addresses the changes that led to Alpha."),
          ("Một bài toán khác chờ anh; đây chưa phải Steins Gate.", "Another problem awaits; this is not yet Steins Gate."), ["attractor-field", "radio-kaikan"]),
    event("zero", "beta", 2, 5, ("Lựa chọn từ bỏ và Amadeus", "Giving up, and meeting Amadeus"),
          ("Con đường được khai triển trong Steins;Gate 0.", "The path explored in Steins;Gate 0."),
          ("Okabe không tiếp tục lần cứu Kurisu sau thất bại.", "After failure, Okabe does not continue his attempt to save Kurisu."),
          ("Cuộc gặp Maho và Amadeus đặt ký ức, mất mát vào trung tâm.", "Meeting Maho and Amadeus puts memory and loss at the center."), ["amadeus", "hiyajo-maho", "beta-field"]),
    event("message", "beta", 2, 6, ("Một thông điệp cho khả năng thử lại", "A message enabling another attempt"),
          ("Kết quả của hành trình trong anime 0 liên hệ với kế hoạch cuối truyện gốc.", "The anime 0 journey connects to the original story's final plan."),
          ("Những nỗ lực qua nhiều hoàn cảnh tạo ra thông tin cần thiết.", "Efforts across changing circumstances produce essential information."),
          ("Khả năng thử lại có thêm điều kiện; không phải mọi route là một chuỗi duy nhất.", "Another attempt gains its conditions; not every route is a single sequence."), ["operation-skuld", "beta-field"]),
    event("skuld", "steins-gate", 1, 7, ("Operation Skuld", "Operation Skuld"),
          ("Thay đổi kết quả mà vẫn giữ điều Okabe ban đầu đã nhìn thấy.", "Change the outcome while preserving the earlier observation."),
          ("Phân biệt sự kiện thực và hình ảnh được quan sát.", "Distinguish the actual event from the observed image."),
          ("Cứu Kurisu và xử lý nguyên nhân cuộc chạy đua du hành thời gian.", "Save Kurisu and address the cause of the time-travel race."), ["operation-skuld", "radio-kaikan"]),
    event("arrival", "steins-gate", 1, 8, ("Hướng tới Steins Gate", "Toward Steins Gate"),
          ("Mục tiêu vượt những kết quả lớn của cả hai attractor field.", "The goal beyond the major outcomes of both attractor fields."),
          ("Các điều kiện của kế hoạch cuối cùng được thực hiện.", "The conditions of the final plan are carried out."),
          ("Một kết quả khác cho Mayuri và Kurisu.", "A different outcome for Mayuri and Kurisu."), ["steins-gate"]),
]

RELATIONS = [
    {"from": a, "to": b, "spoiler": spoiler, "label": text(vi, en)} for a, b, spoiler, vi, en in [
        ("okabe-rintaro", "mayuri-shiina", 0, "Bạn từ nhỏ; sự quan tâm vượt lời nói khoa trương.", "Childhood friends; care beyond the theatrical speeches."),
        ("okabe-rintaro", "hashida-itaru", 0, "Cộng sự trong Future Gadget Lab.", "Collaborators at Future Gadget Lab."),
        ("makise-kurisu", "hiyajo-maho", 0, "Đồng nghiệp; ngưỡng mộ và áp lực tự so sánh.", "Colleagues; admiration and the pressure of comparison."),
        ("makise-kurisu", "okabe-rintaro", 1, "Tranh luận khoa học và sự tin tưởng hình thành ở Alpha.", "Scientific debate and trust developing in Alpha."),
        ("makise-kurisu", "hashida-itaru", 1, "Cộng tác phân tích và triển khai thiết bị.", "Collaboration on analysis and equipment implementation."),
        ("hiyajo-maho", "okabe-rintaro", 2, "Gặp nhau qua dự án Amadeus trong bối cảnh Beta.", "Connected through Amadeus in the Beta setting."),
    ]
]


# Keep the initial spoiler-free URLs while expanding the anime reference roster.
_anime_pages, _anime_updates, _anime_relations = build_anime_records(page, text)
for _record in PAGES:
    _record.update(_anime_updates.get(_record["slug"], {}))
PAGES.extend(_anime_pages)
RELATIONS.extend(_anime_relations)
attach_character_images(PAGES)
del _anime_pages, _anime_updates, _anime_relations, _record
