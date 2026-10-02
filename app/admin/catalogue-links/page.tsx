import { AdminDataPage } from "@/app/admin/admin-data-page";
import { adminTables } from "@/lib/admin-tables";
export default function CatalogueLinksPage() { return <AdminDataPage table="catalogue_links" config={adminTables.catalogue_links} />; }
