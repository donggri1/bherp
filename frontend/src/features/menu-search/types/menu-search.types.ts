import type { MenuItem } from "@/types/menu";

export type SearchableMenuItem = MenuItem & {
  groupCode: string;
  groupTitle: string;
  breadcrumb: string;
  breadcrumbTitles: string[];
  keywords: string;
};
