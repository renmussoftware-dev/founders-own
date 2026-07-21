/**
 * The Launch Playbook (Act I utility). Before a founder has revenue, the
 * metric-driven engine has little to read and the dashboard is empty — this is
 * the concrete, checkable "what to actually do" list to get from zero to a
 * shipped app, live payments, and first users. App-dev specific, on-store flow.
 */

export interface PlaybookItem {
  id: string;
  label: string;
}

export interface PlaybookGroup {
  id: string;
  title: string;
  blurb: string;
  items: PlaybookItem[];
}

export const PLAYBOOK: PlaybookGroup[] = [
  {
    id: 'ship',
    title: 'Ship a build',
    blurb: 'Get something a stranger could actually install.',
    items: [
      { id: 'asc_app', label: 'Create your app in App Store Connect' },
      { id: 'testflight', label: 'Get a TestFlight build a stranger could install' },
      { id: 'screens', label: 'Add screenshots and an app preview' },
      { id: 'privacy', label: 'Fill out App Privacy and the data questions' },
      { id: 'submit', label: 'Submit for App Store review' },
    ],
  },
  {
    id: 'pay',
    title: 'Turn on payments',
    blurb: 'Make it possible for someone to pay you.',
    items: [
      { id: 'products', label: 'Create your subscription products in App Store Connect' },
      { id: 'rc_import', label: 'Import products and entitlements into RevenueCat' },
      { id: 'paywall', label: 'Put a paywall in front of your best feature' },
      { id: 'price', label: 'Pick a price and a free-trial length' },
      { id: 'sandbox', label: 'Confirm a sandbox purchase works end to end' },
    ],
  },
  {
    id: 'users',
    title: 'Get your first users',
    blurb: 'Put it in front of people who have the problem.',
    items: [
      { id: 'oneliner', label: 'Write the one-liner: who it’s for and the problem it solves' },
      { id: 'post', label: 'Draft a launch post — what it does and who it helps' },
      { id: 'share', label: 'Post it where your target users already gather' },
      { id: 'ten', label: 'Personally show it to 10 people with that problem' },
      { id: 'feedback', label: 'Ask each of them for one piece of honest feedback' },
    ],
  },
];

export const PLAYBOOK_TOTAL = PLAYBOOK.reduce((n, g) => n + g.items.length, 0);
