import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchCardProps = {
  keywordLabel?: string;
};

export function SearchCard({ keywordLabel = "검색어" }: SearchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>검색조건</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium">
            {keywordLabel}
            <Input placeholder="검색어를 입력하세요" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            사용여부
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20">
              <option value="">전체</option>
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
