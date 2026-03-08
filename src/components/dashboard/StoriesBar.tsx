import { useState } from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import StoryViewer from "./StoryViewer";

interface StoriesBarProps {
  userAvatar: string;
}

const stories = [
  { name: "Sophie M.", avatar: "https://i.pravatar.cc/150?img=5", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Lucas D.", avatar: "https://i.pravatar.cc/150?img=8", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Amina K.", avatar: "https://i.pravatar.cc/150?img=1", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Paul R.", avatar: "https://i.pravatar.cc/150?img=4", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=1000&fit=crop", hasNew: false },
  { name: "Claire M.", avatar: "https://i.pravatar.cc/150?img=10", image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Omar B.", avatar: "https://i.pravatar.cc/150?img=11", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=1000&fit=crop", hasNew: false },
];

const StoriesBar = ({ userAvatar }: StoriesBarProps) => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {/* Create Story */}
        <button className="relative shrink-0 w-28 h-48 rounded-xl overflow-hidden bg-card border border-border shadow-sm group snap-start hover:shadow-md transition-shadow">
          <img
            src={userAvatar}
            alt="Create"
            className="w-full h-3/4 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-0 inset-x-0 h-1/4 bg-card flex flex-col items-center justify-center pt-4">
            <div className="absolute top-0 -translate-y-1/2 w-9 h-9 bg-primary rounded-full flex items-center justify-center border-4 border-card">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground mt-1">Créer</span>
          </div>
        </button>

        {/* Stories */}
        {stories.map((story, i) => (
          <button
            key={story.name}
            onClick={() => setViewerIndex(i)}
            className="relative shrink-0 w-28 h-48 rounded-xl overflow-hidden group cursor-pointer snap-start animate-fade-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img
              src={story.image}
              alt={story.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className={`absolute top-3 left-3 p-0.5 rounded-full ${story.hasNew ? "bg-primary" : "bg-muted"}`}>
              <Avatar className="w-9 h-9 border-2 border-card">
                <AvatarImage src={story.avatar} />
                <AvatarFallback className="text-xs">{story.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white truncate">
              {story.name}
            </span>
          </button>
        ))}
      </div>

      {/* Fullscreen Story Viewer */}
      {viewerIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
};

export default StoriesBar;
