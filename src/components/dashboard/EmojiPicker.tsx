const EMOJIS = [
  "😀", "😂", "🥰", "😍", "🤩", "😎", "🥳", "😢", "😤", "🤔",
  "👍", "👎", "❤️", "🔥", "💯", "🎉", "🙏", "💪", "✨", "🌟",
  "😊", "😇", "🤗", "😏", "😌", "😴", "🤯", "🥺", "😭", "😱",
  "🍕", "🍔", "☕", "🎵", "📸", "⚽", "🏆", "🚀", "💼", "🎓",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  return (
    <div className="bg-muted rounded-xl p-3 border border-border animate-scale-in">
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-card hover:scale-125 transition-all duration-150"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
