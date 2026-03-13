import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, Play, RotateCcw, Check, X, Calculator, Flag, Settings, Plus, Trash2, Upload, Download, BookOpen, ChevronLeft, FileSpreadsheet, FileText, Volume2, VolumeX } from 'lucide-react';

// --- BỘ CÂU HỎI MẪU TOÁN LỚP 3 ---
const DEFAULT_QUESTIONS = [
  { id: 1, question: "25 + 47 = ?", options: ["72", "62", "82", "70"], correctAnswer: 0 },
  { id: 2, question: "8 x 7 = ?", options: ["54", "56", "48", "64"], correctAnswer: 1 },
  { id: 3, question: "Một lớp có 30 học sinh chia đều vào 5 tổ. Mỗi tổ có mấy học sinh?", options: ["5 học sinh", "6 học sinh", "7 học sinh", "8 học sinh"], correctAnswer: 1 },
  { id: 4, question: "Số liền sau của 999 là số nào?", options: ["1000", "998", "900", "100"], correctAnswer: 0 },
  { id: 5, question: "120 - 45 = ?", options: ["85", "65", "75", "80"], correctAnswer: 2 },
  { id: 6, question: "Hình vuông có mấy góc vuông?", options: ["2", "3", "4", "5"], correctAnswer: 2 },
  { id: 7, question: "54 : 6 = ?", options: ["7", "8", "9", "10"], correctAnswer: 2 },
  { id: 8, question: "Số lớn nhất có 3 chữ số là?", options: ["900", "990", "999", "1000"], correctAnswer: 2 },
  { id: 9, question: "Chu vi hình vuông có cạnh 5cm là?", options: ["10 cm", "20 cm", "25 cm", "15 cm"], correctAnswer: 1 },
  { id: 10, question: "7 x 9 = ?", options: ["63", "54", "72", "65"], correctAnswer: 0 }
];

const WINNING_SCORE = 5;

const SOUND_URLS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'
};

// Background Động (Floating Math Symbols)
const FloatingBackground = ({ is3D }: { is3D: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className={`floating-item item-1 text-8xl font-black absolute top-[10%] ${is3D ? 'text-white/40 drop-shadow-2xl' : 'text-white/20'}`}>+</div>
      <div className={`floating-item item-2 text-9xl font-black absolute top-[40%] ${is3D ? 'text-white/40 drop-shadow-2xl' : 'text-white/20'}`}>-</div>
      <div className={`floating-item item-3 text-8xl font-black absolute top-[70%] ${is3D ? 'text-white/40 drop-shadow-2xl' : 'text-white/20'}`}>×</div>
      <div className={`floating-item item-4 text-9xl font-black absolute top-[20%] ${is3D ? 'text-white/40 drop-shadow-2xl' : 'text-white/20'}`}>÷</div>
      <div className={`floating-item item-5 text-7xl font-black absolute top-[80%] ${is3D ? 'text-white/40 drop-shadow-2xl' : 'text-white/20'}`}>=</div>
      <div className={`floating-item item-6 text-9xl font-black absolute top-[50%] ${is3D ? 'text-white/30 drop-shadow-2xl' : 'text-white/10'}`}>?</div>
    </div>
  );
};

// Component vẽ nhân vật kéo co bằng SVG
const PullingFigure = ({ isLeft, color }: { isLeft: boolean, color: string }) => {
  const transform = isLeft ? 'scaleX(1)' : 'scaleX(-1)';
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[0_10px_10px_rgba(0,0,0,0.4)]" style={{ transform, overflow: 'visible' }}>
       <line x1="35" y1="40" x2="20" y2="75" stroke={color} strokeWidth="12" strokeLinecap="round" />
       <line x1="20" y1="75" x2="45" y2="95" stroke={color} strokeWidth="12" strokeLinecap="round" />
       <line x1="20" y1="75" x2="-5" y2="90" stroke={color} strokeWidth="12" strokeLinecap="round" />
       <circle cx="35" cy="22" r="16" fill={color} stroke="white" strokeWidth="3" />
       <path d="M 19 18 L 51 18 L 49 24 L 21 24 Z" fill="white" opacity="0.9" />
       <path d="M 19 18 L 5 25 L 10 28 L 19 22 Z" fill="white" opacity="0.9" />
       <line x1="32" y1="45" x2="65" y2="52" stroke={color} strokeWidth="12" strokeLinecap="round" />
       <circle cx="65" cy="52" r="7" fill="#facc15" />
    </svg>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('start'); // start, playing, end, settings
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [ropePosition, setRopePosition] = useState(0);
  const [lockedOut, setLockedOut] = useState({ team1: false, team2: false });
  const [feedback, setFeedback] = useState<{ show: boolean, team: string | null, isCorrect: boolean, selectedIdx?: number }>({ show: false, team: null, isCorrect: false });
  const [timeLeft, setTimeLeft] = useState(15);
  
  // State for Settings form
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/music/preview/mixkit-funny-quirky-comedy-track-43.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    bgmRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (!bgmRef.current) return;
    if (soundEnabled) {
      bgmRef.current.play().catch(() => {});
    } else {
      bgmRef.current.pause();
    }
  }, [soundEnabled]);

  useEffect(() => {
    const handleInteraction = () => {
      if (soundEnabled && bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, [soundEnabled]);

  const playSound = (type: keyof typeof SOUND_URLS) => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(SOUND_URLS[type]);
      audio.volume = type === 'tick' ? 0.2 : 0.6;
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (e) {}
  };

  useEffect(() => {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .mesh-bg {
        background: linear-gradient(-45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #1dd1a1);
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
      }
      .bg-3d-cartoon {
        background-image: url('https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2000&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
      @keyframes floatLeftToRight {
        0% { transform: translateX(-20vw) rotate(0deg) translateY(0px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateX(120vw) rotate(360deg) translateY(-50px); opacity: 0; }
      }
      @keyframes floatRightToLeft {
        0% { transform: translateX(120vw) rotate(0deg) translateY(0px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateX(-20vw) rotate(-360deg) translateY(50px); opacity: 0; }
      }
      .floating-item { position: absolute; will-change: transform; }
      .item-1 { animation: floatLeftToRight 25s linear infinite; }
      .item-2 { animation: floatRightToLeft 30s linear infinite 5s; }
      .item-3 { animation: floatLeftToRight 28s linear infinite 2s; }
      .item-4 { animation: floatRightToLeft 35s linear infinite 10s; }
      .item-5 { animation: floatLeftToRight 22s linear infinite 8s; }
      .item-6 { animation: floatRightToLeft 40s linear infinite 15s; }

      .glass-panel {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 2px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
      }
      .glass-button {
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.7);
        transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        color: #333;
      }
      .glass-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.7);
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
      }
      .glass-button:active:not(:disabled) {
        transform: translateY(1px) scale(0.98);
      }
      .glass-button-correct { background: #1dd1a1 !important; color: white !important; border-color: #10ac84 !important; box-shadow: 0 0 20px rgba(29, 209, 161, 0.6); }
      .glass-button-wrong { background: #ff6b6b !important; color: white !important; border-color: #ee5253 !important; box-shadow: 0 0 20px rgba(255, 107, 107, 0.6); animation: shake 0.4s; }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } }
      .rope-pattern { background: repeating-linear-gradient(45deg, #d35400, #d35400 10px, #e67e22 10px, #e67e22 20px); box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.2); }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.5); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.8); }
    `;
    document.head.appendChild(style);

    // 2. Inject Libraries for Excel & Word Parsing
    const scriptXLSX = document.createElement('script');
    scriptXLSX.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    document.head.appendChild(scriptXLSX);

    const scriptMammoth = document.createElement('script');
    scriptMammoth.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js";
    document.head.appendChild(scriptMammoth);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && !feedback.show) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          if (prev <= 6) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, feedback.show, currentQIndex, soundEnabled]);

  const handleTimeOut = () => {
    setTimeout(() => {
      nextQuestion(ropePosition);
    }, 1000);
  };

  const startGame = () => {
    playSound('click');
    if (questions.length === 0) {
      showToast("Vui lòng thêm ít nhất 1 câu hỏi!");
      return;
    }
    setRopePosition(0);
    setCurrentQIndex(0);
    setGameState('playing');
    setTimeLeft(15);
    setLockedOut({ team1: false, team2: false });
  };

  const handleAnswer = (team: 'team1' | 'team2', selectedOptionIndex: number) => {
    if (lockedOut[team] || feedback.show) return;

    const currentQuestion = questions[currentQIndex];
    const isCorrect = selectedOptionIndex === currentQuestion.correctAnswer;

    if (isCorrect) {
      playSound('correct');
      const pullAmount = team === 'team1' ? -1 : 1;
      const newPosition = ropePosition + pullAmount;
      
      setRopePosition(newPosition);
      setFeedback({ show: true, team, isCorrect: true, selectedIdx: selectedOptionIndex });
      setLockedOut({ team1: true, team2: true });

      setTimeout(() => {
        nextQuestion(newPosition);
      }, 2000);
    } else {
      playSound('wrong');
      setLockedOut(prev => ({ ...prev, [team]: true }));
      setFeedback({ show: true, team, isCorrect: false, selectedIdx: selectedOptionIndex });
      
      setTimeout(() => {
        setFeedback({ show: false, team: null, isCorrect: false });
        if (lockedOut[team === 'team1' ? 'team2' : 'team1']) {
           nextQuestion(ropePosition);
        }
      }, 1000);
    }
  };

  const nextQuestion = (currentPos: number) => {
    if (currentPos <= -WINNING_SCORE || currentPos >= WINNING_SCORE) {
      playSound('win');
      setGameState('end');
      return;
    }
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(15);
      setLockedOut({ team1: false, team2: false });
      setFeedback({ show: false, team: null, isCorrect: false });
    } else {
      playSound('win');
      setGameState('end');
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleAddQuestion = () => {
    if (!newQuestion.question || newQuestion.options.some(o => !o)) {
      showToast("Vui lòng điền đầy đủ câu hỏi và 4 đáp án!");
      return;
    }
    setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
    setNewQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    showToast("Đã thêm câu hỏi thành công!");
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Nâng cấp: Xử lý file JSON, Excel, Word
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'json') {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.every(q => q.question && q.options && q.options.length === 4)) {
            setQuestions(parsed);
            showToast("Đã tải dữ liệu từ file JSON thành công!");
          } else {
            showToast("Lỗi: File JSON không đúng định dạng!");
          }
        } catch (err) {
          showToast("Lỗi: Không thể đọc file JSON!");
        }
      };
      reader.readAsText(file);
    } 
    else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      if (!(window as any).XLSX) return showToast("Thư viện Excel đang tải, vui lòng thử lại sau 2 giây...");
      
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = (window as any).XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = (window as any).XLSX.utils.sheet_to_json(worksheet);

          const parsedQuestions = json.map((row: any, index: number) => {
            // Tương thích với nhiều kiểu đặt tên cột tiếng Việt/Anh
            const q = row.CauHoi || row.Question || row["Câu hỏi"] || `Câu hỏi ${index+1}`;
            const optA = row.DapAnA || row.A || row["Đáp án A"] || "A";
            const optB = row.DapAnB || row.B || row["Đáp án B"] || "B";
            const optC = row.DapAnC || row.C || row["Đáp án C"] || "C";
            const optD = row.DapAnD || row.D || row["Đáp án D"] || "D";
            // Đáp án đúng (A=0, B=1, C=2, D=3) hoặc nhập trực tiếp số 0,1,2,3
            let ansStr = String(row.DapAnDung || row.Answer || row["Đáp án đúng"] || "0").toUpperCase().trim();
            let ansIndex = parseInt(ansStr);
            if (isNaN(ansIndex)) {
                if (ansStr === 'A') ansIndex = 0;
                else if (ansStr === 'B') ansIndex = 1;
                else if (ansStr === 'C') ansIndex = 2;
                else if (ansStr === 'D') ansIndex = 3;
                else ansIndex = 0;
            }

            return {
              id: Date.now() + index,
              question: q,
              options: [optA, optB, optC, optD],
              correctAnswer: ansIndex > 3 ? 0 : ansIndex
            };
          });

          if (parsedQuestions.length > 0) {
            setQuestions(parsedQuestions);
            showToast(`Đã tải thành công ${parsedQuestions.length} câu hỏi từ Excel!`);
          } else {
            showToast("File Excel trống hoặc cấu trúc cột chưa chuẩn.");
          }
        } catch (error) {
          showToast("Có lỗi xảy ra khi đọc file Excel.");
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (ext === 'doc' || ext === 'docx') {
      if (!(window as any).mammoth) return showToast("Thư viện Word đang tải, vui lòng thử lại sau 2 giây...");
      
      showToast("Đang trích xuất từ Word. (Khuyến nghị dùng Excel để dữ liệu chuẩn nhất)");
      reader.onload = (event) => {
        (window as any).mammoth.extractRawText({ arrayBuffer: event.target?.result })
          .then((result: any) => {
            const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
            const parsedQuestions = [];
            
            // Xử lý thô: Lấy cứ 5 dòng làm 1 câu hỏi (Câu hỏi, A, B, C, D)
            for (let i = 0; i < lines.length - 4; i += 5) {
              parsedQuestions.push({
                id: Date.now() + i,
                question: lines[i],
                options: [lines[i+1], lines[i+2], lines[i+3], lines[i+4]],
                correctAnswer: 0 // Mặc định đáp án A vì Word khó đánh dấu
              });
            }
            if (parsedQuestions.length > 0) {
              setQuestions(parsedQuestions);
              showToast(`Tải xong ${parsedQuestions.length} câu hỏi từ Word (Mặc định đáp án A đúng).`);
            } else {
              showToast("Không tìm thấy cấu trúc câu hỏi nào trong file Word.");
            }
          })
          .catch((err: any) => showToast("Không thể đọc file Word này."));
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast("Định dạng file không được hỗ trợ!");
    }
    
    e.target.value = ''; // reset input
  };

  const downloadExcelTemplate = () => {
    // Tạo file CSV với chuẩn BOM (UTF-8) để đọc tiếng Việt không bị lỗi font trên Excel
    const header = "CauHoi,DapAnA,DapAnB,DapAnC,DapAnD,DapAnDung\n";
    const row1 = "1 + 1 bằng mấy?,1,2,3,4,1\n"; // Đáp án đúng là index 1 (giá trị 2)
    const row2 = "Thủ đô của Việt Nam?,Đà Nẵng,Hà Nội,Hồ Chí Minh,Huế,1\n";
    
    const csvContent = "\uFEFF" + header + row1 + row2; 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Mau_Cau_Hoi_Keo_Co.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER SCREENS ---

  const renderToast = () => toastMessage && (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-8 py-3 rounded-full font-bold shadow-2xl animate-bounce border border-white/20 text-center min-w-[300px]">
      {toastMessage}
    </div>
  );

  if (gameState === 'start') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative bg-3d-cartoon overflow-hidden">
        {/* Lớp phủ tối mờ để text nổi lên trên nền 3D */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0"></div>
        
        <FloatingBackground is3D={true} />
        {renderToast()}
        
        {/* Nút Cài Đặt */}
        <button 
          onClick={() => { playSound('click'); setGameState('settings'); }}
          className="absolute top-8 right-8 glass-button p-4 rounded-full text-white hover:text-white z-20 border-white/40 bg-white/10 hover:bg-white/30 shadow-2xl"
          title="Cài đặt câu hỏi"
        >
          <Settings className="w-8 h-8" />
        </button>

        <button 
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) {
              try { const audio = new Audio(SOUND_URLS.click); audio.volume = 0.6; audio.play().catch(()=>{}); } catch(e) {}
            }
          }}
          className="absolute top-8 right-28 glass-button p-4 rounded-full text-white hover:text-white z-20 border-white/40 bg-white/10 hover:bg-white/30 shadow-2xl"
          title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          {soundEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
        </button>

        <div className="glass-panel p-12 rounded-[3rem] max-w-3xl w-full text-center relative z-10 bg-white/20 border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Calculator className="w-28 h-28 mx-auto mb-6 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
          <h1 className="text-7xl font-black mb-4 tracking-tight text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
            KÉO CO <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 drop-shadow-none">TOÁN HỌC</span>
          </h1>
          <p className="text-2xl mb-12 text-blue-100 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Ai nhanh tay, cờ bay về đội đó!</p>
          <button 
            onClick={startGame}
            className="glass-button bg-white hover:bg-yellow-400 hover:border-yellow-300 hover:text-red-700 text-gray-900 text-3xl font-black py-6 px-14 rounded-full inline-flex items-center gap-4 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            <Play fill="currentColor" className="w-8 h-8" /> BẮT ĐẦU CHƠI
          </button>
          
          <div className="mt-10 inline-block bg-black/40 px-6 py-2 rounded-full text-white/90 font-semibold border border-white/20 backdrop-blur-md">
            Đã tải: {questions.length} câu hỏi
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'settings') {
    return (
      <div className="min-h-screen mesh-bg flex flex-col p-6 font-sans relative">
        <FloatingBackground is3D={false} />
        {renderToast()}
        
        <div className="glass-panel flex-1 rounded-[3rem] p-8 max-w-7xl mx-auto w-full z-10 bg-white/70 flex flex-col shadow-2xl">
          
          <div className="flex items-center justify-between mb-8 border-b-2 border-white/50 pb-4">
            <button onClick={() => { playSound('click'); setGameState('start'); }} className="glass-button px-6 py-2 rounded-full font-bold flex items-center gap-2">
              <ChevronLeft /> Quay lại
            </button>
            <h2 className="text-4xl font-black text-gray-800">CÀI ĐẶT CÂU HỎI</h2>
            <div className="w-32"></div> {/* Spacer */}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
            {/* Cột trái: Form nhập liệu & Hành động */}
            <div className="w-full lg:w-5/12 flex flex-col gap-6">
              <div className="bg-white/60 p-6 rounded-3xl border-2 border-white/80 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Plus className="text-blue-600"/> Nhập câu hỏi mới</h3>
                
                <textarea 
                  className="w-full p-3 rounded-xl border-2 border-white/80 bg-white/70 focus:bg-white outline-none font-semibold mb-4 resize-none"
                  rows={2} placeholder="Nhập nội dung câu hỏi..."
                  value={newQuestion.question}
                  onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                ></textarea>

                <div className="space-y-3 mb-4">
                  {['A', 'B', 'C', 'D'].map((label, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="font-bold w-6">{label}</div>
                      <input 
                        type="text" className="flex-1 p-2 rounded-lg border-2 border-white/80 bg-white/70 focus:bg-white outline-none font-medium"
                        placeholder={`Đáp án ${label}`}
                        value={newQuestion.options[idx]}
                        onChange={e => {
                          const newOpts = [...newQuestion.options];
                          newOpts[idx] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOpts});
                        }}
                      />
                      <input 
                        type="radio" name="correctAnswer" 
                        checked={newQuestion.correctAnswer === idx}
                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: idx})}
                        className="w-6 h-6 accent-green-500 cursor-pointer"
                        title="Chọn làm đáp án đúng"
                      />
                    </div>
                  ))}
                </div>

                <button onClick={handleAddQuestion} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-lg">
                  THÊM CÂU HỎI VÀO DANH SÁCH
                </button>
              </div>

              <div className="bg-white/60 p-6 rounded-3xl border-2 border-white/80 shadow-lg flex flex-col gap-4">
                <h3 className="text-xl font-bold">Tải lên hàng loạt (Word, Excel)</h3>
                
                <input 
                  type="file" 
                  accept=".json, .csv, .xlsx, .xls, .doc, .docx" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                
                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="glass-button flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-blue-800 bg-blue-100 hover:bg-blue-200">
                    <Upload size={20} /> Tải File Lên
                  </button>
                  <button onClick={downloadExcelTemplate} className="glass-button flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-green-800 bg-green-100 hover:bg-green-200">
                    <FileSpreadsheet size={20} /> Mẫu Excel
                  </button>
                </div>

                <div className="text-sm text-gray-600 font-medium">
                  * Hệ thống khuyên dùng <b>Excel (hoặc CSV)</b> để chia cột câu hỏi/đáp án chuẩn xác. Word (Docx) có thể bị lệch đáp án.
                </div>

                <button onClick={() => { setQuestions(DEFAULT_QUESTIONS); showToast("Đã khôi phục bộ câu hỏi mẫu Lớp 3!"); }} className="glass-button w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-gray-700 mt-2 bg-white hover:bg-gray-100">
                  <BookOpen size={20} /> Load câu hỏi mẫu Lớp 3
                </button>
              </div>
            </div>

            {/* Cột phải: Danh sách câu hỏi */}
            <div className="w-full lg:w-7/12 bg-white/50 p-6 rounded-3xl border-2 border-white/80 shadow-inner flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Danh sách câu hỏi ({questions.length} câu)</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center text-gray-500 font-bold py-10">Chưa có câu hỏi nào. Hãy thêm thủ công hoặc tải file lên.</div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-300 relative group transition-colors">
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                        title="Xóa câu hỏi này"
                      ><Trash2 size={22} /></button>
                      <h4 className="font-bold text-lg mb-3 text-gray-800 pr-10">Câu {idx + 1}: {q.question}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`px-3 py-2 rounded-xl flex items-center gap-2 ${q.correctAnswer === oIdx ? 'bg-green-100 border-2 border-green-400 text-green-900' : 'bg-gray-50 border-2 border-gray-100 text-gray-600'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${q.correctAnswer === oIdx ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                              {['A', 'B', 'C', 'D'][oIdx]}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'end') {
    let winner = 'HÒA NHAU';
    let winnerColor = 'text-white';
    
    if (ropePosition < 0) {
      winner = 'ĐỘI ĐỎ CHIẾN THẮNG!';
      winnerColor = 'text-red-500';
    } else if (ropePosition > 0) {
      winner = 'ĐỘI XANH CHIẾN THẮNG!';
      winnerColor = 'text-blue-500';
    }

    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-6 font-sans relative">
        <FloatingBackground is3D={false} />
        <div className="glass-panel p-12 rounded-[3rem] max-w-3xl w-full text-center bg-white/60 z-10 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          <Trophy className="w-32 h-32 mx-auto mb-8 text-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
          <h2 className="text-5xl font-black mb-8 text-gray-800 drop-shadow-sm">KẾT QUẢ TRẬN KÉO CO</h2>
          
          <div className="mb-10 text-6xl font-black">
            <span className={`${winnerColor} drop-shadow-lg`}>{winner}</span>
          </div>

          <button 
            onClick={() => { playSound('click'); setGameState('start'); }}
            className="glass-button bg-white hover:bg-gray-100 text-gray-900 text-xl font-bold py-4 px-10 rounded-full inline-flex items-center gap-3"
          >
            <RotateCcw /> QUAY VỀ MÀN HÌNH CHÍNH
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQIndex];
  const ropeMovementPercent = (ropePosition / WINNING_SCORE) * 35; 

  return (
    <div className="min-h-screen mesh-bg flex flex-col font-sans overflow-hidden text-gray-800 relative">
      <FloatingBackground is3D={false} />
      
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 glass-button p-3 rounded-full text-gray-800 z-50 border-white/40 bg-white/40 hover:bg-white/60 shadow-lg"
        title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
      >
        {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>

      {/* HEADER SECTION (Chứa thanh kéo co) */}
      <header className="h-48 glass-panel bg-white/40 border-b-0 rounded-b-[3rem] mx-4 mt-4 flex flex-col items-center justify-center px-10 z-10 relative shadow-lg">
        
        <div className="w-full flex justify-between items-center mb-2 px-8">
           <h2 className="text-3xl font-black text-red-600 drop-shadow-md bg-white/50 px-6 py-2 rounded-full border-2 border-red-300">ĐỘI ĐỎ</h2>
           
           <div className="flex flex-col items-center bg-white/60 px-6 py-2 rounded-2xl border-2 border-white/80 shadow-lg">
             <div className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-1">
               Câu hỏi {currentQIndex + 1} / {questions.length}
             </div>
             <div className="flex items-center gap-2">
               <Clock className={`w-6 h-6 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
               <span className={`text-3xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                 00:{timeLeft.toString().padStart(2, '0')}
               </span>
             </div>
           </div>

           <h2 className="text-3xl font-black text-blue-600 drop-shadow-md bg-white/50 px-6 py-2 rounded-full border-2 border-blue-300">ĐỘI XANH</h2>
        </div>

        {/* THANH KÉO CO TRỰC QUAN (CÓ HÌNH NGƯỜI) */}
        <div className="w-full max-w-5xl relative h-32 flex items-center mt-2 rounded-[2rem] bg-black/10 border-4 border-white/50 shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="absolute left-[15%] top-0 bottom-0 w-2 bg-red-500/70 shadow-[0_0_15px_rgba(239,68,68,1)] z-0"></div>
          <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-white/60 z-0 -translate-x-1/2 border-l border-dashed border-gray-400"></div>
          <div className="absolute right-[15%] top-0 bottom-0 w-2 bg-blue-500/70 shadow-[0_0_15px_rgba(59,130,246,1)] z-0"></div>

          <div 
            className="absolute top-1/2 transition-all duration-700 ease-in-out flex items-center justify-center h-full"
            style={{ 
              left: `calc(50% + ${ropeMovementPercent}%)`, 
              transform: 'translate(-50%, -50%)',
              width: '200%' 
            }}
          >
            <div className="w-full h-5 rope-pattern absolute top-1/2 -translate-y-1/2 shadow-lg z-10"></div>

            <div className="absolute top-1/2 -translate-y-1/2 z-20" style={{ left: 'calc(50% - 140px)' }}>
              <PullingFigure isLeft={true} color="#ef4444" />
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center" style={{ left: '50%' }}>
              <div className="w-6 h-12 bg-yellow-400 rounded-lg border-2 border-yellow-600 shadow-lg mb-1 flex items-center justify-center">
                <div className="w-full h-1 bg-yellow-600/50"></div>
              </div>
              <Flag className="w-10 h-10 text-yellow-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] absolute -top-10" fill="#facc15" />
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 z-20" style={{ left: 'calc(50% + 140px)' }}>
              <PullingFigure isLeft={false} color="#3b82f6" />
            </div>
          </div>
        </div>

      </header>

      {/* CÂU HỎI Ở GIỮA */}
      <div className="absolute top-56 left-1/2 -translate-x-1/2 z-20 w-[85%] max-w-3xl">
        <div className="glass-panel bg-white/80 p-8 rounded-[2rem] text-center shadow-2xl border-4 border-white">
          <h2 className="text-4xl font-black leading-tight text-gray-800">
            {question?.question}
          </h2>
        </div>
      </div>

      {/* KHU VỰC TRẢ LỜI CHIA ĐÔI MÀN HÌNH */}
      <div className="flex-1 flex mt-20 relative">
        
        {/* TEAM 1 (RED/LEFT) */}
        <div className="flex-1 p-8 pt-48 flex flex-col justify-center border-r-4 border-white/50 relative z-10">
          <div className="absolute inset-0 bg-red-400/20 pointer-events-none mix-blend-multiply"></div>
          
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto w-full z-10">
            {question?.options.map((opt, idx) => {
              const isSelected = feedback.team === 'team1' && feedback.selectedIdx === idx;
              let btnClass = "glass-button p-6 rounded-3xl text-center text-3xl font-black w-full relative overflow-hidden flex flex-col items-center justify-center min-h-[120px] bg-white/70";
              
              if (isSelected) {
                btnClass += feedback.isCorrect ? " glass-button-correct" : " glass-button-wrong";
              } else if (lockedOut.team1) {
                btnClass += " opacity-50 cursor-not-allowed scale-95";
              }

              return (
                <button 
                  key={`t1-${idx}`}
                  disabled={lockedOut.team1 || feedback.show}
                  onClick={() => handleAnswer('team1', idx)}
                  className={btnClass}
                >
                  <span className="drop-shadow-sm">{opt}</span>
                  {isSelected && feedback.isCorrect && <Check className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-md" />}
                  {isSelected && !feedback.isCorrect && <X className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* TEAM 2 (BLUE/RIGHT) */}
        <div className="flex-1 p-8 pt-48 flex flex-col justify-center relative z-10">
          <div className="absolute inset-0 bg-blue-400/20 pointer-events-none mix-blend-multiply"></div>

          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto w-full z-10">
            {question?.options.map((opt, idx) => {
              const isSelected = feedback.team === 'team2' && feedback.selectedIdx === idx;
              let btnClass = "glass-button p-6 rounded-3xl text-center text-3xl font-black w-full relative overflow-hidden flex flex-col items-center justify-center min-h-[120px] bg-white/70";
              
              if (isSelected) {
                btnClass += feedback.isCorrect ? " glass-button-correct" : " glass-button-wrong";
              } else if (lockedOut.team2) {
                btnClass += " opacity-50 cursor-not-allowed scale-95";
              }

              return (
                <button 
                  key={`t2-${idx}`}
                  disabled={lockedOut.team2 || feedback.show}
                  onClick={() => handleAnswer('team2', idx)}
                  className={btnClass}
                >
                  <span className="drop-shadow-sm">{opt}</span>
                  {isSelected && feedback.isCorrect && <Check className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-md" />}
                  {isSelected && !feedback.isCorrect && <X className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Huy hiệu VS ở giữa */}
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-8 border-yellow-400 shadow-[0_0_30px_rgba(255,255,255,0.8)]">
            <span className="text-3xl font-black italic text-yellow-500">VS</span>
          </div>
        </div>

      </div>
    </div>
  );
}