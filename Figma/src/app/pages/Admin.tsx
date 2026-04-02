import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { events, Event } from "../data/mockData";
import { toast } from "sonner";

export default function Admin() {
  const [localEvents, setLocalEvents] = useState<Event[]>(events);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    closeTime: "",
    status: "active" as "active" | "closed",
    description: ""
  });

  const categories = ["Crypto", "Finance", "Stocks", "Technology", "Commodities"];

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      closeTime: "",
      status: "active",
      description: ""
    });
    setIsAddingEvent(false);
    setEditingEventId(null);
  };

  const handleAddEvent = () => {
    if (!formData.title || !formData.category || !formData.closeTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newEvent: Event = {
      id: String(localEvents.length + 1),
      title: formData.title,
      category: formData.category,
      closeTime: new Date(formData.closeTime).toISOString(),
      status: formData.status,
      description: formData.description
    };

    setLocalEvents([...localEvents, newEvent]);
    toast.success("Event added successfully");
    resetForm();
  };

  const handleEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      category: event.category,
      closeTime: new Date(event.closeTime).toISOString().slice(0, 16),
      status: event.status,
      description: event.description || ""
    });
  };

  const handleUpdateEvent = () => {
    if (!formData.title || !formData.category || !formData.closeTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLocalEvents(localEvents.map(event =>
      event.id === editingEventId
        ? {
            ...event,
            title: formData.title,
            category: formData.category,
            closeTime: new Date(formData.closeTime).toISOString(),
            status: formData.status,
            description: formData.description
          }
        : event
    ));
    
    toast.success("Event updated successfully");
    resetForm();
  };

  const handleDeleteEvent = (eventId: string) => {
    setLocalEvents(localEvents.filter(event => event.id !== eventId));
    toast.success("Event deleted successfully");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Manage Data</h1>
              <p className="text-sm text-slate-400">Add, update, and delete events</p>
            </div>
            {!isAddingEvent && !editingEventId && (
              <Button onClick={() => setIsAddingEvent(true)} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Add/Edit Event Form */}
        {(isAddingEvent || editingEventId) && (
          <Card className="mb-6 bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">
                {editingEventId ? "Edit Event" : "Add New Event"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-300">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-300">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {categories.map(category => (
                          <SelectItem key={category} value={category} className="text-white">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="closeTime" className="text-slate-300">Close Time *</Label>
                    <Input
                      id="closeTime"
                      type="datetime-local"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-slate-300">Status *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: "active" | "closed") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="active" className="text-white">Active</SelectItem>
                        <SelectItem value="closed" className="text-white">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter event description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    onClick={editingEventId ? handleUpdateEvent : handleAddEvent}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {editingEventId ? "Update Event" : "Add Event"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="border-slate-700 text-white hover:bg-slate-800">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Existing Events ({localEvents.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {localEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No events available. Click "Add Event" to create one.
                </div>
              ) : (
                localEvents.map((event) => (
                  <Card key={event.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-2">{event.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge variant="outline" className={getCategoryColor(event.category)}>
                              {event.category}
                            </Badge>
                            <span className="text-slate-400">
                              {formatDateTime(event.closeTime)}
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

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
