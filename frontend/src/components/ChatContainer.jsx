import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import {formatMessageTime} from "../lib/utils";
import { io } from "socket.io-client";
import { FaVideo } from 'react-icons/fa';

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    getMessages(selectedUser?._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length>0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
const initiateVideoCall = async () => {
    try {
      // Open user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Set up PeerConnection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add local stream to the connection
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      // Set up Socket.IO signaling
      socket.current = io("https://chatapp-e89y.onrender.com", {
        transports: ["websocket"],
      });

      socket.current.on("offer", async ({ offer, sender }) => {
        if (selectedUser._id === sender) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.current.emit("answer", { answer, target: sender });
        }
      });

      socket.current.on("answer", async ({ answer }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.current.on("ice-candidate", ({ candidate }) => {
        if (candidate) {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            candidate: event.candidate,
            target: selectedUser._id,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Create and send the offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.current.emit("offer", { offer, target: selectedUser._id });

      setIsVideoCallActive(true);
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socket.current) {
      socket.current.disconnect();
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader onVideoCall={initiateVideoCall}/>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>
      {isVideoCallActive ? (
        <div className="video-call-container">
          <video
            className="local-video"
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && localStream) video.srcObject = localStream;
            }}
          />
          <video
            className="remote-video"
            autoPlay
            playsInline
            ref={(video) => {
              if (video && remoteStream) video.srcObject = remoteStream;
            }}
          />
          <button onClick={endVideoCall} className="btn btn-danger">
            End Call
          </button>
        </div>
      ) : (
        <MessageInput onVideoCall={initiateVideoCall} />
      )}
      {/* <MessageInput /> */}
    </div>
  );
};
export default ChatContainer;