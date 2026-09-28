import { Link, useLocation } from "react-router";
import { LandmarkIcon, ReceiptIcon, TagsIcon, type LucideIcon } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";
import { MarcaHorizontal, MarcaIcone } from "~/components/marca";

type NavItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	color: string;
};

type NavGroup = {
	label: string;
	items: NavItem[];
};

const navGroups: NavGroup[] = [
	{
		label: "Financeiro",
		items: [
			{ title: "Despesas", href: "/despesas", icon: ReceiptIcon, color: "var(--paleta-1)" },
		],
	},
	{
		label: "Cadastros",
		items: [
			{ title: "Categorias", href: "/categorias", icon: TagsIcon, color: "var(--paleta-4)" },
			{ title: "Contas", href: "/contas", icon: LandmarkIcon, color: "var(--paleta-5)" },
		],
	},
];

function isActivePath(currentPath: string, href: string): boolean {
	if (href === "/") {
		return currentPath === "/";
	}
	return currentPath.startsWith(href);
}

export function AppSidebar() {
	const location = useLocation();

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<div className='flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
					<MarcaHorizontal className='group-data-[collapsible=icon]:hidden' />
					<MarcaIcone className='hidden size-8 group-data-[collapsible=icon]:inline-flex' />
				</div>
			</SidebarHeader>

			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											render={<Link to={item.href} />}
											isActive={isActivePath(location.pathname, item.href)}
											tooltip={item.title}>
											<item.icon style={{ color: item.color }} />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
