export function Footer() {
  return (
    <footer className="bg-surface-container-low dark:bg-surface-container-low border-t border-outline-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-outline">
        &copy; {new Date().getFullYear()} StoreApp. All rights reserved.
      </div>
    </footer>
  );
}