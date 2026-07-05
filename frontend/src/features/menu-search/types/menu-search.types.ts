import type { MenuItem } from "@/types/menu";

export type SearchableMenuItem = MenuItem & {
  groupCode: string;
  groupTitle: string;
  keywords: string;
};
