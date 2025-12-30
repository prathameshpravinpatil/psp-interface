import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Zap, Play, Settings, Link, FlaskConical, 
  ShieldAlert, CheckCircle, Save, Download, RefreshCw, XCircle,
  FileSpreadsheet, FileText, Timer, List, Info, Database, Crosshair, ZoomIn, 
  Cpu, ZapOff, Layers, Gauge, Sun, Moon, Monitor, Hexagon, Camera,
  ChevronDown, ChevronRight, Terminal, BarChart3, History, HardDrive, Beaker,
  ShieldCheck, Radio, Server, Microscope, Power, AlertTriangle, RotateCcw,
  FileImage, FileType, Clock, Menu, X, BookOpen, HelpCircle, Mail, User, Phone, MapPin,
  Unplug, Link2, Binary
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';

/**
 * STATIC CONFIGURATION & HARDWARE CONSTANTS
 */

const deviceDetails = {
  model: "PSP-8821-X Potentiostat",
  serial: "SN-2024-0812-FB",
  port: "Auto-Detect",
  baud: "9,600 bps", 
  firmware: "PSP_OS v1.0-Stable",
  compliance: "± 2.5 V / 75 mA",
  adc: "16-Bit Resolution",
  sampling: "10,000 Hz",
  refElectrode: "Ag/AgCl (Sat. KCl)"
};

const techInfo = {
  calibrate: { label: "Instrument Calibration", icon: <RefreshCw size={14}/>, group: 'System', cmd: 'w' },
  ocp: { label: "Open Circuit Potential", icon: <Gauge size={14}/>, group: 'System', cmd: 'o' },
  cv: { label: "Cyclic Voltammetry", icon: <Activity size={14}/>, group: 'Voltammetry', cmd: 'z' },
  lsv: { label: "Linear Sweep Voltammetry", icon: <Zap size={14}/>, group: 'Voltammetry', cmd: 'y' },
  sv: { label: "Stripping Voltammetry", icon: <FlaskConical size={14}/>, group: 'Voltammetry', cmd: 'v' },
  dpv: { label: "Differential Pulse", icon: <Layers size={14}/>, group: 'Pulse', cmd: 'd' },
  swv: { label: "Square Wave", icon: <Cpu size={14}/>, group: 'Pulse', cmd: 's' },
  ca: { label: "Chronoamperometry", icon: <Timer size={14}/>, group: 'Amperometry', cmd: 'c' },
  zra: { label: "Zero Resistance Ammeter", icon: <ShieldAlert size={14}/>, group: 'Amperometry', cmd: 'e' },
  lpr: { label: "Linear Polarization (LPR)", icon: <Zap size={14}/>, group: 'Corrosion', cmd: 'l' },
  tafel: { label: "Tafel Plot Analysis", icon: <Activity size={14}/>, group: 'Corrosion', cmd: 't' },
  corrosion: { label: "Corrosion Rate Analysis", icon: <ShieldAlert size={14}/>, group: 'Corrosion', cmd: 'k' }
};

const experimentGroups = ['Voltammetry', 'Pulse', 'Amperometry', 'Corrosion', 'System'];

const DEFAULT_PARAMETERS = {
  calibrate: { initE: -1.0, finalE: 1.0, duration: 60, scanRate: 100, stepE: 5 },
  ocp: { duration: 60 },
  cv: { initE: -0.2, finalE: 0.8, scanRate: 100, stepE: 5, scans: 1 },
  lsv: { initE: 0.0, finalE: 0.8, scanRate: 100, stepE: 5, quietTime: 30, mode: 'reference' },
  ca: { initE: 0.0, preTime: 5, s1E: 0.5, s1T: 10, s2E: -0.2, s2T: 10 },
  sv: { initE: -1.0, finalE: 0.5, scanRate: 50, stepE: 5, depE: -0.8, depT: 30 },
  dpv: { initE: 0.0, finalE: 0.8, stepE: 5, pAmp: 50, pWidth: 50, stepTime: 100 },
  swv: { initE: 0.0, finalE: 0.8, stepE: 5, pAmp: 25, freq: 25 },
  zra: { duration: 120 },
  tafel: { initE: -0.25, finalE: 0.25, stepE: 2, ocp: 0 },
  lpr: { initE: -0.02, finalE: 0.02, stepE: 0.5, scanRate: 0.5 },
  corrosion: { initE: -0.5, finalE: 0.5, stepE: 5, density: 7.87, eqWt: 27.92, area: 1.0 }
};

/**
 * UI SUB-COMPONENTS
 */

function PSPLogo({ isDark, isPrint = false, size = "small" }) {
  const [imgError, setImgError] = useState(false);
  const mainTextColor = isPrint ? "text-slate-900" : (isDark ? "text-white" : "text-slate-900");
  const accentColor = isPrint ? "text-[#4a2c8c]" : (isDark ? "text-cyan-500" : "text-indigo-600");
  
  const logoDim = size === "large" ? "w-24 h-24" : "w-10 h-10";

  return (
    <div className={`flex items-center gap-3 select-none ${isPrint ? 'mb-8' : ''}`}>
      <div className={`${logoDim} shrink-0 flex items-center justify-center`}>
        {!imgError ? (
          <img 
            src="/logo.png" 
            alt="PSP Instruments" 
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg">P</div>
        )}
      </div>
      <div className="flex flex-col font-black">
        <span className={`font-black ${size === "large" ? 'text-2xl' : 'text-base'} tracking-tighter leading-none ${mainTextColor}`}>
          PSP <span className={`${accentColor} italic`}>INSTRUMENTS</span>
        </span>
        <span className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-black uppercase tracking-[0.4em]`}>Potentiostat v1.0</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, xLabel, theme }) {
  if (active && payload && payload.length) {
    const isDark = theme === 'dark';
    const bg = isDark ? 'bg-[#0f172a]/95 border-cyan-500/30' : 'bg-white border-indigo-200 shadow-xl';
    const valueColor = isDark ? 'text-white' : 'text-slate-900';

    return (
      <div className={`${bg} border-2 p-4 rounded-xl backdrop-blur-xl transition-all font-black`}>
        <div className="flex flex-col gap-2">
          <div className={`flex justify-between items-center gap-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} pb-2`}>
            <span className={`text-[10px] font-black uppercase tracking-widest leading-none text-slate-400`}>{String(xLabel)}</span>
            <span className={`${valueColor} text-xs font-mono font-bold`}>{String(payload[0].value)}</span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">Readout</span>
            <span className={`${valueColor} text-xs font-mono font-bold`}>{String(payload[0].payload.i)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function ParamInput({ label, unit, value, onChange, theme, range }) {
  const isDark = theme === 'dark';
  const labelColor = isDark ? 'text-slate-500' : 'text-slate-700';
  const inputBase = isDark 
    ? 'bg-[#0f172a]/40 border-white/5 text-white focus:ring-cyan-500/20 focus:border-cyan-500/50' 
    : 'bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/10 focus:border-indigo-600';

  return (
    <div className="space-y-1 group animate-in fade-in duration-300 w-full font-black">
      <div className="flex justify-between items-center px-1">
        <label className={`text-[9px] font-black ${labelColor} uppercase tracking-widest leading-none transition-colors group-hover:text-cyan-500`}>
          {String(label)}
        </label>
        {unit && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-tighter shadow-sm border transition-all
            ${isDark ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-indigo-600 text-white border-indigo-700'}`}>
            {String(unit)}
          </span>
        )}
      </div>
      <div className="relative">
        <input 
          type="number" value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition-all shadow-sm ${inputBase}`} 
        />
      </div>
      {range && (
        <div className="flex justify-end px-1 pt-0.5">
           <span className={`text-[8px] font-black italic tracking-tight ${isDark ? 'text-cyan-400 underline decoration-cyan-500/30' : 'text-indigo-800'}`}>
             Range: {range}
           </span>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon: Icon, isDark }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-cyan-500/10 text-cyan-500' : 'bg-indigo-50 text-indigo-600'}`}>
        <Icon size={14} />
      </div>
      <div className="flex flex-col min-w-0 overflow-hidden font-black">
        <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{String(label)}</span>
        <span className={`text-[10px] font-mono font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{String(value)}</span>
      </div>
    </div>
  );
}

/**
 * MAIN APPLICATION COMPONENT
 */

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState('dashboard'); 
  const [activeStep, setActiveStep] = useState(3); // Start at Dashboard (Step 3)
  const [activeTechnique, setActiveTechnique] = useState('cv');
  const [isRunning, setIsRunning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPort, setConnectedPort] = useState("No Device Detected");
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: "System Ready. Initialized in Light Mode.", type: "system" }]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showDevicePane, setShowDevicePane] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [pendingTechnique, setPendingTechnique] = useState(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [themeMode, setThemeMode] = useState('light'); // Set Light Theme as default
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [expandedGroups, setExpandedGroups] = useState(['Voltammetry', 'System']);

  const terminalEndRef = useRef(null);
  const portRef = useRef(null); 
  const serialBuffer = useRef(""); 
  const isRunningRef = useRef(false); // Ref for loop access

  // Consolidated parameters state
  const [p, setP] = useState(JSON.parse(JSON.stringify(DEFAULT_PARAMETERS)));

  const sessionStats = useMemo(() => {
    if (data.length === 0) return { peakPot: "0.000", charge: "0.0" };
    const peakPoint = data.reduce((max, point) => Math.abs(point.i) > Math.abs(max.i) ? point : max, data[0]);
    const totalCharge = data.reduce((sum, point) => sum + Math.abs(point.i) * 0.1, 0);
    return { peakPot: peakPoint.x.toFixed(3), charge: (totalCharge/10).toFixed(1) };
  }, [data]);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-99), { time: new Date().toLocaleTimeString(), msg: String(msg), type }]);
  };

  // Sync ref with state for internal async functions
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Scroll to bottom of terminal whenever logs update
  useEffect(() => {
    if (showTerminal) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showTerminal]);

  const update = (tech, key, val) => setP(prev => ({ ...prev, [tech]: { ...prev[tech], [key]: val } }));

  const getXReadoutLabel = () => {
    if (activeTechnique === 'zra') return 'Time';
    if (['cv', 'lsv', 'dpv', 'swv', 'sv', 'tafel', 'lpr', 'corrosion', 'calibrate'].includes(activeTechnique)) return 'Potential';
    return 'Time';
  };

  const getYReadoutLabel = () => {
    if (activeTechnique === 'ocp') return 'Potential';
    return 'Current';
  };

  const getXUnit = () => getXReadoutLabel() === 'Potential' ? 'V' : 's';
  const getYUnit = () => getYReadoutLabel() === 'Potential' ? 'V' : 'µA';

  /**
   * AUTOMATIC HARDWARE MONITORING
   */
  useEffect(() => {
    if (!("serial" in navigator)) return;

    const checkPorts = async () => {
        try {
            const ports = await navigator.serial.getPorts();
            if (ports.length > 0) {
                const info = ports[0].getInfo();
                const portName = info.usbVendorId ? `COM-USB (VID:${info.usbVendorId})` : "COM-PORT";
                addLog(`Authorized hardware detected: ${portName}. Ready to connect.`, "system");
            }
        } catch (err) {}
    };
    checkPorts();

    const handleDisconnectEvent = (e) => {
      if (portRef.current === e.port) {
        setIsConnected(false);
        setConnectedPort("Disconnected");
        addLog("Hardware Alert: Potentiostat link severed.", "error");
        portRef.current = null;
      }
    };
    navigator.serial.addEventListener('disconnect', handleDisconnectEvent);
    return () => navigator.serial.removeEventListener('disconnect', handleDisconnectEvent);
  }, []);

  /**
   * NAVIGATION & EXPERIMENT LOGIC
   */
  const handleSelectTechnique = (id) => {
    if (isRunning) {
      setPendingTechnique(id);
      setShowStopConfirmation(true);
    } else {
      setActiveTechnique(id);
      setData([]);
      setActiveView('dashboard');
      setShowDevicePane(false); 
      addLog(`Technique Initialized: ${techInfo[id].label}`, "info");
      setActiveMenu(null);
      if (window.innerWidth < 1024) setIsSidebarOpen(false); 
    }
  };

  const applyPendingTechnique = () => {
    // Terminate current if running
    if (isRunning) {
       sendToHardware('s');
       setIsRunning(false);
       isRunningRef.current = false;
    }
    const id = pendingTechnique;
    setActiveTechnique(id);
    setData([]);
    setActiveView('dashboard');
    setShowDevicePane(false);
    addLog(`Technique Switched: ${techInfo[id].label}`, "info");
    setPendingTechnique(null);
    setShowStopConfirmation(false);
  };

  const sendToHardware = async (msg) => {
    if (!portRef.current || !portRef.current.writable) {
      addLog("Write Error: No active workstation link.", "error");
      return;
    }
    const writer = portRef.current.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(msg + '\n'));
      addLog(`DEBUG: Sending '${msg}' command to hardware.`, "system");
    } catch (err) {
      addLog(`TX Error: ${err.message}`, "error");
    } finally {
      writer.releaseLock();
    }
  };

  const handleConnect = async () => {
    if (!("serial" in navigator)) {
      addLog("Browser mismatch: Web Serial API not detected.", "error");
      return;
    }
    setIsConnecting(true);
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 }); 
      portRef.current = port;
      
      const info = port.getInfo();
      const portName = info.usbVendorId ? `COM-USB (VID:${info.usbVendorId})` : "COM-PORT (Serial)";
      setConnectedPort(portName);
      setIsConnected(true);
      setActiveStep(3); 
      addLog(`Handshake Established on ${portName} at 9600 baud.`, "system");
      readFromSerial();
    } catch (err) {
      addLog(`Handshake Failed: ${err.message || 'Access denied'}`, "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (isRunning) {
        // Force stop if running
        await sendToHardware('s');
        setIsRunning(false);
        isRunningRef.current = false;
    }
    if (portRef.current) {
        try {
            await portRef.current.close();
            addLog("Workstation link closed successfully.", "system");
        } catch (err) {
            addLog(`Close Error: ${err.message}`, "error");
        } finally {
            portRef.current = null;
            setIsConnected(false);
            setConnectedPort("No Device Detected");
        }
    }
  };

  const readFromSerial = async () => {
    while (portRef.current && portRef.current.readable) {
      const reader = portRef.current.readable.getReader();
      try {
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          serialBuffer.current += decoder.decode(value);
          if (serialBuffer.current.includes('\n')) {
            const lines = serialBuffer.current.split('\n');
            serialBuffer.current = lines.pop(); 
            lines.forEach(line => { 
              const trimmed = line.trim();
              if (trimmed) {
                 addLog(`DEBUG: Raw Serial: '${trimmed}'`, "info"); 
                 if (isRunningRef.current) processIncomingData(trimmed);
              }
            });
          }
        }
      } catch (err) {
        addLog(`Read Error: ${err.message}`, "error");
        break;
      } finally {
        reader.releaseLock();
      }
    }
  };

  const processIncomingData = (line) => {
    // Robust parser replicating Python plotting.py logic
    const cleanLine = line
      .replace(/plotting\s*(OCP|LPR|TAFEL|CV|LSV|ZRA)?/i, '')
      .replace(/\{|\}/g, '')
      .trim();
    
    if (!cleanLine || cleanLine.includes('#')) return;

    const parts = cleanLine.split(',').map(p => p.trim());
    const numericParts = parts.map(p => {
        // Handle tagged values like E:1.23 or just numeric parts
        if (p.includes(':')) return parseFloat(p.split(':')[1]);
        return parseFloat(p);
    }).filter(n => !isNaN(n));

    if (activeTechnique === 'zra' && numericParts.length >= 3) {
      // For ZRA, we receive Time, Voltage, Current
      const t = numericParts[0];
      const v = numericParts[1];
      const i = numericParts[2];
      setData(prev => [...prev.slice(-2000), { t, v, i, x: t }]); // Store all 3 for dual plotting
    } else if (numericParts.length >= 2) {
      // Logic mapping to Python: val1 is Potential/Time, val2 is Current/Potential
      const xVal = numericParts[0];
      const yVal = numericParts[1];
      // For consistency, store in generic t, v, i slots too
      setData(prev => [...prev.slice(-2000), { x: xVal, i: yVal, t: xVal, v: yVal }]);
    }
  };

  const handleRunExperiment = () => {
    if (!isConnected || !portRef.current) {
        addLog("Hardware Link Offline. Please use 'Connect' first.", "error");
        return;
    }

    if (!isRunning) {
      let cmd = techInfo[activeTechnique].cmd;
      const params = p[activeTechnique];

      // Dynamic command construction matching working hardware protocols
      switch(activeTechnique) {
        case 'cv':
          cmd = `${cmd},${params.initE},${params.finalE},${params.scanRate},${params.stepE},${params.scans}`;
          break;
        case 'ca':
          cmd = `${cmd},${params.initE},${params.preTime},${params.s1E},${params.s1T},${params.s2E},${params.s2T}`;
          break;
        case 'sv':
          cmd = `${cmd},${params.initE},${params.finalE},${params.scanRate},${params.stepE},${params.depE},${params.depT}`;
          break;
        case 'ocp':
        case 'zra':
        case 'calibrate':
          cmd = `${cmd},${params.duration}`;
          break;
        default:
          cmd = `${cmd},${params.initE || 0},${params.finalE || 0}`;
      }
      
      setData([]);
      isRunningRef.current = true;
      setIsRunning(true);
      addLog(`Executing: ${techInfo[activeTechnique].label}...`, "system");
      sendToHardware(cmd);
    } else {
      sendToHardware('s'); 
      isRunningRef.current = false;
      setIsRunning(false);
      addLog("DEBUG: Sending 's' (stop) command to hardware.", "error");
    }
  };

  const handleSaveData = () => {
    if (data.length === 0) {
        addLog("No data available to save.", "error");
        return;
    }
    try {
        const isZRA = activeTechnique === 'zra';
        const xHeader = isZRA ? 'Time (s)' : `${getXReadoutLabel()} (${getXUnit()})`;
        const yHeader = isZRA ? 'Voltage (V),Current (µA)' : `${getYReadoutLabel()} (${getYUnit()})`;
        
        const csvContent = [
            isZRA ? "Time (s),Voltage (V),Current (µA)" : `${xHeader},${yHeader}`,
            ...data.map(r => isZRA ? `${r.t},${r.v},${r.i}` : `${r.x},${r.i}`)
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `PSP_${activeTechnique.toUpperCase()}_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addLog("CSV data exported successfully.", "system");
    } catch (err) {
        addLog(`Save Error: ${err.message}`, "error");
    }
  };

  const handleSaveParameters = () => {
    addLog(`Configuration saved for current session.`, "system");
  };

  const loadDefaults = () => {
    setP(prev => ({ ...prev, [activeTechnique]: JSON.parse(JSON.stringify(DEFAULT_PARAMETERS[activeTechnique])) }));
    addLog(`Defaults loaded for ${techInfo[activeTechnique].label}`, "info");
  };

  const expandAll = () => setExpandedGroups([...experimentGroups]);
  const collapseAll = () => setExpandedGroups([]);

  useEffect(() => {
    if (isRunning) {
        setActiveStep(4); 
    } else if (data.length > 0 && !isRunning) {
        setActiveStep(5);
    } else if (activeTechnique === 'calibrate') {
        setActiveStep(2);
    } else {
        setActiveStep(3); 
    }
  }, [isRunning, data.length, activeTechnique]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setResolvedTheme(themeMode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : themeMode);
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeMode]);

  const isDark = resolvedTheme === 'dark';
  const xLabelText = ['cv', 'lsv', 'dpv', 'swv', 'sv', 'tafel', 'lpr', 'corrosion', 'calibrate'].includes(activeTechnique) ? 'Potential (V)' : 'Time (s)';

  const renderViewContent = () => {
    switch (activeView) {
      case 'about':
        return (
          <div className="flex-1 overflow-y-auto p-4 lg:p-12 flex flex-col items-center animate-in fade-in duration-500 font-black">
            <div className="max-w-3xl w-full bg-white dark:bg-[#0f172a] rounded-[2.5rem] lg:rounded-[3rem] p-8 lg:p-16 border border-slate-200 dark:border-white/5 shadow-2xl">
              <PSPLogo isDark={isDark} size="large" />
              <h1 className="text-3xl font-black mb-6 tracking-tighter uppercase italic text-slate-800 dark:text-white leading-none mt-8">About PSP</h1>
              <div className="space-y-6 text-slate-500 dark:text-slate-400 font-black leading-relaxed text-sm text-justify">
                <p>Precision electrochemical workstations and analysis software designed for modern researchers.</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="flex-1 overflow-y-auto p-4 lg:p-12 animate-in slide-in-from-bottom-4 duration-500 font-black">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-12 text-slate-800 dark:text-white">Contact</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl font-black">
                  <h3 className="text-xl font-black uppercase mb-4 tracking-tight text-slate-800 dark:text-white">Support</h3>
                  <p className="text-sm">+91 9172495510</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <main className="flex flex-1 overflow-hidden p-3 lg:p-6 gap-6 relative flex-col lg:flex-row font-black">
            <aside className={`
              fixed lg:relative inset-y-0 left-0 z-40 w-72 lg:w-64 transform transition-transform duration-300 ease-in-out font-black
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              ${isDark ? 'bg-[#0f172a]/95 lg:bg-[#0f172a]/40 border-white/5 shadow-2xl' : 'bg-white lg:bg-white border-slate-300 shadow-xl'} 
              backdrop-blur-xl border-r lg:border rounded-r-[2rem] lg:rounded-[2rem] flex flex-col py-6 overflow-hidden
            `}>
              <div className="px-6 mb-4 flex items-center justify-between font-black">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2 font-black"><Beaker size={14} className="text-cyan-500" /> Experiments</span>
              </div>
              {/* Expand/Collapse All Buttons */}
              <div className="px-6 mb-6 flex gap-4 font-black">
                 <button onClick={expandAll} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400 hover:underline">Expand All</button>
                 <button onClick={collapseAll} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:underline">Collapse All</button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-2 font-black">
                {experimentGroups.map(group => {
                  const isExpanded = expandedGroups.includes(group);
                  return (
                    <div key={group} className="flex flex-col font-black">
                      <button onClick={() => setExpandedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-indigo-400 font-black' : 'hover:bg-slate-50 text-indigo-600 font-black'} font-black uppercase text-[10px] tracking-widest font-black`}>
                        {group} {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      {isExpanded && (
                        <div className="flex flex-col gap-1 mt-1 ml-2 animate-in slide-in-from-top-1 duration-300 font-black">
                          {Object.entries(techInfo).filter(([_, info]) => info.group === group).map(([id, info]) => (
                            <button key={id} onClick={() => handleSelectTechnique(id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${activeTechnique === id ? (isDark ? 'bg-cyan-500 text-black shadow-lg border-cyan-500 font-black' : 'bg-[#4a2c8c] text-white border-[#4a2c8c] font-black') : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-slate-600 dark:text-slate-400 font-black'}`}>{info.icon} <span className="truncate">{info.label}</span></button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            <section className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0 font-black">
              <div className={`${isDark ? 'bg-[#0f172a]/40 border-white/5 shadow-2xl' : 'bg-white border-slate-300 shadow-xl'} backdrop-blur-3xl p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border flex flex-1 flex-col relative min-h-0 font-black`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 px-2 gap-4 font-black">
                  <div className="flex items-center gap-5 font-black">
                    <div className={`w-12 h-12 lg:w-14 lg:h-14 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-indigo-50 border-slate-100'} rounded-2xl flex items-center justify-center shadow-sm shrink-0 font-black`}>{techInfo[activeTechnique].icon}</div>
                    <div className="flex flex-col font-black">
                      <div className="flex items-center gap-3 font-black">
                        <h2 className={`text-xl lg:text-2xl font-black italic uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-800'} font-black font-black`}>{techInfo[activeTechnique].label}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                           {isConnected ? `Status: device connected on ${connectedPort}` : 'Status: OFFLINE'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`}>{isRunning ? 'TRANSMITTING' : 'IDLE'}</span>
                    </div>
                  </div>

                  <div className={`flex gap-6 lg:gap-8 items-center px-6 lg:px-10 py-3 lg:py-4 rounded-full border shadow-lg transition-all animate-in zoom-in-95 duration-500 ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200'} font-black`}>
                    <div className="flex flex-col items-center font-black">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40 font-black">{activeTechnique === 'zra' ? 'Voltage' : getXReadoutLabel()}</span>
                      <div className="flex items-baseline gap-1 font-black">
                        <span className={`text-xl lg:text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-[#4a2c8c]'}`}>
                          {isRunning ? (activeTechnique === 'zra' ? (data[data.length-1]?.v || 0).toFixed(3) : (data[data.length-1]?.x || 0).toFixed(3)) : '0.000'}
                        </span>
                        <span className="text-[10px] font-black opacity-40 font-black">{activeTechnique === 'zra' ? 'V' : getXUnit()}</span>
                      </div>
                    </div>
                    <div className="w-[1px] h-8 lg:h-10 bg-slate-100 dark:bg-white/10 font-black"></div>
                    <div className="flex flex-col items-center font-black">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40 font-black">{getYReadoutLabel()}</span>
                      <div className="flex items-baseline gap-1 font-black">
                        <span className={`text-xl lg:text-2xl font-black font-mono text-cyan-600`}>
                          {isRunning ? (data[data.length-1]?.i || 0).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[10px] font-black opacity-40 font-black">{getYUnit()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end lg:self-auto font-black font-black">
                    {!isConnected ? (
                      <button onClick={handleConnect} title="Connect Device" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
                        <Link2 size={16}/> Connect
                      </button>
                    ) : (
                      <button onClick={handleDisconnect} title="Disconnect Device" className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg">
                        <Unplug size={16}/> Disconnect
                      </button>
                    )}
                    <button onClick={() => setShowTerminal(!showTerminal)} title="System Terminal" className={`p-3 rounded-2xl border transition-all ${showTerminal ? 'bg-cyan-500 text-black shadow-lg border-cyan-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-slate-400'}`}><Terminal size={18}/></button>
                    <button onClick={handleSaveParameters} title="Save Parameters" className="p-3 rounded-2xl border bg-slate-100 hover:bg-slate-200 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-500"><Save size={18} /></button>
                  </div>
                </div>

                <div className={`flex-1 flex flex-col min-h-0 relative font-black`}>
                  <div className={`flex-1 ${isDark ? 'bg-[#020617]/80 shadow-inner' : 'bg-[#fcfdff] border-slate-300 shadow-inner'} rounded-[2.5rem] border-2 p-3 lg:p-6 relative font-black overflow-y-auto`}>
                    {activeTechnique === 'zra' ? (
                      <div className="flex flex-col h-full gap-8">
                        <div className="flex-1 min-h-[220px]">
                          <div className="flex justify-between items-center mb-2 px-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voltage vs Time</h3>
                            <span className="text-[10px] font-mono text-indigo-600">{data[data.length-1]?.v?.toFixed(3) || '0.000'} V</span>
                          </div>
                          <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                              <XAxis dataKey="t" type="number" domain={['auto', 'auto']} stroke="#64748b" fontSize={10} fontWeight="black" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                              <YAxis dataKey="v" stroke="#64748b" fontSize={10} fontWeight="black" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip xLabel="Time" theme={resolvedTheme} />} />
                              <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 min-h-[220px]">
                          <div className="flex justify-between items-center mb-2 px-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current vs Time</h3>
                            <span className="text-[10px] font-mono text-cyan-600">{data[data.length-1]?.i?.toFixed(2) || '0.00'} µA</span>
                          </div>
                          <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                              <XAxis dataKey="t" type="number" domain={['auto', 'auto']} stroke="#64748b" fontSize={10} fontWeight="black" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                              <YAxis dataKey="i" stroke="#64748b" fontSize={10} fontWeight="black" label={{ value: 'Current (µA)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip xLabel="Time" theme={resolvedTheme} />} />
                              <Line type="monotone" dataKey="i" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                          <XAxis 
                            dataKey="x" 
                            type="number" 
                            domain={['auto', 'auto']} 
                            stroke="#64748b" 
                            fontSize={10} 
                            fontWeight="black" 
                            label={{ value: `${getXReadoutLabel()} (${getXUnit()})`, position: 'insideBottom', offset: -25, fill: '#64748b', fontSize: 12, fontWeight: 'black' }} 
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            fontWeight="black" 
                            label={{ value: `${getYReadoutLabel()} (${getYUnit()})`, angle: -90, position: 'insideLeft', offset: -45, fill: '#64748b', fontSize: 12, fontWeight: 'black' }} 
                          />
                          <Tooltip content={<CustomTooltip xLabel={getXReadoutLabel()} theme={resolvedTheme} />} />
                          <Line type="monotone" dataKey="i" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* SYSTEM TERMINAL OVERLAY */}
                  {showTerminal && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/95 border-t border-cyan-500/20 rounded-b-[2.5rem] z-[60] p-4 flex flex-col font-mono text-[10px] overflow-hidden animate-in slide-in-from-bottom-4 shadow-2xl">
                      <div className="flex justify-between items-center mb-2 px-2 border-b border-white/10 pb-1">
                        <span className="text-cyan-400 font-bold uppercase tracking-widest">Hardware Workstation Console</span>
                        <button onClick={() => setShowTerminal(false)} className="text-white/40 hover:text-white"><X size={14}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-1">
                        {logs.map((log, i) => (
                          <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-rose-400' : log.type === 'system' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                            <span className="opacity-30 shrink-0">[{log.time}]</span>
                            <span className="break-all font-medium">{log.msg}</span>
                          </div>
                        ))}
                        <div ref={terminalEndRef} />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`mt-6 flex flex-col md:flex-row items-center justify-between p-4 lg:p-5 rounded-[2rem] border gap-4 ${isDark ? 'bg-black/20 border-white/5 font-black' : 'bg-white shadow-inner font-black'}`}>
                  <div className="flex gap-10 font-mono text-[10px] font-black uppercase opacity-50 w-full md:w-auto font-black"><div>Handshake<br/><span className="text-slate-900 dark:text-white font-black">9.6 KBPS</span></div><div className="border-l pl-10 font-black font-black">Buffer<br/><span className="text-slate-900 dark:text-white font-black">{data.length} PTS</span></div></div>
                  <div className="flex gap-3 w-full md:w-auto font-black font-black">
                    <button onClick={handleSaveData} disabled={isRunning || data.length === 0} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${(isRunning || data.length === 0) ? 'opacity-20 grayscale font-black' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 dark:bg-white/5 dark:text-white font-black'}`}><FileSpreadsheet size={16} /> Export Data</button>
                    <button 
                      onClick={handleRunExperiment} 
                      className={`flex-[2] md:flex-none flex items-center justify-center gap-5 px-10 lg:px-16 py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl transition-all active:scale-95 font-black
                        ${isRunning ? 'bg-rose-600 text-white shadow-rose-600/30' : 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/40'}`}
                    >
                      {isRunning ? <><XCircle size={18} /> Stop Experiment</> : <><Play size={18} fill="currentColor"/> Run Experiment</>}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <aside className={`w-full lg:w-80 flex flex-col gap-6 shrink-0 font-black`}>
              <div className={`${isDark ? 'bg-[#0f172a]/40 border-white/5 shadow-2xl' : 'bg-white border-slate-300 shadow-xl'} backdrop-blur-2xl border rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-8 flex flex-col gap-8 min-h-full transition-all overflow-y-auto max-h-[70vh] lg:max-h-none font-black`}>
                {showDevicePane ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 font-black">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white font-black">Hardware Profile <HardDrive size={18} className="text-slate-400" /></div>
                    <div className="grid grid-cols-1 gap-2 font-black">
                      <DetailItem label="Instrument Model" value={deviceDetails.model} icon={Server} isDark={isDark} />
                      <DetailItem label="Serial Number" value={deviceDetails.serial} icon={Radio} isDark={isDark} />
                      <DetailItem label="Handshake Port" value={isConnected ? connectedPort : 'Not Connected'} icon={Cpu} isDark={isDark} />
                      <DetailItem label="Handshake Baud" value={deviceDetails.baud} icon={Zap} isDark={isDark} />
                      <DetailItem label="Instrument Limits" value={deviceDetails.compliance} icon={Gauge} isDark={isDark} />
                      <DetailItem label="ADC/DAC Res." value={deviceDetails.adc} icon={Layers} isDark={isDark} />
                      <DetailItem label="System Sampling" value={deviceDetails.sampling} icon={Activity} isDark={isDark} />
                      <DetailItem label="Firmware Revision" value={deviceDetails.firmware} icon={History} isDark={isDark} />
                    </div>
                    <button onClick={() => setShowDevicePane(false)} className="w-full py-3 rounded-xl border text-[9px] font-black uppercase bg-slate-50 hover:bg-slate-100 shadow-sm transition-all dark:bg-white/5 dark:text-white font-black font-black font-black">Configure Technique</button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 font-black">
                    <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-white/5 text-[11px] font-black uppercase text-slate-800 dark:text-white font-black font-black font-black">Control Panel <Settings size={18} className="text-slate-400" /></div>
                    <button onClick={loadDefaults} title="Reset to Factory Defaults" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 shadow-sm transition-all shadow-indigo-100 font-black"><RotateCcw size={12} /> Load Defaults</button>
                    <div className="space-y-5 lg:overflow-y-auto lg:max-h-[60vh] scrollbar-hide pr-1 pb-4 font-black">
                        {/* CV / LSV */}
                        {(activeTechnique === 'cv' || activeTechnique === 'lsv') && (
                          <>
                            <ParamInput label="Initial potential" unit="V" value={p[activeTechnique].initE} onChange={v => update(activeTechnique, 'initE', v)} theme={resolvedTheme} range="-2.5v to +2.5v" />
                            <ParamInput label="Final potential" unit="V" value={p[activeTechnique].finalE} onChange={v => update(activeTechnique, 'finalE', v)} theme={resolvedTheme} range="-2.5v to +2.5v" />
                            <ParamInput label="Scan rate" unit="mV/Sec" value={p[activeTechnique].scanRate} onChange={v => update(activeTechnique, 'scanRate', v)} theme={resolvedTheme} range="2mv/Sec to 200mv/Sec" />
                            <ParamInput label="Step potential" unit="mV" value={p[activeTechnique].stepE} onChange={v => update(activeTechnique, 'stepE', v)} theme={resolvedTheme} range="1mv to 100mv" />
                            {activeTechnique === 'cv' && <ParamInput label="No. of scans" value={p.cv.scans} onChange={v => update('cv', 'scans', v)} theme={resolvedTheme} range="1 to 10" />}
                          </>
                        )}
                        
                        {activeTechnique === 'ca' && (
                          <>
                            <ParamInput label="Initial potential" unit="V" value={p.ca.initE} onChange={v => update('ca', 'initE', v)} theme={resolvedTheme} range="-2.5V to +2.5V" />
                            <ParamInput label="Pre step time" unit="sec" value={p.ca.preTime} onChange={v => update('ca', 'preTime', v)} theme={resolvedTheme} />
                            <div className="p-3 bg-slate-100 dark:bg-black/20 rounded-2xl space-y-4 border border-dashed border-slate-300 dark:border-white/10">
                              <ParamInput label="First Step potential" unit="V" value={p.ca.s1E} onChange={v => update('ca', 's1E', v)} theme={resolvedTheme} />
                              <ParamInput label="First Step time" unit="sec" value={p.ca.s1T} onChange={v => update('ca', 's1T', v)} theme={resolvedTheme} />
                            </div>
                            <div className="p-3 bg-slate-100 dark:bg-black/20 rounded-2xl space-y-4 border border-dashed border-slate-300 dark:border-white/10">
                              <ParamInput label="Second Step potential" unit="V" value={p.ca.s2E} onChange={v => update('ca', 's2E', v)} theme={resolvedTheme} />
                              <ParamInput label="Second Step time" unit="sec" value={p.ca.s2T} onChange={v => update('ca', 's2T', v)} theme={resolvedTheme} />
                            </div>
                          </>
                        )}

                        {['ocp', 'zra', 'calibrate'].includes(activeTechnique) && (
                          <ParamInput label="Process time" unit="sec" value={p[activeTechnique].duration} onChange={v => update(activeTechnique, 'duration', v)} theme={resolvedTheme} range="1sec to 100,000sec" />
                        )}

                        {activeTechnique === 'sv' && (
                          <>
                            <ParamInput label="Initial potential" unit="V" value={p.sv.initE} onChange={v => update('sv', 'initE', v)} theme={resolvedTheme} />
                            <ParamInput label="Final potential" unit="V" value={p.sv.finalE} onChange={v => update('sv', 'finalE', v)} theme={resolvedTheme} />
                            <ParamInput label="Step potential" unit="mV" value={p.sv.stepE} onChange={v => update('sv', 'stepE', v)} theme={resolvedTheme} />
                            <ParamInput label="Scan rate" unit="mV/Sec" value={p.sv.scanRate} onChange={v => update('sv', 'scanRate', v)} theme={resolvedTheme} />
                            <ParamInput label="Deposition potential" unit="V" value={p.sv.depE} onChange={v => update('sv', 'depE', v)} theme={resolvedTheme} />
                            <ParamInput label="Deposition time" unit="sec" value={p.sv.depT} onChange={v => update('sv', 'depT', v)} theme={resolvedTheme} />
                          </>
                        )}

                        {(activeTechnique === 'dpv' || activeTechnique === 'swv') && (
                          <>
                            <ParamInput label="Start Potential" unit="V" value={p[activeTechnique].initE} onChange={v => update(activeTechnique, 'initE', v)} theme={resolvedTheme} />
                            <ParamInput label="End Potential" unit="V" value={p[activeTechnique].finalE} onChange={v => update(activeTechnique, 'finalE', v)} theme={resolvedTheme} />
                            <ParamInput label="Step Potential" unit="mV" value={p[activeTechnique].stepE} onChange={v => update(activeTechnique, 'stepE', v)} theme={resolvedTheme} />
                            <ParamInput label="Pulse Amplitude" unit="mV" value={p[activeTechnique].pAmp} onChange={v => update(activeTechnique, 'pAmp', v)} theme={resolvedTheme} />
                            {activeTechnique === 'dpv' && (
                              <>
                                <ParamInput label="Pulse Width" unit="ms" value={p.dpv.pWidth} onChange={v => update('dpv', 'pWidth', v)} theme={resolvedTheme} />
                                <ParamInput label="Pulse Period" unit="ms" value={p.dpv.stepTime} onChange={v => update('dpv', 'stepTime', v)} theme={resolvedTheme} />
                              </>
                            )}
                            {activeTechnique === 'swv' && <ParamInput label="Frequency" unit="Hz" value={p.swv.freq} onChange={v => update('swv', 'freq', v)} theme={resolvedTheme} />}
                          </>
                        )}

                        {(activeTechnique === 'lpr' || activeTechnique === 'tafel' || activeTechnique === 'corrosion') && (
                          <>
                            {activeTechnique === 'corrosion' && (
                              <div className="grid grid-cols-2 gap-3">
                                <ParamInput label="Sample Area" unit="cm²" value={p.corrosion.area} onChange={v => update('corrosion', 'area', v)} theme={resolvedTheme} />
                                <ParamInput label="Density" unit="g/cm³" value={p.corrosion.density} onChange={v => update('corrosion', 'density', v)} theme={resolvedTheme} />
                              </div>
                            )}
                            <ParamInput label="Start Potential" unit="V" value={p[activeTechnique].initE} onChange={v => update(activeTechnique, 'initE', v)} theme={resolvedTheme} />
                            <ParamInput label="End Potential" unit="V" value={p[activeTechnique].finalE} onChange={v => update(activeTechnique, 'finalE', v)} theme={resolvedTheme} />
                            <ParamInput label="Step Potential" unit="mV" value={p[activeTechnique].stepE} onChange={v => update(activeTechnique, 'stepE', v)} theme={resolvedTheme} />
                          </>
                        )}

                        <button onClick={() => setShowDevicePane(true)} className="w-full py-3 rounded-xl border text-[9px] font-black uppercase bg-slate-50 hover:bg-slate-100 shadow-sm mt-4 dark:bg-white/5 dark:text-white font-black font-black font-black">Hardware Profile</button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </main>
        );
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-[#f8f9fc] text-slate-900'} font-sans select-none overflow-hidden transition-colors duration-500 relative font-black font-black font-black`}>
      <header className={`h-16 ${isDark ? 'bg-[#0f172a]/80 border-white/5 shadow-2xl' : 'bg-[#4a2c8c] text-white shadow-xl'} backdrop-blur-2xl border-b flex items-center justify-between px-4 lg:px-8 z-50 shrink-0 font-black`}>
        <div className="flex items-center gap-8 font-black">
          <div className="cursor-pointer hover:opacity-80 transition-opacity font-black" onClick={() => { setActiveView('dashboard'); setActiveMenu(null); }}>
            <PSPLogo isDark={isDark} />
          </div>
          <nav className="hidden lg:flex items-center gap-1 font-black">
            <div className="relative group font-black">
              <button onClick={() => { setActiveView('dashboard'); setActiveMenu(null); }} onMouseEnter={() => setActiveMenu('experiments')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeMenu === 'experiments' || activeView === 'dashboard' ? 'bg-white/10 text-cyan-400 font-black' : 'hover:bg-white/5 font-black'}`}>Experiments</button>
              {activeMenu === 'experiments' && (
                <div onMouseLeave={() => setActiveMenu(null)} className="absolute top-full left-0 mt-2 w-[520px] grid grid-cols-2 p-6 bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl z-[60] animate-in slide-in-from-top-2 duration-200 font-black">
                  {experimentGroups.map(group => (
                    <div key={group} className="p-3 font-black">
                      <h4 className="text-[10px] font-black text-indigo-600 dark:text-cyan-500 uppercase tracking-[0.2em] mb-3 border-b border-slate-100 dark:border-white/5 pb-2 font-black">{group}</h4>
                      <div className="space-y-1 font-black">
                        {Object.entries(techInfo).filter(([_, info]) => info.group === group).map(([id, info]) => (
                          <button key={id} onClick={() => handleSelectTechnique(id)} className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white transition-all font-black">{info.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {['Documentation', 'Help', 'Contact', 'About'].map(item => (
              <button key={item} onClick={() => { setActiveView(item.toLowerCase()); setActiveMenu(null); }} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeView === item.toLowerCase() ? 'bg-white/10 text-cyan-400 font-black' : 'hover:bg-white/5 font-black'}`}>{item}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 font-black">
          <div className="flex p-1 rounded-xl bg-black/20 border border-white/10 items-center shadow-inner font-black">
            {[ { id: 'light', icon: Sun, label: 'Light Theme' }, { id: 'system', icon: Monitor, label: 'System Theme' }, { id: 'dark', icon: Moon, label: 'Dark Theme' } ].map(t => (
              <button key={t.id} onClick={() => setThemeMode(t.id)} title={t.label} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${themeMode === t.id ? (isDark ? 'bg-cyan-500 text-black shadow-md font-black' : 'bg-white text-[#4a2c8c] shadow-md font-black') : 'text-white/40 hover:text-white font-black font-black'}`}><t.icon size={12} /></button>
            ))}
          </div>
        </div>
      </header>

      <nav className={`h-20 ${isDark ? 'bg-[#020617]' : 'bg-white shadow-sm'} flex items-center justify-center gap-8 lg:gap-24 relative z-20 shrink-0 transition-all font-black font-black`}>
        <div className={`absolute top-1/2 left-[15%] right-[15%] h-[1px] ${isDark ? 'bg-white/5 font-black' : 'bg-slate-200 font-black'} -translate-y-1/2 hidden md:block font-black`}></div>
        {['Connect', 'Calibrate', 'Technique', 'Run', 'Analyze'].map((step, idx) => (
          <div key={step} className="flex flex-col items-center gap-2 relative font-black font-black font-black">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-700 ${activeStep >= idx + 1 ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg scale-110 font-black' : 'border-slate-100 text-slate-300 font-black'}`}>{activeStep > idx + 1 ? <CheckCircle size={20} /> : idx + 1}</div>
            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${activeStep >= idx + 1 ? 'text-emerald-500 font-black' : 'text-slate-400 font-black'}`}>{step}</span>
          </div>
        ))}
      </nav>

      {/* Connection Overlay (Default Step 3 means this is hidden) */}
      {activeStep === 1 && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl ${isDark ? 'bg-black/60 font-black' : 'bg-white/60 font-black'} animate-in fade-in duration-500 font-black font-black`}>
          <div className={`p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3rem] border-2 shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col items-center text-center max-w-[90%] lg:max-w-md animate-in zoom-in-95 duration-500 ${isDark ? 'bg-[#0f172a] border-white/5 font-black' : 'bg-white border-indigo-50 font-black'} font-black font-black`}>
            <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center mb-6 lg:mb-8 shadow-2xl ${isConnecting ? 'animate-pulse bg-emerald-500 shadow-emerald-500/20 font-black' : 'bg-indigo-600 shadow-indigo-600/20 text-white font-black font-black font-black'}`}>
              <Power size={40} className={isConnecting ? "animate-spin text-white font-black" : "font-black"} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black italic mb-2 tracking-tighter uppercase text-slate-800 dark:text-white leading-none text-center font-black">System Initialization</h2>
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] mb-6 lg:mb-8 text-emerald-500 font-bold font-black">PROTOCOL ACTIVE</p>
            <p className="text-xs lg:text-sm font-bold uppercase tracking-widest mb-10 text-slate-500 px-2 lg:px-6 leading-relaxed text-center font-black">
              Verify that the <span className="text-indigo-600 dark:text-cyan-400 underline font-black">PSP Instruments Potentiostat</span> is powered and USB is securely connected to the workstation.
            </p>
            <button onClick={handleConnect} disabled={isConnecting} className="w-full py-4 lg:py-5 bg-[#4a2c8c] text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] text-[10px] lg:text-xs active:scale-95 transition-all hover:bg-indigo-700 font-black font-black font-black">
              {isConnecting ? "Detecting Port..." : "Connect to POTENTIOSTAT"}
            </button>
            <button onClick={() => setActiveStep(3)} className="mt-4 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600">Skip to Dashboard</button>
          </div>
        </div>
      )}

      {/* Switch Experiment Confirmation Modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="p-8 bg-white rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-200">
            <div className="flex items-center gap-4 mb-6 text-rose-600">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-black uppercase tracking-tight">Experiment Running</h3>
            </div>
            <p className="text-sm font-bold text-slate-600 mb-8 leading-relaxed">
                An active measurement is currently in progress. Would you like to stop it and switch to <span className="text-[#4a2c8c] underline decoration-indigo-600/30">{techInfo[pendingTechnique]?.label}</span>?
            </p>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => { setShowStopConfirmation(false); setPendingTechnique(null); }} className="py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
               <button onClick={applyPendingTechnique} className="py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all">Stop & Switch</button>
            </div>
          </div>
        </div>
      )}

      {renderViewContent()}

      <footer className={`h-10 ${isDark ? 'bg-[#0f172a]/60 text-slate-600 font-black' : 'bg-[#4a2c8c] text-indigo-100 font-black'} border-t px-4 lg:px-12 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] z-30 transition-all shadow-2xl shrink-0 font-black font-black font-black`}>
        <div className="flex gap-4 lg:gap-12 items-center font-black font-black font-black font-black font-black">
          <span className="flex items-center gap-3 font-black"><div className={`w-2.5 h-2.5 ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] font-black' : 'bg-rose-400 animate-pulse font-black'} rounded-full`}></div> PSP_NODE: {isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          <span className="opacity-60 font-black tracking-[0.1em] hidden sm:inline uppercase font-black font-black font-black">PLATFORM_LIMITS: {deviceDetails.compliance}</span>
        </div>
        <div className="flex gap-4 lg:gap-8 opacity-40 italic tracking-widest text-[8px] lg:text-[9px] font-black font-black font-black font-black">
           <span className="hidden xs:inline uppercase font-black font-black font-black">ADC: 16-BIT</span>
           <span className="hidden xs:inline uppercase font-black font-black font-black">SAMPLING: 10 KHZ</span>
        </div>
      </footer>
    </div>
  );
}