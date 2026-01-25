"use client";

import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { Camera, Upload, Loader2, RotateCcw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* ------------------------- PARSING LOGIC --------------------------- */
/* ------------------------------------------------------------------ */

// --- 1. PHONE EXTRACTION ---
// Matches sequences that look like phones (at least 8 digits, allowing separators)
const PHONE_REGEX = /(?:\+?\d{1,4}[\s\-\.]?)?(?:\(?\d{2,5}\)?[\s\-\.]?)?\d[\d\s\-\.]{5,}\d/g;

function extractPhones(text) {
  const matches = text.match(PHONE_REGEX) || [];
  
  const validPhones = matches
    .map(p => p.trim()) // Clean whitespace
    .filter(p => {
      const digits = p.replace(/\D/g, "");
      // Requirement: Capture any sequence with more than 8 digits
      return digits.length >= 8; 
    });

  return [...new Set(validPhones)]; // Remove duplicates
}

// --- 2. EMAIL EXTRACTION ---
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmails(text) {
  const matches = text.match(EMAIL_REGEX) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))];
}

// --- 3. WEBSITE EXTRACTION ---
// Captures www.site.com, http://site.com, or site.com (if specific TLDs)
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

function extractWebsites(text) {
  const matches = text.match(URL_REGEX) || [];
  // Filter out emails that might be caught by aggressive URL regexes
  const validUrls = matches.filter(url => !url.includes('@')); 
  return [...new Set(validUrls.map(u => u.toLowerCase()))];
}

// --- 4. NAME EXTRACTION ---
const REJECT_WORDS = [
  "PVT", "LTD", "LLP", "PRIVATE", "LIMITED", "TECH", "TECHNO", 
  "SOLUTIONS", "SYSTEMS", "EMAIL", "MOBILE", "PHONE", "TEL", 
  "WWW", "HTTP", "KERALA", "INDIA", "MANAGER", "DIRECTOR", 
  "ENGINEER", "PH", "MOB", "FAX", "WEBSITE", "ADDRESS"
];

function scoreName(line) {
  let score = 0;
  if (/^[A-Za-z\s.]+$/.test(line)) score += 3; 
  if (/[\u0D00-\u0D7F]/.test(line)) score += 4; // Malayalam boost
  if (line.split(" ").length >= 2) score += 2; 
  if (line.length >= 4 && line.length <= 30) score += 2;
  if (line === line.toUpperCase()) score += 1;
  if (/\d/.test(line)) score -= 6; // Penalty for numbers
  if (line.includes("@") || line.includes("www")) score -= 10;
  return score;
}

function extractBestName(text) {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 2);
  let bestName = "";
  let bestScore = -Infinity;

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (REJECT_WORDS.some(w => upper.includes(w))) continue;
    
    const score = scoreName(line);
    if (score > bestScore) {
      bestScore = score;
      bestName = line;
    }
  }
  return bestName || "Unknown Contact";
}

/* ------------------------------------------------------------------ */
/* -------------------------- COMPONENT ------------------------------ */
/* ------------------------------------------------------------------ */

export default function ScanCard({ onScanComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  // Camera State
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  // --- LIFECYCLE ---
  useEffect(() => {
    // Console Cleaner
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args) => { if (typeof args[0] === "string" && (args[0].includes("Parameter") || args[0].includes("classify_cp"))) return; originalWarn(...args); };
    console.error = (...args) => { if (typeof args[0] === "string" && (args[0].includes("Image too small") || args[0].includes("Line cannot"))) return; originalError(...args); };

    // Device Discovery
    const initDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === "videoinput");
        setVideoDevices(cams);
        const backIndex = cams.findIndex(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"));
        if (backIndex !== -1) setCurrentDeviceIndex(backIndex);
      } catch (e) { console.error(e); }
    };
    initDevices();

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!previewImage && videoDevices.length > 0) startCamera();
    return () => stopCamera();
  }, [currentDeviceIndex, videoDevices, previewImage]);

  const startCamera = async () => {
    stopCamera();
    if (videoDevices.length === 0) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: videoDevices[currentDeviceIndex].deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) { console.error("Camera error", e); }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const switchCamera = () => {
    if (videoDevices.length > 1) setCurrentDeviceIndex(i => (i + 1) % videoDevices.length);
  };

  const resetScanner = () => {
    setPreviewImage(null);
    setProcessing(false);
    setStatusText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- OCR & PROCESSING ---
  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let gray = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
      // High contrast thresholding
      const val = gray * 1.2; 
      d[i] = d[i + 1] = d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const runOCR = async (canvas) => {
    setStatusText("Reading text...");
    preprocessImage(canvas);
    const { data } = await Tesseract.recognize(canvas, "eng+mal", {
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      logger: () => {},
    });
    return data.text || "";
  };

  const handleResult = (text) => {
    // Extract all fields
    const phones = extractPhones(text);
    const name = extractBestName(text);
    const emails = extractEmails(text);
    const websites = extractWebsites(text);

    console.log("OCR Data:", { name, phones, emails, websites });

    // Send everything to parent
    onScanComplete({
      name,
      phoneNumber: phones.join(", "), // Join multiple phones with comma
      email: emails[0] || "",         // Take first email
      website: websites[0] || "",     // Take first website
      rawText: text,
    });
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    setProcessing(true);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const text = await runOCR(canvas);
    handleResult(text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setProcessing(true);
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const text = await runOCR(canvas);
      handleResult(text);
    };
    img.src = URL.createObjectURL(file);
    setPreviewImage(img.src);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Camera className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Scan Business Card</h2>
          <p className="text-xs text-slate-500">Capture to extract Name, Phone, Email & Web</p>
        </div>
      </div>

      <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner">
        {!previewImage && (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!processing && videoDevices.length > 1 && (
              <button onClick={switchCamera} className="absolute top-3 right-3 bg-black/60 p-2 rounded-full text-white hover:bg-black/80 transition-all">
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}
            {!processing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[65%] border-2 border-white/60 rounded-lg relative"></div>
                </div>
            )}
          </>
        )}
        {previewImage && <img src={previewImage} alt="Preview" className="w-full h-full object-contain bg-black" />}
        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
            <p className="text-xs text-white mt-3 font-medium animate-pulse">{statusText || "Processing..."}</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileUpload} />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={processing} className="w-full">
          <Upload className="h-4 w-4 mr-2" /> {previewImage ? "Change" : "Upload"}
        </Button>
        {!previewImage ? (
            <Button onClick={captureImage} disabled={processing} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Camera className="h-4 w-4 mr-2" /> Capture
            </Button>
        ) : (
            <Button variant="secondary" onClick={resetScanner} disabled={processing} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" /> Retake
            </Button>
        )}
      </div>
    </div>
  );
}