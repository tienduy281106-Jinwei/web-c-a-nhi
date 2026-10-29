/**
 * NIHONGO STEP - QUẢN LÝ DỮ LIỆU LOCALSTORAGE & THUẬT TOÁN ÔN TẬP
 * Lưu trữ tiến độ học, chuỗi ngày streak, điểm XP, danh sách yêu thích và cài đặt.
 * Triển khai thuật toán lặp lại ngắt quãng đơn giản (Spaced Repetition).
 */

const STORAGE_KEYS = {
  PROGRESS: "nihongo_step_progress_v1",
  SETTINGS: "nihongo_step_settings_v1",
  STATS: "nihongo_step_stats_v1",
  QUIZ_HISTORY: "nihongo_step_quiz_history_v1"
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  speechSpeed: 1.0,
  theme: "light",
  flashcardMode: "all", // "all" | "ja_only" | "vi_only"
  batchSize: 10
};

const DEFAULT_STATS = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  totalQuizzesTaken: 0,
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0
};

class StorageManager {
  constructor() {
    this.progress = this.loadProgress();
    this.settings = this.loadSettings();
    this.stats = this.loadStats();
    this.quizHistory = this.loadQuizHistory();
    this.updateDailyStreak();
  }

  // Khởi tạo hoặc nạp tiến độ của từng từ vựng
  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const parsed = saved ? JSON.parse(saved) : {};
      
      // Đảm bảo mọi từ trong VOCABULARY_DATA đều có bản ghi tiến độ
      if (typeof VOCABULARY_DATA !== "undefined" && Array.isArray(VOCABULARY_DATA)) {
        let hasChanges = false;
        VOCABULARY_DATA.forEach(word => {
          if (!parsed[word.id]) {
            parsed[word.id] = {
              id: word.id,
              status: "unlearned", // "unlearned" | "learning" | "mastered" | "review"
              correctCount: 0,
              wrongCount: 0,
              priority: 1, // 1 (bình thường) đến 5 (rất cần ôn tập)
              nextReviewDate: null,
              lastStudied: null,
              isFavorite: false
            };
            hasChanges = true;
          }
        });
        if (hasChanges) {
          localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch (e) {
      console.error("Lỗi đọc dữ liệu tiến độ từ LocalStorage:", e);
      return {};
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
    } catch (e) {
      console.error("Lỗi lưu dữ liệu tiến độ vào LocalStorage:", e);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error("Lỗi lưu cài đặt:", e);
    }
    return this.settings;
  }

  loadStats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : { ...DEFAULT_STATS };
    } catch (e) {
      return { ...DEFAULT_STATS };
    }
  }

  saveStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (e) {
      console.error("Lỗi lưu thống kê:", e);
    }
  }

  loadQuizHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveQuizHistory(record) {
    this.quizHistory.unshift(record);
    if (this.quizHistory.length > 50) {
      this.quizHistory = this.quizHistory.slice(0, 50); // Giữ tối đa 50 bài gần nhất
    }
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(this.quizHistory));
    } catch (e) {
      console.error("Lỗi lưu lịch sử quiz:", e);
    }
  }

  // Cập nhật chuỗi học liên tiếp (Streak)
  updateDailyStreak() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastDate = this.stats.lastActiveDate;

    if (!lastDate) {
      this.stats.streak = 1;
      this.stats.lastActiveDate = today;
      this.saveStats();
      return;
    }

    if (lastDate === today) {
      // Đã học hôm nay rồi, giữ nguyên
      return;
    }

    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 1);
    const yesterday = prevDate.toISOString().slice(0, 10);

    if (lastDate === yesterday) {
      // Học ngày liền kề -> tăng chuỗi
      this.stats.streak += 1;
    } else {
      // Bị gián đoạn -> bắt đầu lại 1
      this.stats.streak = 1;
    }

    this.stats.lastActiveDate = today;
    this.saveStats();
  }

  // Cộng điểm XP
  addXP(amount) {
    this.stats.xp = (this.stats.xp || 0) + amount;
    this.saveStats();
    return this.stats.xp;
  }

  // Lấy tiến độ của 1 từ
  getWordProgress(wordId) {
    if (!this.progress[wordId]) {
      this.progress[wordId] = {
        id: wordId,
        status: "unlearned",
        correctCount: 0,
        wrongCount: 0,
        priority: 1,
        nextReviewDate: null,
        lastStudied: null,
        isFavorite: false
      };
      this.saveProgress();
    }
    return this.progress[wordId];
  }

  // Đổi trạng thái yêu thích
  toggleFavorite(wordId) {
    const p = this.getWordProgress(wordId);
    p.isFavorite = !p.isFavorite;
    this.saveProgress();
    return p.isFavorite;
  }

  // Thuật toán ôn tập lặp lại ngắt quãng đơn giản (Spaced Repetition System)
  recordAnswer(wordId, isCorrect) {
    const p = this.getWordProgress(wordId);
    const now = Date.now();
    p.lastStudied = now;

    if (isCorrect) {
      p.correctCount += 1;
      // Giảm độ ưu tiên ôn tập khi đã thuộc
      p.priority = Math.max(1, p.priority - 1);

      // Tính khoảng thời gian ngắt quãng dựa trên số lần đúng
      // Lần 1: 1 ngày (86,400,000 ms), Lần 2: 3 ngày, Lần 3+: 7 ngày -> 14 ngày
      const intervalDays = p.correctCount === 1 ? 1 : p.correctCount === 2 ? 3 : p.correctCount >= 3 ? 7 : 1;
      p.nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;

      if (p.correctCount >= 2 && p.wrongCount === 0) {
        p.status = "mastered"; // Đã nhớ chắc
      } else {
        p.status = "learning"; // Đang học tốt
      }
    } else {
      p.wrongCount += 1;
      // Tăng mức độ ưu tiên ôn tập khi trả lời sai
      p.priority = Math.min(5, p.priority + 2);
      p.status = "review"; // Đánh dấu cần ôn tập ngay
      // Ôn tập lại ngay lập tức hoặc sau vài tiếng
      p.nextReviewDate = now + 4 * 60 * 60 * 1000; // 4 tiếng sau
    }

    this.saveProgress();
    return p;
  }

  // Đánh dấu từ thủ công từ Flashcard
  setWordStatus(wordId, status) {
    const p = this.getWordProgress(wordId);
    p.status = status;
    p.lastStudied = Date.now();

    if (status === "mastered") {
      p.priority = 1;
      p.correctCount = Math.max(p.correctCount, 2);
      p.nextReviewDate = Date.now() + 5 * 24 * 60 * 60 * 1000;
    } else if (status === "review") {
      p.priority = 4;
      p.nextReviewDate = Date.now();
    } else if (status === "learning") {
      p.priority = 2;
    }

    this.saveProgress();
    return p;
  }

  // Tổng hợp số liệu thống kê thời gian thực
  getSummaryStats() {
    const totalWords = (typeof VOCABULARY_DATA !== "undefined") ? VOCABULARY_DATA.length : 0;
    let learnedCount = 0;
    let masteredCount = 0;
    let needReviewCount = 0;
    let unlearnedCount = 0;
    let favoriteCount = 0;
    const now = Date.now();

    for (const id in this.progress) {
      const p = this.progress[id];
      if (p.isFavorite) favoriteCount++;

      if (p.status === "mastered") {
        masteredCount++;
        learnedCount++;
      } else if (p.status === "learning") {
        learnedCount++;
      } else if (p.status === "review") {
        needReviewCount++;
        learnedCount++;
      } else {
        unlearnedCount++;
      }

      // Nếu từ có lịch ôn tập đã đến hạn thì tính vào cần ôn
      if (p.nextReviewDate && p.nextReviewDate <= now && p.status !== "review") {
        needReviewCount++;
      }
    }

    // Đảm bảo không trùng lặp đếm
    const completionRate = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

    return {
      totalWords,
      learnedCount,
      masteredCount,
      needReviewCount,
      unlearnedCount,
      favoriteCount,
      completionRate,
      xp: this.stats.xp || 0,
      streak: this.stats.streak || 1,
      totalQuizzes: this.stats.totalQuizzesTaken || 0,
      correctAnswers: this.stats.totalCorrectAnswers || 0,
      totalAnswers: this.stats.totalQuestionsAnswered || 0,
      accuracy: this.stats.totalQuestionsAnswered > 0 
        ? Math.round((this.stats.totalCorrectAnswers / this.stats.totalQuestionsAnswered) * 100) 
        : 0
    };
  }

  // Xuất toàn bộ dữ liệu ra tệp JSON
  exportData() {
    const exportObject = {
      app: "NihongoStep",
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      progress: this.progress,
      settings: this.settings,
      stats: this.stats,
      quizHistory: this.quizHistory
    };
    return JSON.stringify(exportObject, null, 2);
  }

  // Nhập dữ liệu từ tệp JSON
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.progress) {
        throw new Error("Tệp sao lưu không đúng định dạng của Nihongo Step.");
      }

      this.progress = data.progress;
      if (data.settings) this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      if (data.stats) this.stats = { ...DEFAULT_STATS, ...data.stats };
      if (data.quizHistory) this.quizHistory = data.quizHistory;

      this.saveProgress();
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      this.saveStats();
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(this.quizHistory));

      return { success: true, message: "Khôi phục dữ liệu học tập thành công!" };
    } catch (e) {
      return { success: false, message: "Lỗi: " + (e.message || "Tệp JSON không hợp lệ.") };
    }
  }

  // Xóa toàn bộ dữ liệu
  resetAll() {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);

    this.progress = this.loadProgress();
    this.settings = { ...DEFAULT_SETTINGS };
    this.stats = { ...DEFAULT_STATS, streak: 1, lastActiveDate: new Date().toISOString().slice(0, 10) };
    this.quizHistory = [];

    this.saveProgress();
    this.saveStats();
    return true;
  }
}

// Khởi tạo instance toàn cục
window.storageManager = new StorageManager();
