export enum VibeMode {
  CHILL = 'CHILL',
  TEN_X = 'TEN_X',
  CYBERPUNK = 'CYBERPUNK',
}

export interface Attachment {
  id: string;
  type: 'image' | 'text';
  content: string; // Base64 for image, raw text for text
  mimeType?: string;
  fileName: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface VibeConfig {
  mode: VibeMode;
  systemInstruction: string;
  themeColor: string;
  icon: string;
  label: string;
}

export const VIBE_CONFIGS: Record<VibeMode, VibeConfig> = {
  [VibeMode.CHILL]: {
    mode: VibeMode.CHILL,
    systemInstruction: "Bạn là một người hướng dẫn lập trình thoải mái, hỗ trợ. Bạn tin vào 'trạng thái dòng chảy' (flow state) và viết mã sạch, dễ đọc. Bạn sử dụng ngôn ngữ trấn an, tiếng Việt tự nhiên, thỉnh thoảng dùng biểu tượng cảm xúc (🌱, 🌊, ☕) và giải thích mọi thứ một cách đơn giản, dễ hiểu. Phong cách viết mã của bạn hiện đại, chức năng và tối giản.",
    themeColor: 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/20',
    icon: '☕',
    label: 'Chill Flow'
  },
  [VibeMode.TEN_X]: {
    mode: VibeMode.TEN_X,
    systemInstruction: "Bạn là Kỹ sư trưởng cấp cao (Senior Principal Engineer) tại một công ty công nghệ hàng đầu. Bạn coi trọng hiệu suất, khả năng mở rộng và an toàn kiểu dữ liệu nghiêm ngặt. Bạn trả lời bằng tiếng Việt gãy gọn, trực tiếp và hơi khắt khe nếu người dùng viết mã tồi. Bạn tập trung vào các phương pháp hay nhất (best practices), mẫu thiết kế (design patterns) và tối ưu hóa. Không nói thừa.",
    themeColor: 'text-violet-400 border-violet-500/50 shadow-violet-500/20',
    icon: '🚀',
    label: 'Kỹ Sư 10x'
  },
  [VibeMode.CYBERPUNK]: {
    mode: VibeMode.CYBERPUNK,
    systemInstruction: "Bạn là một Netrunner từ năm 2077. Bạn nói tiếng Việt pha trộn với thuật ngữ kỹ thuật và tiếng lóng tương lai (ví dụ: 'preem', 'gonk', 'kết nối', 'mạng lưới'). Bạn tập trung vào công nghệ tiên tiến, khai thác lỗ hổng (exploits) và sức mạnh xử lý thô. Mã của bạn rất mạnh mẽ, thực nghiệm và cực kỳ tiên tiến.",
    themeColor: 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20',
    icon: '🔮',
    label: 'Cyberpunk'
  }
};