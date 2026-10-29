/**
 * NIHONGO STEP - MAIN APPLICATION LOGIC & CONTROLLER
 * Điều hướng giao diện, xử lý tìm kiếm từ điển, Modal chi tiết,
 * Cài đặt hệ thống, chuyển đổi giao diện Sáng/Tối và Quản lý dữ liệu.
 */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  applyStoredTheme();
  setupNavigation();
  setupDictionarySearch();
  setupSettingsHandlers();
  setupGrammarSection();
  updateDashboardStats();

  // Khởi tạo các module con
  if (window.flashcardController) window.flashcardController.init();
  if (window.quizEngine) window.quizEngine.init();
  if (window.reviewManager) window.reviewManager.init();
  if (window.statisticsManager) window.statisticsManager.init();

  // Tự động kiểm tra giọng đọc
  if (window.speechHelper) window.speechHelper.initVoices();
}

// =========================================================================
// 1. ĐIỀU HƯỚNG TABS & SIDEBAR
// =========================================================================
function setupNavigation() {
  const navLinks = document.querySelectorAll("[data-nav-target]");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTabId = link.getAttribute("data-nav-target");
      navigateToTab(targetTabId);

      // Đóng sidebar trên mobile nếu đang mở
      const sidebar = document.getElementById("app-sidebar");
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  });

  // Nút mở/đóng sidebar trên mobile
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("app-sidebar");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Dashboard action buttons
  const btnContinue = document.getElementById("dash-btn-continue");
  const btnReview = document.getElementById("dash-btn-review");
  const btnQuiz = document.getElementById("dash-btn-quiz");

  if (btnContinue) {
    btnContinue.addEventListener("click", () => navigateToTab("flashcards"));
  }
  if (btnReview) {
    btnReview.addEventListener("click", () => navigateToTab("review"));
  }
  if (btnQuiz) {
    btnQuiz.addEventListener("click", () => navigateToTab("quiz"));
  }
}

function navigateToTab(tabId) {
  // Ẩn tất cả các tab
  const allTabs = document.querySelectorAll(".app-tab-content");
  allTabs.forEach(tab => tab.classList.remove("active"));

  // Hiển thị tab mục tiêu
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add("active");
  }

  // Cập nhật class active trên nav links
  const allNavLinks = document.querySelectorAll("[data-nav-target]");
  allNavLinks.forEach(link => {
    if (link.getAttribute("data-nav-target") === tabId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Tự động cập nhật dữ liệu tương ứng khi chuyển tab
  if (tabId === "dashboard") {
    updateDashboardStats();
  } else if (tabId === "statistics" && window.statisticsManager) {
    window.statisticsManager.renderAll();
  } else if (tabId === "review" && window.reviewManager) {
    window.reviewManager.updateQueue();
  } else if (tabId === "dictionary") {
    renderDictionaryList();
  }

  // Cuộn lên đầu trang mượt mà
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.navigateToTab = navigateToTab;

// Bắt đầu một bài học cụ thể từ Dashboard hoặc Statistics
window.startSpecificLesson = function(categoryId) {
  navigateToTab("flashcards");
  if (window.flashcardController) {
    window.flashcardController.currentCategory = categoryId;
    const catSelect = document.getElementById("fc-category-filter");
    if (catSelect) catSelect.value = categoryId;
    window.flashcardController.loadDeck();
  }
};

// =========================================================================
// 2. DASHBOARD CẬP NHẬT DỮ LIỆU THỰC TẾ
// =========================================================================
function updateDashboardStats() {
  if (!window.storageManager || typeof VOCABULARY_DATA === "undefined") return;

  const summary = window.storageManager.getSummaryStats();

  // Cập nhật các thẻ số liệu
  setText("dash-stat-total", summary.totalWords);
  setText("dash-stat-learned", summary.learnedCount);
  setText("dash-stat-review", summary.needReviewCount);
  setText("dash-stat-mastered", summary.masteredCount);
  setText("dash-stat-streak", summary.streak);
  setText("dash-stat-xp", summary.xp);
  setText("dash-stat-accuracy", `${summary.accuracy}%`);
  setText("dash-stat-completion", `${summary.completionRate}%`);

  const mainProgressBar = document.getElementById("dash-progress-fill");
  if (mainProgressBar) {
    mainProgressBar.style.width = `${summary.completionRate}%`;
  }

  // Header quick badges
  setText("header-xp-val", summary.xp);
  setText("header-streak-val", summary.streak);

  // Render thẻ danh mục bài học ở Dashboard
  renderDashboardLessons();
}
window.updateDashboardStats = updateDashboardStats;

function renderDashboardLessons() {
  const container = document.getElementById("dash-lessons-grid");
  if (!container || !window.storageManager) return;

  const progress = window.storageManager.progress;
  let html = "";

  LESSON_CATEGORIES.forEach(cat => {
    if (cat.id === "all") return;

    const wordsInCat = VOCABULARY_DATA.filter(w => {
      if (cat.id === "adverb") return w.category === "adverb" || w.category === "conjunction";
      return w.category === cat.id;
    });

    const total = wordsInCat.length;
    const mastered = wordsInCat.filter(w => progress[w.id] && progress[w.id].status === "mastered").length;
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

    let icon = "fa-book-open";
    if (cat.id === "adjective_na") icon = "fa-tag";
    if (cat.id === "adjective_i") icon = "fa-tags";
    if (cat.id === "adverb") icon = "fa-link";
    if (cat.id === "lesson9") icon = "fa-star";
    if (cat.id === "entertainment") icon = "fa-gamepad";
    if (cat.id === "family_life") icon = "fa-users";
    if (cat.id === "communication") icon = "fa-comments";

    html += `
      <div class="lesson-card" onclick="window.startSpecificLesson('${cat.id}')">
        <div class="lesson-card-icon">
          <i class="fas ${icon}"></i>
        </div>
        <div class="lesson-card-body">
          <h4 class="lesson-card-title">${cat.name}</h4>
          <p class="lesson-card-meta">${total} từ vựng • ${mastered} đã thuộc</p>
          <div class="lesson-mini-progress">
            <div class="lesson-mini-fill" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="lesson-card-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =========================================================================
// 3. TÌM KIẾM VÀ LỌC TỪ ĐIỂN
// =========================================================================
let currentDictFilter = {
  keyword: "",
  category: "all",
  wordType: "all",
  status: "all"
};

function setupDictionarySearch() {
  const searchInput = document.getElementById("dict-search-input");
  const catFilter = document.getElementById("dict-cat-filter");
  const typeFilter = document.getElementById("dict-type-filter");
  const statusFilter = document.getElementById("dict-status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentDictFilter.keyword = e.target.value.trim().toLowerCase();
      renderDictionaryList();
    });
  }

  if (catFilter) {
    catFilter.addEventListener("change", (e) => {
      currentDictFilter.category = e.target.value;
      renderDictionaryList();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", (e) => {
      currentDictFilter.wordType = e.target.value;
      renderDictionaryList();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentDictFilter.status = e.target.value;
      renderDictionaryList();
    });
  }

  // Đóng modal chi tiết
  const closeModalBtn = document.getElementById("close-word-modal");
  const modalOverlay = document.getElementById("word-detail-modal");
  if (closeModalBtn && modalOverlay) {
    closeModalBtn.addEventListener("click", () => modalOverlay.classList.remove("open"));
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove("open");
    });
  }
}

function renderDictionaryList() {
  const container = document.getElementById("dict-results-container");
  const counterEl = document.getElementById("dict-results-count");
  if (!container || typeof VOCABULARY_DATA === "undefined") return;

  const progress = window.storageManager ? window.storageManager.progress : {};

  // Lọc từ vựng
  const filtered = VOCABULARY_DATA.filter(w => {
    // 1. Từ khóa: tìm theo Japanese, Hiragana, Kanji, Romaji, Vietnamese
    if (currentDictFilter.keyword) {
      const kw = currentDictFilter.keyword;
      const matchJp = w.japanese.toLowerCase().includes(kw);
      const matchHira = w.hiragana && w.hiragana.toLowerCase().includes(kw);
      const matchKanji = w.kanji && w.kanji.toLowerCase().includes(kw);
      const matchRomaji = w.romaji.toLowerCase().includes(kw);
      const matchVi = w.vietnamese.toLowerCase().includes(kw);
      if (!matchJp && !matchHira && !matchKanji && !matchRomaji && !matchVi) return false;
    }

    // 2. Nhóm bài học
    if (currentDictFilter.category !== "all") {
      if (currentDictFilter.category === "adverb") {
        if (w.category !== "adverb" && w.category !== "conjunction") return false;
      } else if (w.category !== currentDictFilter.category) {
        return false;
      }
    }

    // 3. Loại từ
    if (currentDictFilter.wordType !== "all") {
      if (!w.wordType.includes(currentDictFilter.wordType)) return false;
    }

    // 4. Trạng thái học tập
    if (currentDictFilter.status !== "all") {
      const p = progress[w.id];
      if (currentDictFilter.status === "favorite") {
        if (!p || !p.isFavorite) return false;
      } else if (currentDictFilter.status === "mastered") {
        if (!p || p.status !== "mastered") return false;
      } else if (currentDictFilter.status === "review") {
        if (!p || (p.status !== "review" && (!p.nextReviewDate || p.nextReviewDate > Date.now()))) return false;
      } else if (currentDictFilter.status === "unlearned") {
        if (p && p.status !== "unlearned") return false;
      }
    }

    return true;
  });

  if (counterEl) {
    counterEl.innerText = `Tìm thấy ${filtered.length} từ vựng`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state p-5 text-center">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h4>Không tìm thấy từ vựng phù hợp</h4>
        <p class="text-muted">Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="vocab-grid">`;
  filtered.forEach(w => {
    const p = progress[w.id] || {};
    const isFav = p.isFavorite || false;
    let statusBadge = `<span class="badge badge-secondary">Chưa học</span>`;
    if (p.status === "mastered") statusBadge = `<span class="badge badge-success">Đã nhớ</span>`;
    else if (p.status === "learning") statusBadge = `<span class="badge badge-info">Đang học</span>`;
    else if (p.status === "review") statusBadge = `<span class="badge badge-warning">Cần ôn</span>`;

    html += `
      <div class="vocab-card" onclick="window.openWordDetail('${w.id}')">
        <div class="vocab-card-header">
          <span class="badge badge-type">${w.wordType}</span>
          <div class="d-flex align-items-center gap-1">
            <button class="btn-fav-mini ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleDictionaryFav('${w.id}')" title="Yêu thích">
              <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <button class="btn-audio-mini" onclick="event.stopPropagation(); window.speechHelper && window.speechHelper.speak('${w.audioText || w.japanese}')" title="Phát âm">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>
        </div>
        <div class="vocab-card-body">
          <div class="vocab-jp-display">
            <span class="vocab-jp-text">${w.japanese}</span>
            ${w.kanji ? `<span class="vocab-kanji-tag">${w.kanji}</span>` : ""}
          </div>
          <p class="vocab-romaji-text">${w.romaji}</p>
          <h4 class="vocab-meaning-text">${w.vietnamese}</h4>
        </div>
        <div class="vocab-card-footer">
          <span class="small text-muted">${w.lesson}</span>
          ${statusBadge}
        </div>
      </div>
    `;
  });
  html += `</div>`;

  container.innerHTML = html;
}

window.toggleDictionaryFav = function(wordId) {
  if (window.storageManager) {
    const isFav = window.storageManager.toggleFavorite(wordId);
    renderDictionaryList();
    if (window.showToast) {
      window.showToast(isFav ? "Đã thêm vào mục Yêu thích!" : "Đã bỏ khỏi Yêu thích.", "info");
    }
  }
};

// Mở Modal chi tiết từ vựng (7.8)
window.openWordDetail = function(wordId) {
  const word = VOCABULARY_DATA.find(w => w.id === wordId);
  if (!word) return;

  const modal = document.getElementById("word-detail-modal");
  const modalContent = document.getElementById("word-detail-content");
  if (!modal || !modalContent) return;

  const p = window.storageManager ? window.storageManager.getWordProgress(word.id) : {};

  modalContent.innerHTML = `
    <div class="modal-detail-header mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <span class="badge badge-type fs-6">${word.wordType}</span>
        <button class="btn btn-outline-danger btn-sm" onclick="window.toggleDictionaryFav('${word.id}'); window.openWordDetail('${word.id}')">
          <i class="${p.isFavorite ? 'fas' : 'far'} fa-heart"></i> ${p.isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
        </button>
      </div>
      <div class="detail-jp-hero mt-2">
        <h1 class="display-5 fw-bold text-primary mb-1">${word.japanese}</h1>
        <div class="d-flex gap-3 align-items-center flex-wrap">
          ${word.kanji ? `<span class="fs-5 text-muted"><i class="fas fa-feather-alt"></i> Kanji: <strong>${word.kanji}</strong></span>` : ""}
          <span class="fs-5 text-muted"><i class="fas fa-font"></i> Romaji: <strong>${word.romaji}</strong></span>
          <button class="btn btn-primary btn-sm px-3" onclick="window.speechHelper && window.speechHelper.speak('${word.audioText || word.japanese}')">
            <i class="fas fa-volume-up"></i> Phát âm từ
          </button>
        </div>
      </div>
    </div>

    <div class="detail-section mb-3 p-3 bg-light rounded">
      <h5 class="text-secondary mb-1">Nghĩa tiếng Việt</h5>
      <h3 class="text-dark mb-0">${word.vietnamese}</h3>
    </div>

    ${word.exampleJapanese ? `
      <div class="detail-section mb-3 p-3 border rounded">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0 text-primary"><i class="fas fa-comment-dots"></i> Ví dụ thực tế trong câu:</h5>
          <button class="btn btn-sm btn-outline-primary" onclick="window.speechHelper && window.speechHelper.speak('${word.exampleJapanese.replace(/'/g, "\\'")}')">
            <i class="fas fa-volume-up"></i> Nghe câu ví dụ
          </button>
        </div>
        <p class="fs-5 mb-1 text-dark fw-bold">${word.exampleJapanese}</p>
        <p class="text-muted mb-1"><em>${word.exampleRomaji}</em></p>
        <p class="mb-0 text-success"><strong>Dịch nghĩa:</strong> ${word.exampleVietnamese}</p>
      </div>
    ` : ""}

    ${word.note ? `
      <div class="detail-section mb-3 p-3 bg-warning-subtle rounded border border-warning">
        <h5 class="text-warning-emphasis mb-1"><i class="fas fa-lightbulb"></i> Lưu ý cách dùng & Ngữ pháp:</h5>
        <p class="mb-0 text-dark">${word.note}</p>
      </div>
    ` : ""}

    <div class="detail-stats-box p-3 bg-body-tertiary rounded small d-flex justify-content-between">
      <span>Đã trả lời đúng: <strong>${p.correctCount || 0}</strong> lần</span>
      <span>Đã làm sai: <strong>${p.wrongCount || 0}</strong> lần</span>
      <span>Độ ưu tiên ôn tập: <strong>${p.priority || 1}/5</strong></span>
    </div>
  `;

  modal.classList.add("open");
};

// =========================================================================
// 4. PHẦN NGỮ PHÁP & VĂN HÓA BỔ TRỢ
// =========================================================================
function setupGrammarSection() {
  const container = document.getElementById("grammar-guides-container");
  if (!container || typeof GRAMMAR_GUIDES === "undefined") return;

  let html = "";
  GRAMMAR_GUIDES.forEach((guide, idx) => {
    html += `
      <div class="grammar-card mb-4">
        <div class="grammar-card-header">
          <h4 class="mb-0 text-primary">${guide.title}</h4>
        </div>
        <div class="grammar-card-body">
          ${guide.content}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =========================================================================
// 5. CÀI ĐẶT & QUẢN LÝ DỮ LIỆU
// =========================================================================
function setupSettingsHandlers() {
  if (!window.storageManager) return;

  const currentSettings = window.storageManager.settings;

  // 1. Bật/tắt âm thanh
  const soundToggle = document.getElementById("setting-sound-toggle");
  if (soundToggle) {
    soundToggle.checked = currentSettings.soundEnabled;
    soundToggle.addEventListener("change", (e) => {
      window.storageManager.saveSettings({ soundEnabled: e.target.checked });
      showToast(e.target.checked ? "Đã bật âm thanh phát âm." : "Đã tắt âm thanh.", "info");
    });
  }

  // 2. Tốc độ đọc
  const speedSelect = document.getElementById("setting-speech-speed");
  if (speedSelect) {
    speedSelect.value = currentSettings.speechSpeed.toString();
    speedSelect.addEventListener("change", (e) => {
      const sp = parseFloat(e.target.value);
      window.storageManager.saveSettings({ speechSpeed: sp });
      showToast(`Đã điều chỉnh tốc độ phát âm: ${sp}x`, "info");
    });
  }

  // 3. Chuyển đổi Theme Sáng/Tối
  const themeToggle = document.getElementById("setting-theme-toggle");
  const quickThemeToggle = document.getElementById("quick-theme-toggle");

  if (themeToggle) {
    themeToggle.checked = currentSettings.theme === "dark";
    themeToggle.addEventListener("change", (e) => {
      const mode = e.target.checked ? "dark" : "light";
      applyTheme(mode);
    });
  }

  if (quickThemeToggle) {
    quickThemeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      if (themeToggle) themeToggle.checked = next === "dark";
    });
  }

  // 4. Xuất dữ liệu JSON
  const exportBtn = document.getElementById("btn-export-data");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const json = window.storageManager.exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nihongo_step_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Đã xuất tệp sao lưu tiến độ học tập thành công!", "success");
    });
  }

  // 5. Nhập dữ liệu JSON
  const importFile = document.getElementById("import-file-input");
  const importBtn = document.getElementById("btn-import-data");
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = window.storageManager.importData(event.target.result);
        if (result.success) {
          showToast(result.message, "success");
          updateDashboardStats();
          if (window.statisticsManager) window.statisticsManager.renderAll();
          if (window.reviewManager) window.reviewManager.updateQueue();
          renderDictionaryList();
        } else {
          showToast(result.message, "danger");
        }
      };
      reader.readAsText(file);
    });
  }

  // 6. Xóa toàn bộ tiến độ (Có xác nhận)
  const resetBtn = document.getElementById("btn-reset-data");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const confirmed = confirm("Bạn có chắc chắn muốn xóa toàn bộ tiến độ học tập, điểm XP và lịch sử kiểm tra không? Thao tác này không thể hoàn tác!");
      if (confirmed) {
        window.storageManager.resetAll();
        showToast("Đã đặt lại toàn bộ tiến độ học tập về ban đầu.", "warning");
        updateDashboardStats();
        if (window.statisticsManager) window.statisticsManager.renderAll();
        if (window.reviewManager) window.reviewManager.updateQueue();
        if (window.flashcardController) window.flashcardController.loadDeck();
        renderDictionaryList();
      }
    });
  }
}

function applyStoredTheme() {
  const saved = window.storageManager ? window.storageManager.settings.theme : "light";
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (window.storageManager) {
    window.storageManager.saveSettings({ theme });
  }

  const quickBtn = document.getElementById("quick-theme-toggle");
  if (quickBtn) {
    quickBtn.innerHTML = theme === "dark" ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
  }
}

// =========================================================================
// 6. HỆ THỐNG TOAST THÔNG BÁO THÂN THIỆN
// =========================================================================
function showToast(message, type = "info") {
  let toastContainer = document.getElementById("app-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "app-toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `app-toast toast-${type}`;

  let icon = "fa-info-circle";
  if (type === "success") icon = "fa-check-circle";
  if (type === "warning") icon = "fa-exclamation-triangle";
  if (type === "danger") icon = "fa-times-circle";

  toast.innerHTML = `
    <i class="fas ${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Hiệu ứng vào
  setTimeout(() => toast.classList.add("show"), 10);

  // Tự động biến mất sau 3.2s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
window.showToast = showToast;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}
