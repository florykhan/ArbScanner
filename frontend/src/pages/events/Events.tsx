import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { events } from "../../data/mockData";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = ["all", ...Array.from(new Set(events.map(e => e.category)))];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCloseTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Crypto': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Finance': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Stocks': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Technology': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Commodities': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Events</h1>
              <p className="text-sm text-slate-400">Browse prediction market events</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Total Events</div>
              <div className="text-2xl font-semibold text-white">{events.length}</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-white">
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-8 py-8">
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">No events found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card 
                key={event.id}
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/events/${event.id}`}
                        className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors block mb-2"
                      >
                        {event.title}
                      </Link>
                      
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className={getCategoryColor(event.category)}>
                          {event.category}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          Closes: {formatCloseTime(event.closeTime)}
                        </span>
                        <Badge 
                          variant="outline"
                          className={
                            event.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                      className="text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0"
                    >
                      <Link to={`/events/${event.id}`}>
                        View Markets
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
