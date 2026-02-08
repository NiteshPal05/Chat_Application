import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import { storage } from "../firebase/firebaseconfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { io } from "socket.io-client"
import { useEffect, useRef, useState } from "react";



export default function ChatDashboard() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const socketRef = useRef(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentUsername, setCurrentUsername] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [file, setFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [sending, setSending] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); // "video" | "audio"
  const [lastMessages, setLastMessages] = useState({});
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadByEmail, setUnreadByEmail] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const localStreamRef = useRef(null);
  const messagesRef = useRef(null);
  const audioRef = useRef(null);
  const callRoleRef = useRef(null); // "caller" | "callee"
  const ringtoneRef = useRef(null);
  const activeCallChatIdRef = useRef(null);
  const usersRef = useRef([]);
  const currentEmailRef = useRef(null);
  const currentUsernameRef = useRef("");
  const selectedUserEmailRef = useRef(null);
  const chatIdRef = useRef(null);

  useEffect(() => {
    if (!BASE_URL) return;
    if (!socketRef.current) {
      socketRef.current = io(BASE_URL, {
        transports: ["websocket", "polling"],
      });
    }
    return () => {};
  }, [BASE_URL]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [BASE_URL]);

  useEffect(() => {
    const updateFocus = () => {
      const focused = document.hasFocus() && document.visibilityState === "visible";
      setIsWindowFocused(focused);
    };

    updateFocus();
    window.addEventListener("focus", updateFocus);
    window.addEventListener("blur", updateFocus);
    document.addEventListener("visibilitychange", updateFocus);

    return () => {
      window.removeEventListener("focus", updateFocus);
      window.removeEventListener("blur", updateFocus);
      document.removeEventListener("visibilitychange", updateFocus);
    };
  }, []);



  const getChatId = (email1, email2) => {
    return [email1, email2].sort().join("_");
  };

  const chatId = selectedUser
    ? getChatId(auth.currentUser.email, selectedUser.email)
    : "global";
  const currentEmail = auth.currentUser?.email;
  chatIdRef.current = chatId;
  currentEmailRef.current = currentEmail;
  selectedUserEmailRef.current = selectedUser?.email || null;

  // receive messages 
  useEffect(() => {
    // Load old messages
    const fetchMessages = async () => {
      const res = await fetch(`${BASE_URL}/api/messages/${chatId}`);
      const data = await res.json();
      setMessages(data.map((m) => ({
        sender: m.sender,
        text: m.text,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        fileName: m.fileName,
        createdAt: m.createdAt,

      })));
    };

    fetchMessages();

    const socket = socketRef.current;
    if (!socket) return;

    socket.on("receiveMessage", (msg) => {
      if (msg.chatId === chatIdRef.current) {
        setMessages((prev) => [...prev, msg]);
        if (selectedUserEmailRef.current) {
          setLastMessages((prev) => ({
            ...prev,
            [selectedUserEmailRef.current]: msg,
          }));
        }
      } else {
        // New message for another chat
        if (msg.sender !== currentUsernameRef.current) {
          playNotificationSound();
        }
        if (msg.chatId) {
          setLastMessages((prev) => {
            const updated = { ...prev };
            let otherEmail = null;
            if (currentEmailRef.current && msg.chatId.includes("_")) {
              const parts = msg.chatId.split("_");
              otherEmail = parts.find((p) => p !== currentEmailRef.current) || null;
            }
            if (!otherEmail) {
              const otherUser = usersRef.current.find(
                (u) => msg.chatId.includes(u.email) && u.email !== currentEmailRef.current
              );
              otherEmail = otherUser?.email || null;
            }
            if (otherEmail) {
              updated[otherEmail] = msg;
              setUnreadByEmail((prevUnread) => ({
                ...prevUnread,
                [otherEmail]: true,
              }));
              setUnreadCounts((prevCounts) => ({
                ...prevCounts,
                [otherEmail]: (prevCounts[otherEmail] || 0) + 1,
              }));
            }
            return updated;
          });
        }
      }
    });

    return () => socket.off("receiveMessage");
  }, [chatId, BASE_URL])

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`${BASE_URL}/api/users`)
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);


  useEffect(() => {
    const fetchMe = async () => {
      const res = await fetch(`${BASE_URL}/api/users`);
      const data = await res.json();

      const me = data.find(
        (u) => u.email === auth.currentUser.email
      );

      if (me) setCurrentUsername(me.username);
    };

    fetchMe();
  }, []);
  useEffect(() => {
    currentUsernameRef.current = currentUsername;
  }, [currentUsername]);

  useEffect(() => {
    const updateLastLogin = async () => {
      if (!auth.currentUser?.email) return;
      await fetch(`${BASE_URL}/api/users/last-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.currentUser.email }),
      });
    };
    updateLastLogin();
  }, []);

  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!currentEmail || users.length === 0) return;
      const entries = await Promise.all(
        users.map(async (u) => {
          if (u.email === currentEmail) return [u.email, null];
          const id = getChatId(currentEmail, u.email);
          const res = await fetch(`${BASE_URL}/api/messages/${id}`);
          const data = await res.json();
          const last = data[data.length - 1];
          return [u.email, last || null];
        })
      );
      const map = {};
      entries.forEach(([email, msg]) => {
        map[email] = msg;
      });
      setLastMessages(map);
    };

    fetchLastMessages();
  }, [users, currentEmail]);


  useEffect(() => {
    if (currentUsername) {
      socketRef.current?.emit("userOnline", currentUsername);
    }
  }, [currentUsername]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, [BASE_URL]);

  useEffect(() => {
    if (chatId !== "global") {
      socketRef.current?.emit("joinRoom", chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (!currentEmail || users.length === 0) return;
    const socket = socketRef.current;
    if (!socket) return;
    users.forEach((u) => {
      if (u.email === currentEmail) return;
      const id = getChatId(currentEmail, u.email);
      socket.emit("joinRoom", id);
    });
  }, [users, currentEmail]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleOffer = (payload) => {
      if (!payload?.chatId) return;
      // If already in a call, ignore
      if (activeCallChatIdRef.current) return;
      setIncomingCall(payload);
    };

    const handleAnswer = async (payload) => {
      if (payload.chatId !== activeCallChatIdRef.current) return;
      if (!pcRef.current) return;
      if (callRoleRef.current !== "caller") return;
      if (pcRef.current.signalingState !== "have-local-offer") return;
      await pcRef.current.setRemoteDescription(payload.answer);
      await flushPendingCandidates();
      setCallActive(true);
      setIsCalling(false);
    };

    const handleCandidate = async (payload) => {
      if (payload.chatId !== activeCallChatIdRef.current) return;
      const candidate = new RTCIceCandidate(payload.candidate);
      if (pcRef.current) {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(candidate);
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleReject = (payload) => {
      if (payload.chatId !== activeCallChatIdRef.current) return;
      cleanupCall();
    };

    const handleEnd = (payload) => {
      if (payload.chatId !== activeCallChatIdRef.current) return;
      cleanupCall();
    };

    socket.on("callOffer", handleOffer);
    socket.on("callAnswer", handleAnswer);
    socket.on("iceCandidate", handleCandidate);
    socket.on("callReject", handleReject);
    socket.on("callEnd", handleEnd);

    return () => {
      socket.off("callOffer", handleOffer);
      socket.off("callAnswer", handleAnswer);
      socket.off("iceCandidate", handleCandidate);
      socket.off("callReject", handleReject);
      socket.off("callEnd", handleEnd);
    };
  }, [chatId, BASE_URL]);

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      socketRef.current?.emit("iceCandidate", {
        chatId,
        candidate: event.candidate,
      });
    };

    pcRef.current = pc;

    return pc;
  };

  const flushPendingCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const candidate of pending) {
      await pcRef.current.addIceCandidate(candidate);
    }
  };

  const getLocalStream = async (type) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const startCall = async (type) => {
    if (!selectedUser || callActive || isCalling) return;
    setIsCalling(true);
    setCallType(type);
    callRoleRef.current = "caller";
    activeCallChatIdRef.current = chatId;

    const stream = await getLocalStream(type);
    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("callOffer", {
      chatId,
      from: currentUsername,
      callType: type,
      offer,
    });
  };

  const acceptCall = async () => {
    if (!incomingCall || callActive) return;
    const type = incomingCall.callType || "video";
    setIncomingCall(null);
    setIsCalling(false);
    setCallActive(true);
    setCallType(type);
    callRoleRef.current = "callee";
    activeCallChatIdRef.current = incomingCall.chatId;
    if (incomingCall.chatId && currentEmailRef.current) {
      const parts = incomingCall.chatId.split("_");
      const otherEmail = parts.find((p) => p !== currentEmailRef.current);
      const otherUser = usersRef.current.find((u) => u.email === otherEmail);
      if (otherUser) setSelectedUser(otherUser);
    }
    socketRef.current?.emit("joinRoom", incomingCall.chatId);

    const stream = await getLocalStream(type);
    const pc = createPeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(incomingCall.offer);
    await flushPendingCandidates();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit("callAnswer", {
      chatId: incomingCall.chatId,
      answer,
    });
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    socketRef.current?.emit("callReject", { chatId: incomingCall.chatId });
    setIncomingCall(null);
  };

  const endCall = () => {
    socketRef.current?.emit("callEnd", { chatId: activeCallChatIdRef.current });
    cleanupCall();
  };

  const cleanupCall = () => {
    setIncomingCall(null);
    setCallActive(false);
    setIsCalling(false);
    setCallType(null);

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    callRoleRef.current = null;
    activeCallChatIdRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    stopRingtone();
  };



  // send message 
  const sendMessage = async () => {
    if (!selectedUser) return;
    if (!message.trim() && !file) return;

    setSending(true);

    let fileUrl = null;
    let fileType = null;

    if (file) {
      const storageRef = ref(
        storage,
        `chatFiles/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);

      fileUrl = await getDownloadURL(storageRef);
      fileType = file.type;

      setFile(null);
      setSelectedFileName("");
    }

    const msgData = {
      chatId,
      sender: currentUsername,
      text: message,
      fileUrl,
      fileType,
      fileName: file ? file.name : null,
    };

    socketRef.current?.emit("sendMessage", msgData);
    if (selectedUser?.email) {
      setLastMessages((prev) => ({
        ...prev,
        [selectedUser.email]: {
          ...msgData,
          createdAt: new Date().toISOString(),
        },
      }));
    }

    setMessage("");
    setSending(false);
    scrollToBottom();
  };


  // logout 
  const logoutHandler = async () => {
    await signOut(auth);
    alert("Logged out");
  };

  const formatTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sound.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      // ignore audio errors
    }
  };

  const playRingtone = () => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/ringtone.mp3");
        ringtoneRef.current.preload = "auto";
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 1;
      }
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch(() => {});
    } catch {
      // ignore audio errors
    }
  };

  const stopRingtone = () => {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  };

  useEffect(() => {
    const unlockAudio = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sound.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1;
      }
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/ringtone.mp3");
        ringtoneRef.current.preload = "auto";
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 1;
      }
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(() => {});
      ringtoneRef.current.play().then(() => {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }).catch(() => {});
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    if (incomingCall) {
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [incomingCall]);

  const scrollToBottom = () => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    setShowScrollDown(false);
  };

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setShowScrollDown(!atBottom);
  };

  const getLastMessagePreview = (msg) => {
    if (!msg) return "No messages yet";
    if (msg.text && msg.text.trim()) return msg.text;
    if (msg.fileType?.startsWith("image")) return "Photo";
    if (msg.fileUrl) return msg.fileName || "Document";
    return "Media";
  };

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + (count || 0),
    0
  );


  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-full md:w-1/4 
  bg-gray-100 border-r p-4 z-50 transition-transform duration-300 flex flex-col
  ${selectedUser ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
      >
        <h2
          onClick={() => setSelectedUser(null)}
          className="text-xl font-bold text-green-600 cursor-pointer hover:text-green-800"
        >
          Chat Application
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              socketConnected ? "bg-emerald-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-gray-600">
            {socketConnected ? "Connected" : "Disconnected"}
          </span>
        </div>


        <p className="mt-2 text-sm text-gray-600">
          Logged in as:
        </p>
        <p className="font-semibold text-gray-800">{auth.currentUser.email}</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={logoutHandler}
            className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 chat-sidebar-list">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedUser(u);
                setUnreadByEmail((prev) => ({ ...prev, [u.email]: false }));
                setUnreadCounts((prev) => ({ ...prev, [u.email]: 0 }));
              }}
              className={`p-3 rounded-2xl shadow cursor-pointer border transition 
      ${selectedUser?.email === u.email
                  ? "bg-emerald-100 font-bold border-emerald-300"
                  : "bg-white/80 hover:bg-emerald-50 border-gray-100"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
                      {(u.username || u.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    {onlineUsers.includes(u.username) && u.email !== auth.currentUser.email && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                    )}
                    {unreadByEmail[u.email] && u.email !== auth.currentUser.email && !isWindowFocused && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-600 border-2 border-white"></span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-800">
                    {u.email === auth.currentUser.email ? "You" : u.username}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCounts[u.email] > 0 && u.email !== auth.currentUser.email && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {unreadCounts[u.email]}
                    </span>
                  )}
                  <div className="text-xs text-gray-500">
                    {u.email !== auth.currentUser.email
                      ? formatTimestamp(lastMessages[u.email]?.createdAt)
                      : formatDateTime(u.lastLoginAt)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1 truncate">
                {u.email !== auth.currentUser.email
                  ? getLastMessagePreview(lastMessages[u.email])
                  : `Last login: ${formatDateTime(u.lastLoginAt) || "—"}`}
              </p>
              {u.email !== auth.currentUser.email && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Last login: {formatDateTime(u.lastLoginAt) || "—"}
                </p>
              )}
            </div>
          ))}

        </div>


      </div>

      {/* Chat window */}
      <div className="w-full md:w-3/4 flex flex-col h-full min-h-0 chat-main">

        {/* If no user selected */}
        {!selectedUser ? (
          <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 ">
            <h2 className="text-2xl font-bold text-gray-600">
              👋 Welcome to Chat Application
            </h2>

            <p className="mt-2 text-gray-500">
              Select a user from the left sidebar to start chatting
            </p>
            {totalUnread > 0 && (
              <div className="mt-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                You have {totalUnread} unread message{totalUnread > 1 ? "s" : ""}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/60 bg-white/80 backdrop-blur font-semibold sticky top-0 z-10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="chat-back-btn"
                    title="Back"
                  >
                    ←
                  </button>
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base font-bold shadow">
                    {selectedUser.username?.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Chat with {selectedUser.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(selectedUser.lastLoginAt)
                        ? `Last seen ${formatDateTime(selectedUser.lastLoginAt)}`
                        : "Last seen recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">
                    {onlineUsers.includes(selectedUser.username)
                      ? "🟢 Online"
                      : "⚪ Offline"}
                  </p>
                  <button
                    onClick={() => startCall("audio")}
                    disabled={callActive || isCalling}
                    className={`chat-call-btn ${callActive || isCalling
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    title="Voice call"
                  >
                    📞
                  </button>
                  <button
                    onClick={() => startCall("video")}
                    disabled={callActive || isCalling}
                    className={`chat-call-btn ${callActive || isCalling
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    title="Video call"
                  >
                    🎥
                  </button>
                </div>
              </div>
              {callActive || isCalling ? (
                <div className="mt-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    {callActive ? "In call" : "Calling..."}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              onScroll={handleMessagesScroll}
              className="flex-1 min-h-0 p-4 overflow-y-scroll bg-white/50 space-y-3 chat-messages"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl w-fit ${msg.sender === currentUsername
                    ? "ml-auto bg-green-300 text-black"
                    : "bg-white shadow text-gray-800"
                    }`}
                >
                  <p className="text-sm font-bold">
                    {msg.sender === currentUsername ? "You" : msg.sender}
                  </p>
                  <p>{msg.text}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {formatTimestamp(msg.createdAt)}
                  </p>

                  {/*  File Preview */}
                  {/* ✅ WhatsApp Image Preview */}
                  {msg.fileUrl && msg.fileType?.startsWith("image") && (
                    <div className="mt-2">
                      <img
                        src={msg.fileUrl}
                        alt="chat-img"
                        onClick={() => setPreviewImage(msg.fileUrl)}
                        className="w-48 h-48 object-cover rounded-2xl cursor-pointer hover:opacity-90 transition"
                      />
                    </div>
                  )}

                  {/* ✅ WhatsApp Document Preview */}
                  {msg.fileUrl && !msg.fileType?.startsWith("image") && (
                    <div
                      onClick={() => window.open(msg.fileUrl, "_blank")}
                      className="mt-2 flex items-center gap-3 bg-gray-200 hover:bg-gray-300 transition p-3 rounded-2xl cursor-pointer max-w-xs"
                    >
                      {/* File Icon */}
                      <div className="text-3xl">
                        {msg.fileType?.includes("pdf") ? "📕" : "📄"}
                      </div>

                      {/* File Info */}
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-semibold truncate">
                          {msg.fileName || "Document"}
                        </p>

                        <p className="text-xs text-gray-600">
                          Click to open
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ✅ Fullscreen Image Modal */}
                  {previewImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">

                      {/* Close Button */}
                      <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-5 right-5 text-white text-3xl font-bold"
                      >
                        ✕
                      </button>

                      {/* Full Image */}
                      <img
                        src={previewImage}
                        alt="fullscreen"
                        className="max-h-[90%] max-w-[90%] rounded-2xl shadow-xl"
                      />
                    </div>
                  )}



                </div>
              ))}
            </div>
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className="chat-scroll-down"
                title="New messages"
              >
                ↓
              </button>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/60 bg-white/70 backdrop-blur flex gap-2 sticky bottom-0 z-10">
              {/* Attachment Button */}
              <label
                htmlFor="fileUpload"
                className="cursor-pointer bg-gray-200 px-4 py-2 rounded-xl"
              >
                📎
              </label>

              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setSelectedFileName(e.target.files[0]?.name);
                }}
              />

              {selectedFileName && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  📎 {selectedFileName}
                  <button
                    onClick={() => {
                      setFile(null);
                      setSelectedFileName("");
                    }}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}



              <input
                type="text"
                value={message}
                placeholder="Type a message..."
                className="flex-1 border rounded-xl px-4 py-2 bg-white"
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={sending}
                className={`px-6 rounded-xl text-white ${sending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {sending ? "Sending..." : "Send"}
              </button>

            </div>
          </>
        )}

      </div>
      {(incomingCall || callActive || isCalling) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-4 w-[90%] max-w-3xl border border-white/60">
            {incomingCall && (
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-gray-800">
                  Incoming {incomingCall.callType === "audio" ? "voice" : "video"} call from {incomingCall.from || "User"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={acceptCall}
                    className="px-4 py-2 rounded-xl text-white bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={rejectCall}
                    className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
            {isCalling && !callActive && (
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-gray-800">
                  Calling {selectedUser.username} ({callType === "audio" ? "voice" : "video"})
                </p>
                <button
                  onClick={endCall}
                  className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-xl p-2">
                <p className="text-sm font-semibold mb-2 text-gray-800">You</p>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-xl bg-black"
                  style={{ display: callType === "audio" ? "none" : "block" }}
                />
                {callType === "audio" && (
                  <div className="h-40 flex items-center justify-center text-gray-600">
                    Voice call
                  </div>
                )}
              </div>
              <div className="bg-gray-100 rounded-xl p-2">
                <p className="text-sm font-semibold mb-2 text-gray-800">
                  {selectedUser?.username || "User"}
                </p>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-black"
                  style={{ display: callType === "audio" ? "none" : "block" }}
                />
                {callType === "audio" && (
                  <div className="h-40 flex items-center justify-center text-gray-600">
                    Voice call
                  </div>
                )}
              </div>
            </div>
            {callActive && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={endCall}
                  className="px-6 py-2 rounded-full text-white bg-red-600 hover:bg-red-500 shadow-md"
                >
                  Hang Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ✅ Fullscreen Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="fullscreen"
            className="max-h-[90%] max-w-[90%] rounded-xl shadow-lg"
          />
        </div>
      )}

    </div>
  );
}
