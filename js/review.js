/**
 * NIHONGO STEP - HỆ THỐNG ÔN TẬP THÔNG MINH (SPACED REPETITION)
 * Lọc các từ cần ôn tập theo độ ưu tiên, lịch hẹn ngày ôn và số lần làm sai.
 * Cung cấp phiên ôn tập tương tác (Flashcard hoặc Quiz thu gọn).
 * Lưu ý: Đây là cơ chế lặp lại ngắt quãng đơn giản hỗ trợ ghi nhớ hiệu quả.
 */

class ReviewManager {
  constructor() {
    this.reviewQueue = [];
    this.currentReviewIndex = 0;
    this.dom = {
      container: document.getElementById("tab-review"),
      countBadge: document.getElementById("review-count-badge"),
      dueListContainer: document.getElementById("review-due-list"),
      startBtn: document.getElementById("start-smart-review-btn"),
      quickTestBtn: document.getElementById("start-review-quiz-btn"),
      emptyNotice: document.getElementById("review-empty-notice")
    };
  }

  init() {
    this.bindEvents();
    this.updateQueue();
  }

  bindEvents() {
    if (this.dom.startBtn) {
      this.dom.startBtn.addEventListener("click", () => {
        this.startFlashcardReview();
      });
    }

    if (this.dom.quickTestBtn) {
      this.dom.quickTestBtn.addEventListener("click", () => {
        this.startQuizReview();
      });
    }
  }

  // Lọc và sắp xếp hàng đợi các từ cần ôn tập
  getDueWords() {
    if (!window.storageManager || typeof VOCABULARY_DATA === "undefined") return [];

    const progress = window.storageManager.progress;
    const now = Date.now();
    const dueWords = [];

    VOCABULARY_DATA.forEach(word => {
      const p = progress[word.id];
      if (!p) return;

      // Điều kiện cần ôn tập:
      // 1. Trạng thái là "review" (Cần ôn tập)
      // 2. Hoặc ngày hẹn ôn tập đã đến (nextReviewDate <= now)
      // 3. Hoặc số lần làm sai nhiều hơn số lần làm đúng
      // 4. Hoặc độ ưu tiên cao (priority >= 3)
      const isDue = (p.status === "review") ||
        (p.nextReviewDate && p.nextReviewDate <= now) ||
        (p.wrongCount > 0 && p.wrongCount >= p.correctCount) ||
        (p.priority >= 3);

      if (isDue) {
        dueWords.push({
          word,
          progress: p
        });
      }
    });

    // Sắp xếp theo mức độ ưu tiên giảm dần (ưu tiên cao nhất ôn trước)
    dueWords.sort((a, b) => b.progress.priority - a.progress.priority || (b.progress.wrongCount - a.progress.wrongCount));

    return dueWords;
  }

  updateQueue() {
    const dueList = this.getDueWords();
    this.reviewQueue = dueList.map(item => item.word);

    const count = this.reviewQueue.length;
    if (this.dom.countBadge) {
      this.dom.countBadge.innerText = `${count} từ cần ôn`;
    }

    // Cập nhật số liệu trên thẻ Dashboard nếu có
    const dashReviewBadge = document.getElementById("dash-stat-review");
    if (dashReviewBadge) {
      dashReviewBadge.innerText = count;
    }

    if (count === 0) {
      if (this.dom.emptyNotice) this.dom.emptyNotice.classList.remove("d-none");
      if (this.dom.dueListContainer) this.dom.dueListContainer.innerHTML = "";
      if (this.dom.startBtn) this.dom.startBtn.disabled = true;
      if (this.dom.quickTestBtn) this.dom.quickTestBtn.disabled = true;
    } else {
      if (this.dom.emptyNotice) this.dom.emptyNotice.classList.add("d-none");
      if (this.dom.startBtn) this.dom.startBtn.disabled = false;
      if (this.dom.quickTestBtn) this.dom.quickTestBtn.disabled = false;
      this.renderDueList(dueList);
    }
  }

  renderDueList(dueList) {
    if (!this.dom.dueListContainer) return;

    let html = `
      <div class="table-responsive">
        <table class="table-vocab">
          <thead>
            <tr>
              <th>Từ tiếng Nhật</th>
              <th>Romaji</th>
              <th>Nghĩa tiếng Việt</th>
              <th>Loại từ</th>
              <th>Mức ưu tiên</th>
              <th>Số lần sai</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
    `;

    dueList.forEach(item => {
      const w = item.word;
      const p = item.progress;
      const priorityLabel = p.priority >= 4 ? `<span class="badge badge-danger">Rất cao</span>` :
        p.priority === 3 ? `<span class="badge badge-warning">Trung bình</span>` : `<span class="badge badge-info">Bình thường</span>`;

      html += `
        <tr>
          <td>
            <strong>${w.japanese}</strong>
            ${w.kanji ? `<span class="text-muted ms-1">(${w.kanji})</span>` : ""}
          </td>
          <td><code>${w.romaji}</code></td>
          <td>${w.vietnamese}</td>
          <td><span class="badge badge-type">${w.wordType}</span></td>
          <td>${priorityLabel}</td>
          <td><span class="text-danger fw-bold">${p.wrongCount}</span></td>
          <td>
            <button class="btn-action-sm" onclick="window.speechHelper && window.speechHelper.speak('${w.audioText || w.japanese}')" title="Phát âm">
              <i class="fas fa-volume-up"></i>
            </button>
            <button class="btn-action-sm btn-action-success ms-1" onclick="window.reviewManager.quickMarkRemembered('${w.id}')" title="Đánh dấu đã nhớ">
              <i class="fas fa-check"></i>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    this.dom.dueListContainer.innerHTML = html;
  }

  quickMarkRemembered(wordId) {
    if (window.storageManager) {
      window.storageManager.setWordStatus(wordId, "mastered");
      window.storageManager.addXP(5);
      if (window.showToast) {
        window.showToast("Đã chuyển từ sang trạng thái ĐÃ NHỚ! (+5 XP)", "success");
      }
      this.updateQueue();
      if (window.updateDashboardStats) {
        window.updateDashboardStats();
      }
    }
  }

  // Chuyển sang Flashcard với danh sách từ cần ôn
  startFlashcardReview() {
    if (this.reviewQueue.length === 0) {
      if (window.showToast) window.showToast("Hiện tại không có từ nào cần ôn tập gấp!", "info");
      return;
    }

    if (window.navigateToTab) {
      window.navigateToTab("flashcards");
    }

    if (window.flashcardController) {
      window.flashcardController.loadDeck(this.reviewQueue);
      if (window.showToast) {
        window.showToast(`Bắt đầu phiên ôn tập với ${this.reviewQueue.length} từ vựng!`, "success");
      }
    }
  }

  // Chuyển sang Quiz với danh sách từ cần ôn
  startQuizReview() {
    if (this.reviewQueue.length < 4) {
      if (window.showToast) {
        window.showToast("Cần tối thiểu 4 từ trong danh sách ôn để tạo bài Quiz. Hãy học thêm một số từ nữa nhé!", "warning");
      }
      return;
    }

    if (window.navigateToTab) {
      window.navigateToTab("quiz");
    }

    if (window.quizEngine) {
      window.quizEngine.startQuiz(this.reviewQueue, Math.min(10, this.reviewQueue.length));
      if (window.showToast) {
        window.showToast(`Bắt đầu bài kiểm tra ôn tập thông minh!`, "success");
      }
    }
  }
}

// Khởi tạo instance toàn cục
window.reviewManager = new ReviewManager();
