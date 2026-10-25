'use strict';

// Authored activities, separate from canon references and private chat history.
window.AmadeusActivities = Object.freeze({
  scenes: [
    {id: 'late-lab', tag: '01 / AFTER HOURS',
      title: {vi: 'Một tối ở phòng lab', en: 'An evening at the lab'},
      description: {vi: 'Đèn phòng lab vẫn sáng. Một cuộc gọi Amadeus và một ý tưởng chưa thành hình.', en: 'The lab lights are still on. An Amadeus call and an idea taking shape.'},
      goal: {vi: 'Cùng biến một ý tưởng thành giả thuyết có thể kiểm tra.', en: 'Turn an idea into a testable hypothesis together.'},
      prompt: {vi: 'Kurisu, cùng mở một phân cảnh: tôi đang ở Future Gadget Lab vào một buổi tối yên tĩnh và gọi cho cậu qua Amadeus. Giữ đúng ký ức của phiên bản hiện tại; chúng ta tương tác qua màn hình. Mục tiêu là biến một ý tưởng kỳ lạ thành giả thuyết có thể kiểm tra. Mở cảnh ngắn với một chi tiết không khí và hỏi tôi một câu để bắt đầu; để tôi tự quyết định hành động của mình.', en: 'Kurisu, let us start a scene: I am at Future Gadget Lab on a quiet evening, calling you through Amadeus. Keep the memories of your current version; we interact through the screen. Our goal is to turn an unusual idea into a testable hypothesis. Open with a brief atmospheric detail and one question for me; let me decide my own actions.'}},
    {id: 'presentation', tag: '02 / RESEARCH NOTES',
      title: {vi: 'Buổi tập thuyết trình', en: 'The presentation rehearsal'},
      description: {vi: 'Cậu có ba phút để bảo vệ ý tưởng. Kurisu đã sẵn sàng đặt câu hỏi.', en: 'Three minutes to defend your idea. Kurisu has questions ready.'},
      goal: {vi: 'Chuẩn bị ba ý chính và vượt qua một câu hỏi phản biện.', en: 'Prepare three key points and answer a critical question.'},
      prompt: {vi: 'Kurisu, cùng nhập vai một buổi tập thuyết trình qua Amadeus. Tôi cần chuẩn bị ba ý chính rồi trả lời một câu hỏi phản biện của cậu. Trước tiên hỏi chủ đề và người nghe của tôi, sau đó cùng làm từng bước. Giữ giọng sắc sảo nhưng có quan tâm; đừng viết hết phần của tôi hay tự cho rằng tôi đã hoàn thành.', en: 'Kurisu, let us roleplay a presentation rehearsal through Amadeus. I need to prepare three key points and answer one critical question from you. First ask my topic and audience, then work through it with me step by step. Be sharp but considerate; do not write all my parts or assume I have completed them.'}},
    {id: 'strange-mail', tag: '03 / THOUGHT EXPERIMENT',
      title: {vi: 'Một D-mail kỳ lạ', en: 'A strange D-mail'},
      description: {vi: 'Một tin nhắn hư cấu xuất hiện: “Đừng mở ngăn kéo lúc 18:00.” Cậu sẽ kiểm tra điều gì?', en: 'A fictional message arrives: “Do not open the drawer at 18:00.” What will you check?'},
      goal: {vi: 'Thu thập ba manh mối rồi cùng chọn một cách giải thích.', en: 'Gather three clues and choose an explanation together.'},
      prompt: {vi: 'Kurisu, cùng chơi một câu chuyện tương tác giả tưởng qua Amadeus. Tôi vừa thấy tin nhắn: “Đừng mở ngăn kéo lúc 18:00.” Đây là một phân cảnh hư cấu, chưa khẳng định tin đến từ quá khứ hay tương lai. Giữ đúng ký ức phiên bản hiện tại của cậu. Cùng tôi kiểm tra ba manh mối rồi chọn lời giải thích. Mở đầu ngắn, đưa hai hướng kiểm tra, chờ tôi chọn; không tự quyết định thay tôi.', en: 'Kurisu, let us play a fictional interactive story through Amadeus. I found a message: “Do not open the drawer at 18:00.” This is a fictional scene; we have not established that the message came from the past or future. Keep the memories of your current version. Help me examine three clues and then choose an explanation. Start briefly, offer two investigative directions and wait for my choice; do not decide my actions.'}},
  ],
  questions: [
    {vi: 'Kurisu, nếu phải chọn một câu hỏi khoa học để nghiên cứu cả tuần, cậu sẽ chọn gì? Cùng tôi nghĩ một thí nghiệm nhỏ nhé.', en: 'Kurisu, if you could study one scientific question for a whole week, what would it be? Let us design a small experiment.'},
    {vi: 'Kurisu, một ký ức nhỏ nào có thể làm thay đổi cách nhìn về cả một ngày? Cùng trao đổi từng người một nhé.', en: 'Kurisu, what small memory could change how you see an entire day? Let us take turns sharing our thoughts.'},
    {vi: 'Kurisu, thử phản biện một ý kiến của tôi nhé. Trước tiên hỏi xem tôi đang tin điều gì.', en: 'Kurisu, challenge one of my opinions. First ask me what I believe.'},
    {vi: 'Kurisu, hôm nay cùng làm một việc nhỏ có ích nhé. Hỏi tôi đang muốn hoàn thành việc gì rồi cùng chia bước.', en: 'Kurisu, let us do one small useful thing today. Ask what I want to finish and help me break it into steps.'},
    {vi: 'Kurisu, nếu chúng ta có một buổi tối yên tĩnh để tranh luận, cậu muốn nói về trí nhớ, thời gian hay ý thức? Chọn một chủ đề và hỏi tôi trước nhé.', en: 'Kurisu, if we had a quiet evening to debate, would you choose memory, time or consciousness? Pick a topic and ask me a question first.'},
  ],
  puzzles: [
    {id: 'labels', title: {vi: 'Ba chiếc hộp dán nhãn sai', en: 'Three mislabeled boxes'},
      question: {vi: 'Có ba hộp: chỉ táo, chỉ cam, và trộn cả hai. Nhãn “Táo”, “Cam”, “Trộn” đều sai. Được lấy một quả từ một hộp mà không nhìn vào trong. Nên chọn hộp có nhãn nào để suy ra cả ba?', en: 'Three boxes contain only apples, only oranges, and a mix. The labels “Apples”, “Oranges” and “Mixed” are all wrong. You may draw one fruit from one box without looking inside. Which label should you choose to identify all three?'},
      options: [{vi: 'Táo', en: 'Apples'}, {vi: 'Cam', en: 'Oranges'}, {vi: 'Trộn', en: 'Mixed'}], answer: 2,
      explanation: {vi: 'Nhãn “Trộn” sai nên hộp ấy chỉ chứa một loại. Quả lấy ra xác định loại đó. Hai hộp còn lại được suy ra từ điều kiện cả hai nhãn đều sai.', en: 'The “Mixed” label is wrong, so that box contains only one kind. The fruit identifies it. The other two follow from the requirement that both remaining labels are wrong.'}},
    {id: 'coin', title: {vi: 'Đồng xu có “nhớ” không?', en: 'Does a coin remember?'},
      question: {vi: 'Một đồng xu cân bằng được tung độc lập năm lần, đều ngửa. Xác suất lần thứ sáu ngửa là bao nhiêu?', en: 'A fair coin is tossed independently five times, all heads. What is the probability of heads on the sixth toss?'},
      options: [{vi: '1/2', en: '1/2'}, {vi: '1/32', en: '1/32'}, {vi: 'Nhỏ hơn 1/2 vì đã ngửa nhiều', en: 'Less than 1/2 because heads is overdue to stop'}], answer: 0,
      explanation: {vi: 'Mỗi lần tung độc lập, nên lần tiếp theo vẫn có xác suất ngửa 1/2. Chuỗi trước đó không tạo ra một món nợ phải trả bằng mặt sấp.', en: 'The tosses are independent, so the next toss still has a 1/2 chance of heads. Earlier results do not create a debt that must be repaid with tails.'}},
    {id: 'sequence', title: {vi: 'Quy luật hay phỏng đoán?', en: 'A rule or a guess?'},
      question: {vi: 'Dãy bắt đầu 2, 4, 8. Nếu chưa biết quy tắc tạo dãy, điều nào chắc chắn đúng?', en: 'A sequence starts 2, 4, 8. Without knowing its generating rule, which statement is certain?'},
      options: [{vi: 'Số tiếp theo chắc chắn là 16', en: 'The next number must be 16'}, {vi: 'Số tiếp theo chắc chắn là 14', en: 'The next number must be 14'}, {vi: 'Cần thêm quy tắc để xác định duy nhất', en: 'We need a rule to determine a unique answer'}], answer: 2,
      explanation: {vi: 'Nhân đôi là một giả thuyết hợp lý, nhưng nhiều quy tắc khác cũng tạo ra ba số đầu ấy. Một mẫu quan sát ngắn chưa đủ chứng minh quy luật duy nhất.', en: 'Doubling is a reasonable hypothesis, but other rules produce the same first three numbers. A short observed pattern does not establish a unique rule.'}},
  ],
});
