import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mb-6">
            <div className="text-6xl font-semibold text-white mb-2">404</div>
            <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
            <p className="text-slate-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}