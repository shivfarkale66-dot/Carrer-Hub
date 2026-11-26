import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

import  {authJson} from "./Authfetch.js";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [iv, setIv] = useState(null);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    authJson("/api/interviews/my")
      .then((list) => {
        const found = (list || []).find((x) => String(x.id) === String(id));
        if (!found) setError("Interview not found.");
        else if (found.status !== "SCHEDULED") setError("This interview is not active.");
        else setIv(found);
      })
      .catch((e) => setError(e.message || "Could not open the interview."));
  }, [id]);

  useEffect(() => {
    if (!iv) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: iv.mode === "VIDEO" })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setMediaError("Please allow microphone and camera access in your browser."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [iv]);

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn(!camOn);
  };

  const leave = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/my-interviews", { replace: true });
  };

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#F8F8F8] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="bg-white border border-[#EEE] rounded-xl p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={leave} className="bg-[#FF8A00] text-white font-semibold px-6 h-11 rounded-lg">
                Back to interviews
              </button>
            </div>
          )}

          {iv && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{iv.jobTitle}</h1>
                <p className="text-gray-500">
                  {iv.companyName || "Company"} - {iv.mode === "VIDEO" ? "Video" : "Audio"} interview
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 bg-[#1F2937] rounded-xl min-h-[340px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-[#374151] text-white text-3xl font-bold flex items-center justify-center">
                    {(iv.companyName || "C").charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white font-semibold mt-4">Waiting for the interviewer to join</p>
                  <p className="text-gray-400 text-sm mt-1">Stay on this page. The interview starts when they connect.</p>
                </div>

                <div className="bg-white border border-[#EEE] rounded-xl p-4">
                  <p className="text-sm font-semibold mb-3">You</p>
                  {iv.mode === "VIDEO" ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full aspect-video rounded-lg bg-black object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video rounded-lg bg-[#F3F4F6] flex items-center justify-center text-gray-500 text-sm">
                      Audio interview
                    </div>
                  )}
                  {mediaError && <p className="text-sm text-red-600 mt-3">{mediaError}</p>}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={toggleMic}
                      className={`flex-1 h-11 rounded-lg font-semibold border ${
                        micOn ? "border-[#E5E7EB] bg-white" : "bg-red-50 border-red-200 text-red-600"
                      }`}
                    >
                      {micOn ? "Mute" : "Unmute"}
                    </button>
                    {iv.mode === "VIDEO" && (
                      <button
                        onClick={toggleCam}
                        className={`flex-1 h-11 rounded-lg font-semibold border ${
                          camOn ? "border-[#E5E7EB] bg-white" : "bg-red-50 border-red-200 text-red-600"
                        }`}
                      >
                        {camOn ? "Camera off" : "Camera on"}
                      </button>
                    )}
                  </div>
                  <button onClick={leave} className="w-full h-11 mt-3 rounded-lg bg-red-600 text-white font-semibold">
                    Leave interview
                  </button>
                </div>
              </div>

              {iv.notes && (
                <p className="mt-6 text-sm text-gray-600 bg-white border border-[#EEE] rounded-lg p-4">{iv.notes}</p>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
