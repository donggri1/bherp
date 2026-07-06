import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ListCardProps = {
  columns: string[];
};

export function ListCard({ columns }: ListCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>목록</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[520px] overflow-auto p-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                조회된 데이터가 없습니다.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
