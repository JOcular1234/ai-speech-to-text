// // // src/app/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { toast } from "react-hot-toast";
import { CloudArrowUpIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import Link from "next/link";


export default function Home() {
  const [downloadFormat, setDownloadFormat] = useState("json");

  // Download handler for JSON, TXT, PDF
  const handleDownloadTranscription = () => {
    if (!transcription) return;
    const filename = `transcription-${Date.now()}`;
    if (downloadFormat === "json") {
      const blob = new Blob([JSON.stringify(transcription, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (downloadFormat === "txt") {
      const text = transcription.text || "";
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (downloadFormat === "pdf") {
      const doc = new jsPDF();
      const margin = 15;
      let y = margin;
      // Helper to load logo as DataURL
      const loadLogo = (url) => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "Anonymous";
          img.onload = function () {
            // Create canvas to get DataURL
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = url;
        });
      };
      // Render PDF after logo loads
      loadLogo("/soundscriptlight.png").then((logoDataUrl) => {
        // Logo
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", margin, y, 40, 13);
        }
        y += 18;
        // Title
        doc.setFontSize(18);
        doc.setTextColor(36, 41, 46);
        doc.text("Transcription Report", margin, y);
        y += 10;
        doc.setDrawColor(36, 41, 46);
        doc.setLineWidth(0.5);
        doc.line(margin, y, 195 - margin, y);
        y += 7;
        // Metadata
        doc.setFontSize(11);
        doc.setTextColor(70, 70, 70);
        doc.text(`File: ${audioFile?.name || "-"}`.substring(0, 60), margin, y);
        y += 6;
        doc.text(`Language: ${transcription.language || "Unknown"}`, margin, y);
        y += 6;
        doc.text(`Confidence: ${transcription.language_confidence != null && !isNaN(transcription.language_confidence) ? `${(transcription.language_confidence * 100).toFixed(1)}%` : "N/A"}`, margin, y);
        y += 6;
        doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
        y += 10;
        // Section header
        doc.setFontSize(13);
        doc.setTextColor(36, 41, 46);
        doc.text("Transcription", margin, y);
        y += 7;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(margin, y, 195 - margin, y);
        y += 8;
        // Transcription text (styled)
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        const splitText = doc.splitTextToSize(transcription.text || "No transcription available", 180);
        doc.text(splitText, margin, y);
        doc.save(`${filename}.pdf`);
      });
    }
  };

  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark/light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("sttHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to history
  const saveToHistory = (newItem) => {
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("sttHistory", JSON.stringify(updatedHistory));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && ["audio/mpeg", "audio/wav"].includes(file.type)) {
      setAudioFile(file);
    } else {
      toast.error("Please upload a valid audio file (MP3 or WAV)");
    }
  };

  // Handle transcription
  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    setIsLoading(true);
    setTranscription(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setTranscription(data);
        saveToHistory({
          fileName: audioFile.name,
          transcription: data.text,
          fullTranscription: data,
          timestamp: Date.now(),
        });
        toast.success("Transcription generated successfully!");
      } else {
        toast.error(data.error || "Failed to transcribe audio");
      }
    } catch (err) {
      console.error("Frontend STT error:", err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("sttHistory");
    toast.success("History cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {/* <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Transcriber</h1> */}
            <img src="/soundscript.png" className="w-24 h-8" alt="SoundScript" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
  Home
</Link>
            <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
  About
</Link>
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <SunIcon className="w-6 h-6 text-yellow-400" />
            ) : (
              <MoonIcon className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Home
          </Link>
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <a
                href="https://x.ai/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                API
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-extrabold text-center mb-10 tracking-tight">
          AI Speech-to-Text Transcriber
        </h1>
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Upload an audio file to generate accurate transcriptions using advanced AI technology.
        </p>

        {/* File Upload Section */}
        <div
          className={`max-w-2xl mx-auto mb-10 p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800 border-2 transition-all duration-300 ${
            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="region"
          aria-label="File upload area"
        >
          <div className="flex flex-col items-center text-center">
            <CloudArrowUpIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
              {audioFile ? audioFile.name : "Drag and drop your audio file here"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Supported formats: MP3, WAV
            </p>
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Select audio file"
            >
              Select File
            </button>
            <input
              type="file"
              accept="audio/mpeg,audio/wav"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Transcribe Button */}
        <div className="max-w-2xl mx-auto mb-10">
          <button
            onClick={handleTranscribe}
            disabled={isLoading || !audioFile}
            className={`w-full py-3 px-6 text-lg font-semibold rounded-xl flex items-center justify-center transition-all duration-300 ${
              isLoading || !audioFile
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            }`}
            aria-label={isLoading ? "Transcribing audio" : "Transcribe audio"}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-6 w-6 mr-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                />
              </svg>
            ) : null}
            {isLoading ? "Transcribing..." : "Transcribe Audio"}
          </button>
        </div>

        {/* Transcription Output */}
        {transcription && (
          <div className="max-w-4xl mx-auto mb-10 animate-fade-in">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Transcription Result
            </h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {transcription.text || "No transcription available"}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  Language: {transcription.language || "Unknown"}
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  Confidence:{" "}
                  {transcription.language_confidence != null && !isNaN(transcription.language_confidence)
                    ? `${(transcription.language_confidence * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  Words: {transcription.words?.length || 0}
                </span>
                {transcription.words?.some((w) => w.speaker_id) && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    Speakers: {new Set(transcription.words.map((w) => w.speaker_id || "Unknown")).size}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <select
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select download format"
              >
                <option value="json">JSON</option>
                <option value="txt">TXT</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                onClick={handleDownloadTranscription}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label={`Download transcription as ${downloadFormat}`}
              >
                Download Transcription ({downloadFormat.toUpperCase()})
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="max-w-4xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Transcription History</h3>
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                aria-label="Clear transcription history"
              >
                Clear History
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                    File: {item.fileName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {item.transcription}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <button
                    onClick={() => setTranscription(item.fullTranscription)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    aria-label="View full transcription"
                  >
                    View Full Transcription
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">About<img src="/soundscript.png" className="w-24 h-8" alt="SoundScript" /></h3>
              <p className="text-sm">
                SoundScript uses advanced speech-to-text technology powered by Elevenlabs ai to convert audio files into accurate transcriptions.
              </p>
            </div>

            {/* Links Section */}

            {/* Contact Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Contact</h3>
              <p className="text-sm">Have questions? Reach out to us!</p>
              <p className="text-sm mt-2">
                Email:{" "}
                <a
                  href="mailto:support@x.ai"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  support@soundscript.ai
                </a>
              </p>
              <p className="text-sm mt-2">
                Follow us on{" "}
                <a
                  href="https://x.com/xai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  X
                </a>
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} SoundScript,  All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}