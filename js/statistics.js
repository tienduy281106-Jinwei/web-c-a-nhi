/**
 * NIHONGO STEP - THỐNG KÊ HỌC TẬP VÀ BIỂU ĐỒ TIẾN ĐỘ
 * Thể hiện số liệu thực tế: XP, Streak, Tỷ lệ chính xác, Phân bố danh mục,
 * Nhóm từ còn yếu và Đề xuất lộ trình bài học kế tiếp.
 */

class StatisticsManager {
  constructor() {
    this.dom = {
      container: document.getElementById("tab-statistics"),
      totalLearned: document.getElementById("stat-total-learned"),
      masteredCount: document.getElementById("stat-mastered"),
      needReview: document.getElementById("stat-need-review"),
      accuracy: document.getElementById("stat-accuracy"),
      xpDisplay: document.getElementById("stat-xp"),
      streakDisplay: document.getElementById("stat-streak"),
      categoryBreakdown: document.getElementById("stat-category-breakdown"),
      weakAreas: document.getElementById("stat-weak-areas"),
      recommendedLesson: document.getElementById("stat-recommended-lesson"),
      historyTableBody: document.getElementById("stat-history-tbody")
    };
  }

  init() {
    this.renderAll();
  }

  renderAll() {
    if (!window.storageManager || typeof VOCABULARY_DATA === "undefined") return;

    const summary = window.storageManager.getSummaryStats();

    if (this.dom.totalLearned) this.dom.totalLearned.innerText = `${summary.learnedCount} / ${summary.totalWords}`;
    if (this.dom.masteredCount) this.dom.masteredCount.innerText = summary.masteredCount;
    if (this.dom.needReview) this.dom.needReview.innerText = summary.needReviewCount;
    if (this.dom.accuracy) this.dom.accuracy.innerText = `${summary.accuracy}%`;
    if (this.dom.xpDisplay) this.dom.xpDisplay.innerText = `${summary.xp} XP`;
    if (this.dom.streakDisplay) this.dom.streakDisplay.innerText = `${summary.streak} ngày`;

    this.renderCategoryBreakdown();
    this.renderWeakAreas();
    this.renderRecommendation();
    this.renderQuizHistory();
  }

  // Biểu đồ thanh tiến độ theo từng nhóm từ vựng
  renderCategoryBreakdown() {
    if (!this.dom.categoryBreakdown) return;

    const progress = window.storageManager.progress;
    let html = "";

    LESSON_CATEGORIES.forEach(cat => {
      if (cat.id === "all") return;

      const wordsInCat = VOCABULARY_DATA.filter(w => {
        if (cat.id === "adverb") return w.category === "adverb" || w.category === "conjunction";
        return w.category === cat.id;
      });

      const total = wordsInCat.length;
      let mastered = 0;
      let learning = 0;

      wordsInCat.forEach(w => {
        const p = progress[w.id];
        if (p) {
          if (p.status === "mastered") mastered++;
          else if (p.status === "learning" || p.status === "review") learning++;
        }
      });

      const pctMastered = total > 0 ? Math.round((mastered / total) * 100) : 0;
      const pctLearning = total > 0 ? Math.round((learning / total) * 100) : 0;

      html += `
        <div class="category-stat-row mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="cat-name fw-bold">${cat.name}</span>
            <span class="cat-count small text-muted">${mastered}/${total} đã thuộc (${pctMastered}%)</span>
          </div>
          <div class="progress-stacked">
            <div class="progress-bar bg-success" style="width: ${pctMastered}%;" title="Đã thuộc: ${pctMastered}%"></div>
            <div class="progress-bar bg-warning" style="width: ${pctLearning}%;" title="Đang học: ${pctLearning}%"></div>
          </div>
        </div>
      `;
    });

    this.dom.categoryBreakdown.innerHTML = html;
  }

  // Xác định các nhóm từ vựng còn yếu (có nhiều lỗi sai)
  renderWeakAreas() {
    if (!this.dom.weakAreas) return;

    const progress = window.storageManager.progress;
    const catMistakes = {};

    LESSON_CATEGORIES.forEach(cat => {
      if (cat.id !== "all") catMistakes[cat.id] = { name: cat.name, wrongCount: 0, totalAttempts: 0 };
    });

    VOCABULARY_DATA.forEach(w => {
      const p = progress[w.id];
      if (p && p.wrongCount > 0) {
        const catKey = (w.category === "adverb" || w.category === "conjunction") ? "adverb" : w.category;
        if (catMistakes[catKey]) {
          catMistakes[catKey].wrongCount += p.wrongCount;
          catMistakes[catKey].totalAttempts += (p.correctCount + p.wrongCount);
        }
      }
    });

    const weakList = Object.values(catMistakes)
      .filter(c => c.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount);

    if (weakList.length === 0) {
      this.dom.weakAreas.innerHTML = `
        <div class="text-success p-3 rounded bg-success-subtle">
          <i class="fas fa-check-circle"></i> Chưa ghi nhận nhóm từ nào bị sai nhiều. Hãy tiếp tục làm bài kiểm tra để phân tích!
        </div>
      `;
    } else {
      let html = `<ul class="list-group list-group-flush">`;
      weakList.forEach(item => {
        html += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span><i class="fas fa-exclamation-circle text-warning me-2"></i> ${item.name}</span>
            <span class="badge badge-danger">${item.wrongCount} lần sai</span>
          </li>
        `;
      });
      html += `</ul>`;
      this.dom.weakAreas.innerHTML = html;
    }
  }

  // Đề xuất bài học tiếp theo dựa trên tỷ lệ hoàn thành thực tế
  renderRecommendation() {
    if (!this.dom.recommendedLesson) return;

    const progress = window.storageManager.progress;
    let nextCat = null;

    for (let i = 0; i < LESSON_CATEGORIES.length; i++) {
      const cat = LESSON_CATEGORIES[i];
      if (cat.id === "all") continue;

      const wordsInCat = VOCABULARY_DATA.filter(w => {
        if (cat.id === "adverb") return w.category === "adverb" || w.category === "conjunction";
        return w.category === cat.id;
      });

      const mastered = wordsInCat.filter(w => progress[w.id] && progress[w.id].status === "mastered").length;
      if (mastered < wordsInCat.length) {
        nextCat = {
          cat,
          remaining: wordsInCat.length - mastered,
          total: wordsInCat.length
        };
        break;
      }
    }

    if (!nextCat) {
      this.dom.recommendedLesson.innerHTML = `
        <div class="card p-3 border-success">
          <h5 class="text-success"><i class="fas fa-award"></i> Hoàn thành xuất sắc toàn bộ khóa học!</h5>
          <p class="mb-0">Bạn đã thành thạo tất cả từ vựng N5 từ Nhóm A đến Nhóm G. Hãy giữ chuỗi học tập bằng cách làm bài kiểm tra hàng ngày nhé!</p>
        </div>
      `;
    } else {
      this.dom.recommendedLesson.innerHTML = `
        <div class="card p-3 border-primary recommendation-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0 text-primary"><i class="fas fa-compass"></i> ${nextCat.cat.name}</h5>
            <span class="badge badge-primary">Còn ${nextCat.remaining}/${nextCat.total} từ</span>
          </div>
          <p class="text-muted small mb-3">Mục tiêu tiếp theo để hoàn thiện vốn từ vựng N5 của bạn.</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="window.startSpecificLesson('${nextCat.cat.id}')">
              <i class="fas fa-play"></i> Học ngay bằng Flashcard
            </button>
          </div>
        </div>
      `;
    }
  }

  // Hiển thị lịch sử làm bài kiểm tra
  renderQuizHistory() {
    if (!this.dom.historyTableBody) return;

    const history = window.storageManager.quizHistory;
    if (!history || history.length === 0) {
      this.dom.historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-3">Chưa có bài kiểm tra nào được thực hiện.</td>
        </tr>
      `;
      return;
    }

    let html = "";
    history.slice(0, 10).forEach((item, index) => {
      const dateFormatted = new Date(item.date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      const catObj = LESSON_CATEGORIES.find(c => c.id === item.category);
      const catName = catObj ? catObj.name : "Tất cả";

      const badgeClass = item.percentage >= 80 ? "badge-success" : item.percentage >= 50 ? "badge-warning" : "badge-danger";

      html += `
        <tr>
          <td>#${index + 1}</td>
          <td>${dateFormatted}</td>
          <td>${catName}</td>
          <td>${item.correctCount}/${item.total} câu</td>
          <td><span class="badge ${badgeClass}">${item.percentage}%</span></td>
        </tr>
      `;
    });

    this.dom.historyTableBody.innerHTML = html;
  }
}

// Khởi tạo instance toàn cục
window.statisticsManager = new StatisticsManager();
