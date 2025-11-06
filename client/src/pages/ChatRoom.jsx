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
      <div className="flex flex-col items-center justify-center text-white h-screen retro-texture" style={{ backgroundColor: 'var(--retro-black)' }}>
        <h1 className="text-2xl retro-text animate-pulse" style={{ color: 'var(--retro-tan)' }}>Connecting...</h1>
      </div>
    );
  }

  if (showModal) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className="relative min-h-screen w-full font-sans retro-texture overflow-x-hidden" style={{ backgroundColor: 'var(--retro-black)', maxWidth: '100vw' }}>
      <div
        className="flex flex-col items-center justify-start text-white min-h-screen w-full retro-texture overflow-x-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(26,26,26,0.95), rgba(45,27,14,0.98))",
          backgroundPosition: "center",
          maxWidth: '100vw'
        }}
      >
        <audio ref={remoteAudioRef} autoPlay playsInline />

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

        {isReceivingCall && (
          <div className="fixed inset-x-0 top-6 flex justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto retro-card px-4 py-3 flex items-center gap-4 retro-texture">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm retro-text font-semibold" style={{ color: 'var(--retro-tan)' }}>
                    Incoming call
                  </span>
                  <span className="text-xs retro-text" style={{ color: 'var(--retro-beige)' }}>
                    {callerInfo?.username || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={answerCall}
                  className="retro-button px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--retro-red-brown)' }}
                >
                  Answer
                </button>
                <button
                  onClick={declineCall}
                  className="retro-button px-3 py-2 text-sm"
                  style={{ backgroundColor: '#a0522d', borderColor: '#654321' }}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="static  w-full py-6 max-w-3xl">
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                onClick={() => navigate("/")}
                className="retro-title text-lg cursor-pointer select-none"
                title="Go to homepage"
                role="button"
              >
                Phantom
              </h1>
            </div>

            <button
              onClick={() => setIsUserListVisible(!isUserListVisible)}
              className="flex items-center space-x-2 retro-text transition-colors"
              style={{ color: 'var(--retro-tan)' }}
            >
              <FiUsers className="w-6 h-6" />
              <span className="text-sm">{onlineUsers.length}</span>
            </button>
          </div>
        </header>

        {/* User List Modal - Fixed Position */}
        {isUserListVisible && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsUserListVisible(false)}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            ></div>
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
              <div 
                className="w-full max-w-md retro-card retro-texture py-4 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-3 flex items-center justify-between border-b mb-2" style={{ borderColor: 'var(--retro-red-brown)' }}>
                  <p className="retro-text-sm font-semibold" style={{ color: 'var(--retro-tan)' }}>
                    Online Users
                  </p>
                  <button
                    onClick={() => setIsUserListVisible(false)}
                    className="retro-text-xs px-2 py-1 rounded-full hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--retro-red-brown)', color: 'var(--retro-tan)' }}
                  >
                    {onlineUsers.length}
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto no-scrollbar px-2">
                  {onlineUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setIsUserListVisible(false)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity rounded-lg mb-1"
                      style={{ backgroundColor: 'rgba(139, 69, 19, 0.1)' }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center retro-text-sm retro-texture flex-shrink-0" style={{ backgroundColor: 'var(--retro-dark)', border: '2px solid var(--retro-red-brown)', color: 'var(--retro-tan)' }}>
                        {user.username
                          ? user.username.charAt(0).toUpperCase()
                          : "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="retro-text-sm font-medium truncate" style={{ color: 'var(--retro-tan)' }}>
                            {user.username}
                            {user.id === socket.id && " (You)"}
                          </span>
                          {user.id !== socket.id && !isInCall && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startCall(user);
                                setIsUserListVisible(false);
                              }}
                              className="retro-button p-2 flex-shrink-0"
                              aria-label={`Call ${user.username}`}
                            >
                              <FiPhone className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="retro-text-xs truncate mt-1" style={{ color: 'var(--retro-beige)' }}>
                          {user.status || "Available"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="chat-panel w-full max-w-3xl retro-texture">
          <div className="w-full flex justify-center">
            {/* <div className="w-full flex justify-center mb-2">
              <div className="retro-card px-4 py-2 flex items-center gap-3 retro-texture">
                <h2 className="text-sm retro-text font-semibold tracking-wide" style={{ color: 'var(--retro-tan)' }}>
                  {roomId || "Group Chat"}
                </h2>
                <div className="px-2 py-1 text-xs retro-text rounded-full" style={{ backgroundColor: 'var(--retro-red-brown)', color: 'var(--retro-tan)' }}>
                  {onlineUsers.length} online
                </div>
              </div>
            </div> */}
            <main
              ref={messageContainerRef}
              className="flex-grow w-full p-4 pb-24 h-[calc(100vh-240px)] overflow-y-auto no-scrollbar"
            >
              {loadingMessages && (
                <div className="flex justify-center items-center py-4">
                  <div className="retro-text text-sm" style={{ color: 'var(--retro-beige)' }}>
                    Loading chat history...
                  </div>
                </div>
              )}

              {messages.map((msg, index) => {
                const isFirstNewMessage =
                  index > 0 &&
                  messages[index - 1].isOldMessage &&
                  !msg.isOldMessage &&
                  oldMessagesLoaded;

                return (
                  <div key={index}>
                    {isFirstNewMessage && (
                      <div className="flex items-center my-6">
                        <div className="flex-grow border-t" style={{ borderColor: 'var(--retro-red-brown)' }}></div>
                        <div className="px-4 text-xs retro-text" style={{ color: 'var(--retro-beige)', backgroundColor: 'var(--retro-black)' }}>
                          New Messages
                        </div>
                        <div className="flex-grow border-t" style={{ borderColor: 'var(--retro-red-brown)' }}></div>
                      </div>
                    )}
                    <div
                      className={`mb-4 flex ${
                        msg.sender === username
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className={`max-w-xs md:max-w-md`}>
                        <div
                          className={`flex items-center gap-2 mb-1 ${
                            msg.sender === username
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <p className={`text-xs retro-text`} style={{ color: 'var(--retro-beige)' }}>
                            {msg.sender === username ? "You" : msg.sender}
                          </p>
                          {msg.timestamp && (
                            <p className="text-xs retro-text" style={{ color: 'var(--retro-beige)' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-4xl ${
                            msg.sender === username
                              ? "bg-purple-600 rounded-br-xl"
                              : msg.isOldMessage
                              ? "bg-gray-700 rounded-bl-xl"
                              : "bg-gray-800 rounded-bl-xl "
                          }`}
                        >
                          <p className="break-words retro-text" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loadingMessages && messages.length === 0 && (
                <div className="flex justify-center items-center py-8">
                  <div className="retro-text text-sm" style={{ color: 'var(--retro-beige)' }}>
                    No messages yet. Start the conversation!
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        <footer className="p-4 fixed inset-x-0 bottom-0">
          <div className="footer-centered">
            <div className="w-full max-w-3xl">
              <div className="flex items-center gap-3 retro-card p-2 retro-texture">
                <input
                  type="text"
                  aria-label="Message input"
                  value={currentMessage}
                  placeholder="Type a message..."
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="retro-input flex-grow px-4 h-11 rounded-full leading-tight"
                />

                <button
                  onClick={sendMessage}
                  aria-label="Send"
                  className="w-11 h-11 rounded-full retro-button flex items-center justify-center"
                  style={{ backgroundColor: 'var(--retro-red-brown)' }}
                >
                  <FiSend className="w-4.5 h-4.5" style={{ color: 'var(--retro-tan)' }} />
                </button>
              </div>
            </div>
          </div>
        </footer>

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
