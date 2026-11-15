import { FileText, Megaphone, Radio, Rocket, Tent } from 'lucide-react';

// Matches app.agents.base.AGENT_REGISTRY; all five are supported by the API.
export const AGENTS = [
  { id: 'branding', label: 'Branding', Icon: FileText },
  { id: 'pr', label: 'PR', Icon: Megaphone },
  { id: 'social', label: 'Social', Icon: Radio },
  { id: 'product_marketing', label: 'Product Marketing', Icon: Rocket },
  { id: 'events', label: 'Field Events', Icon: Tent },
];
