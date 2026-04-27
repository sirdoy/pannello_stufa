// Line icons — single source, stroke-based, no emoji
// All at 24x24 viewBox, stroke-width 1.75, rounded caps

const Icon = ({ children, size = 24, stroke = 'currentColor', sw = 1.75, fill = 'none', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconFlame = (p) => (
  <Icon {...p}>
    <path d="M12 2c1 3 3 4.5 3 7a3 3 0 11-6 0c0-1 .5-2 1-3-2 1-4 3.5-4 7a6 6 0 0012 0c0-5-4-8-6-11z"/>
  </Icon>
);
const IconThermo = (p) => (
  <Icon {...p}>
    <path d="M14 14.76V4a2 2 0 10-4 0v10.76a4 4 0 104 0z"/>
  </Icon>
);
const IconBulb = (p) => (
  <Icon {...p}>
    <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>
  </Icon>
);
const IconSun = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </Icon>
);
const IconCloud = (p) => (
  <Icon {...p}>
    <path d="M18 10a5 5 0 00-9.58-1.5A4 4 0 006 16h12a4 4 0 000-6z"/>
  </Icon>
);
const IconMusic = (p) => (
  <Icon {...p}>
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </Icon>
);
const IconCamera = (p) => (
  <Icon {...p}>
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </Icon>
);
const IconWifi = (p) => (
  <Icon {...p}>
    <path d="M5 12.55a11 11 0 0114 0M8.5 16.05a6 6 0 017 0M2 8.82a15 15 0 0120 0"/>
    <circle cx="12" cy="20" r="0.5" fill="currentColor"/>
  </Icon>
);
const IconCpu = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
  </Icon>
);
const IconPlug = (p) => (
  <Icon {...p}>
    <path d="M9 2v6M15 2v6M7 8h10l-1 8a4 4 0 01-4 4 4 4 0 01-4-4L7 8z"/>
  </Icon>
);
const IconHome = (p) => (
  <Icon {...p}>
    <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2V10z"/>
  </Icon>
);
const IconLayers = (p) => (
  <Icon {...p}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </Icon>
);
const IconGrid = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </Icon>
);
const IconSettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </Icon>
);
const IconBell = (p) => (
  <Icon {...p}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </Icon>
);
const IconPower = (p) => (
  <Icon {...p}>
    <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
  </Icon>
);
const IconPlay = (p) => (
  <Icon {...p} fill="currentColor" sw={0}><path d="M6 4l14 8-14 8V4z"/></Icon>
);
const IconPause = (p) => (
  <Icon {...p} fill="currentColor" sw={0}><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></Icon>
);
const IconSkipF = (p) => (
  <Icon {...p} fill="currentColor" sw={0}><path d="M5 4l10 8-10 8V4zM17 4h2v16h-2V4z"/></Icon>
);
const IconSkipB = (p) => (
  <Icon {...p} fill="currentColor" sw={0}><path d="M19 4L9 12l10 8V4zM5 4h2v16H5V4z"/></Icon>
);
const IconChevR = (p) => (<Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>);
const IconChevD = (p) => (<Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>);
const IconChevU = (p) => (<Icon {...p}><path d="M18 15l-6-6-6 6"/></Icon>);
const IconX = (p) => (<Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>);
const IconPlus = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>);
const IconMinus = (p) => (<Icon {...p}><path d="M5 12h14"/></Icon>);
const IconCheck = (p) => (<Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>);
const IconCalendar = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </Icon>
);
const IconAlert = (p) => (
  <Icon {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
  </Icon>
);
const IconDroplet = (p) => (
  <Icon {...p}><path d="M12 2s6 6 6 11a6 6 0 01-12 0c0-5 6-11 6-11z"/></Icon>
);
const IconWind = (p) => (
  <Icon {...p}><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></Icon>
);
const IconMoon = (p) => (
  <Icon {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Icon>
);
const IconZap = (p) => (
  <Icon {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Icon>
);
const IconMore = (p) => (
  <Icon {...p}><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></Icon>
);
const IconClock = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>
);
const IconShield = (p) => (
  <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>
);
const IconVolume = (p) => (
  <Icon {...p}><path d="M11 5L6 9H2v6h4l5 4V5zM19 12a4 4 0 00-2-3.46M15 8.5a7 7 0 010 7"/></Icon>
);
const IconTv = (p) => (
  <Icon {...p}><rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></Icon>
);
const IconBlind = (p) => (
  <Icon {...p}><path d="M3 4h18M4 4v12M20 4v12M4 8h16M4 12h16M4 16h16M12 16v4"/></Icon>
);

Object.assign(window, {
  IconFlame, IconThermo, IconBulb, IconSun, IconCloud, IconMusic, IconCamera,
  IconWifi, IconCpu, IconPlug, IconHome, IconLayers, IconGrid, IconSettings,
  IconBell, IconPower, IconPlay, IconPause, IconSkipF, IconSkipB,
  IconChevR, IconChevD, IconChevU, IconX, IconPlus, IconMinus, IconCheck,
  IconCalendar, IconAlert, IconDroplet, IconWind, IconMoon, IconZap, IconMore,
  IconClock, IconShield, IconVolume, IconTv, IconBlind,
});
