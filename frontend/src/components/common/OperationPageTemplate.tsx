import { ActionButtons } from "@/components/common/ActionButtons";
import { ListCard } from "@/components/common/ListCard";
import { SearchCard } from "@/components/common/SearchCard";
import { PageHeader } from "@/components/layout/PageHeader";

type OperationPageTemplateProps = {
  title: string;
  description: string;
  columns: string[];
  keywordLabel?: string;
};

export function OperationPageTemplate({
  title,
  description,
  columns,
  keywordLabel,
}: OperationPageTemplateProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <SearchCard keywordLabel={keywordLabel} />
      <ActionButtons />
      <ListCard columns={columns} />
    </>
  );
}
