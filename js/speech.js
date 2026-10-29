/**
 * NIHONGO STEP - WEB SPEECH API PHÁT ÂM TIẾNG NHẬT
 * Hỗ trợ phát âm từ vựng và câu ví dụ với giọng đọc tiếng Nhật (ja-JP).
 * Tùy chỉnh tốc độ, phát hiện hỗ trợ trình duyệt, có cơ chế thông báo thân thiện.
 */

class SpeechHelper {
  constructor() {
    this.isSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    this.japaneseVoice = null;
    this.isPlaying = false;
    this.hasWarnedNoVoice = false;

    if (this.isSupported) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  // Tìm kiếm giọng đọc tiếng Nhật tốt nhất trong hệ điều hành/trình duyệt
  initVoices() {
    if (!this.isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên giọng tiếng Nhật (ja-JP hoặc ja_JP hoặc lang bắt đầu bằng ja)
    this.japaneseVoice = voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP") ||
      voices.find(v => v.lang.toLowerCase().startsWith("ja")) || null;
  }

  // Phát âm văn bản tiếng Nhật
  speak(text, speedOverride = null, onEndCallback = null) {
    // Kiểm tra cài đặt âm thanh
    if (window.storageManager && !window.storageManager.settings.soundEnabled) {
      console.log("Phát âm đã tắt trong cài đặt người dùng.");
      return;
    }

    if (!this.isSupported) {
      this.notifyUnsupported();
      return;
    }

    if (!text || text.trim() === "") return;

    // Hủy các câu đang phát dở
    window.speechSynthesis.cancel();

    // Làm sạch ký tự không cần phát âm (ví dụ dấu ngoặc giải thích, v.v.)
    const cleanText = text.replace(/[（(].*?[）)]/g, "").replace(/[～~…\.]/g, "").trim();

    const utterance = new SpeechSynthesisUtterance(cleanText || text);
    utterance.lang = "ja-JP";

    // Chọn tốc độ đọc (mặc định lấy từ cài đặt hoặc tốc độ truyền vào)
    const currentSpeed = speedOverride || (window.storageManager ? window.storageManager.settings.speechSpeed : 1.0);
    utterance.rate = Math.min(Math.max(currentSpeed, 0.5), 1.5);
    utterance.pitch = 1.0;

    if (this.japaneseVoice) {
      utterance.voice = this.japaneseVoice;
    } else {
      // Nếu chưa nạp xong, thử lấy lại danh sách
      this.initVoices();
      if (this.japaneseVoice) {
        utterance.voice = this.japaneseVoice;
      } else if (!this.hasWarnedNoVoice) {
        console.warn("Chưa tìm thấy gói giọng đọc tiếng Nhật ja-JP trên trình duyệt của bạn.");
        this.hasWarnedNoVoice = true;
      }
    }

    this.isPlaying = true;

    utterance.onend = () => {
      this.isPlaying = false;
      if (typeof onEndCallback === "function") {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      this.isPlaying = false;
      console.warn("Thông báo phát âm Web Speech API:", e);
      if (typeof onEndCallback === "function") {
        onEndCallback();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Lỗi khi gọi window.speechSynthesis.speak:", err);
      this.isPlaying = false;
    }
  }

  // Dừng phát âm ngay lập tức
  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  // Thông báo thân thiện khi trình duyệt không hỗ trợ Web Speech
  notifyUnsupported() {
    const msg = "Trình duyệt hiện tại chưa hỗ trợ Web Speech API tiếng Nhật. Bạn vui lòng sử dụng Google Chrome, Edge hoặc Safari để có trải nghiệm phát âm tốt nhất nhé!";
    if (window.showToast) {
      window.showToast(msg, "warning");
    } else {
      alert(msg);
    }
  }
}

// Khởi tạo instance toàn cục
window.speechHelper = new SpeechHelper();
