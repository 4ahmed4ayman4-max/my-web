import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-bright p-4">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-display-large font-bold text-error">404</h1>
        <h2 className="text-headline-medium font-bold text-on-surface">
          Page Not Found
        </h2>
        <p className="text-body-small text-outline">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center px-5 py-2 rounded-lg bg-primary-600 text-on-primary-50 text-body-large hover:bg-primary-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
