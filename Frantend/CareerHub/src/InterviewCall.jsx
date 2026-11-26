import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "./Api.js";

const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
const POLL_MS = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const clock = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const CHIPS = {
  starting: ["Starting", "bg-slate-500/20 text-slate-200 border-slate-400/40"],
  waiting: ["Waiting", "bg-orange-500/20 text-orange-200 border-orange-400/40"],
  connecting: ["Connecting", "bg-blue-500/20 text-blue-200 border-blue-400/40"],
  connected: ["In Progress", "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"],
};

function Tile({ label, name, videoRef, muted, showVideo, mirror, badge }) {
  const initial = (name || label || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D1A]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={mirror ? { transform: "scaleX(-1)" } : undefined}
        className={`h-full w-full object-cover ${showVideo ? "" : "invisible"}`}
      />
      {!showVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-[#0B3FA8] text-4xl font-bold text-white">
            {initial}
          </div>
        </div>
      )}
      {badge}
      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1 text-sm font-semibold text-white">
        {label}
        {name ? ` • ${name}` : ""}
      </span>
    </div>
  );
}

function Screen({ title, children }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#05060F] p-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0D1A] p-8 text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function InterviewCall() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState("starting");
  const [problem, setProblem] = useState(null);
  const [note, setNote] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [peerLeft, setPeerLeft] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localStream = useRef(null);

  const loadInfo = async () => {
    try {
      const res = await authFetch(`/api/interviews/${id}/call`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setLoadError(data.message || "Could not open this interview.");
      else setInfo(data);
    } catch (e) {
      setLoadError(e.message);
    }
  };

  useEffect(() => {
    loadInfo();

  }, [id]);

  useEffect(() => {
    if (!info || info.canJoin) return;
    const t = setInterval(loadInfo, 20000);
    return () => clearInterval(t);

  }, [info]);

  useEffect(() => {
    if (!info || !info.canJoin) return;

    let cancelled = false;
    const sid = randomId();
    const role = info.role;
    const wantVideo = info.mode !== "AUDIO";

    let pc = null;
    let peerSid = null;
    let failures = 0;
    let lastId = 0;
    const iceBuffer = {};

    let chain = Promise.resolve();
    const post = (type, to, data) => {
      chain = chain
        .then(() =>
          authFetch(`/api/interviews/${id}/call/signal`, {
            method: "POST",
            body: JSON.stringify({
              type,
              sid,
              to: to || null,
              data: data == null ? null : JSON.stringify(data),
            }),
          })
        )
        .catch(() => {});
      return chain;
    };

    const closePeer = () => {
      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      }
      pc = null;
      peerSid = null;
      if (remoteRef.current) remoteRef.current.srcObject = null;
      setRemoteHasVideo(false);
    };

    const stopMedia = () => {
      localStream.current?.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    };

    const flushIce = async (peer, fromSid) => {
      const list = iceBuffer[fromSid] || [];
      iceBuffer[fromSid] = [];
      for (const c of list) {
        try {
          await peer.addIceCandidate(c);
        } catch {

        }
      }
    };

    const callPeer = async (toSid) => {
      const peer = newPeer(toSid);
      setPhase("connecting");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await post("offer", toSid, peer.localDescription);
    };

    function newPeer(toSid) {
      closePeer();
      const peer = new RTCPeerConnection(ICE);
      pc = peer;
      peerSid = toSid;
      localStream.current.getTracks().forEach((t) => peer.addTrack(t, localStream.current));

      if (localStream.current.getAudioTracks().length === 0) {
        peer.addTransceiver("audio", { direction: "recvonly" });
      }
      if (wantVideo && localStream.current.getVideoTracks().length === 0) {
        peer.addTransceiver("video", { direction: "recvonly" });
      }

      peer.ontrack = (e) => {
        const stream = e.streams[0];
        if (remoteRef.current && stream && remoteRef.current.srcObject !== stream) {
          remoteRef.current.srcObject = stream;
        }
        if (e.track.kind === "video") setRemoteHasVideo(true);
      };
      peer.onicecandidate = (e) => {
        if (e.candidate) post("candidate", toSid, e.candidate);
      };
      peer.onconnectionstatechange = () => {
        if (pc !== peer) return;
        const s = peer.connectionState;
        if (s === "connected") {
          failures = 0;
          setNote("");
          setPeerLeft(false);
          setPhase("connected");
        } else if (s === "connecting") {
          setPhase((p) => (p === "connected" ? p : "connecting"));
        } else if (s === "disconnected") {
          setPhase("connecting");
        } else if (s === "failed") {
          failures += 1;
          if (failures >= 3) {
            setNote(
              "Could not connect the call. A firewall or a strict network may be blocking the video. Try another network or ask for a TURN server."
            );
            return;
          }
          setNote("Connection problem. Trying again...");
          if (role === "recruiter") callPeer(toSid).catch(() => {});
        }
      };
      return peer;
    }

    const onOffer = async (m) => {
      const peer = newPeer(m.sid);
      setPhase("connecting");
      await peer.setRemoteDescription(JSON.parse(m.data));
      await flushIce(peer, m.sid);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await post("answer", m.sid, peer.localDescription);
    };

    const onAnswer = async (m) => {
      if (!pc || m.sid !== peerSid || pc.signalingState !== "have-local-offer") return;
      await pc.setRemoteDescription(JSON.parse(m.data));
      await flushIce(pc, m.sid);
    };

    const onCandidate = async (m) => {
      const cand = JSON.parse(m.data);
      if (pc && m.sid === peerSid && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(cand);
        } catch {

        }
      } else {
        (iceBuffer[m.sid] = iceBuffer[m.sid] || []).push(cand);
      }
    };

    const handle = async (m) => {
      if (m.type === "join") {
        if (role === "recruiter") {

          if (m.sid !== peerSid) await callPeer(m.sid);
        } else {
          setPeerLeft(false);
        }
        return;
      }
      if (m.type === "leave") {
        if (m.sid === peerSid) {
          closePeer();
          setPeerLeft(true);
          setPhase("waiting");
        }
        return;
      }
      if (m.to && m.to !== sid) return;
      if (m.type === "offer" && role === "candidate") await onOffer(m);
      else if (m.type === "answer" && role === "recruiter") await onAnswer(m);
      else if (m.type === "candidate") await onCandidate(m);
    };

    const sendLeave = () => {
      authFetch(`/api/interviews/${id}/call/signal`, {
        method: "POST",
        keepalive: true,
        body: JSON.stringify({ type: "leave", sid, to: null, data: null }),
      }).catch(() => {});
    };

    const run = async () => {

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("This browser cannot use the camera here. Open the site on localhost or on https.");
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          });
        } catch (err) {
          if (!wantVideo) throw err;

          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setNote("Your camera is not available, so you joined with audio only.");
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        const cam = stream.getVideoTracks().length > 0;
        setHasCamera(cam);
        setCamOn(cam);
        setMicOn(true);
      } catch (err) {
        if (!cancelled) {
          setProblem({
            text:
              err && err.message && err.message.startsWith("This browser")
                ? err.message
                : "We could not use your camera or microphone. Click the camera icon in the address bar, choose Allow, and try again.",
            retry: true,
          });
        }
        return;
      }

      try {
        const res = await authFetch(`/api/interviews/${id}/call/signal`, {
          method: "POST",
          body: JSON.stringify({ type: "join", sid, to: null, data: null }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (!cancelled) setProblem({ text: d.message || "Could not join the call.", retry: false });
          stopMedia();
          return;
        }
      } catch (e) {
        if (!cancelled) setProblem({ text: e.message, retry: false });
        stopMedia();
        return;
      }
      if (cancelled) return;
      setPhase("waiting");

      while (!cancelled) {
        try {
          const res = await authFetch(`/api/interviews/${id}/call/signal?after=${lastId}`);
          if (res.ok) {
            const msgs = await res.json();
            for (const m of msgs) {
              lastId = Math.max(lastId, m.id);
              try {
                await handle(m);
              } catch (err) {
                console.warn("call message failed", m.type, err);
              }
            }
          } else if (res.status === 404) {
            if (!cancelled) setProblem({ text: "This interview was not found.", retry: false });
            break;
          }
        } catch (e) {
          if (e && e.message && e.message.startsWith("Session")) {
            if (!cancelled) setProblem({ text: e.message, retry: false });
            break;
          }

        }
        await sleep(POLL_MS);
      }
    };

    window.addEventListener("pagehide", sendLeave);
    run();

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", sendLeave);
      sendLeave();
      closePeer();
      stopMedia();
    };
  }, [info?.canJoin, info?.role, info?.mode, id, attempt]);

  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const toggleMic = () => {
    const s = localStream.current;
    if (!s) return;
    const next = !micOn;
    s.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    const s = localStream.current;
    if (!s || !hasCamera) return;
    const next = !camOn;
    s.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const backTo = info?.role === "recruiter" ? "/admin" : "/dashboard?tab=interviews";

  const leave = () => {
    if (phase === "connected" && !window.confirm("Leave the interview call?")) return;
    navigate(backTo);
  };

  const retry = () => {
    setProblem(null);
    setNote("");
    setPhase("starting");
    setAttempt((a) => a + 1);
  };

  if (loadError) {
    return (
      <Screen title="Cannot open the call">
        <p className="mt-3 text-gray-400">{loadError}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-full border border-white/20 px-6 py-2 font-semibold">Login</Link>
          <Link to="/dashboard" className="rounded-full bg-[#FF8A00] px-6 py-2 font-semibold">Back</Link>
        </div>
      </Screen>
    );
  }

  if (!info) return <Screen title="Loading interview..." />;

  if (!info.canJoin) {
    return (
      <Screen title="The call is not open">
        <p className="mt-3 text-gray-300">
          {info.jobTitle} at {info.companyName}
        </p>
        <p className="mt-3 text-gray-400">{info.reason}</p>
        <p className="mt-3 text-xs text-gray-500">This page checks again every 20 seconds.</p>
        <Link to={backTo} className="mt-6 inline-block rounded-full bg-[#FF8A00] px-8 py-2 font-semibold">
          Back
        </Link>
      </Screen>
    );
  }

  if (problem) {
    return (
      <Screen title="Problem">
        <p className="mt-3 text-gray-300">{problem.text}</p>
        <div className="mt-6 flex justify-center gap-3">
          {problem.retry && (
            <button onClick={retry} className="rounded-full bg-[#FF8A00] px-8 py-2 font-semibold">
              Try again
            </button>
          )}
          <Link to={backTo} className="rounded-full border border-white/20 px-8 py-2 font-semibold">
            Back
          </Link>
        </div>
      </Screen>
    );
  }

  const isRecruiter = info.role === "recruiter";
  const chip = CHIPS[phase] || CHIPS.starting;
  const localShows = camOn && hasCamera;
  const remoteShows = remoteHasVideo && phase === "connected";
  const audioOnly = info.mode === "AUDIO";

  const badge = (
    <span className={`absolute right-3 top-3 rounded-md border px-3 py-1 text-xs font-bold ${chip[1]}`}>
      {chip[0]}
    </span>
  );

  const waitText = isRecruiter
    ? `Waiting for ${info.candidateName} to join...`
    : "Waiting for the interviewer to start the call...";

  const round = "grid h-14 w-14 place-items-center rounded-full text-xl transition active:scale-95";

  return (
    <div className="flex min-h-screen flex-col bg-[#05060F] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">{info.jobTitle}</h1>
          <p className="text-sm text-gray-400">
            {info.companyName} • {audioOnly ? "Audio" : "Video"} interview
            {isRecruiter ? ` • ${info.candidateName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {phase === "connected" && <span className="font-mono text-sm text-gray-300">{clock(seconds)}</span>}
          <span className={`rounded-full border px-4 py-1 text-xs font-bold ${chip[1]}`}>{chip[0]}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
        {note && (
          <p className="mb-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
            {note}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Tile
            label="Interviewer"
            name={isRecruiter ? "You" : info.otherName}
            videoRef={isRecruiter ? localRef : remoteRef}
            muted={isRecruiter}
            mirror={isRecruiter}
            showVideo={isRecruiter ? localShows : remoteShows}
            badge={badge}
          />
          <Tile
            label="Candidate"
            name={isRecruiter ? info.candidateName : "You"}
            videoRef={isRecruiter ? remoteRef : localRef}
            muted={!isRecruiter}
            mirror={!isRecruiter}
            showVideo={isRecruiter ? remoteShows : localShows}
          />
        </div>

        <div className="mt-6 text-center text-gray-300">
          {phase === "waiting" && (
            <p>
              {peerLeft ? "The other person left the call. They can join again. " : ""}
              {waitText}
            </p>
          )}
          {phase === "connecting" && <p>Connecting the call...</p>}
          {phase === "starting" && <p>Starting your camera and microphone...</p>}
        </div>
      </main>

      <footer className="sticky bottom-0 flex items-center justify-center gap-4 border-t border-white/10 bg-[#05060F]/95 px-6 py-4">
        <button
          onClick={toggleMic}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
          className={`${round} ${micOn ? "bg-white/10 hover:bg-white/20" : "bg-red-600"}`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>
        <button
          onClick={toggleCam}
          disabled={!hasCamera}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
          className={`${round} ${camOn && hasCamera ? "bg-white/10 hover:bg-white/20" : "bg-red-600"} disabled:opacity-40`}
        >
          {camOn && hasCamera ? "📷" : "🚫"}
        </button>
        {!hasCamera && info.mode !== "AUDIO" && (
          <button
            onClick={retry}
            className="h-14 rounded-full border border-white/20 px-5 text-sm font-semibold transition hover:bg-white/10 active:scale-95"
          >
            Retry camera
          </button>
        )}
        <button
          onClick={leave}
          className="h-14 rounded-full bg-red-600 px-8 font-semibold transition hover:bg-red-500 active:scale-95"
        >
          Leave call
        </button>
      </footer>
    </div>
  );
}
