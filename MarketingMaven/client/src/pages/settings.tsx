import Sidebar from "@/components/sidebar";

export default function Settings() {
  return (
    <div className="flex h-screen bg-cool-gray-10">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-cool-gray-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-cool-gray-80">Settings</h1>
              <p className="text-cool-gray-70 mt-1">Configure your account and preferences</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-lg border border-cool-gray-20 p-8 text-center">
            <h2 className="text-xl font-semibold text-cool-gray-80 mb-4">Settings Coming Soon</h2>
            <p className="text-cool-gray-70">This feature is under development and will be available soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
