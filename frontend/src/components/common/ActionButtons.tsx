import { Plus, Save, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ActionButtonsProps = {
  onSearch?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  searchDisabled?: boolean;
  newDisabled?: boolean;
  saveDisabled?: boolean;
  deleteDisabled?: boolean;
};

export function ActionButtons({
  onSearch,
  onNew,
  onSave,
  onDelete,
  searchDisabled,
  newDisabled,
  saveDisabled,
  deleteDisabled,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" size="sm" onClick={onSearch} disabled={searchDisabled}>
        <Search className="size-4" aria-hidden />
        조회
      </Button>
      <Button variant="outline" size="sm" onClick={onNew} disabled={newDisabled}>
        <Plus className="size-4" aria-hidden />
        신규
      </Button>
      <Button size="sm" onClick={onSave} disabled={saveDisabled}>
        <Save className="size-4" aria-hidden />
        저장
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleteDisabled}>
        <Trash2 className="size-4" aria-hidden />
        삭제
      </Button>
    </div>
  );
}
