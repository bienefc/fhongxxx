import CategorySidebar from "@/components/CategorySidebar";

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 flex gap-6">
      <CategorySidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
