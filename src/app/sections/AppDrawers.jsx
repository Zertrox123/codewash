import React from 'react';
import CosmeticsDrawer from '../../components/drawers/CosmeticsDrawer';
import SettingsDrawer from '../../components/drawers/SettingsDrawer';
import MenuDrawer from '../../components/drawers/MenuDrawer';
import ResetModal from '../../components/modals/ResetModal';
import BugReportModal from '../../components/modals/BugReportModal';

const AppDrawers = ({
  isCosmeticsOpen,
  activeTheme,
  handleThemeChange,
  selectedBorder,
  handleBorderChange,
  borderColor,
  setBorderColor,
  unlockedBorders,
  unlockedAchievements,

  isSettingsOpen,
  setIsResetOpen,
  bgmVol,
  setBgmVol,
  sfxVol,
  setSfxVolState,
  currentProfile,
  handleSwitchProfile,
  profileNames,
  handleRenameProfile,
  getProfileStats,
  parentStatus,
  handleParentVerified,
  skills,

  isMenuOpen,
  stats,

  isResetOpen,
  setIsResetOpenState,
  handleReset,

  isBugReportOpen,
  setIsBugReportOpenState,
  locale,
  setLocale,
  t,
}) => {
  return (
    <>
      <CosmeticsDrawer
        isOpen={isCosmeticsOpen}
        activeTheme={activeTheme}
        setActiveTheme={handleThemeChange}
        selectedBorder={selectedBorder}
        setSelectedBorder={handleBorderChange}
        borderColor={borderColor}
        setBorderColor={setBorderColor}
        unlockedBorders={unlockedBorders}
        unlockedAchievements={unlockedAchievements}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onReset={() => setIsResetOpen(true)}
        bgmVol={bgmVol}
        setBgmVol={setBgmVol}
        sfxVol={sfxVol}
        setSfxVol={setSfxVolState}
        currentProfile={currentProfile}
        onSwitchProfile={handleSwitchProfile}
        profileNames={profileNames}
        onRenameProfile={handleRenameProfile}
        getProfileStats={getProfileStats}
        parentStatus={parentStatus}
        onParentVerified={handleParentVerified}
        currentSkills={skills}
        locale={locale}
        setLocale={setLocale}
        t={t}
      />

      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpenState(false)}
        onConfirm={handleReset}
      />
      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpenState(false)}
        t={t}
      />

      <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />
    </>
  );
};

export default AppDrawers;

