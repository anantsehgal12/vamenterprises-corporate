import { AdminDataPage } from "@/app/admin/admin-data-page";
import { adminTables } from "@/lib/admin-tables";
export default function BrandsPage() { return <AdminDataPage table="brands" config={adminTables.brands} />; }
