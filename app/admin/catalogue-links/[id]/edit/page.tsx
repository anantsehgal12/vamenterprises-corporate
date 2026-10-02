import { notFound } from "next/navigation";
import { CatalogueLinkEditor } from "../../catalogue-link-editor";

export default async function EditCatalogueLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const linkId = Number(id);
  if (!Number.isInteger(linkId) || linkId < 1) notFound();
  return <CatalogueLinkEditor linkId={linkId} />;
}
