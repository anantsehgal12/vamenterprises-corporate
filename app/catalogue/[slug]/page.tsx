import { CatalogueViewer } from "@/components/custom/CatalogueViewer";

export default async function CataloguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CatalogueViewer slug={slug} />;
}
