import { AdminDataPage } from "@/app/admin/admin-data-page";
import { adminTables } from "@/lib/admin-tables";
export default function ProductsPage() { return <AdminDataPage table="products" config={adminTables.products} />; }
