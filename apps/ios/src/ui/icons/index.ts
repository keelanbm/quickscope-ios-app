/**
 * Centralised icon barrel.
 *
 * Lucide icons  — general-purpose UI icons (matches web terminal)
 * Brand icons   — custom SVGs for logos / social that aren't in Lucide
 *
 * Usage:
 *   import { Star, Copy, ExternalLink } from "@/src/ui/icons";
 *   import { XIcon, TelegramIcon, QSLogoIcon } from "@/src/ui/icons";
 */

// ── Lucide (matches web terminal's lucide-react) ──
export {
  // Navigation / chrome
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  X,
  Menu,
  Settings,
  // Actions
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Share2,
  // Status
  Star,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Info,
  CircleCheck,
  Loader2,
  Clock,
  // Trade / finance
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Wallet,
  // Communication
  MessageCircle,
  // Content
  Globe,
  Link,
  List,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  // Layout
  LayoutGrid,
  Layers,
  Compass,
  Crosshair,
  Target,
  SlidersHorizontal,
  MoreHorizontal,
  LogOut,
  Gift,
  User,
  HelpCircle,
} from "lucide-react-native";

// ── Brand / social SVGs ──
export { XIcon, TelegramIcon, QSLogoIcon, SolanaIcon } from "./BrandIcons";
