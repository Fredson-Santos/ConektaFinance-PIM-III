import {
  Utensils,
  Car,
  Film,
  Home,
  HeartPulse,
  GraduationCap,
  Tag,
  Wallet,
  LineChart,
  Briefcase,
  PiggyBank,
  RotateCcw,
  Landmark,
  Circle,
} from 'lucide-react'

const ICONS = {
  Utensils,
  Car,
  Film,
  Home,
  HeartPulse,
  GraduationCap,
  Tag,
  Wallet,
  LineChart,
  Briefcase,
  PiggyBank,
  RotateCcw,
  Landmark,
}

export function Icon({ name, size = 18, color }) {
  const Component = ICONS[name] || Circle
  return <Component size={size} color={color} aria-hidden="true" />
}

export default Icon
