import { AdminDataPage } from "@/app/admin/admin-data-page";
import { adminTables } from "@/lib/admin-tables";
export default function BulkQueriesPage() { return <AdminDataPage table="bulk_queries" config={adminTables.bulk_queries} />; }
