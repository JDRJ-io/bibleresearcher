import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  X, 
  Send, 
  MessageCircle, 
  Lightbulb, 
  Bug, 
  AlertCircle, 
  Heart,
  Bell,
  BellOff
} from "lucide-react";

type PostType = "comment" | "suggestion" | "bug" | "error" | "prayer";

interface ForumQuickAccessProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForumQuickAccess({ isOpen, onClose }: ForumQuickAccessProps) {
  const [postType, setPostType] = useState<PostType>("comment");
  const [message, setMessage] = useState("");
  const [notificationsMuted, setNotificationsMuted] = useState(false);

  const postTypes: { type: PostType; icon: any; label: string; color: string }[] = [
    { type: "comment", icon: MessageCircle, label: "Comment", color: "bg-blue-500" },
    { type: "suggestion", icon: Lightbulb, label: "Suggestion", color: "bg-amber-500" },
    { type: "bug", icon: Bug, label: "Bug", color: "bg-red-500" },
    { type: "error", icon: AlertCircle, label: "Error", color: "bg-orange-500" },
    { type: "prayer", icon: Heart, label: "Prayer", color: "bg-purple-500" },
  ];

  const handleSubmit = () => {
    if (message.trim()) {
      console.log("Submitting post:", { type: postType, message });
      setMessage("");
      onClose();
    }
  };

  const toggleNotifications = () => {
    setNotificationsMuted(!notificationsMuted);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Popup Panel */}
      <div 
        className={`fixed bottom-12 right-4 w-96 max-w-[calc(100vw-2rem)] bg-background border rounded-lg shadow-2xl z-50 transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-sky-100 dark:from-blue-950 dark:to-sky-900 rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Quick Forum Access</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications Toggle */}
            <button
              onClick={toggleNotifications}
              className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
              title={notificationsMuted ? "Enable notifications" : "Mute notifications"}
              data-testid="button-toggle-notifications"
            >
              {notificationsMuted ? (
                <BellOff className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              ) : (
                <Bell className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              )}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
              data-testid="button-close-forum"
            >
              <X className="w-4 h-4 text-blue-700 dark:text-blue-300" />
            </button>
          </div>
        </div>

        {/* Quick Post Section */}
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Post Type</label>
            <div className="flex flex-wrap gap-2">
              {postTypes.map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    postType === type
                      ? `${color} text-white shadow-md scale-105`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`button-post-type-${type}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Share your ${postType}...`}
              className="min-h-[100px] resize-none"
              data-testid="textarea-forum-message"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-submit-post"
          >
            <Send className="w-4 h-4 mr-2" />
            Post to Forum
          </Button>
        </div>
      </div>
    </>
  );
}
