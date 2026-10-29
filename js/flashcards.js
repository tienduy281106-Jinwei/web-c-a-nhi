/**
 * NIHONGO STEP - BỘ THẺ TỪ VỰNG FLASHCARD 3D TƯƠNG TÁC
 * Hỗ trợ lật thẻ mượt mà, chuyển tiếp, xáo trộn, đánh dấu đã nhớ / cần ôn,
 * chế độ chỉ hiển thị tiếng Nhật / chỉ tiếng Việt, và bộ lọc bài học.
 */

class FlashcardController {
  constructor() {
    this.deck = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.currentCategory = "all";
    this.batchSize = 10;
    this.displayMode = "all"; // "all" | "ja_only" | "vi_only"

    this.dom = {
      container: document.getElementById("flashcard-section"),
      card: document.getElementById("flashcard-inner"),
      cardFront: document.getElementById("flashcard-front"),
      cardBack: document.getElementById("flashcard-back"),
      progressText: document.getElementById("fc-progress-text"),
      progressBar: document.getElementById("fc-progress-bar"),
      categorySelect: document.getElementById("fc-category-filter"),
      batchSelect: document.getElementById("fc-batch-size"),
      modeSelect: document.getElementById("fc-mode-filter"),
      prevBtn: document.getElementById("fc-prev-btn"),
      nextBtn: document.getElementById("fc-next-btn"),
      flipBtn: document.getElementById("fc-flip-btn"),
      shuffleBtn: document.getElementById("fc-shuffle-btn"),
      favBtn: document.getElementById("fc-fav-btn"),
      markMasteredBtn: document.getElementById("fc-mark-mastered"),
      markReviewBtn: document.getElementById("fc-mark-review"),
      audioWordBtn: document.getElementById("fc-audio-word"),
      audioExBtn: document.getElementById("fc-audio-example")
    };
  }

  init() {
    this.bindEvents();
    this.loadDeck();
  }

  bindEvents() {
    // Lật thẻ khi bấm vào thẻ
    if (this.dom.card) {
      this.dom.card.addEventListener("click", (e) => {
        // Tránh kích hoạt lật thẻ khi bấm vào nút âm thanh hoặc nút yêu thích
        if (e.target.closest("button") || e.target.closest(".action-btn")) return;
        this.toggleFlip();
      });
    }

    if (this.dom.flipBtn) {
      this.dom.flipBtn.addEventListener("click", () => this.toggleFlip());
    }

    // Điều hướng thẻ
    if (this.dom.prevBtn) {
      this.dom.prevBtn.addEventListener("click", () => this.prevCard());
    }
    if (this.dom.nextBtn) {
      this.dom.nextBtn.addEventListener("click", () => this.nextCard());
    }

    // Xáo trộn thẻ
    if (this.dom.shuffleBtn) {
      this.dom.shuffleBtn.addEventListener("click", () => this.shuffleDeck());
    }

    // Yêu thích
    if (this.dom.favBtn) {
      this.dom.favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleCurrentFavorite();
      });
    }

    // Đánh dấu trạng thái học
    if (this.dom.markMasteredBtn) {
      this.dom.markMasteredBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.markStatus("mastered");
      });
    }
    if (this.dom.markReviewBtn) {
      this.dom.markReviewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.markStatus("review");
      });
    }

    // Bộ lọc danh mục
    if (this.dom.categorySelect) {
      this.dom.categorySelect.addEventListener("change", (e) => {
        this.currentCategory = e.target.value;
        this.loadDeck();
      });
    }

    // Bộ lọc số lượng thẻ
    if (this.dom.batchSelect) {
      this.dom.batchSelect.addEventListener("change", (e) => {
        this.batchSize = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
        this.loadDeck();
      });
    }

    // Bộ lọc chế độ hiển thị
    if (this.dom.modeSelect) {
      this.dom.modeSelect.addEventListener("change", (e) => {
        this.displayMode = e.target.value;
        this.renderCurrentCard();
      });
    }

    // Nút phát âm
    if (this.dom.audioWordBtn) {
      this.dom.audioWordBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const current = this.getCurrentWord();
        if (current && window.speechHelper) {
          window.speechHelper.speak(current.audioText || current.japanese);
        }
      });
    }

    if (this.dom.audioExBtn) {
      this.dom.audioExBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const current = this.getCurrentWord();
        if (current && current.exampleJapanese && window.speechHelper) {
          window.speechHelper.speak(current.exampleJapanese);
        }
      });
    }

    // Phím tắt bàn phím tiện lợi
    document.addEventListener("keydown", (e) => {
      // Chỉ hoạt động khi tab flashcard đang hiển thị
      const fcTab = document.getElementById("tab-flashcards");
      if (!fcTab || !fcTab.classList.contains("active")) return;

      if (e.code === "Space") {
        e.preventDefault();
        this.toggleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        this.nextCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.prevCard();
      } else if (e.code === "KeyS") {
        // Phím S để phát âm
        const current = this.getCurrentWord();
        if (current && window.speechHelper) {
          window.speechHelper.speak(current.audioText || current.japanese);
        }
      }
    });
  }

  // Tải danh sách thẻ theo bộ lọc và số lượng
  loadDeck(customList = null) {
    let list = customList ? [...customList] : [...VOCABULARY_DATA];

    if (!customList && this.currentCategory !== "all") {
      if (this.currentCategory === "adverb") {
        list = list.filter(w => w.category === "adverb" || w.category === "conjunction");
      } else {
        list = list.filter(w => w.category === this.currentCategory);
      }
    }

    if (this.batchSize !== "all" && typeof this.batchSize === "number") {
      list = list.slice(0, this.batchSize);
    }

    this.deck = list;
    this.currentIndex = 0;
    this.isFlipped = false;

    if (this.dom.card) {
      this.dom.card.classList.remove("is-flipped");
    }

    this.renderCurrentCard();
  }

  getCurrentWord() {
    return this.deck[this.currentIndex] || null;
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    if (this.dom.card) {
      this.dom.card.classList.toggle("is-flipped", this.isFlipped);
    }
  }

  nextCard() {
    if (this.currentIndex < this.deck.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      if (this.dom.card) this.dom.card.classList.remove("is-flipped");
      this.renderCurrentCard();
    } else {
      // Khi hoàn thành hết bộ thẻ
      if (window.showToast) {
        window.showToast("Bạn đã xem hết danh sách thẻ từ vựng này!", "success");
      }
      // Tặng XP khi hoàn thành bộ thẻ
      if (window.storageManager) {
        window.storageManager.addXP(10);
      }
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
      if (this.dom.card) this.dom.card.classList.remove("is-flipped");
      this.renderCurrentCard();
    }
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    this.currentIndex = 0;
    this.isFlipped = false;
    if (this.dom.card) this.dom.card.classList.remove("is-flipped");
    this.renderCurrentCard();
    if (window.showToast) {
      window.showToast("Đã xáo trộn thứ tự từ vựng ngẫu nhiên!", "info");
    }
  }

  toggleCurrentFavorite() {
    const word = this.getCurrentWord();
    if (!word || !window.storageManager) return;
    const isFav = window.storageManager.toggleFavorite(word.id);
    this.updateFavButtonUI(isFav);
    if (window.showToast) {
      window.showToast(isFav ? "Đã thêm vào mục Yêu thích!" : "Đã bỏ khỏi Yêu thích.", "info");
    }
  }

  updateFavButtonUI(isFav) {
    if (this.dom.favBtn) {
      this.dom.favBtn.innerHTML = isFav 
        ? `<i class="fas fa-heart text-danger"></i>` 
        : `<i class="far fa-heart"></i>`;
      this.dom.favBtn.title = isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích";
    }
  }

  markStatus(status) {
    const word = this.getCurrentWord();
    if (!word || !window.storageManager) return;

    window.storageManager.setWordStatus(word.id, status);
    window.storageManager.addXP(5);

    if (window.showToast) {
      const msg = status === "mastered" ? "Tuyệt vời! Đã ghi nhận: ĐÃ NHỚ (+5 XP)" : "Đã đưa vào danh sách CẦN ÔN TẬP!";
      window.showToast(msg, status === "mastered" ? "success" : "warning");
    }

    // Tự động chuyển thẻ kế tiếp sau một khoảng ngắn
    setTimeout(() => {
      this.nextCard();
    }, 350);
  }

  renderCurrentCard() {
    const word = this.getCurrentWord();
    if (!word) {
      if (this.dom.cardFront) {
        this.dom.cardFront.innerHTML = `
          <div class="empty-deck-notice">
            <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
            <p>Không có từ vựng nào trong danh mục đã chọn.</p>
          </div>
        `;
      }
      return;
    }

    const progress = window.storageManager ? window.storageManager.getWordProgress(word.id) : {};
    this.updateFavButtonUI(progress.isFavorite);

    // Cập nhật thanh tiến độ
    const total = this.deck.length;
    const cur = this.currentIndex + 1;
    if (this.dom.progressText) {
      this.dom.progressText.innerText = `${cur} / ${total}`;
    }
    if (this.dom.progressBar) {
      const pct = Math.round((cur / total) * 100);
      this.dom.progressBar.style.width = `${pct}%`;
    }

    // Bật tắt trạng thái nút prev/next
    if (this.dom.prevBtn) this.dom.prevBtn.disabled = this.currentIndex === 0;
    if (this.dom.nextBtn) this.dom.nextBtn.disabled = this.currentIndex === total - 1;

    // Hiển thị nội dung Mặt Trước
    let frontHtml = "";
    // Hiển thị nội dung Mặt Sau
    let backHtml = "";

    // Phù hợp theo chế độ hiển thị
    if (this.displayMode === "vi_only") {
      // Mặt trước hiển thị tiếng Việt để người học tự nhớ tiếng Nhật
      frontHtml = `
        <div class="fc-badge-group">
          <span class="badge badge-type">${word.wordType}</span>
          <span class="badge badge-lesson">${word.lesson}</span>
        </div>
        <div class="fc-main-vietnamese">
          <h2>${word.vietnamese}</h2>
          <p class="fc-prompt-hint"><i class="fas fa-question-circle"></i> Từ tiếng Nhật tương ứng là gì?</p>
        </div>
        <div class="fc-flip-hint">
          <i class="fas fa-sync-alt"></i> Nhấn để lật xem tiếng Nhật
        </div>
      `;

      backHtml = `
        <div class="fc-japanese-box">
          <h1 class="fc-jp-word">${word.japanese}</h1>
          <div class="fc-readings">
            ${word.kanji ? `<span class="fc-kanji"><i class="fas fa-feather-alt"></i> Hán tự: <strong>${word.kanji}</strong></span>` : ""}
            <span class="fc-romaji"><i class="fas fa-volume-up"></i> Romaji: <strong>${word.romaji}</strong></span>
          </div>
        </div>
        <div class="fc-vietnamese-box">
          <p class="fc-meaning"><strong>Nghĩa:</strong> ${word.vietnamese}</p>
        </div>
        ${word.exampleJapanese ? `
          <div class="fc-example-card">
            <div class="fc-ex-header">
              <span class="badge badge-sub">Ví dụ minh họa</span>
              <button class="btn-audio-mini" onclick="window.speechHelper && window.speechHelper.speak('${word.exampleJapanese.replace(/'/g, "\\'")}')" title="Nghe câu ví dụ">
                <i class="fas fa-volume-up"></i>
              </button>
            </div>
            <p class="fc-ex-jp">${word.exampleJapanese}</p>
            <p class="fc-ex-romaji">${word.exampleRomaji}</p>
            <p class="fc-ex-vi">${word.exampleVietnamese}</p>
          </div>
        ` : ""}
        ${word.note ? `
          <div class="fc-note-box">
            <i class="fas fa-lightbulb text-warning"></i> <span>${word.note}</span>
          </div>
        ` : ""}
      `;
    } else {
      // Mặc định hoặc ja_only: Mặt trước tiếng Nhật
      frontHtml = `
        <div class="fc-badge-group">
          <span class="badge badge-type">${word.wordType}</span>
          <span class="badge badge-lesson">${word.lesson}</span>
        </div>
        <div class="fc-main-japanese">
          <h1 class="fc-jp-word">${word.japanese}</h1>
          ${word.kanji ? `<p class="fc-kanji-sub">Chữ Hán: <strong>${word.kanji}</strong></p>` : ""}
          <p class="fc-romaji-sub">[ ${word.romaji} ]</p>
        </div>
        <div class="fc-audio-action">
          <button class="fc-listen-btn" onclick="event.stopPropagation(); window.speechHelper && window.speechHelper.speak('${word.audioText || word.japanese}')">
            <i class="fas fa-volume-up"></i> Phát âm từ
          </button>
        </div>
        <div class="fc-flip-hint">
          <i class="fas fa-sync-alt"></i> Nhấn để xem nghĩa và ví dụ câu
        </div>
      `;

      backHtml = `
        <div class="fc-back-meaning">
          <span class="fc-label">Nghĩa tiếng Việt</span>
          <h2 class="fc-meaning-text">${word.vietnamese}</h2>
          <span class="badge badge-type mb-3">${word.wordType}</span>
        </div>

        ${word.exampleJapanese ? `
          <div class="fc-example-card">
            <div class="fc-ex-header">
              <span class="badge badge-sub"><i class="fas fa-comment-dots"></i> Câu ví dụ</span>
              <button class="btn-audio-mini" onclick="event.stopPropagation(); window.speechHelper && window.speechHelper.speak('${word.exampleJapanese.replace(/'/g, "\\'")}')" title="Nghe ví dụ">
                <i class="fas fa-volume-up"></i>
              </button>
            </div>
            <p class="fc-ex-jp">${word.exampleJapanese}</p>
            <p class="fc-ex-romaji">${word.exampleRomaji}</p>
            <p class="fc-ex-vi">${word.exampleVietnamese}</p>
          </div>
        ` : ""}

        ${word.note ? `
          <div class="fc-note-box">
            <i class="fas fa-info-circle text-info"></i> <span>${word.note}</span>
          </div>
        ` : ""}
      `;
    }

    if (this.dom.cardFront) this.dom.cardFront.innerHTML = frontHtml;
    if (this.dom.cardBack) this.dom.cardBack.innerHTML = backHtml;
  }
}

// Khởi tạo controller toàn cục
window.flashcardController = new FlashcardController();
