import React, { useState } from 'react';
import { 
  HardDrive, UploadCloud, Database, Cpu, Activity, RefreshCw, 
  Search, Filter, CheckCircle2, AlertTriangle, FileText, Play,
  FolderOpen, Settings, PlayCircle, Clock
} from 'lucide-react';

export default function Assets() {
  const [isUploading, setIsUploading] = useState(false);
  
  // Simulated hardware metrics to make it look alive
  const [metrics, setMetrics] = useState({
    cpu: 12,
    npu: 4,
    temp: 45,
    memory: 16
  });

  // Mock file queue data
  const [files, setFiles] = useState([
    { id: 1, name: "2023_零售行业研究报告终稿.pdf", type: "PDF", size: "12.5 MB", status: "completed", time: "10分钟前", progress: 100 },
    { id: 2, name: "某车企高管内部访谈_脱敏版.mp3", type: "Audio", size: "84.2 MB", status: "processing", time: "正在处理", progress: 45 },
    { id: 3, name: "财务模型测算_V2.xlsx", type: "Excel", size: "4.1 MB", status: "pending", time: "排队中", progress: 0 },
    { id: 4, name: "STM咨询标准方法论培训.ppt", type: "PPT", size: "32.0 MB", status: "completed", time: "昨天", progress: 100 },
    { id: 5, name: "A集团_项目结项汇报_2022.pdf", type: "PDF", size: "8.4 MB", status: "completed", time: "昨天", progress: 100 }
  ]);

  // Simulate progress update for the processing file
  React.useEffect(() => {
    const timer = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.status === 'processing') {
          const newProgress = f.progress + Math.floor(Math.random() * 5) + 1;
          if (newProgress >= 100) {
            return { ...f, progress: 100, status: 'completed', time: '刚刚' };
          }
          return { ...f, progress: newProgress };
        }
        return f;
      }));

      // Slightly fluctuate hardware metrics
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(5, Math.min(80, prev.cpu + (Math.random() > 0.5 ? 2 : -2))),
        npu: files.some(f => f.status === 'processing') ? Math.max(20, Math.min(90, prev.npu + (Math.random() > 0.5 ? 5 : -5))) : 4,
        temp: prev.cpu > 50 ? prev.temp + 1 : prev.temp - 1
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, [files]);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newFile = {
        id: Date.now(),
        name: "最新客户需求研讨会录音.wav",
        type: "Audio",
        size: "156.8 MB",
        status: "processing",
        time: "正在处理",
        progress: 0
      };
      setFiles(prev => [newFile, ...prev]);
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">本地资产与硬件管理 (STM-Box)</h2>
          <p className="text-sm text-gray-500 mt-1">管理物理机密文档的向量化队列与边缘算力终端状态</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
            <Settings size={16} /> 设备设置
          </button>
          <button 
            onClick={handleSimulateUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
            {isUploading ? '正在上传...' : '上传新资产'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Hardware Status Dashboard */}
        <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Cpu size={180} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <HardDrive className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">STM-Box Edge AI 终端 (Node-01)</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 text-xs font-bold tracking-wider">系统运行正常 | 内网隔离模式</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">持续运行时间</p>
                <p className="text-sm font-mono">45 天 12 小时 23 分</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
              <MetricBox 
                label="CPU 使用率" 
                value={`${metrics.cpu}%`} 
                sub={`核心温度 ${metrics.temp}°C`} 
                color="blue"
                percent={metrics.cpu}
              />
              <MetricBox 
                label="NPU (AI算力)" 
                value={`${metrics.npu}%`} 
                sub={metrics.npu > 10 ? "正在处理向量化任务" : "空闲状态"} 
                color="purple"
                percent={metrics.npu}
              />
              <MetricBox 
                label="内存占用" 
                value={`${metrics.memory}GB / 64GB`} 
                sub="正常" 
                color="emerald"
                percent={(metrics.memory/64)*100}
              />
              <MetricBox 
                label="安全私有存储" 
                value="1.2TB / 8.0TB" 
                sub="SSD 阵列健康" 
                color="orange"
                percent={(1.2/8.0)*100}
              />
            </div>
          </div>
        </div>

        {/* Knowledge Base Queue List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              智力资产向量化引擎队列
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索文件名..." 
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-48"
                />
              </div>
              <button className="p-1.5 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 transition" title="筛选">
                <Filter size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-100 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3">资产名称</th>
                  <th className="px-6 py-3 w-24">格式</th>
                  <th className="px-6 py-3 w-32">处理进度</th>
                  <th className="px-6 py-3 w-40">状态</th>
                  <th className="px-6 py-3 w-32">加入时间</th>
                  <th className="px-6 py-3 w-24 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {files.map(file => (
                  <FileRow key={file.id} file={file} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, color, percent }) {
  const bgColors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
      <div className="text-gray-400 text-xs mb-2 font-medium flex justify-between">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      
      {/* Mini Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
        <div className={`${bgColors[color]} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
      
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  );
}

function FileRow({ file }) {
  const { name, type, size, status, time, progress } = file;
  
  return (
    <tr className="hover:bg-blue-50/30 transition group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            type === 'PDF' ? 'bg-red-50 text-red-500 border border-red-100' : 
            type === 'PPT' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 
            type === 'Excel' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 
            'bg-purple-50 text-purple-500 border border-purple-100'
          }`}>
            {type === 'Audio' ? <PlayCircle size={16} /> : <FileText size={16} />}
          </div>
          <div>
            <div className="font-medium text-gray-900 group-hover:text-blue-700 transition truncate max-w-xs">{name}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{size}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">{type}</span>
      </td>
      <td className="px-6 py-4">
        {status === 'processing' ? (
          <div className="w-full max-w-[100px]">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-blue-600 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : status === 'completed' ? (
           <span className="text-emerald-500 text-sm"><CheckCircle2 size={16} /></span>
        ) : (
           <span className="text-gray-300 text-sm"><Clock size={16} /></span>
        )}
      </td>
      <td className="px-6 py-4">
        {status === 'completed' && <span className="text-emerald-700 font-medium text-xs flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>已向量化入库</span>}
        {status === 'processing' && <span className="text-blue-700 font-bold text-xs flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin text-blue-500" />多模态解析中...</span>}
        {status === 'pending' && <span className="text-gray-500 font-medium text-xs flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>等待 NPU 调度</span>}
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">{time}</td>
      <td className="px-6 py-4 text-right">
        {status === 'completed' ? (
          <button className="text-blue-600 hover:text-blue-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition">查看知识图谱</button>
        ) : status === 'processing' ? (
           <button className="text-red-500 hover:text-red-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition">中止任务</button>
        ) : null}
      </td>
    </tr>
  );
}