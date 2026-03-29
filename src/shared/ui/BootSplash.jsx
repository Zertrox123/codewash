import React from 'react';

const BootSplash = ({ progress, message, title }) => {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200 flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <h1
          className="text-5xl text-yellow-400 font-bold uppercase tracking-widest mb-6 text-center"
          style={{ fontFamily: '"VT323", monospace' }}
        >
          Level Up RPG
        </h1>
        <p className="text-center text-xl text-slate-300 mb-4">{title}</p>
        <div className="w-full h-4 rounded-full overflow-hidden border border-slate-600 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm text-slate-400 uppercase tracking-wider">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BootSplash;
