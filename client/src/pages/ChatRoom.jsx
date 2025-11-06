import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import toast from "react-hot-toast";
import UsernameModal from "../components/UsernameModal";
import { FiUsers, FiPhone, FiPaperclip, FiMic, FiSend } from "react-icons/fi";
import CallUI from "../components/CallUI";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const socket = io.connect(SOCKET_SERVER_URL);

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUserListVisible, setIsUserListVisible] = useState(false);

  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [oldMessagesLoaded, setOldMessagesLoaded] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [isInCall, setIsInCall] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const messageContainerRef = useRef(null);
  const userListRef = useRef(null);
  const userListButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ right: 0, top: 0 });

  const toggleMute = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;
        if (peerConnectionRef.current)
          stream
            .getTracks()
            .forEach((track) =>
              peerConnectionRef.current.addTrack(track, stream)
            );
      }

      setIsMuted((prev) => {
        const newMuted = !prev;
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted;
        });
        return newMuted;
      });
    } catch (err) {
      console.error("toggleMute error", err);
      toast.error("Could not access microphone.");
    }
  }, []);

  useEffect(() => {
    const toastId = toast.loading("Connecting to chat...");
    setTimeout(() => {
      toast.success("Connected!", { id: toastId });
      setIsLoading(false);
      setShowModal(true);
    }, 2000);
  }, []);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = messageContainerRef.current;
    if (!el) return;
    setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior });
      } catch (e) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, oldMessagesLoaded, scrollToBottom]);

  // Close user list when clicking outside and update position
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userListRef.current && !userListRef.current.contains(event.target) && 
          userListButtonRef.current && !userListButtonRef.current.contains(event.target)) {
        setIsUserListVisible(false);
      }
    };

    const updateDropdownPosition = () => {
      if (userListButtonRef.current) {
        const rect = userListButtonRef.current.getBoundingClientRect();
        const navRect = userListButtonRef.current.closest('nav')?.getBoundingClientRect();
        if (navRect) {
          setDropdownPosition({
            right: window.innerWidth - rect.right,
            top: navRect.bottom + 8
          });
        }
      }
    };

    if (isUserListVisible) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserListVisible]);

  useEffect(() => {
    if (!username) return;

    socket.emit("join_room", { roomId, username });

    const messageListener = (data) => {
      const messageWithTimestamp = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, messageWithTimestamp]);
    };

    const userListListener = (users) => {
      setOnlineUsers(users);
    };

    const loadOldMessagesListener = (oldMessages) => {
      const formattedMessages = oldMessages.map((msg) => ({
        roomId: msg.roomId,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.createdAt,
        isOldMessage: true,
      }));
      setMessages(formattedMessages);
      setOldMessagesLoaded(true);
      setLoadingMessages(false);
    };

    const callMadeListener = async (data) => {
      try {
        const { offer, from } = data;
        setCallerInfo(from);

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:relay1.expressturn.com:3480",
              username: "000000002072354464",
              credential: "URGF0vnaKMoQ58xdOLZj2ZY2d3M=",
            },
          ],
        });
        peerConnectionRef.current = pc;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              to: from.id,
              candidate: event.candidate,
            });
          }
        };

        pc.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        processIceCandidateQueue();

        const answer = await pc.createAnswer();

        // Prioritize Opus codec
        setPreferredCodecs(answer);

        await pc.setLocalDescription(answer);

        setIsReceivingCall(true);
      } catch (error) {
        console.error("Error handling incoming call:", error);
        toast.error("Could not handle incoming call.");
      }
    };

    const answerMadeListener = async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    };

    const iceCandidateQueue = [];

    const iceCandidateListener = (data) => {
      try {
        if (peerConnectionRef.current) {
          if (
            peerConnectionRef.current.remoteDescription &&
            peerConnectionRef.current.remoteDescription.type
          ) {
            peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            console.warn(
              "Remote description is not set. Queuing ICE candidate."
            );
            iceCandidateQueue.push(data.candidate);
          }
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };

    // Process queued ICE candidates after setting the remote description
    const processIceCandidateQueue = () => {
      while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift();
        peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    const messageErrorListener = (data) => {
      toast.error(data.error || "Failed to send message");
    };

    socket.on("receive_message", messageListener);
    socket.on("update_user_list", userListListener);
    socket.on("load_old_messages", loadOldMessagesListener);
    socket.on("call-made", callMadeListener);
    socket.on("answer-made", answerMadeListener);
    socket.on("ice-candidate", iceCandidateListener);
    socket.on("message_error", messageErrorListener);

    return () => {
      socket.off("receive_message", messageListener);
      socket.off("update_user_list", userListListener);
      socket.off("load_old_messages", loadOldMessagesListener);
      socket.off("call-made", callMadeListener);
      socket.off("answer-made", answerMadeListener);
      socket.off("ice-candidate", iceCandidateListener);
      socket.off("message_error", messageErrorListener);
    };
  }, [roomId, username]);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    setShowModal(false);
    setLoadingMessages(true);
  };

  const sendMessage = async () => {
    if (currentMessage.trim() !== "" && username) {
      const messageData = {
        roomId,
        sender: username,
        content: currentMessage,
        timestamp: new Date().toISOString(),
      };
      await socket.emit("send_message", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setCurrentMessage("");
      // Message will be added via receive_message event listener
    }
  };

  const startCall = async (targetUser) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:relay1.expressturn.com:3480",
            username: "000000002072354464",
            credential: "URGF0vnaKMoQ58xdOLZj2ZY2d3M=",
          },
        ],
      });
      peerConnectionRef.current = pc;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: targetUser.id,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();

      // Prioritize Opus codec
      setPreferredCodecs(offer);

      await pc.setLocalDescription(offer);

      const currentUser = onlineUsers.find((u) => u.id === socket.id);
      socket.emit("call-user", { to: targetUser.id, from: currentUser, offer });
      setIsInCall(true);
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Could not start call. Check microphone permissions.");
    }
  };

  const answerCall = async () => {
    try {
      if (peerConnectionRef.current && callerInfo) {
        socket.emit("make-answer", {
          to: callerInfo.id,
          answer: peerConnectionRef.current.localDescription,
        });
        setIsReceivingCall(false);
        setIsInCall(true);
        toast.success("Call answered!");
      }
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error("Could not answer call.");
    }
  };

  const declineCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsReceivingCall(false);
    setCallerInfo(null);
  };

  const endCall = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsInCall(false);
    setIsReceivingCall(false);
    setCallerInfo(null);
  }, []);

  if (isLoading) {
    return (
      <div className="retro-landing flex flex-col items-center justify-center text-amber-200 h-screen">
        <div className="scanlines fixed inset-0 pointer-events-none"></div>
        <div className="retro-grid fixed inset-0 opacity-20"></div>
        <div className="retro-bg fixed inset-0"></div>
        <h1 className="relative z-10 text-2xl text-amber-200 animate-pulse font-mono">CONNECTING...</h1>
      </div>
    );
  }

  if (showModal) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className="retro-landing relative min-h-screen w-full overflow-hidden">
      {/* CRT Scanlines Effect */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50"></div>
      
      {/* Retro Grid Background */}
      <div className="retro-grid fixed inset-0 opacity-20"></div>
      
      {/* Animated Background Gradient */}
      <div className="retro-bg fixed inset-0"></div>

      {/* Main chat room container */}
      <div className="relative z-10 flex flex-col items-center justify-start text-amber-100 min-h-screen w-full">
        {/* Hidden audio element for remote audio stream */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Call UI overlay - shown when in active call */}
        {isInCall && (
          <CallUI
            isVisible={isInCall}
            localUsername={username}
            remoteUsername={callerInfo?.username || "User"}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={endCall}
          />
        )}

        {/* Incoming call notification banner */}
        {isReceivingCall && (
          <div className="fixed inset-x-0 top-6 flex justify-center z-50 pointer-events-none">
            {/* Incoming call notification container */}
            <div className="pointer-events-auto retro-glass bg-black/60 backdrop-blur-sm border-2 border-amber-300/50 px-4 py-3 rounded-full flex items-center gap-4 shadow-lg">
              {/* Caller info section */}
              <div className="flex items-center gap-3">
                {/* Caller name and label container */}
                <div className="flex flex-col">
                  <span className="text-sm text-amber-200 font-semibold font-mono">
                    INCOMING CALL
                  </span>
                  <span className="text-xs text-amber-200/70 font-mono">
                    {callerInfo?.username || "UNKNOWN"}
                  </span>
                </div>
              </div>
              {/* Call action buttons (Answer/Decline) */}
              <div className="flex items-center gap-3">
                <button
                  onClick={answerCall}
                  className="retro-btn-primary px-4 py-2 text-sm font-mono"
                >
                  ANSWER
                </button>
                <button
                  onClick={declineCall}
                  className="bg-amber-800/80 hover:bg-amber-900/80 border-2 border-amber-600 text-amber-100 px-4 py-2 rounded-md text-sm font-semibold font-mono transition-colors"
                >
                  DECLINE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Navbar */}
        <nav className="floating-navbar fixed top-4 z-40 w-[95%] max-w-6xl">
          <div className="retro-glass backdrop-blur-md bg-black/40 border-2 border-amber-300/50 rounded-lg px-6 py-3 shadow-[0_0_20px_rgba(217,119,6,0.3)] min-h-[3rem] flex items-center">
            <div className="flex items-center justify-between w-full relative">
              {/* Left side - Logo and Room ID */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src="/phantom-logo.png" alt="Phantom" className="w-6 h-6" />
                  <h1
                    onClick={() => navigate("/")}
                    className="text-amber-200 font-bold text-lg tracking-wider retro-text cursor-pointer select-none"
                    title="Go to homepage"
                  >
                    PHANTOM
                  </h1>
                </div>
                {/* Room ID badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-800/20 border border-amber-300/30 rounded-full">
                  <span className="text-xs text-amber-200/80 font-mono">
                    {roomId?.substring(0, 8) || "GROUP"}
                  </span>
                </div>
              </div>

              {/* Right side - User count and dropdown */}
              <div className="flex items-center gap-4">
                {/* Online users count */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-800/20 border border-amber-300/30 rounded-full">
                  <FiUsers className="w-4 h-4 text-amber-200" />
                  <span className="text-sm text-amber-200 font-mono">{onlineUsers.length}</span>
                </div>

                {/* User list toggle and dropdown */}
                <div className="relative">
                  <button
                    ref={userListButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserListVisible(!isUserListVisible);
                    }}
                    className="retro-btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <FiUsers className="w-4 h-4" />
                    <span className="font-mono">USERS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dropdown user list - positioned outside navbar container */}
          {isUserListVisible && (
            <div 
              ref={userListRef}
              className="fixed w-64 retro-card bg-black/80 backdrop-blur-sm border-2 border-amber-300/50 rounded-2xl shadow-lg py-2 z-[60]"
              style={{
                right: `${dropdownPosition.right}px`,
                top: `${dropdownPosition.top}px`,
                maxWidth: 'calc(95vw - 2rem)'
              }}
            >
                      {/* User list header */}
                      <div className="px-4 py-2 flex items-center justify-between border-b border-amber-300/20">
                        <p className="text-xs text-amber-200 font-semibold font-mono">
                          ONLINE USERS
                        </p>
                        <span className="text-xs bg-amber-800/30 text-amber-300 px-2 py-1 rounded-full font-mono">
                          {onlineUsers.length}
                        </span>
                      </div>

                      {/* Scrollable user list container */}
                      <div className="max-h-64 overflow-y-auto no-scrollbar">
                        {onlineUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-amber-900/20 transition-colors"
                          >
                            {/* User avatar circle */}
                            <div className="w-8 h-8 rounded-full bg-amber-300/10 border-2 border-amber-300/40 flex items-center justify-center text-sm text-amber-200">
                              {user.username
                                ? user.username.charAt(0).toUpperCase()
                                : "?"}
                            </div>

                            {/* User info section */}
                            <div className="flex-1">
                              {/* Username and call button row */}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-amber-100 font-medium font-mono">
                                  {user.username}
                                  {user.id === socket.id && " (YOU)"}
                                </span>
                                {/* Call button for other users */}
                                {user.id !== socket.id && !isInCall && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startCall(user);
                                      setIsUserListVisible(false);
                                    }}
                                    className="bg-amber-600/80 hover:bg-amber-700/80 border border-amber-400 text-amber-100 p-2 rounded-md transition-colors"
                                    aria-label={`Call ${user.username}`}
                                  >
                                    <FiPhone className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              {/* User status */}
                              <div className="text-xs text-amber-200/60 font-mono">
                                {user.status || "AVAILABLE"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
        </nav>

        {/* Spacer for navbar */}
        <div className="h-24"></div>

        {/* Main chat panel container */}
        <div className="chat-panel w-full max-w-3xl">
          {/* Chat room banner with room info and share button */}
          <div className="retro-card mb-6 rounded-xl shadow-inner bg-black/60 border-2 border-amber-300/50 p-4 flex items-center justify-between">
            {/* Room info section */}
            <div>
              <h3 className="text-xl font-semibold text-amber-200 font-mono">
                {roomId || "GROUP CHAT"}
              </h3>
              <p className="text-xs text-amber-200/70 font-mono">
                {onlineUsers.length} ONLINE • ONE-TIME END-TO-END ENCRYPTED CHATS
              </p>
            </div>
            {/* Share button container */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const shareData = {
                    title: document.title,
                    text: `Join me in ${roomId || "this chat"}`,
                    url: window.location.href,
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                      toast.success("Shared successfully");
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Room link copied to clipboard");
                    }
                  } catch (err) {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Room link copied to clipboard");
                    } catch (e) {
                      toast.error("Could not share link");
                    }
                  }
                }}
                className="retro-btn-secondary text-sm px-3 py-2 font-mono"
              >
                SHARE
              </button>
            </div>
          </div>
          {/* Messages container wrapper */}
          <div className="w-full flex justify-center">
            {/* Scrollable messages container */}
            <main
              ref={messageContainerRef}
              className="flex-grow w-full p-4 pb-2 overflow-y-auto no-scrollbar"
              style={{ height: 'calc(100vh - 26rem)' }}
            >
              {/* Loading indicator for chat history */}
              {loadingMessages && (
                <div className="flex justify-center items-center py-4">
                  <div className="text-amber-200/60 text-sm font-mono">
                    LOADING CHAT HISTORY...
                  </div>
                </div>
              )}

              {/* Messages list */}
              {messages.map((msg, index) => {
                const isFirstNewMessage =
                  index > 0 &&
                  messages[index - 1].isOldMessage &&
                  !msg.isOldMessage &&
                  oldMessagesLoaded;

                return (
                  <div key={index}>
                    {/* Divider between old and new messages */}
                    {isFirstNewMessage && (
                      <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-amber-300/30"></div>
                        <div className="px-4 text-xs text-amber-200/60 bg-black font-mono">
                          NEW MESSAGES
                        </div>
                        <div className="flex-grow border-t border-amber-300/30"></div>
                      </div>
                    )}
                    {/* Individual message container */}
                    <div
                      className={`mb-4 flex ${
                        msg.sender === username
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {/* Message bubble wrapper */}
                      <div className={`max-w-xs md:max-w-md`}>
                        {/* Message sender and timestamp row */}
                        <div
                          className={`flex items-center gap-2 mb-1 ${
                            msg.sender === username
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <p className={`text-xs text-amber-200/70 font-mono`}>
                            {msg.sender === username ? "YOU" : msg.sender.toUpperCase()}
                          </p>
                          {msg.timestamp && (
                            <p className="text-xs text-amber-200/50 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                        {/* Message bubble with content */}
                        <div
                          className={`px-4 py-2 rounded-4xl ${
                            msg.sender === username
                              ? "bg-amber-600/80 border-2 border-amber-400/50 rounded-br-xl"
                              : msg.isOldMessage
                              ? "bg-black/40 border-2 border-amber-300/30 rounded-bl-xl"
                              : "bg-black/60 border-2 border-amber-300/40 rounded-bl-xl"
                          }`}
                        >
                          <p className="break-words text-amber-100 font-mono">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state when no messages */}
              {!loadingMessages && messages.length === 0 && (
                <div className="flex justify-center items-center py-8">
                  <div className="text-amber-200/60 text-sm font-mono">
                    NO MESSAGES YET. START THE CONVERSATION!
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Fixed footer with message input */}
        <footer className="pb-4 pt-2 px-6 fixed inset-x-0 bottom-0">
          {/* Footer content wrapper */}
          <div className="footer-centered">
            {/* Input container wrapper */}
            <div className="w-full max-w-3xl">
              {/* Message input and send button container */}
              <div className="flex items-center gap-3 retro-glass bg-black/60 backdrop-blur-sm border-2 border-amber-300/50 rounded-3xl p-2">
                <input
                  type="text"
                  aria-label="Message input"
                  value={currentMessage}
                  placeholder="TYPE A MESSAGE..."
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-grow retro-input bg-black/40 placeholder-amber-200/50 text-amber-100 focus:outline-none px-4 h-11 rounded-full border-2 border-amber-300/50 leading-tight font-mono"
                />

                {/* Send message button */}
                <button
                  onClick={sendMessage}
                  aria-label="Send"
                  className="w-11 h-11 rounded-full bg-amber-600/80 hover:bg-amber-700/80 border-2 border-amber-400 text-amber-100 flex items-center justify-center transition-shadow shadow-md"
                >
                  <FiSend className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Spacer div for footer */}
        <div className="h-8" />
      </div>
    </div>
  );
};
const setPreferredCodecs = (description) => {
  const sdpLines = description.sdp.split("\r\n");

  // Find the m=audio line
  const audioLineIndex = sdpLines.findIndex((line) =>
    line.startsWith("m=audio")
  );

  if (audioLineIndex !== -1) {
    const audioLine = sdpLines[audioLineIndex];
    const payloadTypes = audioLine.split(" ").slice(3); // Extract payload types

    // Find the payload type for Opus
    const opusPayloadType = sdpLines
      .find((line) => line.includes("opus/48000"))
      ?.match(/:(\d+)/)?.[1];

    if (opusPayloadType) {
      // Reorder payload types to prioritize Opus
      const reorderedPayloadTypes = [
        opusPayloadType,
        ...payloadTypes.filter((pt) => pt !== opusPayloadType),
      ];
      sdpLines[audioLineIndex] = audioLine
        .split(" ")
        .slice(0, 3)
        .concat(reorderedPayloadTypes)
        .join(" ");
    }
  }

  description.sdp = sdpLines.join("\r\n");
};
export default ChatRoom;
