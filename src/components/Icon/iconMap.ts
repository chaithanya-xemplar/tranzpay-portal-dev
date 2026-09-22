import type { SVGProps } from "react";
import ChevronDown from "../../assets/icons/chevron-down.svg?react";
import ChevronUp from "../../assets/icons/chevron-up.svg?react";
import ChevronLeft from "../../assets/icons/chevron-left.svg?react";
import ChevronRight from "../../assets/icons/chevron-right.svg?react";
import X from "../../assets/icons/x.svg?react";
import Check from "../../assets/icons/check.svg?react";
import CheckGreen from "../../assets/icons/check-green.svg?react";
import Search from "../../assets/icons/search.svg?react";
import Plus from "../../assets/icons/plus.svg?react";
import Minus from "../../assets/icons/minus.svg?react";
import Edit from "../../assets/icons/edit.svg?react";
import Trash from "../../assets/icons/trash.svg?react";
import Save from "../../assets/icons/save.svg?react";
import Upload from "../../assets/icons/upload.svg?react";
import Download from "../../assets/icons/download.svg?react";
import AlertCircle from "../../assets/icons/alert-circle.svg?react";
import Info from "../../assets/icons/info.svg?react";
import Warning from "../../assets/icons/warning.svg?react";
import CheckCircle from "../../assets/icons/check-circle.svg?react";
import Eye from "../../assets/icons/eye.svg?react";
import EyeOff from "../../assets/icons/eye-off.svg?react";
import Lock from "../../assets/icons/lock.svg?react";
import Unlock from "../../assets/icons/unlock.svg?react";
import Mail from "../../assets/icons/mail.svg?react";
import Phone from "../../assets/icons/phone.svg?react";
import MapPin from "../../assets/icons/map-pin.svg?react";
import Building from "../../assets/icons/building.svg?react";
import User from "../../assets/icons/user.svg?react";
import Users from "../../assets/icons/users.svg?react";
import Settings from "../../assets/icons/settings.svg?react";
import Refresh from "../../assets/icons/icon-refresh-reset.svg?react";
import Filter from "../../assets/icons/filter.svg?react";
import Sort from "../../assets/icons/sort.svg?react";
import ArrowUp from "../../assets/icons/arrow-up.svg?react";
import ArrowDown from "../../assets/icons/arrow-down.svg?react";
import MoreHorizontal from "../../assets/icons/more-horizontal.svg?react";
import MoreVertical from "../../assets/icons/more-vertical.svg?react";
import File from "../../assets/icons/file.svg?react";
import Image from "../../assets/icons/image.svg?react";
import Bold from "../../assets/icons/bold.svg?react";
import Italic from "../../assets/icons/italic.svg?react";
import Underline from "../../assets/icons/underline.svg?react";
import List from "../../assets/icons/list.svg?react";
import ArrowLeft from "../../assets/icons/arrow-left.svg?react";
import Copy from "../../assets/icons/copy.svg?react";
import Key from "../../assets/icons/key.svg?react";
import Grip from "../../assets/icons/grip.svg?react";
import Bank from "../../assets/icons/bank.svg?react";
import CardIcon from "../../assets/icons/card.svg?react";
import Layers from "../../assets/icons/layers.svg?react";
import Shield from "../../assets/icons/shield.svg?react";

export const icons = {
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "arrow-left": ArrowLeft,
  x: X,
  "check-green": CheckGreen,
  check: Check,
  search: Search,
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash,
  save: Save,
  upload: Upload,
  download: Download,
  "alert-circle": AlertCircle,
  info: Info,
  warning: Warning,
  "check-circle": CheckCircle,
  eye: Eye,
  "eye-off": EyeOff,
  lock: Lock,
  unlock: Unlock,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  building: Building,
  user: User,
  users: Users,
  settings: Settings,
  refresh: Refresh,
  filter: Filter,
  sort: Sort,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "more-horizontal": MoreHorizontal,
  "more-vertical": MoreVertical,
  file: File,
  image: Image,
  bold: Bold,
  italic: Italic,
  underline: Underline,
  list: List,
  copy: Copy,
  key: Key,
  grip: Grip,
  bank: Bank,
  card: CardIcon,
  layers: Layers,
  shield: Shield,
} as const;

export type IconName = keyof typeof icons;
export type IconComponent = React.FC<SVGProps<SVGSVGElement>>;
