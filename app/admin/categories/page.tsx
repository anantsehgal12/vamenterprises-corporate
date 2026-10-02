import { AdminDataPage } from "@/app/admin/admin-data-page";
import { adminTables } from "@/lib/admin-tables";
export default function CategoriesPage() { return <AdminDataPage table="categories" config={adminTables.categories} />; }
