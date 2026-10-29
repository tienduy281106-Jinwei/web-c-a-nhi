/**
 * NIHONGO STEP - HỆ THỐNG QUIZ VÀ BÀI KIỂM TRA TRẮC NGHIỆM ĐA DẠNG
 * 9 dạng bài tập: JP->VI, VI->JP, Nghe->Chọn, Chọn Hiragana, Chọn Kanji,
 * Chọn Romaji, Điền từ vào câu ví dụ, Chọn trợ từ が/を, Phân biệt Tính từ な vs い.
 * Có giải thích chi tiết, âm thanh, chấm điểm tự động và lưu lịch sử.
 */

class QuizEngine {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = [];
    this.isAnswered = false;
    this.mode = "quick"; // "quick" (luyện tập) | "exam" (kiểm tra tổng hợp)
    this.totalQuestions = 10;
    this.selectedCategory = "all";

    this.dom = {
      setupContainer: document.getElementById("quiz-setup-card"),
      playContainer: document.getElementById("quiz-play-card"),
      resultContainer: document.getElementById("quiz-result-card"),
      questionCounter: document.getElementById("quiz-q-counter"),
      progressBar: document.getElementById("quiz-progress-bar"),
      scoreBadge: document.getElementById("quiz-score-badge"),
      typeBadge: document.getElementById("quiz-type-badge"),
      promptBox: document.getElementById("quiz-prompt-box"),
      optionsContainer: document.getElementById("quiz-options-grid"),
      feedbackBox: document.getElementById("quiz-feedback-box"),
      feedbackStatus: document.getElementById("quiz-feedback-status"),
      feedbackExp: document.getElementById("quiz-feedback-explanation"),
      feedbackAudioBtn: document.getElementById("quiz-feedback-audio"),
      nextBtn: document.getElementById("quiz-next-btn"),
      startBtn: document.getElementById("quiz-start-btn"),
      categorySelect: document.getElementById("quiz-category-select"),
      lengthSelect: document.getElementById("quiz-length-select"),
      reviewWrongContainer: document.getElementById("quiz-review-wrong-box"),
      retakeBtn: document.getElementById("quiz-retake-btn")
    };
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    if (this.dom.startBtn) {
      this.dom.startBtn.addEventListener("click", () => {
        this.selectedCategory = this.dom.categorySelect ? this.dom.categorySelect.value : "all";
        this.totalQuestions = this.dom.lengthSelect ? parseInt(this.dom.lengthSelect.value, 10) : 10;
        this.startQuiz();
      });
    }

    if (this.dom.nextBtn) {
      this.dom.nextBtn.addEventListener("click", () => {
        if (!this.isAnswered) return;
        this.nextQuestion();
      });
    }

    if (this.dom.retakeBtn) {
      this.dom.retakeBtn.addEventListener("click", () => {
        this.showSetup();
      });
    }
  }

  showSetup() {
    if (this.dom.setupContainer) this.dom.setupContainer.classList.remove("d-none");
    if (this.dom.playContainer) this.dom.playContainer.classList.add("d-none");
    if (this.dom.resultContainer) this.dom.resultContainer.classList.add("d-none");
  }

  // Khởi động bài Quiz
  startQuiz(customPool = null, customTotal = null) {
    let pool = customPool ? [...customPool] : [...VOCABULARY_DATA];

    if (!customPool && this.selectedCategory !== "all") {
      if (this.selectedCategory === "adverb") {
        pool = pool.filter(w => w.category === "adverb" || w.category === "conjunction");
      } else {
        pool = pool.filter(w => w.category === this.selectedCategory);
      }
    }

    if (pool.length < 4) {
      if (window.showToast) {
        window.showToast("Cần ít nhất 4 từ vựng để tạo bài kiểm tra trắc nghiệm!", "warning");
      }
      return;
    }

    const count = customTotal || this.totalQuestions;
    this.questions = this.generateQuestions(pool, count);
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = [];
    this.isAnswered = false;

    if (this.dom.setupContainer) this.dom.setupContainer.classList.add("d-none");
    if (this.dom.resultContainer) this.dom.resultContainer.classList.add("d-none");
    if (this.dom.playContainer) this.dom.playContainer.classList.remove("d-none");

    this.renderQuestion();
  }

  // Thuật toán sinh câu hỏi thông minh tránh trùng lặp
  generateQuestions(pool, targetCount) {
    const list = [...pool];
    this.shuffle(list);
    const questions = [];
    const actualCount = Math.min(targetCount, list.length);

    const questionTypes = [
      "jp_to_vi",       // Nhìn tiếng Nhật -> chọn nghĩa tiếng Việt
      "vi_to_jp",       // Nhìn tiếng Việt -> chọn từ tiếng Nhật
      "audio_to_vi",    // Nghe phát âm -> chọn nghĩa
      "pick_hiragana",  // Chọn cách viết Hiragana đúng
      "pick_romaji",    // Chọn phiên âm Romaji đúng
      "fill_blank",     // Điền từ còn thiếu vào câu
      "grammar_adj_type"// Phân loại Tính từ な hay い
    ];

    for (let i = 0; i < actualCount; i++) {
      const targetWord = list[i];
      let eligibleTypes = [...questionTypes];

      // Nếu từ có Kanji thì bổ sung dạng câu hỏi chọn Kanji
      if (targetWord.kanji) {
        eligibleTypes.push("pick_kanji");
      }

      // Nếu từ thuộc Bài 9 liên quan đến trợ từ が thì thêm dạng trợ từ
      if (targetWord.category === "lesson9") {
        eligibleTypes.push("particle_ga");
      }

      // Chọn ngẫu nhiên dạng câu hỏi phù hợp cho từ
      const qType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
      const qObj = this.buildQuestionObject(targetWord, qType, pool);
      if (qObj) {
        questions.push(qObj);
      }
    }

    return questions;
  }

  buildQuestionObject(word, type, pool) {
    let questionText = "";
    let promptHtml = "";
    let correctAnswer = "";
    let explanation = "";
    let options = [];
    let badgeTitle = "";

    // Lấy 3 từ gây nhiễu không trùng với từ mục tiêu
    const distractors = this.getRandomDistractors(pool, word, 3);

    switch (type) {
      case "jp_to_vi":
        badgeTitle = "Nhìn từ chọn nghĩa";
        promptHtml = `
          <div class="q-word-hero">${word.japanese}</div>
          ${word.kanji ? `<div class="q-kanji-sub">${word.kanji}</div>` : ""}
          <div class="q-instruction">Từ trên có nghĩa tiếng Việt là gì?</div>
        `;
        correctAnswer = word.vietnamese;
        options = [correctAnswer, ...distractors.map(d => d.vietnamese)];
        explanation = `<strong>${word.japanese}</strong> (${word.romaji}) có nghĩa là: <em>${word.vietnamese}</em>.`;
        break;

      case "vi_to_jp":
        badgeTitle = "Nhìn nghĩa chọn từ";
        promptHtml = `
          <div class="q-vi-hero">"${word.vietnamese}"</div>
          <div class="q-instruction">Từ tiếng Nhật tương ứng với nghĩa trên là gì?</div>
        `;
        correctAnswer = word.japanese;
        options = [correctAnswer, ...distractors.map(d => d.japanese)];
        explanation = `Nghĩa <em>${word.vietnamese}</em> trong tiếng Nhật là <strong>${word.japanese}</strong> (${word.romaji}).`;
        break;

      case "audio_to_vi":
        badgeTitle = "Luyện nghe tiếng Nhật";
        promptHtml = `
          <div class="q-audio-hero">
            <button class="btn-quiz-audio" onclick="window.speechHelper && window.speechHelper.speak('${word.audioText || word.japanese}')">
              <i class="fas fa-volume-up fa-2x"></i>
              <span>Nhấn để nghe lại phát âm</span>
            </button>
          </div>
          <div class="q-instruction">Bạn vừa nghe thấy từ tiếng Nhật nào có nghĩa là:</div>
        `;
        correctAnswer = word.vietnamese;
        options = [correctAnswer, ...distractors.map(d => d.vietnamese)];
        explanation = `Từ vừa phát âm là <strong>${word.japanese}</strong> (${word.romaji}), nghĩa là: <em>${word.vietnamese}</em>.`;
        break;

      case "pick_hiragana":
        badgeTitle = "Cách đọc Hiragana";
        promptHtml = `
          <div class="q-word-hero">${word.kanji || word.japanese}</div>
          <div class="q-instruction">Cách đọc bằng chữ Hiragana đúng của từ trên là:</div>
        `;
        correctAnswer = word.hiragana;
        options = [correctAnswer, ...distractors.map(d => d.hiragana)];
        explanation = `<strong>${word.japanese}</strong> có cách đọc Hiragana chuẩn là: <strong>${word.hiragana}</strong> (${word.romaji}).`;
        break;

      case "pick_kanji":
        badgeTitle = "Nhận diện chữ Hán (Kanji)";
        promptHtml = `
          <div class="q-word-hero">${word.japanese}</div>
          <p class="text-muted">Nghĩa: ${word.vietnamese}</p>
          <div class="q-instruction">Chữ Hán (Kanji) đúng của từ này là:</div>
        `;
        correctAnswer = word.kanji;
        // Lấy kanji của các từ khác có kanji
        const kanjiPool = pool.filter(w => w.kanji && w.id !== word.id);
        const kanjiDistractors = this.getRandomDistractors(kanjiPool, word, 3).map(w => w.kanji);
        if (kanjiDistractors.length < 3) return null; // Bỏ qua nếu không đủ kanji gây nhiễu
        options = [correctAnswer, ...kanjiDistractors];
        explanation = `Từ <strong>${word.japanese}</strong> (${word.vietnamese}) có chữ Hán là <strong>${word.kanji}</strong>.`;
        break;

      case "pick_romaji":
        badgeTitle = "Phiên âm Romaji chuẩn";
        promptHtml = `
          <div class="q-word-hero">${word.japanese}</div>
          <div class="q-instruction">Phiên âm Romaji chuẩn của từ này là:</div>
        `;
        correctAnswer = word.romaji;
        options = [correctAnswer, ...distractors.map(d => d.romaji)];
        explanation = `<strong>${word.japanese}</strong> đọc là: <strong>${word.romaji}</strong>.`;
        break;

      case "fill_blank":
        badgeTitle = "Điền từ vào câu";
        if (!word.exampleJapanese) return null;
        // Ẩn từ vựng trong câu ví dụ bằng dấu gạch dưới
        const cleanJp = word.japanese.replace(/な$/, "");
        const blankedExample = word.exampleJapanese.replace(cleanJp, "【 ___ 】");
        promptHtml = `
          <div class="q-sentence-box">${blankedExample}</div>
          <p class="q-sentence-trans">Dịch: "${word.exampleVietnamese}"</p>
          <div class="q-instruction">Chọn từ thích hợp nhất để điền vào chỗ trống:</div>
        `;
        correctAnswer = word.japanese;
        options = [correctAnswer, ...distractors.map(d => d.japanese)];
        explanation = `Câu hoàn chỉnh: <em>${word.exampleJapanese}</em> (${word.exampleVietnamese}).`;
        break;

      case "grammar_adj_type":
        badgeTitle = "Phân biệt loại từ (Tính từ な / い)";
        promptHtml = `
          <div class="q-word-hero">${word.japanese}</div>
          <p class="text-muted">Nghĩa: ${word.vietnamese}</p>
          <div class="q-instruction">Từ trên thuộc loại từ vựng nào sau đây?</div>
        `;
        correctAnswer = word.wordType;
        options = ["Tính từ đuôi な", "Tính từ đuôi い", "Phó từ", "Danh từ"];
        explanation = `<strong>${word.japanese}</strong> là <strong>${word.wordType}</strong>. ${word.note || ""}`;
        break;

      case "particle_ga":
        badgeTitle = "Ngữ pháp Trợ từ N5";
        promptHtml = `
          <div class="q-sentence-box">わたしは にほんご 【 ___ 】 わかります。</div>
          <p class="q-sentence-trans">Dịch: "Tôi hiểu tiếng Nhật."</p>
          <div class="q-instruction">Chọn trợ từ thích hợp để điền vào câu năng lực/sở thích:</div>
        `;
        correctAnswer = "が (ga)";
        options = ["が (ga)", "を (o)", "に (ni)", "で (de)"];
        explanation = "Với các động từ chỉ năng lực (わかります), sở hữu (あります) và tính từ sở thích (好き/嫌い/上手/下手), đối tượng luôn đi kèm với trợ từ <strong>が</strong>, không dùng <strong>を</strong>.";
        break;

      default:
        return null;
    }

    // Đảm bảo loại bỏ các lựa chọn trùng nhau nếu có
    const uniqueOptions = Array.from(new Set(options));
    while (uniqueOptions.length < 4) {
      const extra = pool[Math.floor(Math.random() * pool.length)];
      const candidate = (type === "vi_to_jp" || type === "fill_blank") ? extra.japanese : extra.vietnamese;
      if (!uniqueOptions.includes(candidate)) {
        uniqueOptions.push(candidate);
      }
    }

    this.shuffle(uniqueOptions);

    return {
      word,
      type,
      badgeTitle,
      promptHtml,
      correctAnswer,
      options: uniqueOptions,
      explanation
    };
  }

  getRandomDistractors(pool, targetWord, count) {
    const filtered = pool.filter(w => w.id !== targetWord.id);
    this.shuffle(filtered);
    return filtered.slice(0, count);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) {
      this.finishQuiz();
      return;
    }

    this.isAnswered = false;

    // Cập nhật chỉ số câu hỏi
    const cur = this.currentIndex + 1;
    const total = this.questions.length;
    if (this.dom.questionCounter) {
      this.dom.questionCounter.innerText = `Câu ${cur} / ${total}`;
    }
    if (this.dom.progressBar) {
      this.dom.progressBar.style.width = `${Math.round((cur / total) * 100)}%`;
    }
    if (this.dom.scoreBadge) {
      this.dom.scoreBadge.innerText = `Điểm: ${this.score}`;
    }
    if (this.dom.typeBadge) {
      this.dom.typeBadge.innerText = q.badgeTitle;
    }

    // Hiển thị nội dung câu hỏi
    if (this.dom.promptBox) {
      this.dom.promptBox.innerHTML = q.promptHtml;
    }

    // Nếu là dạng câu hỏi nghe thì tự động phát âm lần đầu
    if (q.type === "audio_to_vi" && window.speechHelper) {
      setTimeout(() => {
        window.speechHelper.speak(q.word.audioText || q.word.japanese);
      }, 300);
    }

    // Sinh các nút lựa chọn
    if (this.dom.optionsContainer) {
      this.dom.optionsContainer.innerHTML = "";
      const letters = ["A", "B", "C", "D"];

      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option-btn";
        btn.innerHTML = `
          <span class="option-key">${letters[idx]}</span>
          <span class="option-text">${opt}</span>
        `;
        btn.addEventListener("click", () => this.handleAnswer(opt, btn));
        this.dom.optionsContainer.appendChild(btn);
      });
    }

    // Ẩn hộp phản hồi
    if (this.dom.feedbackBox) {
      this.dom.feedbackBox.classList.add("d-none");
    }
    if (this.dom.nextBtn) {
      this.dom.nextBtn.disabled = true;
    }
  }

  handleAnswer(selectedOption, clickedButton) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const q = this.questions[this.currentIndex];
    const isCorrect = selectedOption === q.correctAnswer;

    // Ghi lại kết quả câu hỏi
    this.userAnswers.push({
      question: q,
      selected: selectedOption,
      isCorrect
    });

    // Cập nhật SRS và thống kê trong storageManager
    if (window.storageManager) {
      window.storageManager.recordAnswer(q.word.id, isCorrect);
      window.storageManager.stats.totalQuestionsAnswered = (window.storageManager.stats.totalQuestionsAnswered || 0) + 1;
      if (isCorrect) {
        window.storageManager.stats.totalCorrectAnswers = (window.storageManager.stats.totalCorrectAnswers || 0) + 1;
        window.storageManager.addXP(10);
      }
      window.storageManager.saveStats();
    }

    // Đổi màu các nút đáp án
    const allButtons = this.dom.optionsContainer.querySelectorAll(".quiz-option-btn");
    allButtons.forEach(btn => {
      btn.disabled = true;
      const textSpan = btn.querySelector(".option-text");
      const optText = textSpan ? textSpan.innerText.trim() : "";

      if (optText === q.correctAnswer.trim()) {
        btn.classList.add("btn-correct");
      } else if (btn === clickedButton && !isCorrect) {
        btn.classList.add("btn-wrong");
      }
    });

    if (isCorrect) {
      this.score += 10;
      if (this.dom.scoreBadge) this.dom.scoreBadge.innerText = `Điểm: ${this.score}`;
    }

    // Hiển thị phản hồi chi tiết
    if (this.dom.feedbackBox) {
      this.dom.feedbackBox.classList.remove("d-none");
      this.dom.feedbackBox.className = `quiz-feedback-box ${isCorrect ? "feedback-success" : "feedback-danger"}`;

      if (this.dom.feedbackStatus) {
        this.dom.feedbackStatus.innerHTML = isCorrect
          ? `<i class="fas fa-check-circle"></i> Chính xác! (+10 XP)`
          : `<i class="fas fa-times-circle"></i> Chưa chính xác rồi!`;
      }

      if (this.dom.feedbackExp) {
        this.dom.feedbackExp.innerHTML = q.explanation;
      }

      if (this.dom.feedbackAudioBtn) {
        this.dom.feedbackAudioBtn.onclick = () => {
          if (window.speechHelper) {
            window.speechHelper.speak(q.word.audioText || q.word.japanese);
          }
        };
      }
    }

    if (this.dom.nextBtn) {
      this.dom.nextBtn.disabled = false;
      this.dom.nextBtn.focus();
    }
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.renderQuestion();
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz() {
    if (this.dom.playContainer) this.dom.playContainer.classList.add("d-none");
    if (this.dom.resultContainer) this.dom.resultContainer.classList.remove("d-none");

    const total = this.questions.length;
    const correctCount = this.userAnswers.filter(a => a.isCorrect).length;
    const wrongCount = total - correctCount;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Lưu vào lịch sử kiểm tra
    if (window.storageManager) {
      window.storageManager.stats.totalQuizzesTaken = (window.storageManager.stats.totalQuizzesTaken || 0) + 1;
      window.storageManager.saveQuizHistory({
        date: new Date().toISOString(),
        category: this.selectedCategory,
        total,
        correctCount,
        percentage: pct,
        score: this.score
      });
      window.storageManager.saveStats();
    }

    // Hiển thị báo cáo kết quả
    const scoreValEl = document.getElementById("quiz-result-score");
    const pctValEl = document.getElementById("quiz-result-pct");
    const commentEl = document.getElementById("quiz-result-comment");
    const countsEl = document.getElementById("quiz-result-counts");

    if (scoreValEl) scoreValEl.innerText = `${this.score} điểm`;
    if (pctValEl) pctValEl.innerText = `${pct}%`;
    if (countsEl) {
      countsEl.innerHTML = `
        <span class="text-success"><i class="fas fa-check"></i> Đúng: <strong>${correctCount}</strong> câu</span>
        <span class="text-danger ms-3"><i class="fas fa-times"></i> Sai: <strong>${wrongCount}</strong> câu</span>
      `;
    }

    if (commentEl) {
      if (pct === 100) {
        commentEl.innerText = "Xuất sắc tuyệt đối! Bạn đã nắm rất vững toàn bộ từ vựng nhóm này! 🌟";
      } else if (pct >= 80) {
        commentEl.innerText = "Rất tốt! Bạn ghi nhớ gần như toàn bộ từ vựng, tiếp tục duy trì nhé! 👏";
      } else if (pct >= 50) {
        commentEl.innerText = "Khá tốt! Hãy ôn tập lại các câu sai để nhớ từ vựng chắc chắn hơn nhé! 💪";
      } else {
        commentEl.innerText = "Đừng nản lòng! Hãy dùng Flashcard ôn tập lại một lượt rồi kiểm tra lại nha! ☘️";
      }
    }

    // Hiển thị danh sách các câu đã làm sai để người học xem lại
    if (this.dom.reviewWrongContainer) {
      const wrongList = this.userAnswers.filter(a => !a.isCorrect);
      if (wrongList.length === 0) {
        this.dom.reviewWrongContainer.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-trophy"></i> Bạn không làm sai câu nào! Thật tuyệt vời!
          </div>
        `;
      } else {
        let wrongHtml = `<h4 class="mb-3"><i class="fas fa-exclamation-triangle text-warning"></i> Xem lại ${wrongList.length} câu cần ôn tập:</h4><div class="wrong-items-list">`;
        wrongList.forEach((item, idx) => {
          const w = item.question.word;
          wrongHtml += `
            <div class="wrong-card mb-3 p-3">
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge badge-danger">Câu sai #${idx + 1}</span>
                <button class="btn btn-sm btn-outline-primary" onclick="window.speechHelper && window.speechHelper.speak('${w.audioText || w.japanese}')">
                  <i class="fas fa-volume-up"></i> Nghe
                </button>
              </div>
              <div class="my-2">
                <strong class="fs-5 text-primary">${w.japanese}</strong>
                ${w.kanji ? `<span class="text-muted ms-2">(${w.kanji})</span>` : ""}
                <span class="text-muted ms-2">[ ${w.romaji} ]</span>
              </div>
              <p class="mb-1"><strong>Nghĩa đúng:</strong> <span class="text-success">${item.question.correctAnswer}</span></p>
              <p class="mb-1"><strong>Bạn đã chọn:</strong> <span class="text-danger">${item.selected}</span></p>
              <div class="small text-muted mt-2">${item.question.explanation}</div>
            </div>
          `;
        });
        wrongHtml += `</div>`;
        this.dom.reviewWrongContainer.innerHTML = wrongHtml;
      }
    }
  }
}

// Khởi tạo controller quiz toàn cục
window.quizEngine = new QuizEngine();
