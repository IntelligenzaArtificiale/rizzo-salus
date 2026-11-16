/*
 * Adattatore icone per SidebarNav di Beautiful UI.
 * L'originale usa @central-icons-react (licenza a pagamento): qui gli stessi
 * nomi puntano alle icone Lucide equivalenti (MIT), così il componente resta 1:1.
 */
import {
  Check, ChevronDown, House, IceCreamCone, LogOut, PanelLeftClose,
  Plus, Search, Settings, SquarePen, UserPlus, X, type LucideProps,
} from "lucide-react";

type IconProps = Omit<LucideProps, "ref">;

export const IconArrowBoxLeft = (p: IconProps) => <LogOut {...p} />;
export const IconCheckmark1Small = (p: IconProps) => <Check {...p} />;
export const IconChevronDownSmall = (p: IconProps) => <ChevronDown {...p} />;
export const IconCrossSmall = (p: IconProps) => <X {...p} />;
export const IconEditBig = (p: IconProps) => <SquarePen {...p} />;
export const IconHome = (p: IconProps) => <House {...p} />;
export const IconMagnifyingGlass = (p: IconProps) => <Search {...p} />;
export const IconPlusMedium = (p: IconProps) => <Plus {...p} />;
export const IconPopsicle2 = (p: IconProps) => <IceCreamCone {...p} />;
export const IconSettingsGear1 = (p: IconProps) => <Settings {...p} />;
export const IconSidebarLeftArrow = (p: IconProps) => <PanelLeftClose {...p} />;
export const IconUserAdd = (p: IconProps) => <UserPlus {...p} />;
