import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { FaVideo } from "react-icons/fa";

const ChatHeader = ({ onVideoCall }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Debugging logs
  console.log("Selected User in ChatHeader:", selectedUser);
  console.log("onVideoCall function in ChatHeader:", onVideoCall);

  if (!selectedUser) {
    return <div>Select a user to start chatting.</div>;
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
                className="w-10 h-10"
              />
            </div>
          </div>

          {/* User Info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>

          {/* Video Call Button */}
          <button
            onClick={onVideoCall}
            className="video-call-btn p-2 rounded-full bg-blue-500 text-white hover:bg-blue-700 focus:outline-none"
            title="Start Video Call"
          >
            <FaVideo />
          </button>
        </div>

        {/* Close Button */}
        <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-500 hover:text-red-500">
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
