import React from 'react';
import { HardDrive, UploadCloud, Database, Cpu, Activity, RefreshCw } from 'lucide-react';

export default function Assets() {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">本地资产与硬件管理 (STM-Box)</h2>
          <p className="text-sm text-gray-500 mt-1">管理物理机密文档与边缘算力终端状态</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm flex items-center gap-2">
          <UploadCloud size={16} /> 上传新资产
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Hardware Status */}
        <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Cpu size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <HardDrive className="text-blue-400" size={24} />
              <h3 className="text-lg font-bold">STM-Box 边缘算力终端 (Node-01)</h3>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded flex items-center gap-1 border border-emerald-500/30">
                <Activity size={12} /> 在线运行中
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
              <MetricBox label="CPU 使用率" value="12%" sub="温度 45°C" />
              <MetricBox label="NPU (AI算力)" value="4%" sub="空闲状态" />
              <MetricBox label="内存占用" value="16GB / 64GB" sub="健康" />
              <MetricBox label="私有存储" value="1.2TB / 8TB" sub="SSD 阵列健康" />
            </div>
          </div>
        </div>

        {/* Knowledge Base Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <Database size={20} className="text-blue-600" />
              智力资产向量化队列
            </h3>
            <button className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
              <RefreshCw size={14} /> 刷新状态
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-4">文件名</th>
                  <th className="px-6 py-4">类型</th>
                  <th className="px-6 py-4">大小</th>
                  <th className="px-6 py-4">处理状态</th>
                  <th className="px-6 py-4">上传时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <FileRow name="2023_零售行业研究报告终稿.pdf" type="PDF" size="12.5 MB" status="completed" time="10分钟前" />
                <FileRow name="某车企高管内部访谈_脱敏版.mp3" type="Audio" size="84.2 MB" status="processing" time="25分钟前" />
                <FileRow name="财务模型测算_V2.xlsx" type="Excel" size="4.1 MB" status="pending" time="1小时前" />
                <FileRow name="STM咨询标准方法论培训.ppt" type="PPT" size="32.0 MB" status="completed" time="昨天" />
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricBox({ label, value, sub }) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="text-gray-400 text-xs mb-1 font-medium">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function FileRow({ name, type, size, status, time }) {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4">{type}</td>
      <td className="px-6 py-4">{size}</td>
      <td className="px-6 py-4">
        {status === 'completed' && <span className="text-emerald-600 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>已向量化入库</span>}
        {status === 'processing' && <span className="text-blue-600 font-medium flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" />解析与切片中 (45%)</span>}
        {status === 'pending' && <span className="text-gray-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div>等待处理</span>}
      </td>
      <td className="px-6 py-4">{time}</td>
    </tr>
  );
}