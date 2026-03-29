import React from 'react';
import { Menu, Sparkles, Bug, Maximize, Minimize, Settings } from 'lucide-react';
import PixelHeart from '../../shared/ui/PixelHeart';

const AppChrome = ({
  playerHealth,

  isMenuOpen,
  setIsMenuOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isCosmeticsOpen,
  setIsCosmeticsOpen,
  setIsBugReportOpen,

  isFullscreen,
  toggleFullscreen,

  battlingSkillId,
  endBattle,

  playClick,
  locale,
  setLocale,
  t,
}) => {
  return (
    <>
      {/* Top Left Buttons */}
      <button
        onClick={() => {
          setIsMenuOpen(false);
          setIsCosmeticsOpen(false);
          setIsSettingsOpen(true);
          playClick();
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', left: '24px' }}
      >
        <Settings size={48} className="text-slate-400" />
      </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          setIsSettingsOpen(false);
          setIsCosmeticsOpen(true);
          playClick();
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
      >
        <Sparkles size={48} className="text-purple-400" />
      </button>

      {/* Player Health Display - Centered */}
      <div
        className="absolute z-40 flex gap-1.5"
        style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
      >
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <PixelHeart key={i} size={48} filled={i < playerHealth} />
          ))}
      </div>

      {/* Top Right Buttons */}
      <button
        onClick={toggleFullscreen}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
        aria-label={isFullscreen ? t('chrome.exitFullscreen') : t('chrome.enterFullscreen')}
        title={isFullscreen ? t('chrome.exitFullscreen') : t('chrome.enterFullscreen')}
      >
        {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
      </button>
      <button
        onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
        className="absolute z-40 bg-stone-800/90 text-white px-4 py-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg font-bold tracking-wide"
        style={{ top: '24px', right: 'calc(24px + 76px + 12px + 76px + 12px)' }}
        aria-label={t('chrome.languageLabel')}
        title={t('chrome.languageLabel')}
      >
        {locale.toUpperCase()}
      </button>
      <button
        onClick={() => {
          setIsSettingsOpen(false);
          setIsCosmeticsOpen(false);
          setIsMenuOpen(true);
          playClick();
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', right: '24px' }}
      >
        <Menu size={48} />
      </button>

      {/* Bottom Right Bug Report Button */}
      <button
        onClick={() => {
          setIsMenuOpen(false);
          setIsCosmeticsOpen(false);
          setIsSettingsOpen(false);
          setIsBugReportOpen(true);
          playClick();
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ bottom: '24px', right: '24px' }}
      >
        <Bug size={48} className="text-red-400" />
      </button>

      {/* Backdrop overlay when battling - click to exit */}
      {battlingSkillId && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minWidth: '100vw',
            minHeight: '100vh',
          }}
          onClick={endBattle}
        />
      )}

      {/* Drawer overlays */}
      {isCosmeticsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setIsCosmeticsOpen(false);
            playClick();
          }}
        />
      )}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setIsSettingsOpen(false);
            playClick();
          }}
        />
      )}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setIsMenuOpen(false);
            playClick();
          }}
        />
      )}
    </>
  );
};

export default AppChrome;

