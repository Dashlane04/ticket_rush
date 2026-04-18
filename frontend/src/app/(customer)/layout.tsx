import CustomerHeader from '@/components/layout/CustomerHeader';
import CustomerFooter from '@/components/layout/CustomerFooter';

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans selection:bg-rose-500/30">
      <CustomerHeader />
      
      {/* Main Content with top padding to account for fixed floating navbar */}
      <main className="flex-1 pt-28 pb-12">
        {children}
      </main>

      <CustomerFooter />
    </div>
  );
}
