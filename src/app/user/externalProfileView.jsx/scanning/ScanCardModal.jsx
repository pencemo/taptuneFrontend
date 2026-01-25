// "use client";

// import { useEffect, useRef, useState } from "react";
// import Tesseract from "tesseract.js";
// import { toast } from "sonner";
// import { Camera, Upload, X, Loader2, RotateCcw, Languages } from "lucide-react";
// import { downloadVCard } from "@/utils/contactSave";

// // --- SHADCN STYLE BUTTON ---
// const Button = ({
//   children,
//   variant = "primary",
//   className,
//   disabled,
//   onClick,
// }) => {
//   const base =
//     "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
//   const variants = {
//     primary: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
//     outline:
//       "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
//     ghost: "hover:bg-slate-100 hover:text-slate-900",
//     secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
//     destructive: "text-red-500 hover:bg-red-50",
//   };
//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={`${base} ${variants[variant]} ${className || ""}`}
//     >
//       {children}
//     </button>
//   );
// };

// // ------------------- MAIN COMPONENT -------------------

// function ScanCardModal({ open, onClose }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const streamRef = useRef(null);

//   const [processing, setProcessing] = useState(false);
//   const [statusText, setStatusText] = useState("");
//   const [previewImage, setPreviewImage] = useState(null);

//   /* -------------------- 1. CONSOLE CLEANER & LIFECYCLE -------------------- */

//   useEffect(() => {
//     const originalWarn = console.warn;
//     const originalError = console.error;

//     // Filter Tesseract Warnings
//     console.warn = (...args) => {
//       const msg = args[0];
//       if (typeof msg === "string") {
//         if (
//           msg.includes("Parameter not found") ||
//           msg.includes("classify_cp_cutoff_strength") ||
//           msg.includes("prioritize_division") ||
//           msg.includes("disable_character_fragments")
//         ) {
//           return;
//         }
//       }
//       originalWarn(...args);
//     };

//     // Filter Tesseract "Image too small" Errors
//     console.error = (...args) => {
//       const msg = args[0];
//       if (typeof msg === "string") {
//         if (
//           msg.includes("Image too small to scale") ||
//           msg.includes("Line cannot be recognized")
//         ) {
//           return;
//         }
//       }
//       originalError(...args);
//     };

//     if (open) {
//       startCamera();
//     } else {
//       stopCamera();
//       cleanupState();
//     }

//     return () => {
//       console.warn = originalWarn;
//       console.error = originalError;
//       stopCamera();
//     };
//   }, [open]);

//   const cleanupState = () => {
//     setPreviewImage(null);
//     setProcessing(false);
//     setStatusText("");
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const startCamera = async () => {
//     if (previewImage) return;
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           facingMode: "environment",
//           width: { ideal: 1920 },
//           height: { ideal: 1080 },
//         },
//       });
//       streamRef.current = stream;
//       if (videoRef.current) videoRef.current.srcObject = stream;
//     } catch (err) {
//       if (open) console.error("Camera access denied");
//     }
//   };

//   const stopCamera = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//   };

//   const resetScanner = () => {
//     cleanupState();
//     startCamera();
//   };

//   /* -------------------- 2. IMAGE PROCESSING -------------------- */

//   const rotateCanvas = (sourceCanvas, angle) => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     if (angle === 90 || angle === 270) {
//       canvas.width = sourceCanvas.height;
//       canvas.height = sourceCanvas.width;
//     } else {
//       canvas.width = sourceCanvas.width;
//       canvas.height = sourceCanvas.height;
//     }
//     ctx.translate(canvas.width / 2, canvas.height / 2);
//     ctx.rotate((angle * Math.PI) / 180);
//     ctx.drawImage(
//       sourceCanvas,
//       -sourceCanvas.width / 2,
//       -sourceCanvas.height / 2,
//     );
//     return canvas;
//   };

//   const preprocessImage = (canvas) => {
//     const ctx = canvas.getContext("2d");
//     const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//     const d = imgData.data;
//     const contrast = 1.2;
//     const intercept = 128 * (1 - contrast);
//     for (let i = 0; i < d.length; i += 4) {
//       let gray = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
//       gray = gray * contrast + intercept;
//       gray = gray > 255 ? 255 : gray < 0 ? 0 : gray;
//       d[i] = d[i + 1] = d[i + 2] = gray;
//     }
//     ctx.putImageData(imgData, 0, 0);
//     return canvas;
//   };

//   /* -------------------- 3. OCR ENGINE -------------------- */

//   const runOCRWithRotation = async (originalCanvas) => {
//     let bestConfidence = 0;
//     let bestText = "";
//     const angles = [0, 90, 270];

//     for (const angle of angles) {
//       setStatusText(
//         angle === 0
//           ? "Scanning Eng + Mal..."
//           : `Checking rotation ${angle}°...`,
//       );

//       const rotatedCanvas = rotateCanvas(originalCanvas, angle);
//       preprocessImage(rotatedCanvas);

//       const { data } = await Tesseract.recognize(rotatedCanvas, "eng+mal", {
//         tessedit_pageseg_mode: Tesseract.PSM.AUTO,
//         logger: () => {},
//       });

//       const text = data.text;
//       const phoneCount = (text.match(/\d{3,}/g) || []).length;
//       const letterCount = (text.match(/[a-zA-Z\u0D00-\u0D7F]/g) || []).length;

//       const score = data.confidence * 0.5 + phoneCount * 10 + letterCount * 0.1;

//       if (score > bestConfidence) {
//         bestConfidence = score;
//         bestText = text;
//       }
//     }
//     return bestText;
//   };

//   /* -------------------- 4. PARSING LOGIC (UPDATED) -------------------- */

//   const parseContactInfo = (text) => {
//       if (!text) return null;
//       console.log("OCR TEXT:", text);
//     const lines = text
//       .split(/\n+/)
//       .map((l) => l.trim())
//       .filter(Boolean);

//     // 1. EXTRACT ALL PHONE NUMBERS
//     const phoneRegex =
//       /(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g;
//     const potentialPhones = text.match(phoneRegex) || [];

//     // Clean noise (remove spaces/dashes) but KEEP original digits/plus
//     const validPhones = potentialPhones
//       .map((p) => p.replace(/[^0-9+]/g, "")) // Only remove non-digits (except +)
//       .filter((p) => p.length >= 10); // Ensure valid length

//     // Remove duplicates (Set) and Join with Comma
//     const uniquePhones = [...new Set(validPhones)];
//     const finalPhoneNumber = uniquePhones.join(", "); // "9947332521, 9495890963"
//     console.log("DETECTED PHONES:", finalPhoneNumber);
//     // 2. EXTRACT NAME
//     const COMPANY_KEYWORDS = [
//       "PVT",
//       "LTD",
//       "LLP",
//       "SURVEYORS",
//       "DIGITAL",
//       "TECHNO",
//       "GOVT",
//       "REG",
//       "PH:",
//       "MOB:",
//       "KERALA",
//       "INDIA",
//       "EMAIL",
//       "WEB",
//     ];

//     let bestName = "";
//     let maxNameScore = -1;

//     lines.forEach((line) => {
//       const upperLine = line.toUpperCase();
//       if (COMPANY_KEYWORDS.some((k) => upperLine.includes(k))) return;
//       if (line.replace(/[^0-9]/g, "").length > 3) return;
//       if (line.includes("@") || line.includes("www")) return;

//       let score = 0;
//       if (/^[A-Z\s.]+$/.test(line)) score += 3;
//       if (/[\u0D00-\u0D7F]/.test(line)) score += 2;
//       if (line.length > 3 && line.length < 30) score += 2;
//       if (/\d/.test(line)) score -= 5;

//       if (score > maxNameScore) {
//         maxNameScore = score;
//         bestName = line;
//       }
//     });
//     console.log("DETECTED NAME:", bestName);
//     return {
//       name: bestName || "Unknown Contact",
//       phoneNumber: finalPhoneNumber,
//     };
//   };

//   const handleOCRResult = (text) => {
//     const contact = parseContactInfo(text);

//     if (!contact || !contact.phoneNumber) {
//       toast.error("No phone number detected. Please try again.");
//       resetScanner();
//       return;
//     }

//     toast.success(`Saved: ${contact.name}`);
//     downloadVCard(contact);

//     cleanupState();
//     onClose();
//   };

//   /* -------------------- 5. HANDLERS -------------------- */

//   const captureImage = async () => {
//     if (!videoRef.current) return;
//     setProcessing(true);
//     setStatusText("Capturing...");

//     const canvas = canvasRef.current;
//     const video = videoRef.current;
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//     const text = await runOCRWithRotation(canvas);
//     handleOCRResult(text);
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     stopCamera();
//     setProcessing(true);
//     setStatusText("Loading image...");

//     const objectUrl = URL.createObjectURL(file);
//     setPreviewImage(objectUrl);

//     const img = new Image();
//     img.onload = async () => {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext("2d");
//       const scale = img.width < 1000 ? 1.5 : 1;
//       canvas.width = img.width * scale;
//       canvas.height = img.height * scale;
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//       const text = await runOCRWithRotation(canvas);
//       handleOCRResult(text);
//     };
//     img.src = objectUrl;
//   };

//   /* -------------------- UI (EXACT USER STYLE) -------------------- */

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
//       <div className="w-full max-w-md">
//         {/* Card */}
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
//           {/* Header */}
//           <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
//             <div className="flex items-center gap-2">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Scan Business Card
//               </h2>

//               <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
//                 <Languages className="h-3 w-3" />
//                 ENG + MAL
//               </span>
//             </div>

//             <Button
//               variant="ghost"
//               className="h-8 w-8 p-0 rounded-full"
//               onClick={onClose}
//             >
//               <X className="h-4 w-4 text-slate-600" />
//             </Button>
//           </div>

//           {/* Body */}
//           <div className="p-5 space-y-5">
//             {/* Scanner Frame */}
//             <div className="relative mx-auto w-full max-w-[320px] aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
//               {/* Camera */}
//               {!previewImage && (
//                 <>
//                   <video
//                     ref={videoRef}
//                     autoPlay
//                     playsInline
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />

//                   {!processing && (
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                       <div className="w-[85%] h-[65%] border-2 border-white/60 rounded-lg relative">
//                         <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
//                           Align card
//                         </span>

//                         <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
//                         <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
//                         <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
//                         <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}

//               {/* Image Preview */}
//               {previewImage && (
//                 <img
//                   src={previewImage}
//                   alt="Preview"
//                   className="absolute inset-0 w-full h-full object-contain bg-black"
//                 />
//               )}

//               {/* Processing Overlay */}
//               {processing && (
//                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
//                   <Loader2 className="h-9 w-9 text-white animate-spin" />
//                   <p className="mt-3 text-xs font-medium text-white/90 text-center px-3">
//                     {statusText || "Processing…"}
//                   </p>
//                 </div>
//               )}
//             </div>

//             <canvas ref={canvasRef} className="hidden" />
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               hidden
//               onChange={handleFileUpload}
//             />

//             {/* Actions */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-2 gap-3">
//                 <Button
//                   variant="outline"
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={processing}
//                   className="w-full gap-2"
//                 >
//                   <Upload className="h-4 w-4" />
//                   {previewImage ? "Change" : "Upload"}
//                 </Button>

//                 {!previewImage ? (
//                   <Button
//                     variant="primary"
//                     onClick={captureImage}
//                     disabled={processing}
//                     className="w-full gap-2 shadow-md"
//                   >
//                     <Camera className="h-4 w-4" />
//                     Capture
//                   </Button>
//                 ) : (
//                   <Button
//                     variant="secondary"
//                     onClick={resetScanner}
//                     disabled={processing}
//                     className="w-full gap-2"
//                   >
//                     <RotateCcw className="h-4 w-4" />
//                     Retake
//                   </Button>
//                 )}
//               </div>

//               {/* Cancel */}
//               <Button
//                 variant="ghost"
//                 onClick={onClose}
//                 disabled={processing}
//                 className="w-full border border-slate-200 text-slate-600 hover:bg-slate-100"
//               >
//                 Cancel
//               </Button>
//             </div>

//             {/* Hint */}
//             <p className="text-[11px] text-slate-500 text-center leading-relaxed">
//               Place the card on a flat surface with good lighting for best
//               accuracy.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ScanCardModal;

"use client";

import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { Camera, Upload, Loader2, RotateCcw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScanCard({ onScanComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  // --- CAMERA SWITCHING STATE ---
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  // --- LIFECYCLE ---
  useEffect(() => {
    // 1. Console Cleaner
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Parameter not found") ||
          args[0].includes("classify_cp"))
      )
        return;
      originalWarn(...args);
    };
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Image too small") || args[0].includes("Line cannot"))
      )
        return;
      originalError(...args);
    };

    // 2. Discover Cameras
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setVideoDevices(videoInputs);

        // Try to find the back camera to start with
        const backCameraIndex = videoInputs.findIndex(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("environment"),
        );
        if (backCameraIndex !== -1) {
          setCurrentDeviceIndex(backCameraIndex);
        }
      } catch (err) {
        console.error("Error listing devices", err);
      }
    };

    getDevices();

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
      stopCamera();
    };
  }, []);

  // 3. Start Camera when index or preview state changes
  useEffect(() => {
    if (!previewImage && videoDevices.length > 0) {
      startCamera();
    }
    return () => stopCamera();
  }, [currentDeviceIndex, videoDevices, previewImage]);

  const startCamera = async () => {
    stopCamera();

    if (videoDevices.length === 0) return;

    try {
      const deviceId = videoDevices[currentDeviceIndex].deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      // Fallback if specific ID fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("Camera access denied", e);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const switchCamera = () => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex((prev) => (prev + 1) % videoDevices.length);
    }
  };

  const resetScanner = () => {
    setPreviewImage(null);
    setProcessing(false);
    setStatusText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- OCR LOGIC ---
  const rotateCanvas = (sourceCanvas, angle) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (angle === 90 || angle === 270) {
      canvas.width = sourceCanvas.height;
      canvas.height = sourceCanvas.width;
    } else {
      canvas.width = sourceCanvas.width;
      canvas.height = sourceCanvas.height;
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(
      sourceCanvas,
      -sourceCanvas.width / 2,
      -sourceCanvas.height / 2,
    );
    return canvas;
  };

  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const contrast = 1.2;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < d.length; i += 4) {
      let gray = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
      gray = gray * contrast + intercept;
      gray = gray > 255 ? 255 : gray < 0 ? 0 : gray;
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  };

  const runOCR = async (canvas) => {
    let bestConfidence = 0;
    let bestText = "";
    const angles = [0, 90, 270];

    for (const angle of angles) {
      setStatusText(
        angle === 0
          ? "Scanning Eng + Mal..."
          : `Checking rotation ${angle}°...`,
      );
      const rotated = rotateCanvas(canvas, angle);
      preprocessImage(rotated);

      const { data } = await Tesseract.recognize(rotated, "eng+mal", {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        logger: () => {},
      });

      const text = data.text;
      const phoneCount = (text.match(/\d{3,}/g) || []).length;
      const letterCount = (text.match(/[a-zA-Z\u0D00-\u0D7F]/g) || []).length;
      const score = data.confidence * 0.5 + phoneCount * 10 + letterCount * 0.1;

      if (score > bestConfidence) {
        bestConfidence = score;
        bestText = text;
      }
    }
    return bestText;
  };

  const processScanResult = (text) => {
    // 1. Phone Extraction (Updated Regex for flexible formats)
    // Matches patterns like: +91 9495 890963, 9495890963, 0480-2821234
    // Supports 2 to 5 digits in first group, 3 to 6 in last group to catch "9495 890963"
    const phoneRegex =
      /(?:\+?\d{1,3}[-. ]?)?\(?\d{2,5}\)?[-. ]?\d{2,5}[-. ]?\d{3,6}/g;

    const potentialPhones = text.match(phoneRegex) || [];

    // We just trim whitespace. We DO NOT strip digits or modify the number structure.
    const validPhones = potentialPhones.map((p) => p.trim());

    // Remove duplicates
    const uniquePhones = [...new Set(validPhones)];

    // Join multiple numbers with comma
    const detectedPhone = uniquePhones.join(", ");

    // 2. Name Extraction
    const COMPANY_KEYWORDS = [
      "PVT",
      "LTD",
      "LLP",
      "SURVEYORS",
      "DIGITAL",
      "TECHNO",
      "GOVT",
      "REG",
      "PH:",
      "MOB:",
      "KERALA",
      "INDIA",
      "EMAIL",
      "WEB",
    ];
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    let bestName = "";
    let maxNameScore = -1;

    lines.forEach((line) => {
      const upper = line.toUpperCase();
      if (COMPANY_KEYWORDS.some((k) => upper.includes(k))) return;
      if (line.replace(/[^0-9]/g, "").length > 3) return;
      if (line.includes("@") || line.includes("www")) return;

      let score = 0;
      if (/^[A-Z\s.]+$/.test(line)) score += 3;
      if (/[\u0D00-\u0D7F]/.test(line)) score += 2;
      if (line.length > 3 && line.length < 30) score += 2;
      if (/\d/.test(line)) score -= 5;

      if (score > maxNameScore) {
        maxNameScore = score;
        bestName = line;
      }
    });

    onScanComplete({
      name: bestName,
      phoneNumber: detectedPhone,
      rawText: text,
    });
  };

  // --- ACTIONS ---
  const captureImage = async () => {
    if (!videoRef.current) return;
    setProcessing(true);
    setStatusText("Capturing...");
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const text = await runOCR(canvas);
    processScanResult(text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setProcessing(true);
    setStatusText("Loading image...");
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const scale = img.width < 1000 ? 1.5 : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const text = await runOCR(canvas);
      processScanResult(text);
    };
    img.src = objectUrl;
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Camera className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Scan Business Card
          </h2>
          <p className="text-xs text-slate-500">
            Capture or upload a card to extract contact details
          </p>
        </div>
      </div>

      {/* Scanner Card */}
      <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
        {/* Camera */}
        {!previewImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Switch Camera Button (Only if multiple cameras exist) */}
            {!processing && videoDevices.length > 1 && (
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all active:rotate-180"
                title="Switch Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {!processing && (
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-6">
                <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur text-xs text-white shadow-md">
                  Point camera at business card
                </div>
              </div>
            )}
          </>
        )}

        {/* Image Preview */}
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        )}

        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <Loader2 className="h-9 w-9 text-white animate-spin" />
            <p className="mt-3 text-xs font-medium text-white/90 animate-pulse text-center px-4">
              {statusText || "Processing..."}
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileUpload}
      />

      {/* Actions */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="w-full gap-2"
          >
            <Upload className="h-4 w-4" />
            {previewImage ? "Change" : "Upload"}
          </Button>

          {!previewImage ? (
            <Button
              onClick={captureImage}
              disabled={processing}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
            >
              <Camera className="h-4 w-4" />
              Capture
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={resetScanner}
              disabled={processing}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          Tip: Use a flat surface and good lighting for best accuracy.
        </p>
      </div>
    </div>
  );
}